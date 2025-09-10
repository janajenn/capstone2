import React, { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function TransitionManager({ 
    children, 
    animation = 'fade-slide-up',
    duration = 500,
    delay = 150,
    stagger = 0,
    className = ''
}) {
    const { component } = usePage();
    const [isVisible, setIsVisible] = useState(false);
    const [currentComponent, setCurrentComponent] = useState(component);
    const timeoutRef = useRef(null);
    const staggerTimeoutRef = useRef(null);

    // Enhanced animation variants with more sophisticated effects
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
        },
        'slide-up-bounce': {
            enter: 'opacity-100 translate-y-0',
            exit: 'opacity-0 translate-y-8'
        },
        'slide-down-bounce': {
            enter: 'opacity-100 translate-y-0',
            exit: 'opacity-0 -translate-y-8'
        },
        'fade-rotate': {
            enter: 'opacity-100 rotate-0',
            exit: 'opacity-0 rotate-12'
        },
        'fade-flip': {
            enter: 'opacity-100 rotate-y-0',
            exit: 'opacity-0 rotate-y-90'
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

    // Dynamic easing classes
    const getEasingClass = (animation) => {
        if (animation.includes('bounce')) {
            return 'ease-out';
        } else if (animation.includes('flip')) {
            return 'ease-in-out';
        } else {
            return 'ease-out';
        }
    };

    useEffect(() => {
        // Cleanup any existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (staggerTimeoutRef.current) {
            clearTimeout(staggerTimeoutRef.current);
        }

        // When component changes, start transition
        if (component !== currentComponent) {
            setIsVisible(false);
            
            // Main delay to ensure smooth transition
            timeoutRef.current = setTimeout(() => {
                setCurrentComponent(component);
                
                // Apply stagger effect if specified
                if (stagger > 0) {
                    staggerTimeoutRef.current = setTimeout(() => {
                        setIsVisible(true);
                    }, stagger);
                } else {
                    setIsVisible(true);
                }
            }, delay);
        } else {
            // Initial load
            setIsVisible(true);
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (staggerTimeoutRef.current) {
                clearTimeout(staggerTimeoutRef.current);
            }
        };
    }, [component, currentComponent, delay, stagger]);

    return (
        <div
            className={`transform transition-all ${getDurationClass(duration)} ${getEasingClass(animation)} ${className} ${
                isVisible 
                    ? selectedAnimation.enter
                    : selectedAnimation.exit
            }`}
        >
            {children}
        </div>
    );
}
