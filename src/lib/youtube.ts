// YouTube URL utilities
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[&?]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  return youtubeRegex.test(url);
}

export interface VideoInfo {
  id: string;
  url: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
}

export interface PlaylistInfo {
  id: string;
  url: string;
  title?: string;
  videos: VideoInfo[];
}

export function parseYouTubeUrls(urls: string[]): {
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  errors: string[];
} {
  const videos: VideoInfo[] = [];
  const playlists: PlaylistInfo[] = [];
  const errors: string[] = [];

  urls.forEach((url, index) => {
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) return;
    
    if (!isValidYouTubeUrl(trimmedUrl)) {
      errors.push(`Invalid YouTube URL at line ${index + 1}: ${trimmedUrl}`);
      return;
    }

    const playlistId = extractPlaylistId(trimmedUrl);
    const videoId = extractVideoId(trimmedUrl);

    if (playlistId) {
      playlists.push({
        id: playlistId,
        url: trimmedUrl,
        videos: [] // Will be populated when playlist is loaded
      });
    } else if (videoId) {
      videos.push({
        id: videoId,
        url: trimmedUrl
      });
    } else {
      errors.push(`Could not extract video or playlist ID from: ${trimmedUrl}`);
    }
  });

  return { videos, playlists, errors };
}
