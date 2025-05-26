'use client';

import { useState } from 'react';
import { parseYouTubeUrls, VideoInfo, PlaylistInfo } from '@/lib/youtube';
import { Plus, Link, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

interface VideoUrlInputProps {
  onVideosAdded: (videos: VideoInfo[], playlists: PlaylistInfo[]) => void;
  className?: string;
}

export default function VideoUrlInput({ onVideosAdded, className = '' }: VideoUrlInputProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    setErrors([]);
    setSuccessCount(0);

    try {
      const urls = urlInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const { videos, playlists, errors: parseErrors } = parseYouTubeUrls(urls);

      if (parseErrors.length > 0) {
        setErrors(parseErrors);
      }

      if (videos.length > 0 || playlists.length > 0) {
        setSuccessCount(videos.length + playlists.length);
        onVideosAdded(videos, playlists);
        setUrlInput('');
      }
    } catch (error) {
      console.error('Error processing URLs:', error);
      setErrors(['An error occurred while processing URLs']);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearInput = () => {
    setUrlInput('');
    setErrors([]);
    setSuccessCount(0);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(prev => prev ? `${prev}\n${text}` : text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Link className="text-blue-400" size={20} />
        <h3 className="text-lg font-semibold text-white">Add YouTube Videos</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            YouTube URLs (one per line)
          </label>
          <div className="relative">
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={`Paste YouTube video or playlist URLs here...

Examples:
https://youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZU6NoQW2i1x71`}
              className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              disabled={isProcessing}
            />
            {urlInput && (
              <button
                type="button"
                onClick={clearInput}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!urlInput.trim() || isProcessing}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <Plus size={18} />
                Add Videos
              </>
            )}
          </button>

          <button
            type="button"
            onClick={pasteFromClipboard}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
          >
            Paste
          </button>
        </div>
      </form>

      {/* Success Message */}
      {successCount > 0 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <CheckCircle className="text-green-400" size={16} />
          <span className="text-green-400 text-sm">
            Successfully added {successCount} item{successCount > 1 ? 's' : ''}!
          </span>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-blue-400 font-medium text-sm mb-1">Supported formats:</h4>
        <ul className="text-blue-300 text-xs space-y-1">
          <li>• Individual videos: youtube.com/watch?v=... or youtu.be/...</li>
          <li>• Playlists: youtube.com/playlist?list=...</li>
          <li>• Multiple URLs: One per line</li>
        </ul>
      </div>
    </div>
  );
}
