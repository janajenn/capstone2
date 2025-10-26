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
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '50%',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
            }}
            animate={{
                y: [0, -Math.random() * 200 - 100],
                opacity: [0, 0.5, 0],
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
                className="fixed inset-0 bg-black/20 backdrop-blur-md"
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
                    className="p-6 bg-white backdrop-blur-sm rounded-2xl border border-gray-200 shadow-2xl"
                    variants={containerVariants}
                >
                    <motion.div
                        className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full mb-6 relative overflow-hidden"
                        variants={pulseVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <svg className="w-8 h-8 text-black relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="text-xl font-bold text-black text-center mb-4 leading-tight drop-shadow-md"
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
                        <p className="mb-4 text-lg leading-relaxed text-black drop-shadow-md"
                           style={{
                               textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                           }}
                        >
                            For account registration and general assistance, please visit the HR Office during working hours.
                        </p>
                        <div className="bg-gray-100 rounded-xl p-5 text-sm shadow-inner border border-gray-200">
                            <p className="font-semibold text-black mb-2 drop-shadow-md" 
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >HR Office Location:</p>
                            <p className="text-black mb-3 drop-shadow-md"
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Main Administration Building, 2nd Floor</p>
                            <p className="font-semibold text-black mb-2 drop-shadow-md"
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Office Hours:</p>
                            <p className="text-black drop-shadow-md"
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
                            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg border border-gray-300"
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
                className="fixed inset-0 bg-black/20 backdrop-blur-md"
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
                    className="p-6 bg-white backdrop-blur-sm rounded-2xl border border-gray-200 shadow-2xl"
                    variants={containerVariants}
                >
                    <motion.div
                        className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full mb-6 relative overflow-hidden"
                        variants={pulseVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <svg className="w-8 h-8 text-black relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="text-xl font-bold text-black text-center mb-4 leading-tight drop-shadow-md"
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
                        <p className="mb-4 text-lg leading-relaxed text-black drop-shadow-md"
                           style={{
                               textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                           }}
                        >
                            For security reasons, password resets must be processed in person at the HR Office.
                        </p>
                        <div className="bg-gray-100 rounded-xl p-5 text-sm shadow-inner border border-gray-200">
                            <p className="font-semibold text-black mb-3 drop-shadow-md"
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >Please bring:</p>
                            <ul className="space-y-2 text-left mb-4">
                                <li className="flex items-center text-black drop-shadow-md"
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className="w-2 h-2 bg-black rounded-full mr-2 flex-shrink-0"></span>
                                    Your company ID
                                </li>
                                <li className="flex items-center text-black drop-shadow-md"
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className="w-2 h-2 bg-black rounded-full mr-2 flex-shrink-0"></span>
                                    Valid government-issued ID
                                </li>
                                <li className="flex items-center text-black drop-shadow-md"
                                    style={{
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    <span className="w-2 h-2 bg-black rounded-full mr-2 flex-shrink-0"></span>
                                    Completed password reset form
                                </li>
                            </ul>
                            <p className="font-semibold text-black mb-2 drop-shadow-md"
                               style={{
                                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                               }}
                            >HR Office:</p>
                            <p className="text-black drop-shadow-md"
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
                            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg border border-gray-300"
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
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
                }}
            >
                {/* Animated Background Gradient */}
                <motion.div
                    className="absolute inset-0"
                    variants={backgroundVariants}
                    animate="animate"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
                        backgroundSize: '200% 200%',
                    }}
                />

                {/* Subtle Rising Particles */}
                <div style={particleStyles}>
                    {particles}
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
                                className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm"
                                variants={pulseVariants}
                                initial="hidden"
                                animate="visible"
                                style={{
                                    filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.05))',
                                }}
                            >
                                <img
                                    src="/assets/Opol_logo.png"
                                    alt="OPOL Logo"
                                    className="w-16 h-16 object-contain"
                                />
                            </motion.div>
                            {/* Glow Ring Around Logo */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    opacity: 0,
                                }}
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                            />
                        </div>
                        <motion.h2 
                            className="text-3xl font-bold text-black mb-2"
                            variants={glowVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            Welcome back
                        </motion.h2>
                        <motion.p 
                            className="text-gray-600"
                            variants={itemVariants}
                        >
                            Sign in to your OPOL Leave Portal account
                        </motion.p>
                    </motion.div>

                    {/* Status Message */}
                    {status && (
                        <AnimatePresence>
                            <motion.div 
                                className="rounded-xl bg-gray-100 p-4 border border-gray-200 backdrop-blur-sm"
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
                                        <p className="text-sm font-medium text-gray-600">
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
                        className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 backdrop-blur-sm"
                        variants={itemVariants}
                    >
                        <div className="space-y-4">
                            {/* Email Field */}
                            <motion.div variants={itemVariants}>
                                <InputLabel
                                    htmlFor="email"
                                    value="Email"
                                    className="block text-sm font-medium text-black mb-2"
                                />
                                <div className="relative">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="block w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:ring-opacity-50 focus:border-black focus:border-opacity-30 transition duration-150 text-black placeholder-gray-500"
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
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
                                        className="block text-sm font-medium text-black"
                                    />
                                    <button
                                        type="button"
                                        onClick={openForgotPasswordModal}
                                        className="text-sm font-medium text-black hover:text-gray-700 transition-colors"
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
                                        className="block w-full px-4 py-3 pr-12 bg-gray-100 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:ring-opacity-50 focus:border-black focus:border-opacity-30 transition duration-150 text-black placeholder-gray-500"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
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
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
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
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black focus:ring-opacity-50 transition duration-150 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                            className="text-center pt-4 border-t border-gray-200"
                            variants={itemVariants}
                        >
                            <p className="text-sm text-gray-600">
                                Need an account?{' '}
                                <button
                                    type="button"
                                    onClick={openContactModal}
                                    className="font-medium text-black hover:text-gray-700 transition-colors"
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
                        <div className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full shadow-sm backdrop-blur-sm">
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
        </GuestLayout>
    );
}