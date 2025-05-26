import { Metadata } from 'next';
import SharedSessionPage from './page';

// Metadata generation for dynamic session pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sessionId = params.id;
  
  // Try to fetch session data for better meta tags
  let sessionName = 'Study Session';
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://focus0.vercel.app'}/api/sessions?id=${sessionId}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      sessionName = data.name || 'Study Session';
    }
  } catch (error) {
    // Fallback to default name if fetch fails
    console.error('Failed to fetch session data for metadata:', error);
  }
  
  return {
    title: `${sessionName} | Focus0 Study Session`,
    description: `Join this Focus0 study session: "${sessionName}". Experience distraction-free YouTube learning with focus tracking and Pomodoro timer integration.`,
    keywords: [
      'study session', 'shared learning', 'youtube study', 'focus tracking',
      'pomodoro timer', 'collaborative learning', 'educational content'
    ],
    openGraph: {
      title: `${sessionName} | Focus0 Study Session`,
      description: `Join this Focus0 study session: "${sessionName}". Experience distraction-free YouTube learning with focus tracking and Pomodoro timer integration.`,
      type: 'article',
      url: `https://focus0.vercel.app/session/${sessionId}`,
      images: [
        {
          url: '/favicon/web-app-manifest-512x512.png',
          width: 512,
          height: 512,
          alt: 'Focus0 Study Session'
        }
      ]
    },
    twitter: {
      card: 'summary',
      title: `${sessionName} | Focus0 Study Session`,
      description: `Join this Focus0 study session: "${sessionName}". Experience distraction-free YouTube learning.`,
      images: ['/favicon/web-app-manifest-512x512.png']
    },
    robots: {
      index: true,
      follow: true
    },
    alternates: {
      canonical: `https://focus0.vercel.app/session/${sessionId}`
    }
  };
}

// Server component wrapper
export default function SessionPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = params; // Keep for future use with proper storage
  return <SharedSessionPage />;
}
