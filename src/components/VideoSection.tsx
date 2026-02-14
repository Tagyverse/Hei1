import { Play } from 'lucide-react';

interface VideoItem {
  id: string;
  url: string;
  title: string;
  description: string;
  order: number;
  isVisible: boolean;
}

interface VideoSectionProps {
  videos: VideoItem[];
  title: string;
  subtitle: string;
}

const getEmbedUrl = (url: string): string => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : new URLSearchParams(url.split('?')[1]).get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
};

export default function VideoSection({ videos, title, subtitle }: VideoSectionProps) {
  if (videos.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className={`grid gap-6 ${
          videos.length === 1
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {videos.map((video) => (
            <div
              key={video.id}
              className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl"
            >
              <div className="relative bg-gray-100 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={getEmbedUrl(video.url)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>

              {(video.title || video.description) && (
                <div className="p-6">
                  {video.title && (
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {video.title}
                    </h3>
                  )}
                  {video.description && (
                    <p className="text-gray-600 leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
