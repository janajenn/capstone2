import React, { useState } from 'react';
import TransitionManager from './TransitionManager';

export default function TransitionDemo() {
    const [selectedAnimation, setSelectedAnimation] = useState('fade-slide-up');
    const [selectedDuration, setSelectedDuration] = useState(500);
    const [selectedDelay, setSelectedDelay] = useState(150);

    const animations = [
        { key: 'fade-slide-up', name: 'Fade Slide Up', description: 'Fade in with upward slide' },
        { key: 'fade-slide-down', name: 'Fade Slide Down', description: 'Fade in with downward slide' },
        { key: 'fade-slide-left', name: 'Fade Slide Left', description: 'Fade in with leftward slide' },
        { key: 'fade-slide-right', name: 'Fade Slide Right', description: 'Fade in with rightward slide' },
        { key: 'fade-scale', name: 'Fade Scale', description: 'Fade in with scale effect' },
        { key: 'fade-zoom', name: 'Fade Zoom', description: 'Fade in with zoom effect' },
        { key: 'slide-up-bounce', name: 'Slide Up Bounce', description: 'Slide up with bounce effect' },
        { key: 'slide-down-bounce', name: 'Slide Down Bounce', description: 'Slide down with bounce effect' },
        { key: 'fade-rotate', name: 'Fade Rotate', description: 'Fade in with rotation' },
        { key: 'fade-flip', name: 'Fade Flip', description: 'Fade in with 3D flip' }
    ];

    const durations = [150, 200, 300, 500, 700, 1000];
    const delays = [0, 50, 100, 150, 200, 300];

    const handleAnimationChange = (animation) => {
        setSelectedAnimation(animation);
    };

    const handleDurationChange = (duration) => {
        setSelectedDuration(duration);
    };

    const handleDelayChange = (delay) => {
        setSelectedDelay(delay);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Transition Demo</h1>
                <p className="text-lg text-gray-600">
                    Explore different transition animations and customize their behavior
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Transition Controls</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Animation Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Animation Type
                        </label>
                        <select
                            value={selectedAnimation}
                            onChange={(e) => handleAnimationChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {animations.map((animation) => (
                                <option key={animation.key} value={animation.key}>
                                    {animation.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Duration: {selectedDuration}ms
                        </label>
                        <input
                            type="range"
                            min="150"
                            max="1000"
                            step="50"
                            value={selectedDuration}
                            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Delay */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Delay: {selectedDelay}ms
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="300"
                            step="50"
                            value={selectedDelay}
                            onChange={(e) => handleDelayChange(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Animation Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Animation Preview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {animations.map((animation) => (
                        <div
                            key={animation.key}
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedAnimation === animation.key
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleAnimationChange(animation.key)}
                        >
                            <h3 className="font-semibold text-lg mb-2">{animation.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{animation.description}</p>
                            
                            <TransitionManager
                                animation={animation.key}
                                duration={300}
                                delay={0}
                            >
                                <div className="w-full h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-medium">
                                    Preview
                                </div>
                            </TransitionManager>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Settings Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6">Current Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedAnimation}</div>
                        <div className="text-sm text-gray-600">Animation</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedDuration}ms</div>
                        <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{selectedDelay}ms</div>
                        <div className="text-sm text-gray-600">Delay</div>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-blue-900">How to Use</h2>
                <div className="space-y-2 text-blue-800">
                    <p>• <strong>Select an animation:</strong> Choose from various transition effects</p>
                    <p>• <strong>Adjust duration:</strong> Control how long the animation takes</p>
                    <p>• <strong>Set delay:</strong> Add a pause before the animation starts</p>
                    <p>• <strong>Apply in layouts:</strong> Use PageTransition component in your layout files</p>
                    <p>• <strong>Customize per page:</strong> Override these settings in individual components</p>
                </div>
            </div>
        </div>
    );
}
