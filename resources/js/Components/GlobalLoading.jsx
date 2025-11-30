// Components/GlobalLoading.jsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function GlobalLoading() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const start = () => {
            setLoading(true);
        };

        const finish = () => {
            setTimeout(() => setLoading(false), 300);
        };

        router.on('start', start);
        router.on('finish', finish);

        return () => {
            router.off('start', start);
            router.off('finish', finish);
        };
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-[9999] flex items-center justify-center">
            {/* White transparent container with elegant shadow */}
            <div className="bg-white/95 backdrop-blur-2xl border border-white/30 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300">
                {/* Bouncing Logo with shadow effect */}
                <div className="flex justify-center mb-6">
                    <div className="animate-bounce transition-transform duration-300 relative">
                        {/* Shadow that grows/shrinks with bounce */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black/20 blur-md rounded-full animate-pulse"></div>
                        <img 
                            src="/assets/Opol_logo.png"
                            alt="Logo"
                            className="w-20 h-20 object-contain relative z-10 drop-shadow-2xl"
                        />
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h3>
                    <p className="text-gray-600 text-sm mb-6">Hang tight, we’re setting things up for you.</p>

                    {/* Elegant loading dots */}
                    <div className="flex justify-center space-x-2 mt-4">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>

                {/* Subtle decorative elements */}
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-400/20 rounded-full blur-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-400/20 rounded-full blur-sm"></div>
            </div>
        </div>
    );
}