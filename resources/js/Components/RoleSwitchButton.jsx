// resources/js/Components/RoleSwitchButton.jsx
import { usePage, router } from '@inertiajs/react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export default function RoleSwitchButton({ collapsed, currentMode }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    
    if (!user || user.role === "employee") {
        return null;
    }

    const getOriginalRoleLabel = () => {
        switch(user.role) {
            case 'dept_head': return 'Dept Head';
            case 'hr': return 'HR';
            case 'admin': return 'Admin';
            default: return 'Main Role';
        }
    };

    const getOriginalRolePath = () => {
        switch(user.role) {
            case 'dept_head': return '/dept-head/dashboard';
            case 'hr': return '/hr/dashboard';
            case 'admin': return '/admin/dashboard';
            default: return '/dashboard';
        }
    };

    const handleSwitch = () => {
        if (currentMode === "employee") {
            // Switch back to original role
            router.visit(getOriginalRolePath());
        } else {
            // Switch to employee mode
            router.visit("/employee/dashboard");
        }
    };

    return (
        <button
            onClick={handleSwitch}
            className="w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-indigo-700/50 text-indigo-100 hover:text-white group"
        >
            <ArrowsRightLeftIcon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
                <span className="ml-3">
                    {currentMode === "employee" 
                        ? `Back to ${getOriginalRoleLabel()}` 
                        : "Switch to Employee"}
                </span>
            )}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                    {currentMode === "employee" 
                        ? `Back to ${getOriginalRoleLabel()}` 
                        : "Switch to Employee"}
                </div>
            )}
        </button>
    );
}