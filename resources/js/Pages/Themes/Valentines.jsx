import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function ValentinesTheme() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{
                background: 'linear-gradient(to bottom, #fdf2f8, #ffe4e6)', // Soft gradient for a modern, airy feel
                transition: 'all 0.5s ease'
            }}
        >
            {/* Background Pattern - Subtle hearts instead of dots for theme relevance */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(#e11d48 0.3px, transparent 0.3px)',
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Minimal Animated Elements - Gentle floating hearts */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-rose-400 text-lg"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            scale: [1, 1.05, 1],
                            opacity: [0.4, 0.6, 0.4],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 4
                        }}
                    >
                        ❤️
                    </motion.div>
                ))}
            </div>

            {/* Theme Indicator - Clean, modern pill shape */}
            <div className="absolute top-4 left-4 z-20">
                <div className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-md text-rose-600 text-sm font-semibold shadow-sm border border-rose-200">
                    Valentine's Theme
                </div>
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-3xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                {/* Logo - With soft glow and minimal border */}
                <motion.div
                    className="mb-10 relative"
                    animate={{ scale: [1, 1.01, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="absolute inset-0 bg-rose-300/20 rounded-full blur-xl"></div>
                    <img
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo"
                        className="h-36 w-auto mx-auto rounded-full shadow-md relative z-10 border border-rose-100/50"
                    />
                </motion.div>

                {/* Headline - Clean sans-serif font, subtle shadow */}
                <motion.h1
                    className="text-4xl md:text-6xl font-extrabold mb-4 leading-none tracking-wide drop-shadow-sm"
                    style={{ color: '#881337' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    INTEGRATED LEAVE<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-700">
                        MANAGEMENT SYSTEM
                    </span>
                </motion.h1>

                {/* Subheading - Lighter weight for contrast */}
                <motion.h2
                    className="text-xl md:text-3xl font-medium mb-8"
                    style={{ color: '#be123c' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    Enhancing Efficiency with Care
                </motion.h2>

                {/* Message Card - Glassmorphism style for modernity */}
                <motion.div
                    className="mb-8 p-8 rounded-2xl bg-white/40 backdrop-blur-lg border border-white/30 shadow-md max-w-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    <p className="text-lg md:text-xl font-semibold text-gray-800 leading-relaxed">
                        Happy Valentine's Day. Let's manage leave requests with precision and compassion.
                    </p>
                </motion.div>

                {/* Subtext - Increased readability with better line height */}
                <motion.p
                    className="text-base md:text-lg mb-12 max-w-xl leading-loose"
                    style={{ color: '#881337' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    Streamline leave requests, approvals, and tracking for optimal work-life balance in local government operations.
                </motion.p>

                {/* CTA Button - Modern with gradient and subtle animation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    <Link
                        href={route('login')}
                        className="py-3 px-8 rounded-full bg-gradient-to-r from-rose-600 to-red-700 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-300 min-w-[200px]"
                    >
                        Get Started
                    </Link>
                </motion.div>

                {/* Additional Note - Minimal card style */}
                <motion.div
                    className="mt-6 p-3 rounded-lg bg-rose-50/30 border border-rose-100/50 text-sm text-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                >
                    Wishing you a productive and balanced day.
                </motion.div>
            </motion.div>

            {/* Floating Petals - Softer colors and slower animation */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-base"
                        style={{
                            left: `${Math.random() * 100}%`,
                            color: '#fb7185',
                        }}
                        animate={{
                            y: [0, window.innerHeight + 50],
                            x: [0, Math.random() * 30 - 15],
                            rotate: [0, 360],
                            opacity: [0, 0.6, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 6,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 6
                        }}
                    >
                        🌹
                    </motion.div>
                ))}
            </div>

            {/* Footer - Clean and centered */}
            <div className="absolute bottom-6 text-center text-sm" style={{ color: '#be123c' }}>
                Developed for LGU Opol
            </div>
        </div>
    );
}