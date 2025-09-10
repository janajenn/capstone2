import { useEffect, useState } from 'react';

export function usePageTransition() {
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Listen for navigation events
        const handleStart = () => setIsTransitioning(true);
        const handleFinish = () => setIsTransitioning(false);

        // Add event listeners for Inertia navigation
        if (window.Inertia) {
            window.Inertia.on('start', handleStart);
            window.Inertia.on('finish', handleFinish);
        }

        return () => {
            if (window.Inertia) {
                window.Inertia.off('start', handleStart);
                window.Inertia.off('finish', handleFinish);
            }
        };
    }, []);

    return { isTransitioning };
}
