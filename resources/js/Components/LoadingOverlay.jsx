// components/LoadingOverlay.jsx
export default function LoadingOverlay({ text = 'Loading...', subtext }) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[9999] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4">
          {/* Animated Spinner */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer ring */}
              <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
              {/* Spinning ring */}
              <div className="w-20 h-20 border-4 border-transparent border-t-white border-r-white rounded-full animate-spin absolute top-0 left-0"></div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
            </div>
          </div>
  
          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">{text}</h3>
            {subtext && (
              <p className="text-white/70 text-sm">{subtext}</p>
            )}
            {/* Animated dots */}
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }