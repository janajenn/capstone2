import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.8,
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: -30 
        },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    return (
        <div 
            className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: '#7d0c0c' }}
        >
            <motion.div
                className="relative z-10 flex flex-col items-center justify-center text-center px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
             

                {/* Original Logo (Fixed) */}
                <motion.div
                    className="mb-8"
                    variants={itemVariants}
                >
                    <img 
                        src="/assets/Opol_logo.png"
                        alt="LGU Opol Logo" 
                        className="h-48 w-49 mx-auto" // Removed filter classes that might cause issues
                        onError={(e) => {
                            console.log('Image load error - trying alternative solutions');
                            // Fallback to different path or background image
                        }}
                    />
                </motion.div>

                {/* Rest of your content */}
                <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
                    variants={itemVariants}
                    style={{
                        textShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
                    }}
                >
                    INTEGRATED LEAVE MANAGEMENT SYSTEM<br />
                    <span className="text-2xl md:text-3xl">FOR LGU - OPOL</span>
                </motion.h1>

                <motion.div
                    variants={itemVariants}
                    className="mt-8"
                >
                    <Link
                        href={route('login')}
                        className="bg-white text-maroon py-3 px-8 rounded-lg hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center inline-block min-w-[200px]"
                        style={{ color: '#7d0c0c' }}
                    >
                        Get Started
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}