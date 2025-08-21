import React from 'react';
import { Link } from '@inertiajs/react';

export default function WelcomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-indigo-700 mb-4">Welcome to the Leave Portal</h1>
                <p className="text-gray-700 mb-6">
                    Manage your leave requests easily and efficiently. Log in to get started or learn more about our portal.
                </p>
                <div className="flex flex-col gap-4">
                    <Link
                        href={route('login')}
                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
                    >
                        Log In
                    </Link>
                    <Link
                        href={route('register')}
                        className="bg-gray-100 text-indigo-700 py-2 px-4 rounded hover:bg-gray-200 transition"
                    >
                        Register
                    </Link>
                </div>
            </div>
            <footer className="mt-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Leave Portal. All rights reserved.
            </footer>
            </div>
    );
}
