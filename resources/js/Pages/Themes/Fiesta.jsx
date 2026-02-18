import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function FiestaTheme() {
    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                backgroundColor: '#fdfaf7',
                backgroundImage: 'radial-gradient(#f3e7e9 0.5px, transparent 0.5px)',
                backgroundSize: '20px 20px',
            }}
        >
            {/* Enhanced Confetti Particles - More Visible and More of Them */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Large Confetti */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={`large-${i}`}
                        className="absolute w-4 h-4 transform rotate-45 rounded-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#fb923c', '#fde047', '#4ade80', '#60a5fa', '#f43f5e', '#c084fc', '#22d3ee'][i % 7],
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        animate={{
                            y: [0, 200, 0],
                            x: [0, Math.random() * 100 - 50, 0],
                            rotate: [0, 360, 720],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 3
                        }}
                    />
                ))}

                {/* Medium Confetti */}
                {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                        key={`medium-${i}`}
                        className="absolute w-3 h-3 transform rotate-45 rounded-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#fb923c', '#fde047', '#4ade80', '#60a5fa', '#f43f5e'][i % 5],
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                        animate={{
                            y: [0, 150, 0],
                            x: [0, Math.random() * 80 - 40, 0],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 2
                        }}
                    />
                ))}

                {/* Small Confetti */}
                {Array.from({ length: 60 }).map((_, i) => (
                    <motion.div
                        key={`small-${i}`}
                        className="absolute w-2 h-2 transform rotate-45"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#fb923c', '#fde047', '#4ade80', '#60a5fa', '#f43f5e', '#c084fc'][i % 6],
                        }}
                        animate={{
                            y: [0, 100, 0],
                            x: [0, Math.random() * 60 - 30, 0],
                            rotate: [0, 90, 180],
                            opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 1.5
                        }}
                    />
                ))}

                {/* Circular Confetti */}
                {Array.from({ length: 25 }).map((_, i) => (
                    <motion.div
                        key={`circle-${i}`}
                        className="absolute rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 6 + 2}px`,
                            height: `${Math.random() * 6 + 2}px`,
                            backgroundColor: ['#fde047', '#60a5fa', '#f43f5e', '#4ade80', '#fb923c'][i % 5],
                        }}
                        animate={{
                            y: [0, 180, 0],
                            x: [0, Math.random() * 120 - 60, 0],
                            scale: [0.5, 1.5, 0.5],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 2
                        }}
                    />
                ))}

                {/* Falling Streamers */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                        key={`streamer-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '-20px',
                            width: '3px',
                            height: '40px',
                            backgroundColor: ['#fb923c', '#fde047', '#4ade80', '#60a5fa', '#f43f5e'][i % 5],
                            borderRadius: '3px',
                        }}
                        animate={{
                            y: [0, window.innerHeight + 100],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 3
                        }}
                    />
                ))}
            </div>

            {/* Theme Name Indicator */}
            <div className="absolute top-4 left-4 z-20">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-medium shadow-sm">
                    Fiesta Theme
                </div>
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                {/* Logo with Subtle Frame */}
                <div className="mb-8 relative">
                    {/* Simple Decorative Banner */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="px-3 py-1 bg-gradient-to-r from-orange-300 to-red-400 rounded-sm shadow-sm">
                            <span className="text-white font-medium text-xs">Fiesta 2026</span>
                        </div>
                    </div>
                    
                    {/* Logo with Subtle Border */}
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-orange-200 to-red-200 rounded-full opacity-10 blur-md"></div>
                        <img 
                            src="/assets/Opol_logo.png"
                            alt="LGU Opol Logo" 
                            className="h-36 w-auto mx-auto rounded-full shadow-lg relative z-10 border border-orange-100"
                        />
                    </div>
                    
                    {/* Minimal Emblem */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-orange-300 to-red-400 rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
                    </div>
                </div>

                {/* Headline with Retro Multi-Color Effect */}
                <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span style={{ color: '#fbbf24' }}>I</span>
                    <span style={{ color: '#60a5fa' }}>N</span>
                    <span style={{ color: '#f43f5e' }}>T</span>
                    <span style={{ color: '#4ade80' }}>E</span>
                    <span style={{ color: '#fb923c' }}>G</span>
                    <span style={{ color: '#fbbf24' }}>R</span>
                    <span style={{ color: '#60a5fa' }}>A</span>
                    <span style={{ color: '#f43f5e' }}>T</span>
                    <span style={{ color: '#4ade80' }}>E</span>
                    <span style={{ color: '#fb923c' }}>D</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        LEAVE MANAGEMENT SYSTEM
                    </span>
                </motion.h1>

                {/* Subheading with Fiesta Greeting */}
                <motion.h2
                    className="text-2xl md:text-4xl font-semibold mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        Happy Fiesta!
                    </span>
                </motion.h2>

                {/* Fiesta Celebration Message */}
                <motion.div
                    className="mb-10 p-6 rounded-xl bg-white/90 border border-orange-100 shadow-lg max-w-2xl backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                    Viva Kabaya Festival! Celebrating community spirit, culture, and efficient governance.                    </p>
                </motion.div>

                {/* Subtext */}
                <motion.p
                    className="text-md md:text-lg mb-10 max-w-2xl text-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    Streamline leave requests, approvals, and tracking for a balanced work-life in our vibrant local government.
                </motion.p>

                {/* Call-to-Action Button */}
                <motion.div
                    className="rounded-full"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className="relative overflow-hidden group py-3 px-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold text-md shadow-md hover:shadow-lg transform inline-block min-w-[200px]"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            Get Started
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div 
                className="absolute bottom-4 text-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
            >
                <p className="text-sm font-semibold text-gray-700">
                    Mabuhay ang LGU Opol! Viva Kabaya Festival!
                </p>
            </motion.div>
        </div>
    );
}