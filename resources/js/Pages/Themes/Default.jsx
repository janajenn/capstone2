// resources/js/Components/Themes/Default.jsx
import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DefaultTheme() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1.2,
                staggerChildren: 0.4,
                delayChildren: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 50,
            scale: 0.95
        },
        visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
                duration: 1.0,
                ease: "easeOut"
            }
        }
    };

    const glowVariants = {
        hidden: { textShadow: '0 0 0 rgba(0, 0, 0, 0)' },
        visible: {
            textShadow: [
                '0 0 10px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)',
                '0 0 20px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 0, 0, 0.1)',
                '0 0 10px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)'
            ],
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
            }
        }
    };

    const pulseVariants = {
        hidden: { scale: 1 },
        visible: {
            scale: [1, 1.05, 1],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
            }
        }
    };

    const backgroundVariants = {
        animate: {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
            }
        }
    };

    const particleStyles = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
    };

    const particles = Array.from({ length: 50 }).map((_, i) => (
        <motion.div
            key={i}
            style={{
                position: 'absolute',
                width: `${Math.random() * 5 + 2}px`,
                height: `${Math.random() * 5 + 2}px`,
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
            }}
            animate={{
                y: [0, -Math.random() * 200 - 100],
                opacity: [0, 1, 0],
            }}
            transition={{
                duration: Math.random() * 8 + 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 5
            }}
        />
    ));

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
            }}
        >
            {/* Animated Background Gradient */}
            <motion.div
                className="absolute inset-0"
                variants={backgroundVariants}
                animate="animate"
                style={{
                    backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
                    backgroundSize: '200% 200%',
                }}
            />

            {/* Theme Indicator */}
            <div className="absolute top-4 left-4 z-20">
                <div className="px-3 py-1 rounded-full bg-black text-white text-sm font-medium">
                    Default Theme
                </div>
            </div>

            {/* Particles */}
            <div style={particleStyles}>
                {particles}
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mt-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Enhanced Logo with Pulse and Glow */}
                <motion.div
                    className="mb-12 relative"
                    variants={itemVariants}
                >
                    <motion.img 
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo" 
                        className="h-56 w-auto mx-auto rounded-full shadow-2xl"
                        variants={pulseVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))',
                        }}
                        onError={(e) => {
                            console.error('Image load error');
                        }}
                    />
                    {/* Glow Ring Around Logo */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            boxShadow: '0 0 30px 10px rgba(0, 0, 0, 0.05)',
                            opacity: 0,
                        }}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                </motion.div>

                {/* Animated Title with Enhanced Glowing Effect */}
                <motion.h1
                    className="text-5xl md:text-7xl font-extrabold text-black mb-6 leading-tight tracking-wide"
                    variants={{ ...itemVariants, ...glowVariants }}
                    initial="hidden"
                    animate="visible"
                >
                    INTEGRATED LEAVE<br />MANAGEMENT SYSTEM
                </motion.h1>

                <motion.h2
                    className="text-2xl md:text-4xl font-semibold text-black mb-10 opacity-90"
                    variants={itemVariants}
                    style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    FOR LGU - OPOL
                </motion.h2>

                {/* Subtle Tagline with Fade-In */}
                <AnimatePresence>
                    <motion.p
                        className="text-lg md:text-xl text-black mb-12 max-w-2xl opacity-80"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        Streamline your leave requests, approvals, and tracking with our intuitive system. 
                        Empowering efficiency for a better work-life balance in local government.
                    </motion.p>
                </AnimatePresence>

                {/* Prominent Call-to-Action Button with Hover Effects */}
                <motion.div
                    className="rounded-full -mt-4"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className="bg-black text-white py-4 px-10 rounded-full hover:bg-gray-800 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 inline-block min-w-[250px]"
                    >
                        Get Started Now
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer Wave Effect */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                <svg className="relative block w-full h-24" viewBox="0 0 1420 100" preserveAspectRatio="none">
                    <path
                        fill="rgba(0,0,0,0.02)"
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
        </div>
    );
}