import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomePage() {
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
        hidden: { textShadow: '0 0 0 rgba(255, 255, 255, 0)' },
        visible: {
            textShadow: [
                '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
                '0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(255, 255, 255, 0.5)',
                '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)'
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

    // Simple particle effect using CSS (no extra libs needed)
    const particles = Array.from({ length: 50 }).map((_, i) => (
        <motion.div
            key={i}
            style={{
                position: 'absolute',
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
            }}
            animate={{
                y: [0, -Math.random() * 200 - 100],
                opacity: [0, 1, 0],
            }}
            transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5
            }}
        />
    ));

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                background: 'linear-gradient(135deg, #7d0c0c 0%, #a52a2a 50%, #7d0c0c 100%)',
            }}
        >
            {/* Animated Background Gradient */}
            <motion.div
                className="absolute inset-0"
                variants={backgroundVariants}
                animate="animate"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                    backgroundSize: '200% 200%',
                }}
            />

            {/* Subtle Rising Particles */}
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
                            filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.6))',
                        }}
                        onError={(e) => {
                            console.error('Image load error');
                        }}
                    />
                    {/* Glow Ring Around Logo */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            boxShadow: '0 0 30px 10px rgba(255, 255, 255, 0.4)',
                            opacity: 0,
                        }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    />
                </motion.div>

                {/* Animated Title with Glowing Effect */}
                <motion.h1
                    className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-wide"
                    variants={{ ...itemVariants, ...glowVariants }}
                    initial="hidden"
                    animate="visible"
                >
                    INTEGRATED LEAVE<br />MANAGEMENT SYSTEM
                </motion.h1>

                <motion.h2
                    className="text-2xl md:text-4xl font-semibold text-white mb-10 opacity-90"
                    variants={itemVariants}
                    style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                >
                    FOR LGU - OPOL
                </motion.h2>

                {/* Subtle Tagline with Fade-In */}
                <AnimatePresence>
                    <motion.p
                        className="text-lg md:text-xl text-white mb-12 max-w-2xl opacity-80"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        Streamline your leave requests, approvals, and tracking with our intuitive system. 
                        Empowering efficiency for a better work-life balance in local government.
                    </motion.p>
                </AnimatePresence>

                {/* Feature Highlights with Staggered Animation */}
                {/* <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                    variants={containerVariants}
                >
                    {[
                        { icon: '📅', text: 'Easy Scheduling' },
                        { icon: '✅', text: 'Quick Approvals' },
                        { icon: '📊', text: 'Real-Time Tracking' }
                    ].map((feature, index) => (
                        <motion.div
                            key={index}
                            className="flex flex-col items-center p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm shadow-lg"
                            variants={itemVariants}
                        >
                            <span className="text-4xl mb-2">{feature.icon}</span>
                            <p className="text-white font-medium">{feature.text}</p>
                        </motion.div>
                    ))}
                </motion.div> */}

                {/* Prominent Call-to-Action Button with Hover Effects */}
                <motion.div
                    className="rounded-full -mt-4"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.5)' }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className="bg-white text-maroon py-4 px-10 rounded-full hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 inline-block min-w-[250px]"
                        style={{ color: '#7d0c0c' }}
                    >
                        Get Started Now
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer Wave Effect */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                <svg className="relative block w-full h-24" viewBox="0 0 1420 100" preserveAspectRatio="none">
                    <path
                        fill="rgba(255,255,255,0.1)"
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