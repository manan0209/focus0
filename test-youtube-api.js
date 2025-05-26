// Test script to verify YouTube API integration
// Run with: node test-youtube-api.js

// Note: You'll need to set NEXT_PUBLIC_YOUTUBE_API_KEY in .env.local first

import { parseYouTubeUrlsAsync } from './src/lib/youtube.js';

async function testYouTubeAPI() {
  console.log('🧪 Testing YouTube API Integration...\n');

  // Test playlist URL (public playlist)
  const testPlaylistUrl = 'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZU6NoQW2i1x71';
  
  console.log('📋 Testing playlist:', testPlaylistUrl);
  console.log('⏳ Fetching playlist data...\n');

  try {
    const result = await parseYouTubeUrlsAsync([testPlaylistUrl]);
    
    console.log('✅ Results:');
    console.log(`   📹 Videos: ${result.videos.length}`);
    console.log(`   📋 Playlists: ${result.playlists.length}`);
    console.log(`   ❌ Errors: ${result.errors.length}`);
    
    if (result.playlists.length > 0) {
      const playlist = result.playlists[0];
      console.log(`\n📋 Playlist: "${playlist.title}"`);
      console.log(`   🎬 Videos in playlist: ${playlist.videos.length}`);
      
      playlist.videos.slice(0, 3).forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.title} (${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')})`);
      });
      
      if (playlist.videos.length > 3) {
        console.log(`   ... and ${playlist.videos.length - 3} more videos`);
      }
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure to:');
      console.log('   1. Create .env.local file');
      console.log('   2. Add: NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here');
      console.log('   3. Get API key from: https://console.developers.google.com/');
    }
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testYouTubeAPI();
