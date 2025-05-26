// YouTube Data API v3 integration
export interface YouTubeAPIVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 format (PT4M13S)
  };
}

export interface YouTubeAPIPlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

export interface YouTubeAPIPlaylistItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    resourceId: {
      videoId: string;
    };
  };
}

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export class YouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchPlaylistDetails(playlistId: string): Promise<YouTubeAPIPlaylist | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/playlists?part=snippet&id=${playlistId}&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      return null;
    }
  }

  async fetchPlaylistItems(playlistId: string, maxResults = 50): Promise<YouTubeAPIPlaylistItem[]> {
    try {
      const items: YouTubeAPIPlaylistItem[] = [];
      let nextPageToken = '';
      
      while (items.length < maxResults) {
        const pageSize = Math.min(50, maxResults - items.length); // API max is 50 per request
        const url = `${this.baseUrl}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${pageSize}&key=${this.apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        items.push(...(data.items || []));
        
        if (!data.nextPageToken || items.length >= maxResults) {
          break;
        }
        
        nextPageToken = data.nextPageToken;
      }
      
      return items.slice(0, maxResults);
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      return [];
    }
  }

  async fetchVideoDetails(videoIds: string[]): Promise<YouTubeAPIVideo[]> {
    if (videoIds.length === 0) return [];
    
    try {
      // API allows up to 50 video IDs per request
      const chunks: string[][] = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
      }
      
      const allVideos: YouTubeAPIVideo[] = [];
      
      for (const chunk of chunks) {
        const response = await fetch(
          `${this.baseUrl}/videos?part=snippet,contentDetails&id=${chunk.join(',')}&key=${this.apiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        allVideos.push(...(data.items || []));
      }
      
      return allVideos;
    } catch (error) {
      console.error('Error fetching video details:', error);
      return [];
    }
  }

  async fetchVideoDetail(videoId: string): Promise<YouTubeAPIVideo | null> {
    const videos = await this.fetchVideoDetails([videoId]);
    return videos[0] || null;
  }
}

// Factory function to create API instance
export function createYouTubeAPI(): YouTubeAPI | null {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YouTube API key not configured. Using placeholder data.');
    return null;
  }
  
  return new YouTubeAPI(apiKey);
}

// Helper function to convert API data to our VideoInfo format
export function convertAPIVideoToVideoInfo(apiVideo: YouTubeAPIVideo): {
  id: string;
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
} {
  return {
    id: apiVideo.id,
    url: `https://www.youtube.com/watch?v=${apiVideo.id}`,
    title: apiVideo.snippet.title,
    duration: parseDuration(apiVideo.contentDetails.duration),
    thumbnail: apiVideo.snippet.thumbnails.medium?.url || apiVideo.snippet.thumbnails.default?.url
  };
}
