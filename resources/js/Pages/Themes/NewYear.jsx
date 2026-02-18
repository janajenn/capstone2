import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function NewYearTheme() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [fireworks, setFireworks] = useState([]);
    const currentYear = currentTime.getFullYear();
    const nextYear = currentYear + 1;
    const isNewYear = currentTime.getMonth() === 0 && currentTime.getDate() === 1;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Create initial fireworks
        const initialFireworks = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: 10 + i * 10,
            y: Math.random() * 100,
            color: ['#fbbf24', '#60a5fa', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'][i % 6],
            size: Math.random() * 2 + 1,
        }));
        setFireworks(initialFireworks);

        return () => clearInterval(timer);
    }, []);

    const addFirework = () => {
        const newFirework = {
            id: Date.now(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: ['#fbbf24', '#60a5fa', '#ec4899', '#10b981', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 6)],
            size: Math.random() * 3 + 1,
        };
        setFireworks(prev => [...prev.slice(-50), newFirework]);
    };

    useEffect(() => {
        const fireworkInterval = setInterval(addFirework, 300);
        return () => clearInterval(fireworkInterval);
    }, []);

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                backgroundColor: '#0a0a1e',
                backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(96, 165, 250, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at 40% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
                    linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)
                `
            }}
        >
            {/* Interactive Background with Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Stars */}
                {Array.from({ length: 150 }).map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute w-[2px] h-[2px] bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: i * 0.1
                        }}
                    />
                ))}

                {/* Constellation Lines */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={`constellation-${i}`}
                        className="absolute w-20 h-px bg-blue-400/30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                        }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    />
                ))}

                {/* Giant Fireworks */}
                <div className="absolute inset-0">
                    {fireworks.map((firework, index) => (
                        <motion.div
                            key={firework.id}
                            className="absolute"
                            style={{
                                left: `${firework.x}%`,
                                top: `${firework.y}%`,
                            }}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ 
                                scale: [0, 1, 0],
                                opacity: [1, 0.8, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "easeOut",
                            }}
                            onAnimationComplete={() => {
                                if (index > 20) {
                                    setFireworks(prev => prev.filter(f => f.id !== firework.id));
                                }
                            }}
                        >
                            {/* Firework Burst */}
                            {Array.from({ length: 24 }).map((_, i) => (
                                <motion.div
                                    key={`particle-${firework.id}-${i}`}
                                    className="absolute w-1 h-3"
                                    style={{
                                        backgroundColor: firework.color,
                                        transformOrigin: 'center bottom',
                                        transform: `rotate(${i * 15}deg)`,
                                    }}
                                    initial={{ scale: 0, y: 0 }}
                                    animate={{ 
                                        scale: [0, 1, 0],
                                        y: [0, 60, 0],
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        ease: "easeOut",
                                    }}
                                />
                            ))}
                            
                            {/* Firework Glow */}
                            <motion.div
                                className="absolute -inset-4 rounded-full"
                                style={{
                                    background: `radial-gradient(circle, ${firework.color}40 0%, transparent 70%)`,
                                }}
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 3, 0] }}
                                transition={{ duration: 1.5 }}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Confetti Storm */}
                <div className="absolute inset-0">
                    {Array.from({ length: 200 }).map((_, i) => (
                        <motion.div
                            key={`confetti-${i}`}
                            className="absolute w-2 h-2"
                            style={{
                                backgroundColor: ['#fbbf24', '#60a5fa', '#ec4899', '#10b981', '#8b5cf6'][i % 5],
                                left: `${Math.random() * 100}%`,
                                top: `${-10 - Math.random() * 20}%`,
                            }}
                            animate={{
                                y: ['0vh', '120vh'],
                                x: [0, Math.random() * 100 - 50],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 5,
                            }}
                        />
                    ))}
                </div>

                {/* Balloon Animation */}
                {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                        key={`balloon-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: '110%',
                        }}
                        animate={{
                            y: ['110%', '-20%'],
                            x: [0, Math.random() * 100 - 50],
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 10,
                        }}
                    >
                        <div className="relative">
                            <div 
                                className="w-8 h-10 rounded-full"
                                style={{
                                    backgroundColor: ['#fbbf24', '#60a5fa', '#ec4899', '#10b981'][i % 4],
                                }}
                            />
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gray-300"></div>
                        </div>
                    </motion.div>
                ))}

                {/* Floating Bubbles */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={`bubble-${i}`}
                        className="absolute rounded-full border border-white/20"
                        style={{
                            width: `${Math.random() * 20 + 5}px`,
                            height: `${Math.random() * 20 + 5}px`,
                            left: `${Math.random() * 100}%`,
                            top: '110%',
                        }}
                        animate={{
                            y: ['110%', '-20%'],
                            x: [0, Math.random() * 40 - 20],
                            opacity: [0.8, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5,
                        }}
                    />
                ))}

                {/* Time Glow Effect */}
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'radial-gradient(circle at 30% 40%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 70% 60%, rgba(96, 165, 250, 0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                        ]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
            </div>

            {/* Countdown Timer (Real-time) */}
            <motion.div
                className="absolute top-4 right-4 z-30 p-4 rounded-2xl backdrop-blur-sm bg-black/30 border border-white/20 shadow-2xl"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="text-center">
                    <div className="text-xs text-yellow-300 mb-1">COUNTDOWN TO NEW YEAR</div>
                    <div className="text-2xl font-bold text-white">
                        {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-blue-300 mt-1">
                        {isNewYear ? '🎉 HAPPY NEW YEAR! 🎉' : 'Almost there!'}
                    </div>
                </div>
            </motion.div>

            {/* Main Content Container */}
            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-6xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
            >
                {/* Year Transition Animation */}
                <motion.div
                    className="relative mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-center space-x-8 mb-6">
                        <motion.div
                            className="text-8xl md:text-9xl font-black text-yellow-400 relative"
                            animate={{
                                scale: [1, 1.05, 1],
                                textShadow: [
                                    '0 0 20px rgba(251, 191, 36, 0.5)',
                                    '0 0 40px rgba(251, 191, 36, 0.8)',
                                    '0 0 20px rgba(251, 191, 36, 0.5)',
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                            }}
                        >
                            {currentYear}
                        </motion.div>
                        
                        <motion.div
                            className="text-4xl text-white"
                            animate={{
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            ⏩
                        </motion.div>
                        
                        <motion.div
                            className="text-8xl md:text-9xl font-black text-blue-400 relative"
                            animate={{
                                scale: [1, 1.1, 1],
                                textShadow: [
                                    '0 0 20px rgba(96, 165, 250, 0.5)',
                                    '0 0 40px rgba(96, 165, 250, 0.8)',
                                    '0 0 20px rgba(96, 165, 250, 0.5)',
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: 0.5,
                            }}
                        >
                            {nextYear}
                        </motion.div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{
                                duration: 60,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        <motion.div
                            className="absolute top-0 h-full w-2 bg-white"
                            initial={{ left: '0%' }}
                            animate={{ left: '100%' }}
                            transition={{
                                duration: 60,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    </div>
                </motion.div>

                {/* Logo with Celebration Effect */}
                <motion.div
                    className="relative mb-12"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    {/* Ring Effect */}
                    <motion.div
                        className="absolute -inset-4 border-4 border-transparent rounded-full"
                        animate={{
                            borderColor: ['rgba(251, 191, 36, 0.3)', 'rgba(96, 165, 250, 0.3)', 'rgba(236, 72, 153, 0.3)'],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                        }}
                    />
                    
                    {/* Sparkles around logo */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={`sparkle-${i}`}
                            className="absolute"
                            style={{
                                left: `${Math.cos((i * 45 * Math.PI) / 180) * 120}px`,
                                top: `${Math.sin((i * 45 * Math.PI) / 180) * 120}px`,
                            }}
                            animate={{
                                rotate: [0, 360],
                                scale: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        >
                            <span className="text-2xl">✨</span>
                        </motion.div>
                    ))}
                    
                    <img 
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo" 
                        className="h-44 w-auto mx-auto rounded-full shadow-2xl relative z-10 border-4 border-yellow-400/50 bg-gradient-to-br from-gray-900 to-black"
                    />
                    
                    {/* Celebration Horns */}
                    <motion.div
                        className="absolute -top-6 -left-6 text-4xl"
                        animate={{
                            rotate: [0, -20, 0],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        🎺
                    </motion.div>
                    <motion.div
                        className="absolute -top-6 -right-6 text-4xl"
                        animate={{
                            rotate: [0, 20, 0],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: 0.5
                        }}
                    >
                        🎷
                    </motion.div>
                </motion.div>

                {/* Main Heading */}
                <motion.div
                    className="mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            background: 'linear-gradient(90deg, #fbbf24, #ec4899, #60a5fa, #10b981, #8b5cf6, #fbbf24)',
                            backgroundSize: '300% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        LEAVE MANAGEMENT SYSTEM
                    </motion.h1>
                    
                    {/* Animated Underline */}
                    <motion.div
                        className="h-1 mx-auto max-w-md bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5, delay: 1 }}
                    />
                </motion.div>

                {/* Celebration Message */}
                <motion.div
                    className="mb-12 p-8 rounded-3xl relative overflow-hidden group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.8) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Animated Border */}
                    <motion.div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), rgba(236, 72, 153, 0.3), rgba(96, 165, 250, 0.3), transparent)',
                        }}
                        animate={{
                            x: ['-100%', '200%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center space-x-4 mb-6">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                🎆
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300">
                                HAPPY NEW YEAR {nextYear}!
                            </h2>
                            <motion.div
                                animate={{ rotate: [360, 0] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                                🎇
                            </motion.div>
                        </div>
                        
                        <p className="text-xl md:text-2xl text-white leading-relaxed max-w-3xl">
                            Cheers to new beginnings! Wishing you a year filled with 
                            <span className="font-bold text-yellow-300"> prosperity</span>, 
                            <span className="font-bold text-pink-300"> success</span>, and 
                            <span className="font-bold text-blue-300"> efficient governance</span>.
                            May this New Year bring fresh opportunities and seamless workflows!
                        </p>
                        
                        {/* Celebration Stats */}
                        <div className="grid grid-cols-3 gap-6 mt-8">
                            {[
                                { icon: '🚀', label: 'Productivity', value: '+100%' },
                                { icon: '✨', label: 'Efficiency', value: '99.9%' },
                                { icon: '🎯', label: 'Success Rate', value: 'A+' },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5 + idx * 0.2 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="text-3xl mb-2">{stat.icon}</div>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-sm text-gray-300">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Resolution Section */}
                <motion.div
                    className="mb-12 max-w-3xl relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    <h3 className="text-2xl font-bold text-yellow-300 mb-4">🎯 New Year's Resolution:</h3>
                    <p className="text-lg md:text-xl text-white mb-6">
                        This year, let's resolve to make leave management 
                        <span className="font-bold text-pink-300"> simpler</span>, 
                        <span className="font-bold text-blue-300"> faster</span>, and 
                        <span className="font-bold text-green-300"> more efficient</span> than ever before!
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        {['⚡ Instant Approvals', '📱 Mobile Access', '📊 Real-time Tracking', '🔒 Secure & Reliable'].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-white/10 backdrop-blur-sm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2.2 + idx * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className="text-white">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Main CTA Button */}
                <motion.div
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.5 }}
                >
                    {/* Glowing Orb Effect */}
                    <motion.div
                        className="absolute -inset-6 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, rgba(96, 165, 250, 0.2) 50%, transparent 70%)',
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    
                    <Link
                        href={route('login')}
                        className="relative overflow-hidden group py-5 px-16 rounded-full bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transform inline-flex items-center justify-center min-w-[300px] border-2 border-yellow-400/50"
                    >
                        {/* Animated Background */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                            animate={{
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                backgroundSize: '200% auto',
                            }}
                        />
                        
                        <span className="relative z-10 flex items-center justify-center space-x-3">
                            <motion.span
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="text-2xl"
                            >
                                🚀
                            </motion.span>
                            <span className="font-bold">LAUNCH INTO {nextYear}</span>
                            <motion.span
                                animate={{ rotate: [360, 0] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="text-2xl"
                            >
                                🎆
                            </motion.span>
                        </span>
                        
                        {/* Button Border Animation */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                            }}
                            animate={{
                                x: ['-100%', '200%'],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: 0.5
                            }}
                        />
                        
                        {/* Sparkle Particles */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div
                                key={`btn-sparkle-${i}`}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    scale: [0, 1, 0],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </Link>
                </motion.div>

                {/* Bottom Celebration */}
                <motion.div
                    className="mt-12 p-6 rounded-2xl backdrop-blur-sm bg-black/30 border border-white/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                >
                    <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-blue-300 mb-2">
                        🎊 WELCOME {nextYear} AT LGU OPOL! 🎊
                    </p>
                    <p className="text-sm text-gray-300">
                        Here's to a year of innovation, collaboration, and exceptional public service!
                    </p>
                </motion.div>
            </motion.div>

            {/* Interactive Firework Trigger */}
            <motion.button
                className="absolute bottom-4 left-4 z-30 p-3 rounded-full backdrop-blur-sm bg-black/30 border border-white/20 text-white hover:text-yellow-300 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={addFirework}
            >
                <span className="text-xl">🎆</span>
                <span className="text-xs absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    +
                </span>
            </motion.button>

            {/* Scrolling Celebration Text */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent z-20 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
            >
                <motion.div
                    className="whitespace-nowrap text-sm text-yellow-300"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    🎉 • HAPPY NEW YEAR {nextYear}! • 🎊 • CHEERS TO NEW BEGINNINGS • 🥂 • PROSPERITY • 🚀 • SUCCESS • 
                    🎉 • HAPPY NEW YEAR {nextYear}! • 🎊 • CHEERS TO NEW BEGINNINGS • 🥂 • PROSPERITY • 🚀 • SUCCESS •
                </motion.div>
            </motion.div>

            {/* Audio Control (Optional) */}
            <motion.button
                className="absolute bottom-4 right-4 z-30 p-3 rounded-full backdrop-blur-sm bg-black/30 border border-white/20 text-white hover:text-blue-300 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    // Add New Year celebration sound
                }}
            >
                <span className="text-xl">🎵</span>
            </motion.button>
        </div>
    );
}