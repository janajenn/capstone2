// resources/js/Layouts/EmployeeLayout.jsx

import { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function EmployeeLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className={`transition-all duration-300 bg-white border-r ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    {!collapsed && <h1 className="font-bold text-xl">DEPARTMENT HEAD</h1>}
                    <button onClick={toggleSidebar}>
                        {collapsed ? '➡️' : '⬅️'}
                    </button>
                </div>

                <nav className="flex flex-col p-2 space-y-2">
                    <Link href="/dept/dashboard"  className="hover:bg-gray-200 rounded p-2">
                        🏠 {!collapsed && 'Dashboard'}
                    </Link>
                    <Link href="/dept/leave-approvals" className="hover:bg-gray-200 rounded p-2">
                        📝 {!collapsed && 'My Leaves'}
                    </Link>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="hover:bg-red-100 text-red-600 rounded p-2 mt-auto text-left"
                    >
                        🚪 {!collapsed && 'Logout'}
                    </Link>
                </nav>
            </div>

            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}
