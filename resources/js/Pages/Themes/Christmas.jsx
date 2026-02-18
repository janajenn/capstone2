import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function ChristmasTheme() {
    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                backgroundColor: '#0c4a6e',
                backgroundImage: 'radial-gradient(#1e40af 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }}
        >
            {/* Snow Animation */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 100 }).map((_, i) => (
                    <motion.div
                        key={`snow-${i}`}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '-10px',
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            opacity: Math.random() * 0.7 + 0.3,
                        }}
                        animate={{
                            y: [0, window.innerHeight + 100],
                            x: [0, Math.random() * 100 - 50],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                    />
                ))}
            </div>

            {/* Christmas Ornaments */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={`ornament-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: '20px',
                            height: '20px',
                        }}
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                        }}
                    >
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-red-500 to-green-500 shadow-lg"></div>
                    </motion.div>
                ))}
            </div>

            {/* Theme Name Indicator */}
            <div className="absolute top-4 left-4 z-20">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-green-600 text-white text-sm font-medium shadow-lg">
                    Christmas Theme
                </div>
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Logo with Christmas Frame */}
                <div className="mb-8 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="px-3 py-1 bg-gradient-to-r from-red-600 to-green-600 rounded-sm shadow-lg">
                            <span className="text-white font-medium text-xs">Christmas 2024</span>
                        </div>
                    </div>
                    
                    {/* Christmas Wreath */}
                    <div className="absolute -inset-4">
                        <div className="w-full h-full rounded-full border-4 border-green-500"></div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                        </div>
                    </div>
                    
                    <img 
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo" 
                        className="h-36 w-auto mx-auto rounded-full shadow-xl relative z-10 border-2 border-red-500/30"
                    />
                </div>

                {/* Headline with Christmas Colors */}
                <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span style={{ color: '#dc2626' }}>I</span>
                    <span style={{ color: '#16a34a' }}>N</span>
                    <span style={{ color: '#dc2626' }}>T</span>
                    <span style={{ color: '#16a34a' }}>E</span>
                    <span style={{ color: '#dc2626' }}>G</span>
                    <span style={{ color: '#16a34a' }}>R</span>
                    <span style={{ color: '#dc2626' }}>A</span>
                    <span style={{ color: '#16a34a' }}>T</span>
                    <span style={{ color: '#dc2626' }}>E</span>
                    <span style={{ color: '#16a34a' }}>D</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-red-500 animate-pulse">
                        LEAVE MANAGEMENT SYSTEM
                    </span>
                </motion.h1>

                {/* Christmas Greeting */}
                <motion.h2
                    className="text-2xl md:text-4xl font-semibold mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-green-400">
                        Merry Christmas!
                    </span>
                </motion.h2>

                {/* Christmas Message */}
                <motion.div
                    className="mb-10 p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-red-500/30 shadow-xl max-w-2xl"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <p className="text-lg md:text-xl font-medium text-white leading-relaxed">
                        Season's Greetings! May your holidays be filled with joy and efficient governance.
                    </p>
                </motion.div>

                {/* Subtext */}
                <motion.p
                    className="text-md md:text-lg mb-10 max-w-2xl text-emerald-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                >
                    Streamline leave requests, approvals, and tracking for a merry work-life balance this holiday season.
                </motion.p>

                {/* Call-to-Action Button */}
                <motion.div
                    className="rounded-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className="relative overflow-hidden group py-3 px-8 rounded-full bg-gradient-to-r from-red-600 to-green-600 text-white font-semibold text-md shadow-lg hover:shadow-xl transform inline-block min-w-[200px]"
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            <span className="mr-2">🎄</span>
                            Get Started
                            <span className="ml-2">🎅</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                <p className="text-sm font-semibold text-emerald-300">
                    Merry Christmas from LGU Opol! May your holidays be bright! ✨
                </p>
            </motion.div>
        </div>
    );
}