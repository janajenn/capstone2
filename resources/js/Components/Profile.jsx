// resources/js/Components/Profile.jsx
import { usePage } from '@inertiajs/react';
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    HomeIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    ShieldCheckIcon,
    IdentificationIcon,
    MapPinIcon,
    UsersIcon,
    ClockIcon,
    DocumentTextIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
    const { props } = usePage();
    const { auth } = props;
    const user = auth.user;
    const employee = props.employee || {};
    
    // Safely access department and department head
    const department = employee.department || {};
    const deptHead = department?.head || {};
    
    // Helper functions for formatting
    const formatCurrency = (amount) => {
        if (!amount) return 'Not specified';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    };

    const calculateAge = (dateString) => {
        if (!dateString) return '';
        try {
            const birthDate = new Date(dateString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return `${age} years`;
        } catch (e) {
            return '';
        }
    };

    const formatCivilStatus = (status) => {
        if (!status) return 'Not specified';
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getRoleDisplay = (role) => {
        const roles = {
            admin: { label: 'Administrator', color: 'bg-gradient-to-r from-red-500 to-rose-600', icon: '👑' },
            hr: { label: 'HR Manager', color: 'bg-gradient-to-r from-indigo-500 to-purple-600', icon: '👔' },
            dept_head: { label: 'Department Head', color: 'bg-gradient-to-r from-yellow-500 to-amber-600', icon: '👑' },
            employee: { label: 'Employee', color: 'bg-gradient-to-r from-emerald-500 to-green-600', icon: '💼' }
        };
        return roles[role] || roles.employee;
    };

    const getStatusDisplay = (status) => {
        const statuses = {
            active: { label: 'Active', color: 'bg-gradient-to-r from-emerald-400 to-green-500' },
            inactive: { label: 'Inactive', color: 'bg-gradient-to-r from-gray-500 to-gray-600' },
            pending: { label: 'Pending', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' }
        };
        return statuses[status] || statuses.active;
    };

    const roleInfo = getRoleDisplay(auth.role);
    const statusInfo = getStatusDisplay(employee.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                        My Profile
                    </h1>
                    <p className="text-gray-600 mt-2">
                        View your personal and employment information
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Profile Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                            <div className="flex flex-col items-center">
                                {/* Avatar */}
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                                        {employee.firstname && employee.lastname ? (
                                            <span className="text-4xl font-bold text-white">
                                                {employee.firstname[0]}{employee.lastname[0]}
                                            </span>
                                        ) : (
                                            <UserCircleIcon className="w-20 h-20 text-white" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-4 border-white"></div>
                                </div>
                                
                                {/* Name and Position */}
                                <h2 className="text-2xl font-bold text-gray-800 text-center">
                                    {employee.firstname} {employee.middlename && employee.middlename + ' '}{employee.lastname}
                                </h2>
                                <p className="text-gray-600 text-center mt-1">{employee.position || 'Not specified'}</p>
                                
                                {/* Role Badge */}
                                <div className="mt-4">
                                    <span className={`px-3 py-1.5 rounded-xl text-sm font-medium text-white shadow-lg ${roleInfo.color}`}>
                                        {roleInfo.icon} {roleInfo.label}
                                    </span>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="mt-2">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium text-white ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                                
                                {/* Quick Info */}
                                <div className="mt-6 w-full space-y-3">
                                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                        <EnvelopeIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600">Email Address</p>
                                            <p className="font-medium text-gray-800 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                                        <PhoneIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600">Contact Number</p>
                                            <p className="font-medium text-gray-800">{employee.contact_number || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                                        <CalendarIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-gray-600">Age</p>
                                            <p className="font-medium text-gray-800">
                                                {employee.date_of_birth ? calculateAge(employee.date_of_birth) : 'Not specified'}
                                            </p>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        
                        {/* Department Info Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                                <span>Department Information</span>
                            </h3>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Department</p>
                                    <p className="font-medium text-gray-800">{department.name || 'Not assigned'}</p>
                                </div>
                                
                                {deptHead && deptHead.firstname && (
                                    <div>
                                        <p className="text-sm text-gray-600">Department Head</p>
                                        <p className="font-medium text-gray-800">
                                            {deptHead.firstname} {deptHead.lastname}
                                        </p>
                                    </div>
                                )}
                                
                                <div>
                                    <p className="text-sm text-gray-600">Employee ID</p>
                                    <p className="font-medium text-gray-800 font-mono bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1 rounded">
                                        {employee.employee_id || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                                <UserCircleIcon className="w-5 h-5 text-blue-600" />
                                <span>Personal Information</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Full Name</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">
                                                {employee.firstname || 'Not specified'} {employee.middlename && employee.middlename + ' '}{employee.lastname || ''}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Gender</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium capitalize">{employee.gender || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Date of Birth</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{formatDate(employee.date_of_birth)}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Civil Status</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{formatCivilStatus(employee.civil_status)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Contact Number</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{employee.contact_number || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{employee.address || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Email Address</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Account Created</p>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{formatDate(user.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employment Information Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                                <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                                <span>Employment Information</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Position</p>
                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{employee.position || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
                                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{department.name || 'Not assigned'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Employment Status</p>
                                        <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg">
                                            <p className="text-gray-800 font-medium capitalize">{employee.status || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Monthly Salary</p>
                                        <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{formatCurrency(employee.monthly_salary)}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Daily Rate</p>
                                        <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                                            <p className="text-gray-800 font-medium">{formatCurrency(employee.daily_rate)}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Employee ID</p>
                                        <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
                                            <p className="text-gray-800 font-medium font-mono">{employee.employee_id || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}