import { useState, useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [isChristmasMode, setIsChristmasMode] = useState(() => localStorage.getItem('christmasMode') === 'true');

    useEffect(() => {
        localStorage.setItem('christmasMode', isChristmasMode);
    }, [isChristmasMode]);

    const [showPassword, setShowPassword] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const openContactModal = (e) => {
        e.preventDefault();
        setShowContactModal(true);
    };

    const openForgotPasswordModal = (e) => {
        e.preventDefault();
        setShowForgotPasswordModal(true);
    };

    const closeContactModal = () => {
        setShowContactModal(false);
    };

    const closeForgotPasswordModal = () => {
        setShowForgotPasswordModal(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 1.0,
                staggerChildren: 0.2,
                delayChildren: 0.3
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
                duration: 0.8,
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
                borderRadius: isChristmasMode ? '50%' : '50%',
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

    const subTextColor = isChristmasMode ? 'text-gray-300' : 'text-gray-600';

    const formBg = isChristmasMode ? 'bg-gray-800/80' : 'bg-white';

    const formBorder = isChristmasMode ? 'border-gray-700' : 'border-gray-200';

    const inputBg = isChristmasMode ? 'bg-gray-700' : 'bg-gray-100';

    const inputBorder = isChristmasMode ? 'border-gray-600' : 'border-gray-200';

    const inputText = isChristmasMode ? 'text-white placeholder-gray-400' : 'text-black placeholder-gray-500';

    const focusRing = isChristmasMode ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-black focus:border-black';

    const focusRingOpacity = 'focus:ring-opacity-50 focus:border-opacity-30';

    const buttonClass = isChristmasMode ? 'bg-green-700 text-yellow-300 hover:bg-green-800 focus:ring-red-500' : 'bg-black text-white hover:bg-gray-800 focus:ring-black';

    const iconColor = isChristmasMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700';

    const linkColor = isChristmasMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700';

    const modalBackdrop = isChristmasMode ? 'bg-white/10' : 'bg-black/20';

    const modalBg = isChristmasMode ? 'bg-gray-900' : 'bg-white';

    const modalBorder = isChristmasMode ? 'border-gray-700' : 'border-gray-200';

    const modalText = isChristmasMode ? 'text-white' : 'text-black';

    const modalSubText = isChristmasMode ? 'text-gray-300' : 'text-black';

    const modalInfoBg = isChristmasMode ? 'bg-gray-800' : 'bg-gray-100';

    const modalInfoBorder = isChristmasMode ? 'border-gray-700' : 'border-gray-200';

    const modalButton = isChristmasMode ? 'bg-green-700 text-yellow-300 hover:bg-green-800' : 'bg-black text-white hover:bg-gray-800';

    const modalIconBg = isChristmasMode ? 'bg-gray-800' : 'bg-gray-100';

    const modalIconColor = isChristmasMode ? 'text-white' : 'text-black';

    const modalDotBg = isChristmasMode ? 'bg-white' : 'bg-black';

    const logoShadow = isChristmasMode 
        ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))' 
        : 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.1))';

    const glowRingShadow = isChristmasMode 
        ? '0 0 40px 15px rgba(255, 215, 0, 0.3)' 
        : '0 0 30px 10px rgba(0, 0, 0, 0.05)';

    const logoBg = isChristmasMode ? 'bg-gray-800' : 'bg-gray-100';

    const statusBg = isChristmasMode ? 'bg-gray-800' : 'bg-gray-100';

    const statusBorder = isChristmasMode ? 'border-gray-700' : 'border-gray-200';

    const statusText = isChristmasMode ? 'text-gray-300' : 'text-gray-600';

    const securityBg = isChristmasMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500';

    const waveFill = isChristmasMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';

    

    return (
        <GuestLayout>
            <Head title="Log in" />

{/* Contact HR Modal */}
<AnimatePresence>
    {showContactModal && (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {/* Blurred Backdrop */}
            <motion.div
                className={`fixed inset-0 ${modalBackdrop} backdrop-blur-md`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onClick={closeContactModal}
            />
            {/* Modal Content */}
            <motion.div
                className="relative w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div 
                    className={`p-6 ${modalBg} backdrop-blur-sm rounded-2xl ${modalBorder} shadow-2xl`}
                    variants={containerVariants}
                >
                    <motion.div
                        className={`flex items-center justify-center w-16 h-16 mx-auto ${modalIconBg} rounded-full mb-6 relative overflow-hidden`}
                        variants={pulseVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <svg className={`w-8 h-8 ${modalIconColor} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {/* Subtle Glow Ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                boxShadow: '0 0 30px 10px rgba(0, 0, 0, 0.05)',
                            }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    </motion.div>
                    <motion.h3 
                        className={`text-xl font-bold ${modalText} text-center mb-4 leading-tight drop-shadow-md`}
                        variants={glowVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        Contact HR Department
                    </motion.h3>
                    <motion.div 
                        className="text-center mb-6"
                        variants={itemVariants}
                    >
                        <p className={`mb-4 text-lg leading-relaxed ${modalText} drop-shadow-md`}
                           style={{
                               textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                           }}
                        >
                            For account registration and general assistance, please visit the HR Office during working hours.
                        </p>
                        <div className={`${modalInfoBg} rounded-xl p-5 text-sm shadow-inner ${modalInfoBorder}`}>
                            <p className={`font-semibold ${modalText} mb-2 drop-shadow-md`} 
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >HR Office Location:</p>
                            <p className={`${modalText} mb-3 drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Main Administration Building, 2nd Floor</p>
                            <p className={`font-semibold ${modalText} mb-2 drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Office Hours:</p>
                            <p className={`${modalText} drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Monday - Friday: 8:00 AM - 5:00 PM</p>
                        </div>
                    </motion.div>
                    <motion.div 
                        className="flex justify-center"
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            onClick={closeContactModal}
                            className={`${modalButton} px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 font-semibold shadow-lg transform hover:-translate-y-0.5 text-lg border ${modalBorder}`}
                        >
                            Understood
                        </button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>

{/* Forgot Password Modal */}
<AnimatePresence>
    {showForgotPasswordModal && (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {/* Blurred Backdrop */}
            <motion.div
                className={`fixed inset-0 ${modalBackdrop} backdrop-blur-md`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onClick={closeForgotPasswordModal}
            />
            {/* Modal Content */}
            <motion.div
                className="relative w-full max-w-md"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div 
                    className={`p-6 ${modalBg} backdrop-blur-sm rounded-2xl ${modalBorder} shadow-2xl`}
                    variants={containerVariants}
                >
                    <motion.div
                        className={`flex items-center justify-center w-16 h-16 mx-auto ${modalIconBg} rounded-full mb-6 relative overflow-hidden`}
                        variants={pulseVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <svg className={`w-8 h-8 ${modalIconColor} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {/* Subtle Glow Ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                boxShadow: '0 0 30px 10px rgba(0, 0, 0, 0.05)',
                            }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        />
                    </motion.div>
                    <motion.h3 
                        className={`text-xl font-bold ${modalText} text-center mb-4 leading-tight drop-shadow-md`}
                        variants={glowVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        Password Assistance Required
                    </motion.h3>
                    <motion.div 
                        className="text-center mb-6"
                        variants={itemVariants}
                    >
                        <p className={`mb-4 text-lg leading-relaxed ${modalText} drop-shadow-md`}
                           style={{
                               textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                           }}
                        >
                            For security reasons, password resets must be processed in person at the HR Office.
                        </p>
                        <div className={`${modalInfoBg} rounded-xl p-5 text-sm shadow-inner ${modalInfoBorder}`}>
                            <p className={`font-semibold ${modalText} mb-3 drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Please bring:</p>
                            <ul className="space-y-2 text-left mb-4">
                                <li className={`flex items-center ${modalSubText} drop-shadow-md`}
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className={`w-2 h-2 ${modalDotBg} rounded-full mr-2 flex-shrink-0`}></span>
                                    Your company ID
                                </li>
                                <li className={`flex items-center ${modalSubText} drop-shadow-md`}
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className={`w-2 h-2 ${modalDotBg} rounded-full mr-2 flex-shrink-0`}></span>
                                    Valid government-issued ID
                                </li>
                                <li className={`flex items-center ${modalSubText} drop-shadow-md`}
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className={`w-2 h-2 ${modalDotBg} rounded-full mr-2 flex-shrink-0`}></span>
                                    Completed password reset form
                                </li>
                            </ul>
                            <p className={`font-semibold ${modalText} mb-2 drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >HR Office:</p>
                            <p className={`${modalText} drop-shadow-md`}
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Main Administration Building, 2nd Floor</p>
                        </div>
                    </motion.div>
                    <motion.div 
                        className="flex justify-center"
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            onClick={closeForgotPasswordModal}
                            className={`${modalButton} px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 font-semibold shadow-lg transform hover:-translate-y-0.5 text-lg border ${modalBorder}`}
                        >
                            I Understand
                        </button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>

            <div 
                className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8"
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
                    className="max-w-md w-full space-y-8 relative z-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div 
                        className="text-center"
                        variants={itemVariants}
                    >
                        <div className="flex justify-center mb-6 relative">
                            <motion.div 
                                className={`w-20 h-20 ${logoBg} rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm`}
                                variants={pulseVariants}
                                initial="hidden"
                                animate="visible"
                                style={{
                                    filter: logoShadow,
                                }}
                            >
                                <img
                                    src="/assets/Opol_logo.png"
                                    alt="OPOL Logo"
                                    className="w-16 h-16 object-contain"
                                />
                            </motion.div>
                            {/* Glow Ring Around Logo */}
                            {/* <motion.div
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
                            /> */}
                        </div>
                        {isChristmasMode && (
                            <motion.h2
                                className={`text-4xl md:text-5xl font-bold ${textColor} mb-8 italic`}
                                variants={{ ...itemVariants, ...christmasGreetingVariants }}
                                initial="hidden"
                                animate={['visible', 'glow']}
                            >
                                Happy Holiday's Opolanons!
                            </motion.h2>
                        )}
                        <motion.h2 
                            className={`text-3xl font-bold ${textColor} mb-2`}
                            variants={isChristmasMode ? christmasGlowVariants : glowVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            Welcome back
                        </motion.h2>
                        <motion.p 
                            className={subTextColor}
                            variants={itemVariants}
                        >
                            Sign in to your OPOL Leave Portal account
                        </motion.p>
                    </motion.div>

                    {/* Status Message */}
                    {status && (
                        <AnimatePresence>
                            <motion.div 
                                className={`rounded-xl ${statusBg} p-4 ${statusBorder} backdrop-blur-sm`}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${statusText}`}>
                                            {status}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Login Form */}
                    <motion.form 
                        onSubmit={submit} 
                        className={`mt-8 space-y-6 ${formBg} p-8 rounded-2xl shadow-2xl ${formBorder} backdrop-blur-sm`}
                        variants={itemVariants}
                    >
                        <div className="space-y-4">
                            {/* Email Field */}
                            <motion.div variants={itemVariants}>
                                <InputLabel
                                    htmlFor="email"
                                    value="Email"
                                    className={`block text-sm font-medium ${textColor} mb-2`}
                                />
                                <div className="relative">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className={`block w-full px-4 py-3 ${inputBg} ${inputBorder} rounded-xl ${focusRing} ${focusRingOpacity} transition duration-150 ${inputText}`}
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className={`h-5 w-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.email} className="mt-2 text-sm text-red-500" />
                            </motion.div>

                            {/* Password Field */}
                            <motion.div variants={itemVariants}>
                                <div className="flex items-center justify-between mb-2">
                                    <InputLabel
                                        htmlFor="password"
                                        value="Password"
                                        className={`block text-sm font-medium ${textColor}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={openForgotPasswordModal}
                                        className={`text-sm font-medium ${linkColor} transition-colors`}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <TextInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        className={`block w-full px-4 py-3 pr-12 ${inputBg} ${inputBorder} rounded-xl ${focusRing} ${focusRingOpacity} transition duration-150 ${inputText}`}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${iconColor} transition-colors`}
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L9 9m9 9l-3-3m0 0l-3 3m3-3V15" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2 text-sm text-red-500" />
                            </motion.div>
                        </div>

                        {/* Remember Me */}
                        <motion.div 
                            className="flex items-center"
                            variants={itemVariants}
                        >
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className={`h-4 w-4 ${focusRing} border-gray-300 rounded`}
                            />
                            <label htmlFor="remember" className={`ml-2 block text-sm ${subTextColor}`}>
                                Remember me
                            </label>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div 
                            variants={itemVariants}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}
                            transition={{ duration: 0.3 }}
                        >
                            <PrimaryButton
                                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium ${buttonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition duration-150 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </PrimaryButton>
                        </motion.div>

                        {/* Footer Links */}
                        <motion.div 
                            className={`text-center pt-4 border-t ${formBorder}`}
                            variants={itemVariants}
                        >
                            <p className={`text-sm ${subTextColor}`}>
                                Need an account?{' '}
                                <button
                                    type="button"
                                    onClick={openContactModal}
                                    className={`font-medium ${linkColor} transition-colors`}
                                >
                                    Click me!
                                </button>
                            </p>
                        </motion.div>
                    </motion.form>

                    {/* Security Badge */}
                    <motion.div 
                        className="text-center"
                        variants={itemVariants}
                    >
                        <div className={`inline-flex items-center text-xs ${securityBg} px-3 py-2 rounded-full shadow-sm backdrop-blur-sm`}>
                            <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secure & encrypted connection
                        </div>
                    </motion.div>
                </motion.div>

               {/* Footer Wave Effect */}
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
{/* Minimal Footer */}
<motion.footer 
    className={`absolute bottom-4 left-0 right-0 text-center ${subTextColor}`}
    variants={itemVariants}
    initial="hidden"
    animate="visible"
>
    <div className="max-w-4xl mx-auto px-4">
        <p className="opacity-70 whitespace-nowrap text-xs">
            © 2025 DEBO Capstone Development Team — 
            Programmer: Dela cruz, BJ | Technical Writer: Espanol, Jahna | Project Manager: Bete, Mark | System Analyst: Origines, Julie  
        </p>
    </div>
</motion.footer>
</div> {/* This closes the main container */}
          
        </GuestLayout>
    );
}