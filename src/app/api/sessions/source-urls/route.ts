import { NextRequest, NextResponse } from 'next/server';

// Source URL-based session sharing - much more efficient!
interface SourceSession {
  id: string;
  name: string;
  sourceUrls: string[]; // Original URLs provided by user
  createdAt: number;
}

// Simple in-memory storage (works for same serverless instance)
const sessions = new Map<string, SourceSession>();

// Generate a short, URL-friendly ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Clean up old sessions periodically
function cleanupOldSessions() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  for (const [id, session] of sessions.entries()) {
    if (session.createdAt < thirtyDaysAgo) {
      sessions.delete(id);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, sourceUrls } = await request.json();

    // Validate input
    if (!sourceUrls || !Array.isArray(sourceUrls) || sourceUrls.length === 0) {
      return NextResponse.json(
        { error: 'Source URLs are required' },
        { status: 400 }
      );
    }

    cleanupOldSessions();

    const sessionId = generateSessionId();
    const now = Date.now();

    const session: SourceSession = {
      id: sessionId,
      name: name || `Study Session`,
      sourceUrls,
      createdAt: now
    };

    // Store in memory (works for same serverless instance)
    sessions.set(sessionId, session);

    // Create ultra-short URL with source URLs and session name
    const sourceUrlsParam = encodeURIComponent(sourceUrls.join('|'));
    const nameParam = encodeURIComponent(session.name);
    const shareUrl = `${request.nextUrl.origin}/session/${sessionId}?sources=${sourceUrlsParam}&name=${nameParam}`;

    console.log(`Created source session ${sessionId} with ${sourceUrls.length} source URLs`);
    console.log(`Share URL length: ${shareUrl.length} characters`);

    return NextResponse.json({
      sessionId,
      shareUrl,
      urlLength: shareUrl.length,
      message: `Ultra-efficient sharing: ${sourceUrls.length} source URLs in ${shareUrl.length} characters`
    });

  } catch (error) {
    console.error('Error creating source session:', error);
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
    const sourcesParam = searchParams.get('sources');

    cleanupOldSessions();

    // First try to get from URL sources parameter (most efficient)
    if (sourcesParam) {
      const sourceUrls = decodeURIComponent(sourcesParam).split('|').filter(url => url.trim());
      const nameParam = searchParams.get('name');
      const sessionName = nameParam ? decodeURIComponent(nameParam) : 'Shared Study Session';
      
      return NextResponse.json({
        id: sessionId || 'url-session',
        name: sessionName,
        sourceUrls,
        createdAt: Date.now(),
        fromUrl: true
      });
    }

    // Fallback to stored session if no sources in URL
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired. Try creating a new session.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      name: session.name,
      sourceUrls: session.sourceUrls,
      createdAt: session.createdAt,
      fromUrl: false
    });

  } catch (error) {
    console.error('Error fetching source session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
