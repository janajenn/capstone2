import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageTransition from '@/Components/PageTransition';
import TransitionManager from '@/Components/TransitionManager';

export default function TransitionTest({ auth }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <PageTransition 
                animation="fade-slide-up"
                duration={500}
                delay={100}
                className="max-w-6xl mx-auto p-6 space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Transition Test Page</h1>
                    <p className="text-lg text-gray-600">
                        This page demonstrates the page transition system working correctly
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TransitionManager animation="fade-scale" duration={400} delay={200}>
                        <div className="bg-blue-100 p-6 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-2">Fade Scale Effect</h3>
                            <p className="text-blue-600">This card uses a scale animation</p>
                        </div>
                    </TransitionManager>

                    <TransitionManager animation="fade-slide-left" duration={400} delay={300}>
                        <div className="bg-green-100 p-6 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-green-800 mb-2">Slide Left Effect</h3>
                            <p className="text-green-600">This card slides in from the right</p>
                        </div>
                    </TransitionManager>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Navigation Test</h2>
                    <p className="text-gray-600 mb-4">
                        Navigate to other pages to see the transitions in action:
                    </p>
                    <div className="space-y-2">
                        <a href="/dashboard" className="block text-blue-600 hover:text-blue-800">
                            → Go to Dashboard
                        </a>
                        <a href="/profile" className="block text-blue-600 hover:text-blue-800">
                            → Go to Profile
                        </a>
                    </div>
                </div>
            </PageTransition>
        </AuthenticatedLayout>
    );
}
