import { convertAPIVideoToVideoInfo, createYouTubeAPI } from './youtube-api';

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

// Synchronous parsing for immediate results (with placeholders for playlists)
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
      // Create placeholder videos for the playlist
      // These will be replaced by real data when using parseYouTubeUrlsAsync
      const placeholderVideos: VideoInfo[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${playlistId}_video_${i + 1}`,
        url: `https://youtube.com/watch?v=${playlistId}_video_${i + 1}&list=${playlistId}`,
        title: `Loading playlist video ${i + 1}...`,
        duration: 300 // 5 minutes placeholder
      }));

      playlists.push({
        id: playlistId,
        url: trimmedUrl,
        title: `Loading playlist...`,
        videos: placeholderVideos
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

// Async parsing for real YouTube API data
export async function parseYouTubeUrlsAsync(urls: string[]): Promise<{
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  errors: string[];
}> {
  const videos: VideoInfo[] = [];
  const playlists: PlaylistInfo[] = [];
  const errors: string[] = [];
  
  const youtubeAPI = createYouTubeAPI();
  if (!youtubeAPI) {
    // Fall back to synchronous parsing if no API key
    return parseYouTubeUrls(urls);
  }

  for (let index = 0; index < urls.length; index++) {
    const url = urls[index];
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) continue;
    
    if (!isValidYouTubeUrl(trimmedUrl)) {
      errors.push(`Invalid YouTube URL at line ${index + 1}: ${trimmedUrl}`);
      continue;
    }

    const playlistId = extractPlaylistId(trimmedUrl);
    const videoId = extractVideoId(trimmedUrl);

    if (playlistId) {
      try {
        // Fetch real playlist data
        const [playlistDetails, playlistItems] = await Promise.all([
          youtubeAPI.fetchPlaylistDetails(playlistId),
          youtubeAPI.fetchPlaylistItems(playlistId, 50) // Fetch up to 50 videos
        ]);

        if (playlistItems.length === 0) {
          errors.push(`Playlist ${playlistId} is empty or inaccessible`);
          continue;
        }

        // Get video IDs from playlist items
        const videoIds = playlistItems
          .map(item => item.snippet.resourceId.videoId)
          .filter(Boolean);

        // Fetch detailed video information
        const videoDetails = await youtubeAPI.fetchVideoDetails(videoIds);

        // Convert to our VideoInfo format
        const playlistVideos: VideoInfo[] = videoDetails.map(convertAPIVideoToVideoInfo);

        playlists.push({
          id: playlistId,
          url: trimmedUrl,
          title: playlistDetails?.snippet.title || `Playlist ${playlistId}`,
          videos: playlistVideos
        });
      } catch (error) {
        console.error(`Error fetching playlist ${playlistId}:`, error);
        errors.push(`Failed to fetch playlist data for ${playlistId}`);
      }
    } else if (videoId) {
      try {
        // Fetch individual video details
        const videoDetail = await youtubeAPI.fetchVideoDetail(videoId);
        if (videoDetail) {
          videos.push(convertAPIVideoToVideoInfo(videoDetail));
        } else {
          videos.push({
            id: videoId,
            url: trimmedUrl,
            title: `Video ${videoId}` // Fallback title
          });
        }
      } catch (error) {
        console.error(`Error fetching video ${videoId}:`, error);
        // Still add the video with basic info
        videos.push({
          id: videoId,
          url: trimmedUrl
        });
      }
    } else {
      errors.push(`Could not extract video or playlist ID from: ${trimmedUrl}`);
    }
  }

  return { videos, playlists, errors };
}
