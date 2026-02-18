import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function HalloweenTheme() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        
        // Audio for spooky effects (optional)
        const playSpookySound = () => {
            // Uncomment to add sound
            // const audio = new Audio('/spooky-sound.mp3');
            // audio.volume = 0.1;
            // audio.play().catch(e => console.log('Audio error:', e));
        };
        
        document.addEventListener('click', playSpookySound);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('click', playSpookySound);
        };
    }, []);

    const floatingCandles = Array.from({ length: 15 });
    const bats = Array.from({ length: 20 });
    const ghosts = Array.from({ length: 8 });
    const spiders = Array.from({ length: 6 });

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                backgroundColor: '#0a0a1a',
                backgroundImage: `
                    radial-gradient(circle at 20% 50%, rgba(255, 165, 0, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(31, 0, 48, 0.8) 0%, rgba(31, 0, 48, 0.8) 100%),
                    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                `
            }}
        >
            {/* Animated Spooky Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated Gradient Overlay */}
                <motion.div 
                    className="absolute inset-0"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 30%, rgba(255, 165, 0, 0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                            'radial-gradient(circle at 50% 50%, rgba(255, 165, 0, 0.1) 0%, transparent 50%)',
                        ]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                
                {/* Haunted Mist/Fog */}
                <div className="absolute inset-0">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <motion.div
                            key={`mist-${i}`}
                            className="absolute w-64 h-64 bg-gradient-to-r from-purple-500/5 to-orange-500/5 rounded-full blur-3xl"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                x: [0, Math.random() * 200 - 100, 0],
                                y: [0, Math.random() * 200 - 100, 0],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 15 + Math.random() * 10,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.5
                            }}
                        />
                    ))}
                </div>

                {/* Floating Jack-o-Lanterns with Candle Light */}
                {floatingCandles.map((_, i) => (
                    <motion.div
                        key={`candle-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: '60px',
                            height: '60px',
                        }}
                        animate={{
                            y: [0, -50, 0],
                            rotate: [0, 180, 360],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                        }}
                    >
                        {/* Candle Flame */}
                        <motion.div
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.8, 1, 0.8],
                            }}
                            transition={{
                                duration: 0.5 + Math.random() * 0.3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="w-4 h-8 bg-gradient-to-b from-yellow-400 via-orange-500 to-red-500 rounded-full blur-sm"></div>
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-yellow-300/30 rounded-full blur-md"></div>
                        </motion.div>
                        
                        {/* Pumpkin */}
                        <div className="relative">
                            <div className="w-16 h-14 bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700 rounded-full relative">
                                {/* Pumpkin Ridges */}
                                <div className="absolute top-1 left-2 w-12 h-1 bg-orange-700 rounded-full"></div>
                                <div className="absolute top-3 left-2 w-12 h-1 bg-orange-700 rounded-full"></div>
                                <div className="absolute top-5 left-2 w-12 h-1 bg-orange-700 rounded-full"></div>
                                
                                {/* Face */}
                                <div className="absolute top-3 left-5 w-1 h-1 bg-black rounded-full"></div>
                                <div className="absolute top-3 right-5 w-1 h-1 bg-black rounded-full"></div>
                                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black rounded-full"></div>
                            </div>
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-green-600 rounded-t-sm"></div>
                        </div>
                        
                        {/* Candle Glow */}
                        <div className="absolute -inset-4 bg-yellow-500/10 rounded-full blur-md"></div>
                    </motion.div>
                ))}

                {/* Flying Bats with Trail Effect */}
                {bats.map((_, i) => (
                    <motion.div
                        key={`bat-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: '40px',
                            height: '30px',
                            color: 'rgba(109, 40, 217, 0.8)',
                            filter: 'drop-shadow(0 0 8px rgba(255, 165, 0, 0.5))'
                        }}
                        animate={{
                            x: [0, Math.random() * 400 - 200, Math.random() * 200 - 100, 0],
                            y: [0, Math.random() * 400 - 200, Math.random() * 200 - 100, 0],
                            rotate: [0, 180, 360, 180, 0],
                        }}
                        transition={{
                            duration: 7 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2C8,2,4,6,4,10C4,18,12,22,12,22S20,18,20,10C20,6,16,2,12,2M14,6L13,8H15L14,10L16,11L14,12L13,14L12,13L11,14L10,12L8,11L10,10L9,8H11L10,6H12H14Z" />
                        </svg>
                        
                        {/* Bat Trail */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full blur-sm"
                            animate={{ opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    </motion.div>
                ))}

                {/* Floating Ghosts with Glow */}
                {ghosts.map((_, i) => (
                    <motion.div
                        key={`ghost-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: '60px',
                            height: '70px',
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, Math.random() * 20 - 10, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.4
                        }}
                    >
                        <div className="relative">
                            <div className="w-16 h-20 bg-gradient-to-b from-white/90 via-white/70 to-transparent rounded-t-full rounded-b-3xl relative">
                                <div className="absolute top-4 left-5 w-3 h-3 bg-black rounded-full"></div>
                                <div className="absolute top-4 right-5 w-3 h-3 bg-black rounded-full"></div>
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="w-4 h-3 bg-white rounded-b-full"></div>
                                    ))}
                                </div>
                            </div>
                            {/* Ghost Glow */}
                            <div className="absolute -inset-3 bg-white/10 rounded-full blur-md"></div>
                        </div>
                    </motion.div>
                ))}

                {/* Crawling Spiders */}
                {spiders.map((_, i) => (
                    <motion.div
                        key={`spider-${i}`}
                        className="absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: '30px',
                            height: '30px',
                        }}
                        animate={{
                            x: [0, Math.random() * 100 - 50, 0],
                            y: [0, Math.random() * 100 - 50, 0],
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5
                        }}
                    >
                        <div className="relative">
                            <div className="w-6 h-6 bg-black rounded-full"></div>
                            {/* Spider Legs */}
                            {Array.from({ length: 8 }).map((_, leg) => (
                                <div
                                    key={leg}
                                    className="absolute w-6 h-0.5 bg-black origin-left"
                                    style={{
                                        transform: `rotate(${leg * 45}deg)`,
                                        left: '15px',
                                        top: '15px',
                                    }}
                                />
                            ))}
                            {/* Spider Eyes */}
                            <div className="absolute top-2 left-2 w-1 h-1 bg-red-500 rounded-full"></div>
                            <div className="absolute top-2 right-2 w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                    </motion.div>
                ))}
                
                {/* Interactive Mouse Light */}
                <motion.div
                    className="fixed w-96 h-96 rounded-full pointer-events-none"
                    animate={{
                        x: mousePosition.x - 192,
                        y: mousePosition.y - 192,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 150,
                        damping: 15
                    }}
                    style={{
                        background: 'radial-gradient(circle at center, rgba(255, 165, 0, 0.1) 0%, transparent 70%)',
                    }}
                />
            </div>

            {/* Blood Drips on Top */}
            <div className="absolute top-0 left-0 right-0 h-8 z-20 flex justify-center">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                        key={`blood-${i}`}
                        className="w-2 h-6 bg-gradient-to-b from-red-600 via-red-800 to-transparent rounded-b-full mx-1"
                        animate={{
                            height: ['24px', '32px', '24px'],
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    />
                ))}
            </div>

            {/* Theme Name with Glowing Effect */}
            <motion.div
                className="absolute top-4 left-4 z-30"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
            >
                <div className="relative">
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-2xl backdrop-blur-sm border border-orange-400/50">
                        🎃 HALLOWEEN EDITION 🎃
                    </div>
                    <motion.div
                        className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 -z-10"
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
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-6xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
            >
                {/* Spooky Logo Container */}
                <motion.div
                    className="mb-10 relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.8 }}
                >
                    {/* Spider Web Frame */}
                    <div className="absolute -inset-8">
                        <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full opacity-50"></div>
                        <div className="absolute inset-4 border-2 border-purple-500/30 rounded-full opacity-50"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-16 bg-gradient-to-b from-transparent via-orange-500/50 to-transparent"></div>
                            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        </div>
                    </div>
                    
                    {/* Logo with Haunted Glow */}
                    <div className="relative">
                        <motion.div
                            className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-70"
                            animate={{
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        
                        <img 
                            src="/assets/Opol_logo.png"
                            alt="LGU Opol Logo" 
                            className="h-44 w-auto mx-auto rounded-full shadow-2xl relative z-10 border-4 border-orange-400/50 bg-gradient-to-br from-gray-900 to-black"
                        />
                        
                        {/* Floating Spiders around logo */}
                        {[1, 2, 3].map((spider) => (
                            <motion.div
                                key={spider}
                                className="absolute"
                                style={{
                                    left: spider === 1 ? '-20px' : spider === 2 ? 'calc(100% - 10px)' : '50%',
                                    top: spider === 1 ? '50%' : spider === 2 ? '50%' : '-20px'
                                }}
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 180, 360],
                                }}
                                transition={{
                                    duration: 3 + spider,
                                    repeat: Infinity,
                                    delay: spider * 0.5
                                }}
                            >
                                <div className="w-8 h-8 text-orange-500">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2C8,2,4,6,4,10C4,18,12,22,12,22S20,18,20,10C20,6,16,2,12,2M14,6L13,8H15L14,10L16,11L14,12L13,14L12,13L11,14L10,12L8,11L10,10L9,8H11L10,6H12H14Z" />
                                    </svg>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Animated Title */}
                <motion.div className="mb-8 relative">
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        {["I", "N", "T", "E", "G", "R", "A", "T", "E", "D"].map((letter, idx) => (
                            <motion.span
                                key={idx}
                                className="inline-block"
                                style={{ 
                                    color: idx % 2 === 0 ? '#f97316' : '#a855f7',
                                    filter: 'drop-shadow(0 0 10px currentColor)'
                                }}
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: idx * 0.1
                                }}
                            >
                                {letter}
                            </motion.span>
                        ))}
                        <br />
                        <motion.span
                            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-purple-500 to-pink-500 font-extrabold"
                            animate={{
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                            }}
                        >
                            LEAVE MANAGEMENT SYSTEM
                        </motion.span>
                    </motion.h1>
                    
                    {/* Underline Animation */}
                    <motion.div
                        className="h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-pink-500 rounded-full mt-2"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, delay: 1.5 }}
                    />
                </motion.div>

                {/* Spooky Greeting with Glitch Effect */}
                <motion.h2
                    className="text-3xl md:text-5xl font-bold mb-10 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                >
                    <span className="relative">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500">
                            HAPPY HALLOWEEN!
                        </span>
                        <motion.span
                            className="absolute left-0 top-0 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500"
                            animate={{
                                clipPath: [
                                    'inset(0 100% 0 0)',
                                    'inset(0 0% 0 0)',
                                    'inset(0 0% 0 100%)',
                                ],
                            }}
                            transition={{
                                duration: 0.5,
                                times: [0, 0.05, 1],
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            HAPPY HALLOWEEN!
                        </motion.span>
                    </span>
                </motion.h2>

                {/* Haunted Message Card */}
                <motion.div
                    className="mb-12 p-8 rounded-2xl relative overflow-hidden group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(31, 0, 48, 0.9) 0%, rgba(55, 0, 60, 0.9) 100%)',
                        border: '1px solid rgba(255, 165, 0, 0.3)',
                        boxShadow: '0 0 50px rgba(255, 165, 0, 0.2)',
                    }}
                >
                    {/* Animated Border */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255, 165, 0, 0.3), transparent)',
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
                        <div className="flex items-center justify-center mb-4">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="mr-3"
                            >
                                <span className="text-2xl">👻</span>
                            </motion.div>
                            <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-300 to-purple-300 bg-clip-text text-transparent">
                                BOO! SCARY-GOOD LEAVE MANAGEMENT
                            </p>
                            <motion.div
                                animate={{ rotate: [360, 0] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="ml-3"
                            >
                                <span className="text-2xl">🎃</span>
                            </motion.div>
                        </div>
                        
                        <p className="text-lg md:text-xl font-medium text-orange-100 leading-relaxed max-w-3xl">
                            Managing leaves shouldn't be a horror show! Our system makes it a treat with 
                            <span className="font-bold text-orange-300"> ghostly efficiency</span> and 
                            <span className="font-bold text-purple-300"> spellbinding simplicity</span>. 
                            Enjoy the spooky season with seamless governance!
                        </p>
                    </div>
                    
                    {/* Floating Candles inside card */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex space-x-8">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-600 rounded-full"
                                animate={{
                                    height: ['16px', '24px', '16px'],
                                    opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.3
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Subtext with Ghost Typing Effect */}
                <motion.div
                    className="mb-12 max-w-3xl relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.3 }}
                >
                    <p className="text-lg md:text-xl mb-4 font-medium text-purple-200">
                        <span className="text-orange-300 font-bold">Streamline</span> leave requests, 
                        <span className="text-orange-300 font-bold"> automate</span> approvals, and 
                        <span className="text-orange-300 font-bold"> track</span> everything - 
                        no tricks, just treats for our local government!
                    </p>
                    
                    <div className="flex items-center justify-center space-x-4 text-sm text-orange-400">
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            ⚡
                        </motion.div>
                        <span>100% Ghost-Proof Security</span>
                        <motion.div
                            animate={{ rotate: [360, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            ⚡
                        </motion.div>
                        <span>Witch-Crafted User Experience</span>
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            ⚡
                        </motion.div>
                    </div>
                </motion.div>

                {/* Call-to-Action with Haunted Button */}
                <motion.div
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.6 }}
                >
                    {/* Button Glow Effect */}
                    <motion.div
                        className="absolute -inset-4 bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 0.7, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    
                    <Link
                        href={route('login')}
                        className="relative overflow-hidden group py-4 px-12 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold text-lg shadow-2xl hover:shadow-3xl transform inline-flex items-center justify-center min-w-[280px] border-2 border-orange-400/50"
                    >
                        {/* Pulsing Effect */}
                        <motion.span
                            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        
                        <span className="relative z-10 flex items-center justify-center">
                            <motion.span
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="mr-3 text-xl"
                            >
                                🚀
                            </motion.span>
                            ENTER IF YOU DARE
                            <motion.span
                                animate={{ rotate: [360, 0] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="ml-3 text-xl"
                            >
                                👻
                            </motion.span>
                        </span>
                        
                        {/* Button Border Animation */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
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
                    </Link>
                    
                    {/* Floating Skulls around button */}
                    <div className="absolute -top-6 -left-6 text-2xl">💀</div>
                    <div className="absolute -top-6 -right-6 text-2xl">💀</div>
                    <div className="absolute -bottom-6 -left-6 text-2xl">💀</div>
                    <div className="absolute -bottom-6 -right-6 text-2xl">💀</div>
                </motion.div>

                {/* Halloween Countdown */}
                <motion.div
                    className="mt-12 p-6 rounded-xl bg-black/40 backdrop-blur-sm border border-purple-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                >
                    <p className="text-lg font-bold text-orange-300 mb-2">🎃 SPOOKY SEASON COUNTDOWN 🎃</p>
                    <p className="text-sm text-purple-200">
                        The ghosts are restless... make your leave requests before the witching hour!
                    </p>
                </motion.div>
            </motion.div>

            {/* Animated Footer */}
            <motion.div 
                className="absolute bottom-6 text-center z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5 }}
            >
                <div className="relative">
                    <motion.div
                        className="absolute -inset-2 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-lg"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <p className="relative text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-400">
                        HAVE A SPOOKTACULAR TIME AT LGU OPOL!
                    </p>
                    <p className="text-sm text-orange-300/70 mt-2">
                        Beware of ghostly efficiency and phantom-fast approvals 👻
                    </p>
                </div>
            </motion.div>

            {/* Haunted Sound Toggle */}
            <motion.button
                className="absolute bottom-4 right-4 z-30 p-3 rounded-full bg-black/30 backdrop-blur-sm border border-purple-500/50 text-purple-300 hover:text-orange-300 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                    // Toggle sound here
                }}
            >
                <span className="text-xl">🔊</span>
            </motion.button>

            {/* Scrolling Text at Bottom */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-20 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
            >
                <motion.div
                    className="whitespace-nowrap text-xs text-orange-400"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    👻 • BOO! • 🎃 • HAPPY HALLOWEEN! • 👻 • TRICK OR TREAT! • 🎃 • SPOOKY SEASON • 👻 • 
                    BOO! • 🎃 • HAPPY HALLOWEEN! • 👻 • TRICK OR TREAT! • 🎃 • SPOOKY SEASON • 👻
                </motion.div>
            </motion.div>
        </div>
    );
}