import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomePage() {
    const [isChristmasMode, setIsChristmasMode] = React.useState(false);

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

    const christmasGlowVariants = {
        hidden: { textShadow: '0 0 0 rgba(255, 255, 255, 0)' },
        visible: {
            textShadow: [
                '0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)',
                '0 0 20px rgba(0, 255, 0, 0.5), 0 0 30px rgba(255, 0, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.3)',
                '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3), 0 0 30px rgba(0, 255, 0, 0.2)',
                '0 0 10px rgba(255, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)'
            ],
            transition: {
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut'
            }
        }
    };

    const christmasGreetingVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 1.5,
                ease: 'easeOut'
            }
        },
        glow: {
            textShadow: [
                '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3)',
                '0 0 20px rgba(255, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
                '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 0, 0, 0.3)'
            ],
            transition: {
                duration: 2.5,
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

    const particleCount = isChristmasMode ? 150 : 50;

    const getParticleColor = () => {
        if (!isChristmasMode) return 'rgba(0, 0, 0, 0.05)';
        const colors = ['rgba(255, 0, 0, 0.4)', 'rgba(0, 255, 0, 0.4)', 'rgba(255, 215, 0, 0.4)', 'rgba(255, 255, 255, 0.6)'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // Enhanced particle effect for festive vibe
    const particles = Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
            key={i}
            style={{
                position: 'absolute',
                width: `${Math.random() * 5 + 2}px`,
                height: `${Math.random() * 5 + 2}px`,
                background: getParticleColor(),
                borderRadius: isChristmasMode ? '50%' : '50%', // Rounded for snow-like in Christmas
                top: isChristmasMode ? `-${Math.random() * 20}%` : `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                boxShadow: isChristmasMode ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
            }}
            animate={{
                y: isChristmasMode ? [0, Math.random() * 600 + 800] : [0, -Math.random() * 200 - 100],
                opacity: isChristmasMode ? [0, 1, 0.5, 1, 0] : [0, 1, 0],
                rotate: isChristmasMode ? [0, Math.random() * 360 - 180] : 0,
            }}
            transition={{
                duration: Math.random() * 8 + 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 5
            }}
        />
    ));

    // Twinkling lights for Philippine Christmas vibe
    const twinklingLights = isChristmasMode ? Array.from({ length: 50 }).map((_, i) => (
        <motion.div
            key={`light-${i}`}
            style={{
                position: 'absolute',
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                background: getParticleColor(),
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
            }}
            animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
            }}
            transition={{
                duration: Math.random() * 2 + 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 3
            }}
        />
    )) : null;

    const mainBg = isChristmasMode 
        ? 'linear-gradient(135deg, #b30000 0%, #004d00 50%, #b30000 100%)' 
        : 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)';

    const animatedBg = isChristmasMode 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)' 
        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)';

    const textColor = isChristmasMode ? 'text-white' : 'text-black';

    const logoShadow = isChristmasMode 
        ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))' 
        : 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))';

    const glowRingShadow = isChristmasMode 
        ? '0 0 40px 15px rgba(255, 215, 0, 0.3)' 
        : '0 0 30px 10px rgba(0, 0, 0, 0.05)';

    const h2Shadow = isChristmasMode 
        ? '0 2px 4px rgba(0,0,0,0.2)' 
        : '0 2px 4px rgba(0,0,0,0.1)';

    const buttonBg = isChristmasMode ? 'bg-green-700' : 'bg-black';
    const buttonHoverBg = isChristmasMode ? 'hover:bg-green-800' : 'hover:bg-gray-800';
    const buttonText = isChristmasMode ? 'text-yellow-300' : 'text-white';

    const hoverShadow = isChristmasMode 
        ? '0 0 25px rgba(255,215,0,0.3)' 
        : '0 0 20px rgba(0,0,0,0.1)';

    const waveFill = isChristmasMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
                background: mainBg,
            }}
        >
            {/* Animated Background Gradient */}
            <motion.div
                className="absolute inset-0"
                variants={backgroundVariants}
                animate="animate"
                style={{
                    background: animatedBg,
                    backgroundSize: '200% 200%',
                }}
            />

            {/* Festive Particles and Twinkling Lights */}
            <div style={particleStyles}>
                {particles}
                {twinklingLights}
            </div>

            {/* Mode Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${textColor}`}>Default Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isChristmasMode} 
                            onChange={() => setIsChristmasMode(!isChristmasMode)} 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-green-600"></div>
                    </label>
                    <span className={`text-sm font-medium ${textColor}`}>Christmas Mode</span>
                </div>
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
                            filter: logoShadow,
                        }}
                        onError={(e) => {
                            console.error('Image load error');
                        }}
                    />
                    {/* Glow Ring Around Logo */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            boxShadow: glowRingShadow,
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

                {/* Heartfelt Christmas Greeting */}
                {isChristmasMode && (
                    <motion.h2
                        className={`text-4xl md:text-5xl font-bold ${textColor} mb-8 italic`}
                        variants={{ ...itemVariants, ...christmasGreetingVariants }}
                        initial="hidden"
                        animate={['visible', 'glow']}
                    >
                        Malipayong Pasko Opolanons!
                    </motion.h2>
                )}

                {/* Animated Title with Enhanced Glowing Effect */}
                <motion.h1
                    className={`text-5xl md:text-7xl font-extrabold ${textColor} mb-6 leading-tight tracking-wide`}
                    variants={{ ...itemVariants, ...(isChristmasMode ? christmasGlowVariants : glowVariants) }}
                    initial="hidden"
                    animate="visible"
                >
                    INTEGRATED LEAVE<br />MANAGEMENT SYSTEM
                </motion.h1>

                <motion.h2
                    className={`text-2xl md:text-4xl font-semibold ${textColor} mb-10 opacity-90`}
                    variants={itemVariants}
                    style={{
                        textShadow: h2Shadow,
                    }}
                >
                    FOR LGU - OPOL
                </motion.h2>

                {/* Subtle Tagline with Fade-In */}
                <AnimatePresence>
                    <motion.p
                        className={`text-lg md:text-xl ${textColor} mb-12 max-w-2xl opacity-80`}
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
                    whileHover={{ scale: 1.05, boxShadow: hoverShadow }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href={route('login')}
                        className={`${buttonBg} ${buttonText} py-4 px-10 rounded-full ${buttonHoverBg} transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 inline-block min-w-[250px]`}
                    >
                        Get Started Now
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer Wave Effect with Festive Touch */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                <svg className="relative block w-full h-24" viewBox="0 0 1420 100" preserveAspectRatio="none">
                    <path
                        fill={waveFill}
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