import { useEffect, useRef } from 'react';

interface VideoOverlay {
  id: string;
  video_url: string;
  overlay_text: string;
  overlay_subtext: string;
  order: number;
}

interface VideoOverlaySectionProps {
  videos: VideoOverlay[];
  title?: string;
  subtitle?: string;
}

export default function VideoOverlaySection({ videos }: VideoOverlaySectionProps) {
  if (videos.length === 0) return null;

  return (
    <>
      {videos.map((video) => (
        <VideoOverlayItem key={video.id} video={video} />
      ))}
    </>
  );
}

function VideoOverlayItem({ video }: { video: VideoOverlay }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked by browser
      });
    }
  }, []);

  const isYouTubeUrl = video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');

  return (
    <section className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
      {isYouTubeUrl ? (
        <iframe
          src={`${getYouTubeEmbedUrl(video.video_url)}?autoplay=1&mute=1&loop=1&controls=0&playlist=${extractYouTubeId(video.video_url)}`}
          className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          title={video.overlay_text}
        />
      ) : (
        <video
          ref={videoRef}
          src={video.video_url}
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-2xl">
            {video.overlay_text}
          </h2>
          {video.overlay_subtext && (
            <p className="text-lg sm:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto drop-shadow-lg">
              {video.overlay_subtext}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function extractYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = extractYouTubeId(url);
  return `https://www.youtube.com/embed/${videoId}`;
}
