import { PlaylistInfo, VideoInfo } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';

// Simplified session type - only stores video collections for sharing
interface SharedSession {
  id: string;
  name: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  createdAt: number;
}

// In-memory storage for serverless compatibility
// Note: This resets between function invocations, but we'll use URL encoding as backup
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

// Encode session data into URL-safe base64
function encodeSessionData(session: Omit<SharedSession, 'id'>): string {
  try {
    const jsonString = JSON.stringify(session);
    return Buffer.from(jsonString).toString('base64url');
  } catch (error) {
    console.error('Error encoding session data:', error);
    throw new Error('Failed to encode session data');
  }
}

// Decode session data from URL-safe base64
function decodeSessionData(encodedData: string): Omit<SharedSession, 'id'> | null {
  try {
    const jsonString = Buffer.from(encodedData, 'base64url').toString('utf-8');
    return JSON.parse(jsonString);
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

    // Store in memory (will persist for current serverless function lifetime)
    sessions.set(sessionId, session);

    // Create URL with encoded data as fallback
    const encodedData = encodeSessionData(sessionData);
    const shareUrlWithData = `${request.nextUrl.origin}/session/${sessionId}?data=${encodedData}`;

    return NextResponse.json({
      sessionId,
      shareUrl: shareUrlWithData
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

    // First try to get from memory
    let session = sessions.get(sessionId);

    // If not in memory, try to decode from URL data
    if (!session && encodedData) {
      const decodedData = decodeSessionData(encodedData);
      if (decodedData) {
        session = {
          id: sessionId,
          ...decodedData
        };
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
