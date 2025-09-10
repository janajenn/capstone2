import React, { useEffect, useState } from 'react';

export default function PageTransition({ 
    children, 
    animation = 'fade-slide-up',
    duration = 500,
    delay = 150,
    className = ''
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to ensure smooth transition
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    // Animation variants
    const animations = {
        'fade-slide-up': {
            enter: 'opacity-100 translate-y-0',
            exit: 'opacity-0 translate-y-4'
        },
        'fade-slide-down': {
            enter: 'opacity-100 translate-y-0',
            exit: 'opacity-0 -translate-y-4'
        },
        'fade-slide-left': {
            enter: 'opacity-100 translate-x-0',
            exit: 'opacity-0 -translate-x-4'
        },
        'fade-slide-right': {
            enter: 'opacity-100 translate-x-0',
            exit: 'opacity-0 translate-x-4'
        },
        'fade-scale': {
            enter: 'opacity-100 scale-100',
            exit: 'opacity-0 scale-95'
        },
        'fade-zoom': {
            enter: 'opacity-100 scale-100',
            exit: 'opacity-0 scale-105'
        }
    };

    const selectedAnimation = animations[animation] || animations['fade-slide-up'];

    // Dynamic duration classes
    const getDurationClass = (duration) => {
        const durationMap = {
            150: 'duration-150',
            200: 'duration-200',
            300: 'duration-300',
            500: 'duration-500',
            700: 'duration-700',
            1000: 'duration-1000'
        };
        return durationMap[duration] || 'duration-500';
    };

    return (
        <div
            className={`transform transition-all ${getDurationClass(duration)} ease-out ${className} ${
                isVisible 
                    ? selectedAnimation.enter
                    : selectedAnimation.exit
            }`}
        >
            {children}
        </div>
    );
}
