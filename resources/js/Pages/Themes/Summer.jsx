import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function SummerTheme() {
    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                background: 'linear-gradient(135deg, #e0f7fa 0%, #fffbeb 50%, #fde68a 100%)',
                transition: 'all 0.5s ease'
            }}
        >
            {/* Subtle Animated Sun - Smaller and less intense */}
            <motion.div
                className="absolute top-10 right-10 z-0 opacity-50"
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-200 to-amber-300 rounded-full shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-amber-300 rounded-full animate-pulse opacity-50"></div>
                </div>
            </motion.div>

            {/* Swaying Coconut Trees for Beach Vibe */}
            <div className="absolute bottom-0 left-10 z-0 opacity-70">
                <motion.div
                    className="text-6xl"
                    animate={{
                        rotate: [-2, 2, -2],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    🌴
                </motion.div>
            </div>
            <div className="absolute bottom-0 right-10 z-0 opacity-70">
                <motion.div
                    className="text-6xl"
                    animate={{
                        rotate: [2, -2, 2],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                >
                    🌴
                </motion.div>
            </div>

            {/* Subtle Floating Elements - Use palm leaves for beach vibe */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-2xl"
                        style={{
                            left: `${Math.random() * 100}%`,
                            color: '#22c55e',
                        }}
                        animate={{
                            y: [0, -50, 0],
                            x: [0, Math.random() * 20 - 10],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 3
                        }}
                    >
                        🍃
                    </motion.div>
                ))}
            </div>

            {/* Theme Name Indicator - More subtle */}
            <div className="absolute top-4 left-4 z-20">
                <div className="px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-medium shadow-md">
                    Summer Beach Theme
                </div>
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Logo with Subtle Glow */}
                <motion.div
                    className="mb-8 relative"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-lg opacity-20"></div>
                    <img 
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo" 
                        className="h-40 w-auto mx-auto rounded-full shadow-xl relative z-10 border-2 border-amber-200"
                    />
                </motion.div>

                {/* Headline with Professional Gradient */}
                <motion.h1
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight"
                    style={{ color: '#78350f' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    INTEGRATED LEAVE<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                        MANAGEMENT SYSTEM
                    </span>
                </motion.h1>

                {/* Subheading - More formal with beach touch */}
                <motion.h2
                    className="text-2xl md:text-4xl font-semibold mb-8"
                    style={{ color: '#92400e' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Embracing Summer Beach Vibes
                </motion.h2>

                {/* Professional Message with beach reference */}
                <motion.div
                    className="mb-10 p-6 rounded-xl bg-white/90 border border-amber-100 shadow-lg max-w-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed">
                        Feel the beach breeze this summer with streamlined leave management for enhanced productivity.
                    </p>
                </motion.div>

                {/* Subtext - Clean and professional */}
                <motion.p
                    className="text-lg md:text-xl mb-10 max-w-2xl"
                    style={{ color: '#78350f' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    Optimize leave requests, approvals, and tracking to support a balanced work-life in local government.
                </motion.p>

                {/* Call-to-Action Button - Sleeker design */}
                <motion.div
                    className="rounded-full"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className="relative overflow-hidden group py-4 px-10 rounded-full bg-amber-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl transform inline-block min-w-[250px]"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            Get Started
                        </span>
                        <div className="absolute inset-0 bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                </motion.div>

                {/* Additional Note - Subtle with beach vibe */}
                <motion.div
                    className="mt-8 p-4 rounded-lg bg-amber-50/50 border border-amber-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    <p className="text-sm text-gray-700">
                        Achieve balance and efficiency under the summer sun.
                    </p>
                </motion.div>
            </motion.div>

            {/* Ocean Wave Effect at Bottom - Blue for beach vibe */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-60">
                <svg className="relative block w-full h-32" viewBox="0 0 1420 100" preserveAspectRatio="none">
                    <path
                        fill="#3b82f6"
                        fillOpacity="0.5"
                        d="M0,0 C200,150 1220,150 1420,0 L1420,100 L0,100 Z"
                    >
                        <animate
                            attributeName="d"
                            values="M0,0 C200,150 1220,150 1420,0 L1420,100 L0,100 Z; M0,0 C400,50 1020,250 1420,0 L1420,100 L0,100 Z; M0,0 C200,150 1220,150 1420,0 L1420,100 L0,100 Z"
                            dur="10s"
                            repeatCount="indefinite"
                        />
                    </path>
                </svg>
            </div>

            {/* Footer - Professional */}
            <div className="absolute bottom-4 text-center z-20">
                <p className="text-sm" style={{ color: '#92400e' }}>
                    Developed for LGU Opol
                </p>
            </div>
        </div>
    );
}