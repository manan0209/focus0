import { PlaylistInfo, VideoInfo } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';
import { gzipSync, gunzipSync } from 'zlib';

// Simplified session type - only stores video collections for sharing
interface SharedSession {
  id: string;
  name: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  createdAt: number;
}

// Minimal data structure for URL encoding (only essential fields)
interface MinimalVideoInfo {
  id: string;
  title?: string;
}

interface MinimalPlaylistInfo {
  id: string;
  title?: string;
  videos: MinimalVideoInfo[];
}

interface MinimalSession {
  name: string;
  videos: MinimalVideoInfo[];
  playlists: MinimalPlaylistInfo[];
  createdAt: number;
}

// Enhanced in-memory storage with expiration
const sessionStore = new Map<string, { data: SharedSession; expires: number }>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Legacy in-memory storage (for compatibility)
const sessions = new Map<string, SharedSession>();

// Cleanup expired sessions
const cleanupExpired = () => {
  const now = Date.now();
  for (const [key, value] of sessionStore.entries()) {
    if (value.expires < now) {
      sessionStore.delete(key);
    }
  }
};

// Enhanced storage methods
const StorageManager = {
  set(sessionId: string, data: SharedSession): void {
    sessionStore.set(sessionId, {
      data,
      expires: Date.now() + SESSION_TTL
    });
  },

  get(sessionId: string): SharedSession | null {
    const stored = sessionStore.get(sessionId);
    if (!stored) return null;
    
    if (stored.expires < Date.now()) {
      sessionStore.delete(sessionId);
      return null;
    }
    
    return stored.data;
  },

  cleanup(): void {
    cleanupExpired();
  }
};

// Generate a short, URL-friendly ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert full session to minimal format for URL encoding
function toMinimalSession(session: Omit<SharedSession, 'id'>): MinimalSession {
  return {
    name: session.name,
    videos: session.videos.map(v => ({ id: v.id, title: v.title })),
    playlists: session.playlists.map(p => ({
      id: p.id,
      title: p.title,
      videos: p.videos.map(v => ({ id: v.id, title: v.title }))
    })),
    createdAt: session.createdAt
  };
}

// Convert minimal session back to full format
function fromMinimalSession(minimal: MinimalSession): Omit<SharedSession, 'id'> {
  return {
    name: minimal.name,
    videos: minimal.videos.map(v => ({
      id: v.id,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      title: v.title,
    })),
    playlists: minimal.playlists.map(p => ({
      id: p.id,
      url: `https://www.youtube.com/playlist?list=${p.id}`,
      title: p.title,
      videos: p.videos.map(v => ({
        id: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        title: v.title,
      }))
    })),
    createdAt: minimal.createdAt
  };
}

// Encode session data with compression and base64
function encodeSessionData(session: Omit<SharedSession, 'id'>): string {
  try {
    const minimal = toMinimalSession(session);
    const jsonString = JSON.stringify(minimal);
    const compressed = gzipSync(Buffer.from(jsonString, 'utf-8'));
    return compressed.toString('base64url');
  } catch (error) {
    console.error('Error encoding session data:', error);
    throw new Error('Failed to encode session data');
  }
}

// Decode session data from compressed base64
function decodeSessionData(encodedData: string): Omit<SharedSession, 'id'> | null {
  try {
    const compressed = Buffer.from(encodedData, 'base64url');
    const decompressed = gunzipSync(compressed);
    const jsonString = decompressed.toString('utf-8');
    const minimal: MinimalSession = JSON.parse(jsonString);
    return fromMinimalSession(minimal);
  } catch (error) {
    console.error('Error decoding session data:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, videos, playlists } = body;
    
    if ((!videos || !Array.isArray(videos) || videos.length === 0) && 
        (!playlists || !Array.isArray(playlists) || playlists.length === 0)) {
      return NextResponse.json(
        { error: 'At least one video or playlist is required' },
        { status: 400 }
      );
    }

    // Validate video format
    const isValidVideo = (video: unknown): video is VideoInfo => {
      return video !== null &&
             typeof video === 'object' &&
             video !== undefined &&
             'id' in video &&
             'title' in video &&
             'thumbnail' in video &&
             typeof (video as VideoInfo).id === 'string' &&
             typeof (video as VideoInfo).title === 'string' &&
             typeof (video as VideoInfo).thumbnail === 'string';
    };

    // Validate playlist format
    const isValidPlaylist = (playlist: unknown): playlist is PlaylistInfo => {
      if (playlist === null || typeof playlist !== 'object' || playlist === undefined) {
        return false;
      }
      
      const playlistObj = playlist as Record<string, unknown>;
      
      return 'id' in playlistObj &&
             'title' in playlistObj &&
             'videos' in playlistObj &&
             typeof playlistObj.id === 'string' &&
             typeof playlistObj.title === 'string' &&
             Array.isArray(playlistObj.videos) &&
             playlistObj.videos.every(isValidVideo);
    };

    if (videos && !videos.every(isValidVideo)) {
      return NextResponse.json(
        { error: 'Invalid video format' },
        { status: 400 }
      );
    }

    if (playlists && !playlists.every(isValidPlaylist)) {
      return NextResponse.json(
        { error: 'Invalid playlist format' },
        { status: 400 }
      );
    }

    const sessionId = generateSessionId();
    const now = Date.now();

    const sessionData = {
      name: name || `Study Session`,
      videos: videos || [],
      playlists: playlists || [],
      createdAt: now
    };

    const session: SharedSession = {
      id: sessionId,
      ...sessionData
    };

    // Store in both systems for redundancy
    sessions.set(sessionId, session);
    StorageManager.set(sessionId, session);

    // Try to create compressed URL with data
    let shareUrl = `${request.nextUrl.origin}/session/${sessionId}`;
    
    try {
      const encodedData = encodeSessionData(sessionData);
      
      // Only include data in URL if it's reasonably sized (under 2000 chars to be safe)
      if (encodedData.length < 2000) {
        shareUrl = `${request.nextUrl.origin}/session/${sessionId}?data=${encodedData}`;
      } else {
        console.log(`Session ${sessionId} data too large for URL (${encodedData.length} chars), using ID-only approach`);
      }
    } catch (error) {
      console.error('Error creating encoded URL, falling back to ID-only:', error);
    }

    return NextResponse.json({
      sessionId,
      shareUrl
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const encodedData = searchParams.get('data');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Try multiple storage sources in order of preference
    let session: SharedSession | null = null;

    // 1. Try in-memory storage first (fastest)
    session = sessions.get(sessionId) || null;

    // 2. Try persistent storage
    if (!session) {
      session = StorageManager.get(sessionId);
    }

    // 3. Try to decode from URL data as last resort
    if (!session && encodedData) {
      const decodedData = decodeSessionData(encodedData);
      if (decodedData) {
        session = {
          id: sessionId,
          ...decodedData
        };
        
        // Store the decoded session for future requests
        sessions.set(sessionId, session);
        StorageManager.set(sessionId, session);
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Return the session data
    return NextResponse.json({
      id: session.id,
      name: session.name,
      videos: session.videos,
      playlists: session.playlists,
      createdAt: session.createdAt
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
