import React from 'react';
import HRLayout from '@/Layouts/HRLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    CheckCircleIcon, 
    PencilIcon,
    TrashIcon,
    EyeIcon,
    SparklesIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function ThemesIndex({ themes, activeTheme, auth }) {
    const handleActivate = (theme) => {
        Swal.fire({
            title: 'Activate Theme',
            html: `Are you sure you want to activate <strong>"${theme.name}"</strong> theme?<br>
                  <small class="text-gray-500">This will deactivate the current active theme.</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Activate',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg transition-all duration-300',
                cancelButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-lg transition-all duration-300'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('themes.activate', theme.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Theme Activated!',
                            text: `${theme.name} is now the active theme.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                });
            }
        });
    };

    const handleDeactivate = (theme) => {
        Swal.fire({
            title: 'Deactivate Theme',
            html: `Are you sure you want to deactivate <strong>"${theme.name}"</strong> theme?<br>
                  <small class="text-gray-500">The system will automatically switch back to the Default theme.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Deactivate',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('themes.deactivate', theme.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Theme Deactivated!',
                            text: `${theme.name} has been deactivated. Default theme is now active.`,
                            icon: 'info',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                });
            }
        });
    };

    const handleDelete = (theme) => {
        // Prevent deleting Default theme
        if (theme.name.toLowerCase() === 'default') {
            Swal.fire({
                title: 'Cannot Delete Default Theme',
                text: 'The Default theme cannot be deleted as it is the system fallback theme.',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
            return;
        }

        Swal.fire({
            title: 'Delete Theme',
            html: `Are you sure you want to delete <strong>"${theme.name}"</strong> theme?<br>
                  <small class="text-red-500">This action cannot be undone.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-gray-200',
                title: 'text-xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent',
                htmlContainer: 'text-gray-600',
                confirmButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-lg transition-all duration-300',
                cancelButton: 'px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-lg transition-all duration-300'
            },
            buttonsStyling: false,
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('themes.destroy', theme.id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Theme Deleted!',
                            text: `${theme.name} has been deleted successfully.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                });
            }
        });
    };

    const handlePreview = (theme) => {
        // Open welcome page in new tab to preview theme
        window.open('/', '_blank');
        
        // Show notification
        Swal.fire({
            title: 'Theme Preview',
            html: `Opening <strong>${theme.name}</strong> theme preview in new tab...<br>
                  <small class="text-gray-500">Remember to activate it to make it permanent.</small>`,
            icon: 'info',
            timer: 3000,
            showConfirmButton: false
        });
    };

    // Check if theme is Default
    const isDefaultTheme = (theme) => {
        return theme.name.toLowerCase() === 'default';
    };

    return (
        <HRLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Theme Management</h2>}
        >
            <Head title="Theme Management" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Theme Management
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Customize the welcome page appearance for different seasons and events
                                </p>
                                <div className="mt-2 text-sm text-gray-500">
                                    <span className="inline-flex items-center">
                                        <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1" />
                                        Default theme cannot be deactivated or deleted
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={route('themes.create')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-xl font-semibold text-white uppercase tracking-widest hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Create New Theme
                            </Link>
                        </div>
                    </div>

                    {/* Active Theme Card */}
                    {activeTheme && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow">
                                        <CheckCircleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Currently Active Theme
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xl font-bold text-gray-900">
                                                {activeTheme.name}
                                            </span>
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                                Active
                                            </span>
                                            {isDefaultTheme(activeTheme) && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    System Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {isDefaultTheme(activeTheme) 
                                                ? 'This is the system default theme that cannot be deactivated.'
                                                : 'This theme is currently displayed on the welcome page'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePreview(activeTheme)}
                                        className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        title="Preview Theme"
                                    >
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <Link
                                        href={route('themes.edit', activeTheme.id)}
                                        className="p-2 bg-white border border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="Edit Theme"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Themes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {themes.map((theme) => {
                            const isThemeDefault = isDefaultTheme(theme);
                            const isThemeActive = theme.id === activeTheme?.id;
                            
                            return (
                                <div 
                                    key={theme.id}
                                    className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                                        isThemeActive 
                                            ? 'border-emerald-500 ring-2 ring-emerald-200 ring-offset-2' 
                                            : 'border-gray-200 hover:border-purple-300'
                                    } ${isThemeDefault ? 'border-dashed' : ''}`}
                                >
                                    {/* Theme Preview */}
                                    <div 
                                        className="h-40 w-full relative"
                                        style={{
                                            backgroundColor: theme.config?.backgroundColor || '#ffffff',
                                            backgroundImage: theme.name.toLowerCase() === 'valentines' 
                                                ? 'radial-gradient(#ef4444 1px, transparent 1px)' 
                                                : theme.name.toLowerCase() === 'summer'
                                                ? 'linear-gradient(135deg, rgba(253, 230, 138, 0.3), rgba(251, 191, 36, 0.3))'
                                                : 'none',
                                            backgroundSize: theme.name.toLowerCase() === 'valentines' ? '50px 50px' : 'auto'
                                        }}
                                    >
                                        {/* Default Theme Badge */}
                                        {isThemeDefault && (
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                                SYSTEM DEFAULT
                                            </div>
                                        )}
                                        <div className="h-full flex flex-col items-center justify-center p-4">
                                            <h3 
                                                className="text-2xl font-bold text-center mb-2"
                                                style={{ color: theme.config?.textColor || '#000000' }}
                                            >
                                                {theme.name}
                                            </h3>
                                            <div 
                                                className="px-4 py-2 rounded-full text-sm font-medium"
                                                style={{ 
                                                    backgroundColor: theme.config?.buttonColor || '#3b82f6',
                                                    color: 'white'
                                                }}
                                            >
                                                {theme.config?.buttonText || 'Get Started'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Theme Info */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {theme.name}
                                                </h3>
                                                {theme.description && (
                                                    <p className="text-gray-600 text-sm mt-1">
                                                        {theme.description}
                                                    </p>
                                                )}
                                            </div>
                                            {isThemeActive && (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full flex items-center">
                                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        {/* Theme Stats */}
                                        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500">Type</div>
                                                <div className={`text-sm font-medium ${isThemeDefault ? 'text-blue-600' : 'text-gray-900'}`}>
                                                    {isThemeDefault ? 'System' : 'Seasonal'}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500">Status</div>
                                                <div className={`text-sm font-medium ${
                                                    theme.is_active ? 'text-emerald-600' : 'text-gray-600'
                                                }`}>
                                                    {theme.is_active ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <div className="text-xs text-gray-500">Protection</div>
                                                <div className={`text-sm font-medium ${isThemeDefault ? 'text-blue-600' : 'text-gray-900'}`}>
                                                    {isThemeDefault ? 'Protected' : 'Standard'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handlePreview(theme)}
                                                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Preview Theme"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <Link
                                                    href={route('themes.edit', theme.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Theme"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </Link>
                                            </div>
                                            <div className="flex space-x-2">
                                                {!isThemeActive && !isThemeDefault && (
                                                    <button
                                                        onClick={() => handleActivate(theme)}
                                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 text-sm font-medium"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                
                                                {/* SHOW DEACTIVATE ONLY FOR NON-DEFAULT THEMES */}
                                                {isThemeActive && !isThemeDefault && (
                                                    <button
                                                        onClick={() => handleDeactivate(theme)}
                                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 text-sm font-medium"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                
                                                {/* SHOW DELETE ONLY FOR NON-DEFAULT, NON-ACTIVE THEMES */}
                                                {!isThemeActive && !isThemeDefault && (
                                                    <button
                                                        onClick={() => handleDelete(theme)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Theme"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {themes.length === 0 && (
                        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mb-4">
                                <SparklesIcon className="h-8 w-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No Themes Created Yet
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Create your first theme to customize the welcome page appearance for different seasons and events.
                            </p>
                            <Link
                                href={route('themes.create')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Create Your First Theme
                            </Link>
                        </div>
                    )}

                    {/* System Info Card */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">System Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-2" />
                                    <span className="font-medium text-gray-700">Default Theme Protection</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    The Default theme is protected and cannot be deactivated or deleted. It serves as the system fallback.
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <ArrowPathIcon className="h-5 w-5 text-blue-500 mr-2" />
                                    <span className="font-medium text-gray-700">Automatic Fallback</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    When a theme is deactivated, the system automatically switches back to the Default theme.
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center mb-2">
                                    <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
                                    <span className="font-medium text-gray-700">Seasonal Themes</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Create seasonal themes for holidays and events. Only one theme can be active at a time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HRLayout>
    );
}