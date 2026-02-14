interface ShimmerLoaderProps {
  variant?: 'card' | 'category' | 'product' | 'banner' | 'feature' | 'text' | 'review';
  count?: number;
  className?: string;
}

export default function ShimmerLoader({ variant = 'card', count = 1, className = '' }: ShimmerLoaderProps) {
  const shimmerClass = "relative overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer bg-[length:200%_100%]";

  const renderShimmer = () => {
    switch (variant) {
      case 'banner':
        return (
          <div className="relative h-[280px] sm:h-[350px] lg:h-[400px] overflow-hidden bg-gray-100">
            <div className={`absolute inset-0 ${shimmerClass}`}></div>
          </div>
        );

      case 'category':
        return (
          <div className="group bg-white overflow-hidden shadow-sm">
            <div className={`aspect-square ${shimmerClass}`}></div>
            <div className="p-4 space-y-3">
              <div className={`h-5 w-3/4 rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-1/2 rounded-lg ${shimmerClass}`}></div>
            </div>
          </div>
        );

      case 'product':
        return (
          <div className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200">
            <div className={`aspect-square ${shimmerClass}`}></div>
            <div className="p-4 sm:p-5 space-y-3">
              <div className={`h-6 w-full rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-3/4 rounded-lg ${shimmerClass}`}></div>
              <div className={`h-8 w-1/2 rounded-lg ${shimmerClass}`}></div>
              <div className={`h-10 w-full rounded-xl ${shimmerClass}`}></div>
            </div>
          </div>
        );

      case 'feature':
        return (
          <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-gray-200">
            <div className="relative p-8 sm:p-10 lg:p-12 space-y-6">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${shimmerClass}`}></div>
              <div className={`h-7 w-3/4 rounded-lg ${shimmerClass}`}></div>
              <div className="space-y-2">
                <div className={`h-4 w-full rounded-lg ${shimmerClass}`}></div>
                <div className={`h-4 w-5/6 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${shimmerClass}`}></div>
              <div className="flex-1 space-y-2">
                <div className={`h-5 w-32 rounded-lg ${shimmerClass}`}></div>
                <div className={`h-4 w-24 rounded-lg ${shimmerClass}`}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-4 w-full rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-5/6 rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-4/6 rounded-lg ${shimmerClass}`}></div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <div className={`h-4 w-full rounded-lg ${shimmerClass}`}></div>
            <div className={`h-4 w-5/6 rounded-lg ${shimmerClass}`}></div>
            <div className={`h-4 w-4/6 rounded-lg ${shimmerClass}`}></div>
          </div>
        );

      case 'card':
      default:
        return (
          <div className="bg-white rounded-3xl overflow-hidden border-2 border-gray-200">
            <div className={`aspect-[4/3] ${shimmerClass}`}></div>
            <div className="p-8 space-y-4">
              <div className={`h-6 w-3/4 rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-full rounded-lg ${shimmerClass}`}></div>
              <div className={`h-4 w-5/6 rounded-lg ${shimmerClass}`}></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderShimmer()}
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
