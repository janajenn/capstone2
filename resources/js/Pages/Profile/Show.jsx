// resources/js/Pages/Profile/Show.jsx
import { Head, usePage } from '@inertiajs/react';
import Profile from '@/Components/Profile';
import HRLayout from '@/Layouts/HRLayout';
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ProfileShow({ auth }) {
    const { url } = usePage();
    
    // Parse the mode from URL query parameter
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const mode = urlParams.get('mode') || auth.role; // Default to user's actual role
    
    const renderLayout = () => {
        // Use the mode from URL parameter instead of auth.role
        switch (mode) {
            case 'admin':
                return <AdminLayout><Profile /></AdminLayout>;
            case 'hr':
                return <HRLayout><Profile /></HRLayout>;
            case 'dept_head':
                return <DeptHeadLayout><Profile /></DeptHeadLayout>;
            case 'employee':
                return <EmployeeLayout><Profile /></EmployeeLayout>;
            default:
                // Fallback to actual role if mode is invalid
                return <EmployeeLayout><Profile /></EmployeeLayout>;
        }
    };

    return (
        <>
            <Head title="My Profile" />
            {renderLayout()}
        </>
    );
}