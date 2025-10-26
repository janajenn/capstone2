// Components/GlobalLoading.jsx
import { useState, useEffect } from 'react';

export default function GlobalLoading() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleStart = () => {
            setLoading(true);
            setProgress(20);
        };

        const handleProgress = (event) => {
            if (event.detail.progress.percentage) {
                setProgress(event.detail.progress.percentage);
            }
        };

        const handleFinish = () => {
            setProgress(100);
            setTimeout(() => setLoading(false), 300);
        };

        // Listen to Inertia events
        window.addEventListener('inertia:start', handleStart);
        window.addEventListener('inertia:progress', handleProgress);
        window.addEventListener('inertia:finish', handleFinish);

        return () => {
            window.removeEventListener('inertia:start', handleStart);
            window.removeEventListener('inertia:progress', handleProgress);
            window.removeEventListener('inertia:finish', handleFinish);
        };
    }, []);

    if (!loading) return null;

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
                    <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
                    <p className="text-white/70 text-sm">Please wait while we load the page</p>
                    {/* Progress bar */}
                    <div className="w-full bg-white/20 rounded-full h-2 mt-4">
                        <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
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