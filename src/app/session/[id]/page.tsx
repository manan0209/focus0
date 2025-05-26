'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudySession, getSessionById } from '@/lib/session';
import SessionView from '@/components/SessionView';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function SharedSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = params.id as string;
    
    if (!sessionId) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    try {
      const foundSession = getSessionById(sessionId);
      if (foundSession) {
        setSession(foundSession);
      } else {
        setError('Session not found or may have expired');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleUpdateSession = (updatedSession: StudySession) => {
    setSession(updatedSession);
  };

  const handleExit = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Session Not Found</h2>
            <p className="text-gray-400 mb-4">
              {error || 'The session you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Sessions may expire after inactivity</p>
              <p>• Check if the link is correct</p>
              <p>• Contact the session creator for a new link</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 mx-auto px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 mx-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              Create New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Shared session indicator */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-purple-300">
              Shared Session: <span className="font-medium">{session.name}</span>
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Created {new Date(session.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <SessionView
        session={session}
        onUpdateSession={handleUpdateSession}
        onExit={handleExit}
      />
    </div>
  );
}
