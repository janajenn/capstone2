// components/LoadingPage.jsx
export default function LoadingPage({ 
    type = 'spinner', 
    text = 'Loading...', 
    subtext,
    size = 'lg',
    fullscreen = true 
  }) {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-20 h-20',
      xl: 'w-24 h-24'
    };
  
    const SpinnerLoader = () => (
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-white/20 rounded-full`}></div>
          <div className={`${sizeClasses[size]} border-4 border-transparent border-t-white border-r-white rounded-full animate-spin absolute top-0 left-0`}></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
        </div>
      </div>
    );
  
    const PulseLoader = () => (
      <div className="flex justify-center mb-6">
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl animate-pulse`}></div>
      </div>
    );
  
    const DotsLoader = () => (
      <div className="flex justify-center mb-6 space-x-2">
        <div className={`${sizeClasses.sm} bg-white rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizeClasses.sm} bg-white rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizeClasses.sm} bg-white rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  
    const BarsLoader = () => (
      <div className="flex justify-center mb-6 space-x-1">
        <div className="w-2 h-8 bg-white rounded-full animate-bar" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-8 bg-white rounded-full animate-bar" style={{ animationDelay: '100ms' }}></div>
        <div className="w-2 h-8 bg-white rounded-full animate-bar" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-8 bg-white rounded-full animate-bar" style={{ animationDelay: '300ms' }}></div>
        <div className="w-2 h-8 bg-white rounded-full animate-bar" style={{ animationDelay: '400ms' }}></div>
      </div>
    );
  
    const loaders = {
      spinner: <SpinnerLoader />,
      pulse: <PulseLoader />,
      dots: <DotsLoader />,
      bars: <BarsLoader />
    };
  
    const content = (
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4">
        {loaders[type]}
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">{text}</h3>
          {subtext && (
            <p className="text-white/70 text-sm">{subtext}</p>
          )}
        </div>
      </div>
    );
  
    if (fullscreen) {
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[9999] flex items-center justify-center">
          {content}
        </div>
      );
    }
  
    return content;
  }