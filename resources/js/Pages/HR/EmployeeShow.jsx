// resources/js/Pages/HR/EmployeeShow.jsx
import HRLayout from '@/Layouts/HRLayout';
import { usePage, Link } from '@inertiajs/react';

// Avatar component matching the employee list
const EmployeeAvatar = ({ gender, name, className = "w-16 h-16" }) => {
    const getInitials = (fullName) => {
        if (!fullName) return '?';
        return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (gender === 'female') {
        return (
            <div className={`${className} bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {getInitials(name)}
            </div>
        );
    }
    
    // Default to male avatar
    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {getInitials(name)}
        </div>
    );
};

// Status badge component
const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium ${
        status === 'active' 
            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200' 
            : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 border border-rose-200'
    }`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${
            status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}></span>
        {status?.toUpperCase()}
    </span>
);

// Role badge component
const RoleBadge = ({ role, isPrimary }) => {
    const getRoleConfig = (role, isPrimary) => {
        const configs = {
            admin: {
                gradient: isPrimary 
                    ? 'from-purple-500 to-pink-600' 
                    : 'from-purple-400 to-pink-500',
                text: isPrimary ? 'PRIMARY ADMIN' : 'ADMIN'
            },
            hr: {
                gradient: 'from-indigo-500 to-blue-600',
                text: 'HR MANAGER'
            },
            dept_head: {
                gradient: 'from-cyan-500 to-blue-500',
                text: 'DEPARTMENT HEAD'
            },
            employee: {
                gradient: 'from-gray-500 to-gray-600',
                text: 'EMPLOYEE'
            }
        };
        
        return configs[role] || configs.employee;
    };

    const config = getRoleConfig(role, isPrimary);

    return (
        <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-gradient-to-r ${config.gradient} text-white shadow-lg`}>
            {config.text}
        </span>
    );
};

// Info card component for consistent styling
const InfoCard = ({ title, children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

// Info row component
const InfoRow = ({ label, value, children }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex-1">
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        <div className="flex-1 text-right">
            {children || <span className="text-sm font-semibold text-gray-800">{value || 'N/A'}</span>}
        </div>
    </div>
);

export default function EmployeeShow() {
    const { employee } = usePage().props;

    // Function to format currency
    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return `₱${parseFloat(amount).toLocaleString()}`;
    };

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Capitalize words for display
    const capitalizeWords = (str) => {
        if (!str) return 'N/A';
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    const fullName = `${employee.firstname} ${employee.middlename} ${employee.lastname}`.trim();

    return (
        <HRLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Employee Details
                            </h1>
                            <p className="text-gray-600 text-lg">Complete information and profile</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sticky top-8">
                            {/* Profile Avatar */}
                            <div className="text-center mb-6">
                                <EmployeeAvatar 
                                    gender={employee.gender} 
                                    name={fullName}
                                    className="w-24 h-24 mx-auto mb-4"
                                />
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                    {employee.firstname} {employee.lastname}
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">{employee.position}</p>
                                
                                {/* Status and Role Badges */}
                                <div className="space-y-3">
                                    <StatusBadge status={employee.status} />
                                    {employee.user && (
                                        <RoleBadge 
                                            role={employee.user.role} 
                                            isPrimary={employee.user.is_primary} 
                                        />
                                    )}
                                </div>
                            </div>

                           
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Personal Information */}
                        <InfoCard title="Personal Information">
                            <InfoRow label="Full Name" value={`${employee.firstname} ${employee.middlename} ${employee.lastname}`.trim()} />
                            <InfoRow label="Gender" value={capitalizeWords(employee.gender)} />
                            <InfoRow label="Date of Birth" value={formatDate(employee.date_of_birth)} />
                            <InfoRow label="Civil Status" value={capitalizeWords(employee.civil_status)} />
                            <InfoRow label="Contact Number" value={employee.contact_number} />
                        </InfoCard>

                        {/* Work Information */}
                        <InfoCard title="Work Information">
                            <InfoRow label="Department" value={employee.department?.name} />
                            <InfoRow label="Position" value={employee.position} />
                            <InfoRow label="Biometric ID" value={employee.biometric_id} />
                            <InfoRow label="Employment Status" value={capitalizeWords(employee.status)} />
                            <InfoRow label="Date Joined" value={formatDate(employee.created_at)} />
                        </InfoCard>

                        {/* Account Information */}
                        <InfoCard title="Account Information">
                            <InfoRow label="Email" value={employee.user?.email} />
                            <InfoRow label="Role">
                                {employee.user ? (
                                    <RoleBadge 
                                        role={employee.user.role} 
                                        isPrimary={employee.user.is_primary} 
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-gray-800">No Account</span>
                                )}
                            </InfoRow>
                            <InfoRow label="Account Status">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    employee.user 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {employee.user ? 'Active' : 'Not Created'}
                                </span>
                            </InfoRow>
                        </InfoCard>

                        {/* Contact & Compensation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Information */}
                            <InfoCard title="Contact Information">
                                <InfoRow label="Address" value={employee.address} />
                            </InfoCard>

                            {/* Compensation */}
                            <InfoCard title="Compensation">
                                <InfoRow 
                                    label="Monthly Salary" 
                                    value={formatCurrency(employee.monthly_salary)} 
                                />
                                <InfoRow 
                                    label="Daily Rate" 
                                    value={formatCurrency(employee.daily_rate)} 
                                />
                            </InfoCard>
                        </div>

                       
                        

                        {/* Action Buttons */}
                        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
                            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                                <Link
                                    href={route('hr.employees')}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-center"
                                >
                                    ← Back to List
                                </Link>

                                <Link
                                    href={route('hr.employees.edit', employee.employee_id)}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-lg hover:scale-105 text-center"
                                >
                                    Edit Employee
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
            </div>
        </HRLayout>
    );
}