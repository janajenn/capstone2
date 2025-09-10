import { useState } from 'react';
import { Link } from '@inertiajs/react';
import PageTransition from '@/Components/PageTransition';

export default function AdminLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`transition-all duration-300 bg-white border-r ${collapsed ? 'w-16' : 'w-64'}`}>
                <div className="flex items-center justify-between p-4 border-b">
                    {!collapsed && <h1 className="font-bold text-xl">Admin</h1>}
                    <button onClick={toggleSidebar}>
                        {collapsed ? '➡️' : '⬅️'}
                    </button>
                </div>

                <nav className="flex flex-col p-2 space-y-2">
                    <Link href="/admin/dashboard" className="hover:bg-gray-200 rounded p-2">
                        📊 {!collapsed && 'Dashboard'}
                    </Link>
                    <Link href="/admin/users" className="hover:bg-gray-200 rounded p-2">
                        👤 {!collapsed && 'Manage Users'}
                    </Link>
                    <Link href="/admin/feedbacks" className="hover:bg-gray-200 rounded p-2">
                        📝 {!collapsed && 'All Feedback'}
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

            {/* Main content */}
            <div className="flex-1">
                <PageTransition 
                    animation="fade-slide-up"
                    duration={400}
                    delay={100}
                    className="p-6"
                >
                    {children}
                </PageTransition>
            </div>
        </div>
    );
}
