import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex w-full max-w-6xl shadow-xl rounded-xl overflow-hidden bg-white transform transition-all hover:shadow-2xl">
                    {/* Left Side - Graphic (50%) */}
                    <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-800 w-1/2 p-12 relative">
                        <div className="absolute inset-0 bg-opacity-10 bg-white"></div>
                        <div className="relative z-10 text-center w-full">
                            <h2 className="text-4xl font-bold text-white mb-6">Welcome to OPOL Leave Portal</h2>
                            <p className="text-lg text-blue-100 mb-8 leading-relaxed max-w-md mx-auto">
                                Streamline your leave management with our intuitive platform. Access your requests anytime, anywhere.
                            </p>
                            <div className="flex justify-center mb-8">
                                <div className="w-48 h-48">
                                    <img
                                        src="/assets/Opol_logo.png"
                                        alt="OPOL Logo"
                                        className="w-48 h-auto object-contain filter drop-shadow-lg"
                                    />
                                </div>
                            </div>
                            <div className="absolute bottom-1 left-0 right-0 text-center">
                                <p className="text-sm text-blue-200">Secure login powered by OPOL HR System</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form (50%) */}
                    <div className="w-full lg:w-1/2 p-10 md:p-12 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
                            <p className="text-gray-600">Enter your credentials to access your account</p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <InputLabel
                                    htmlFor="email"
                                    value="Email Address"
                                    className="text-gray-700 font-medium"
                                />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 transition duration-150"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-1 text-sm text-red-600" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <InputLabel
                                        htmlFor="password"
                                        value="Password"
                                        className="text-gray-700 font-medium"
                                    />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-3 transition duration-150"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-1 text-sm text-red-600" />
                            </div>

                            <div className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <div>
                                <PrimaryButton
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    Sign In
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href={route('register')} className="font-medium text-blue-600 hover:text-blue-500">
                                    Contact HR
                                </Link>
                            </p>
                        </div>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">
                                        Secure & Encrypted
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
