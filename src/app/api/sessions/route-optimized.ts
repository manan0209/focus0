import { PlaylistInfo, VideoInfo } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync, gzipSync } from 'zlib';

// Simplified session type - only stores video collections for sharing
interface SharedSession {
  id: string;
  name: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  createdAt: number;
}

// Ultra-minimal data structure for maximum compression (using short keys)
interface UltraMinimalVideoInfo {
  i: string; // id
  t?: string; // title (optional, truncated if too long)
}

interface UltraMinimalPlaylistInfo {
  i: string; // id
  t?: string; // title (optional, truncated if too long)
  v: UltraMinimalVideoInfo[]; // videos
}

interface UltraMinimalSession {
  n: string; // name
  v: UltraMinimalVideoInfo[]; // videos
  p: UltraMinimalPlaylistInfo[]; // playlists
  c: number; // createdAt
}

// Simple in-memory storage (works for same serverless instance)
const sessions = new Map<string, SharedSession>();

// Generate a short, URL-friendly ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert to ultra-minimal format with aggressive optimization
function toUltraMinimal(session: Omit<SharedSession, 'id'>): UltraMinimalSession {
  return {
    n: session.name.length > 50 ? session.name.substring(0, 50) : session.name,
    v: session.videos.map(v => ({ 
      i: v.id, 
      t: v.title && v.title.length > 10 && v.title.length < 80 ? v.title : undefined 
    })),
    p: session.playlists.map(p => ({
      i: p.id,
      t: p.title && p.title.length > 10 && p.title.length < 80 ? p.title : undefined,
      v: p.videos.slice(0, 50).map(v => ({ // Limit to 50 videos per playlist
        i: v.id, 
        t: v.title && v.title.length > 10 && v.title.length < 80 ? v.title : undefined 
      }))
    })),
    c: session.createdAt
  };
}

// Convert back to full format
function fromUltraMinimal(minimal: UltraMinimalSession): Omit<SharedSession, 'id'> {
  return {
    name: minimal.n,
    videos: minimal.v.map(v => ({
      id: v.i,
      url: `https://www.youtube.com/watch?v=${v.i}`,
      title: v.t || `Video ${v.i}`,
    })),
    playlists: minimal.p.map(p => ({
      id: p.i,
      url: `https://www.youtube.com/playlist?list=${p.i}`,
      title: p.t || `Playlist ${p.i}`,
      videos: p.v.map(v => ({
        id: v.i,
        url: `https://www.youtube.com/watch?v=${v.i}`,
        title: v.t || `Video ${v.i}`,
      }))
    })),
    createdAt: minimal.c
  };
}

// Encode with maximum compression for Vercel URLs
function encodeSessionData(session: Omit<SharedSession, 'id'>): string {
  try {
    const ultraMinimal = toUltraMinimal(session);
    const jsonString = JSON.stringify(ultraMinimal);
    const compressed = gzipSync(Buffer.from(jsonString, 'utf-8'));
    return compressed.toString('base64url');
  } catch (error) {
    console.error('Error encoding session data:', error);
    throw new Error('Failed to encode session data');
  }
}

// Decode compressed session data
function decodeSessionData(encodedData: string): Omit<SharedSession, 'id'> | null {
  try {
    const compressed = Buffer.from(encodedData, 'base64url');
    const decompressed = gunzipSync(compressed);
    const jsonString = decompressed.toString('utf-8');
    const ultraMinimal: UltraMinimalSession = JSON.parse(jsonString);
    return fromUltraMinimal(ultraMinimal);
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
             typeof (video as VideoInfo).id === 'string';
    };

    // Validate playlist format
    const isValidPlaylist = (playlist: unknown): playlist is PlaylistInfo => {
      if (playlist === null || typeof playlist !== 'object' || playlist === undefined) {
        return false;
      }
      
      const playlistObj = playlist as Record<string, unknown>;
      
      return 'id' in playlistObj &&
             'videos' in playlistObj &&
             typeof playlistObj.id === 'string' &&
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

    // Store in memory (works for same serverless instance)
    sessions.set(sessionId, session);

    // Create compressed URL for Vercel deployment
    let shareUrl = `${request.nextUrl.origin}/session/${sessionId}`;
    
    try {
      const encodedData = encodeSessionData(sessionData);
      
      // Always try to include data in URL, but with length limits for very large sessions
      if (encodedData.length < 1500) {
        // Small sessions: include full data in URL
        shareUrl = `${request.nextUrl.origin}/session/${sessionId}?data=${encodedData}`;
      } else if (encodedData.length < 3000) {
        // Medium sessions: include data but warn user
        shareUrl = `${request.nextUrl.origin}/session/${sessionId}?data=${encodedData}`;
        console.log(`Session ${sessionId} has medium size (${encodedData.length} chars)`);
      } else {
        // Large sessions: ID-only approach with warning
        console.log(`Session ${sessionId} too large for reliable URL sharing (${encodedData.length} chars)`);
        // Could implement chunking or alternative approach here
      }
    } catch (error) {
      console.error('Error creating encoded URL:', error);
    }

    return NextResponse.json({
      sessionId,
      shareUrl,
      warning: shareUrl.length > 2000 ? 'Session data is large; sharing may be unreliable on some platforms' : undefined
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

    let session: SharedSession | null = null;

    // Try in-memory storage first (same serverless instance)
    session = sessions.get(sessionId) || null;

    // If not in memory, decode from URL data (this is the main approach for Vercel)
    if (!session && encodedData) {
      const decodedData = decodeSessionData(encodedData);
      if (decodedData) {
        session = {
          id: sessionId,
          ...decodedData
        };
        
        // Store in memory for potential future requests in same instance
        sessions.set(sessionId, session);
      }
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired. The session may have been too large to share reliably.' },
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
