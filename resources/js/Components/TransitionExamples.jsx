import React from 'react';
import TransitionManager from './TransitionManager';

export default function TransitionExamples() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-center mb-8">Transition Examples</h1>

            {/* Example 1: Dashboard Cards with Stagger */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Dashboard Cards</h2>
                <p className="text-gray-600 mb-6">Cards animate in sequence with staggered timing</p>
                
                <div className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-100 p-6 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800">Total Employees</h3>
                        <p className="text-3xl font-bold text-blue-600">1,247</p>
                    </div>
                    <div className="bg-green-100 p-6 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800">Active Requests</h3>
                        <p className="text-3xl font-bold text-green-600">23</p>
                    </div>
                    <div className="bg-purple-100 p-6 rounded-lg border border-purple-200">
                        <h3 className="font-semibold text-purple-800">Pending Approvals</h3>
                        <p className="text-3xl font-bold text-purple-600">7</p>
                    </div>
                </div>
            </div>

            {/* Example 2: Different Animation Types */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Animation Varieties</h2>
                <p className="text-gray-600 mb-6">Different sections use different animation types</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fade Scale */}
                    <TransitionManager animation="fade-scale" duration={400} delay={100}>
                        <div className="bg-gradient-to-r from-pink-400 to-red-400 p-6 rounded-lg text-white">
                            <h3 className="font-semibold mb-2">Fade Scale Effect</h3>
                            <p>This section uses a scale animation for a subtle zoom effect</p>
                        </div>
                    </TransitionManager>

                    {/* Slide Left */}
                    <TransitionManager animation="fade-slide-left" duration={400} delay={200}>
                        <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-6 rounded-lg text-white">
                            <h3 className="font-semibold mb-2">Slide Left Effect</h3>
                            <p>This section slides in from the right for a dynamic feel</p>
                        </div>
                    </TransitionManager>

                    {/* Bounce Effect */}
                    <TransitionManager animation="slide-up-bounce" duration={600} delay={300}>
                        <div className="bg-gradient-to-r from-green-400 to-teal-400 p-6 rounded-lg text-white">
                            <h3 className="font-semibold mb-2">Bounce Effect</h3>
                            <p>This section bounces up with a playful animation</p>
                        </div>
                    </TransitionManager>

                    {/* Rotate Effect */}
                    <TransitionManager animation="fade-rotate" duration={500} delay={400}>
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-lg text-white">
                            <h3 className="font-semibold mb-2">Rotate Effect</h3>
                            <p>This section rotates in for a unique entrance</p>
                        </div>
                    </TransitionManager>
                </div>
            </div>

            {/* Example 3: Form Sections */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Form Sections</h2>
                <p className="text-gray-600 mb-6">Form sections animate in sequence</p>
                
                <form className="space-y-6">
                    <TransitionManager animation="fade-slide-up" duration={300} delay={100}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Personal Information</label>
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </TransitionManager>

                    <TransitionManager animation="fade-slide-up" duration={300} delay={200}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Contact Details</label>
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </TransitionManager>

                    <TransitionManager animation="fade-slide-up" duration={300} delay={300}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Department</option>
                                <option>HR</option>
                                <option>IT</option>
                                <option>Finance</option>
                                <option>Marketing</option>
                            </select>
                        </div>
                    </TransitionManager>

                    <TransitionManager animation="fade-slide-up" duration={300} delay={400}>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Submit Application
                        </button>
                    </TransitionManager>
                </form>
            </div>

            {/* Example 4: Table with Row Animations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Data Table</h2>
                <p className="text-gray-600 mb-6">Table rows animate in with staggered timing</p>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 stagger-children">
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">John Doe</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Software Engineer</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Jane Smith</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Product Manager</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mike Johnson</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Designer</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Example 5: Modal-like Content */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Modal Content</h2>
                <p className="text-gray-600 mb-6">Content that appears with a dramatic entrance</p>
                
                <TransitionManager animation="fade-flip" duration={700} delay={100}>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-lg text-white text-center">
                        <h3 className="text-2xl font-bold mb-4">Important Notice</h3>
                        <p className="text-lg mb-6">
                            This content uses a 3D flip animation for maximum impact. 
                            Perfect for important announcements or modal content.
                        </p>
                        <button className="bg-white text-indigo-600 px-6 py-2 rounded-md hover:bg-gray-100 transition-colors">
                            Acknowledge
                        </button>
                    </div>
                </TransitionManager>
            </div>
        </div>
    );
}
