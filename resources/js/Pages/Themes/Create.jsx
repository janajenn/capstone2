import React from 'react';
import HRLayout from '@/Layouts/HRLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function ThemeCreate({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        config: {
            backgroundColor: '#ffffff',
            headline: 'Welcome to Our System',
            subtext: 'Streamline your processes with our intuitive platform',
            buttonText: 'Get Started',
            buttonColor: '#3b82f6',
            imageUrl: '',
            textColor: '#000000',
        },
        is_active: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('themes.store'));
    };

    const presetThemes = {
        valentines: {
            name: 'Valentines',
            description: 'Love-themed design for February',
            config: {
                backgroundColor: '#fee2e2',
                headline: 'Spread Love & Efficiency',
                subtext: 'Happy Valentines Day! Work with love in your heart',
                buttonText: 'Join with Love',
                buttonColor: '#dc2626',
                imageUrl: '/images/themes/valentines.jpg',
                textColor: '#7f1d1d',
            }
        },
        summer: {
            name: 'Summer',
            description: 'Bright and sunny summer theme',
            config: {
                backgroundColor: '#fef3c7',
                headline: 'Summer Vibes Are Here!',
                subtext: 'Make this summer your most productive yet',
                buttonText: 'Start Summer Journey',
                buttonColor: '#f59e0b',
                imageUrl: '/images/themes/summer.jpg',
                textColor: '#92400e',
            }
        },
        fiesta: {
            name: 'Fiesta',
            description: 'Festive Philippine fiesta theme',
            config: {
                backgroundColor: '#fef3c7',
                headline: 'Happy Fiesta Opolanons!',
                subtext: 'Celebrating community and productivity',
                buttonText: 'Join the Celebration',
                buttonColor: '#dc2626',
                imageUrl: '/images/themes/fiesta.jpg',
                textColor: '#7f1d1d',
            }
        },
        default: {
            name: 'Default',
            description: 'Clean professional theme',
            config: {
                backgroundColor: '#ffffff',
                headline: 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                subtext: 'Streamline your leave requests, approvals, and tracking with our intuitive system.',
                buttonText: 'Get Started Now',
                buttonColor: '#000000',
                imageUrl: '',
                textColor: '#000000',
            }
        }
    };

    const applyPreset = (presetName) => {
        const preset = presetThemes[presetName];
        setData({
            name: preset.name,
            description: preset.description,
            config: { ...preset.config },
            is_active: false,
        });
    };

    return (
        <HRLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Create New Theme</h2>}
        >
            <Head title="Create Theme" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Presets</h3>
                                <div className="flex flex-wrap gap-3">
                                    {Object.keys(presetThemes).map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm capitalize border border-gray-300"
                                        >
                                            {preset} Theme
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column - Basic Info */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Theme Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="3"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={e => setData('is_active', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                                Activate this theme immediately (will deactivate current active theme)
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right Column - Theme Configuration */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Background Color *
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    value={data.config.backgroundColor}
                                                    onChange={e => setData('config', {
                                                        ...data.config,
                                                        backgroundColor: e.target.value
                                                    })}
                                                    className="w-12 h-12 cursor-pointer rounded border border-gray-300"
                                                />
                                                <input
                                                    type="text"
                                                    value={data.config.backgroundColor}
                                                    onChange={e => setData('config', {
                                                        ...data.config,
                                                        backgroundColor: e.target.value
                                                    })}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="#ffffff"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Headline Text *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.config.headline}
                                                onChange={e => setData('config', {
                                                    ...data.config,
                                                    headline: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Welcome message"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Subtext *
                                            </label>
                                            <textarea
                                                value={data.config.subtext}
                                                onChange={e => setData('config', {
                                                    ...data.config,
                                                    subtext: e.target.value
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                                placeholder="Description text"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Button Text *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.config.buttonText}
                                                    onChange={e => setData('config', {
                                                        ...data.config,
                                                        buttonText: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Get Started"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Button Color *
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={data.config.buttonColor}
                                                        onChange={e => setData('config', {
                                                            ...data.config,
                                                            buttonColor: e.target.value
                                                        })}
                                                        className="w-10 h-10 cursor-pointer rounded border border-gray-300"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={data.config.buttonColor}
                                                        onChange={e => setData('config', {
                                                            ...data.config,
                                                            buttonColor: e.target.value
                                                        })}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="#3b82f6"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Text Color *
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={data.config.textColor}
                                                        onChange={e => setData('config', {
                                                            ...data.config,
                                                            textColor: e.target.value
                                                        })}
                                                        className="w-10 h-10 cursor-pointer rounded border border-gray-300"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={data.config.textColor}
                                                        onChange={e => setData('config', {
                                                            ...data.config,
                                                            textColor: e.target.value
                                                        })}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="#000000"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Image URL (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.config.imageUrl}
                                                    onChange={e => setData('config', {
                                                        ...data.config,
                                                        imageUrl: e.target.value
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="/images/theme-image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Section */}
                                <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
                                    <h4 className="font-medium text-gray-700 mb-3">Theme Preview</h4>
                                    <div className="bg-white p-4 rounded shadow-inner">
                                        <div 
                                            className="h-40 rounded-lg mb-3 flex items-center justify-center p-6"
                                            style={{ backgroundColor: data.config.backgroundColor }}
                                        >
                                            <div className="text-center">
                                                <h2 
                                                    className="text-2xl font-bold mb-2"
                                                    style={{ color: data.config.textColor }}
                                                >
                                                    {data.config.headline}
                                                </h2>
                                                <p 
                                                    className="mb-4"
                                                    style={{ color: data.config.textColor }}
                                                >
                                                    {data.config.subtext}
                                                </p>
                                                <button
                                                    className="px-6 py-2 rounded-lg font-medium text-white"
                                                    style={{ backgroundColor: data.config.buttonColor }}
                                                >
                                                    {data.config.buttonText}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div 
                                                className="h-8 rounded"
                                                style={{ backgroundColor: data.config.backgroundColor }}
                                                title="Background"
                                            ></div>
                                            <div 
                                                className="h-8 rounded"
                                                style={{ backgroundColor: data.config.buttonColor }}
                                                title="Button"
                                            ></div>
                                            <div 
                                                className="h-8 rounded border border-gray-300 flex items-center justify-center"
                                                style={{ color: data.config.textColor }}
                                                title="Text Color"
                                            >
                                                Text
                                            </div>
                                            <div className="h-8 rounded bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                                                Theme
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="mt-6 flex justify-end space-x-3">
                                    <Link
                                        href={route('themes.index')}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create Theme'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}