import { PlaylistInfo, VideoInfo } from '@/lib/youtube';
import { NextRequest, NextResponse } from 'next/server';

// Simplified session type - only stores video collections for sharing
interface SharedSession {
  id: string;
  name: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  createdAt: number;
  expiresAt: number; // 30 days from creation
}

// In-memory storage for demonstration - in production, use a database
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

// Clean up expired sessions
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
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

    cleanupExpiredSessions();

    const sessionId = generateSessionId();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    const session: SharedSession = {
      id: sessionId,
      name: name || `Study Session`,
      videos: videos || [],
      playlists: playlists || [],
      createdAt: now,
      expiresAt: now + thirtyDays
    };

    sessions.set(sessionId, session);

    console.log(`Created session ${sessionId} with ${videos?.length || 0} videos and ${playlists?.length || 0} playlists`);

    return NextResponse.json({
      sessionId,
      shareUrl: `${request.nextUrl.origin}/session/${sessionId}`,
      expiresAt: session.expiresAt
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    cleanupExpiredSessions();

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Return only the video collection, not any progress data
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
