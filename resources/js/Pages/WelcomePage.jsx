import React from 'react';
import { Link } from '@inertiajs/react';

export default function WelcomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background with Opol logo */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="w-full h-full bg-cover bg-center bg-no-repeat opacity-80 blur-sm bg-black"
                    style={{
                        backgroundImage: `url('/assets/Opol_logo1.png')`, // Update this path
                        filter: 'blur(5px)'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/70 to-blue-200/70"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 bg-white/95 shadow-xl rounded-lg p-8 max-w-md w-full mx-4 backdrop-blur-sm border border-white/20">
                <div className="text-center mb-6">
                    {/* Optional: Small clear logo at top */}
                    <div className="mb-4 flex justify-center">
                        <img 
                            src="/assets/Opol_logo.png" // Update this path
                            alt="Opol Logo" 
                            className="h-16 w-auto opacity-90"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-indigo-700 mb-2">Welcome to the Leave Portal</h1>
                    <p className="text-gray-700">
                        Manage your leave requests easily and efficiently. Log in to get started or learn more about our portal.
                    </p>
                </div>
                
                <div className="flex flex-col gap-4">
                    <Link
                        href={route('login')}
                        className="bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-center"
                    >
                        Get Started
                    </Link>
                   
                </div>
            </div>
            
            <footer className="relative z-10 mt-8 text-gray-600 text-sm bg-white/80 py-2 px-4 rounded-full backdrop-blur-sm">
                &copy; {new Date().getFullYear()} Leave Portal. All rights reserved.
            </footer>
        </div>
    );
}