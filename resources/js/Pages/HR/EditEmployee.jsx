import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Avatar component matching the design system
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
    
    return (
        <div className={`${className} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {getInitials(name)}
        </div>
    );
};  

// Password input with show/hide toggle
const PasswordInput = ({ value, onChange, placeholder, error }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm pr-12"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
};

// Form section component for consistent styling
const FormSection = ({ title, children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

export default function EditEmployee() {
    const { employee, departments, errors } = usePage().props;
    const [showPrimaryAdminOption, setShowPrimaryAdminOption] = useState(false);

    const { data, setData, put, processing } = useForm({
        firstname: '',
        middlename: '',
        lastname: '',
        gender: 'male',
        date_of_birth: '',
        position: '',
        department_id: '',
        status: 'active',
        contact_number: '',
        address: '',
        civil_status: 'single',
        biometric_id: '',
        monthly_salary: 0,
        daily_rate: 0,
        email: '',
        role: 'employee',
        is_primary: false,
        password: '',
    });

    // Pre-fill form with employee data
    useEffect(() => {
        if (employee) {
            setData({
                firstname: employee.firstname || '',
                middlename: employee.middlename || '',
                lastname: employee.lastname || '',
                gender: employee.gender || 'male',
                date_of_birth: employee.date_of_birth || '',
                position: employee.position || '',
                department_id: employee.department_id || '',
                status: employee.status || 'active',
                contact_number: employee.contact_number || '',
                address: employee.address || '',
                civil_status: employee.civil_status || 'single',
                biometric_id: employee.biometric_id || '',
                monthly_salary: employee.monthly_salary || 0,
                daily_rate: employee.daily_rate || 0,
                email: employee.user?.email || '',
                role: employee.user?.role || 'employee',
                is_primary: employee.user?.is_primary || false,
                password: '',
            });
            
            setShowPrimaryAdminOption(employee.user?.role === 'admin');
        }
    }, [employee]);

    // Handle role change
    useEffect(() => {
        if (data.role === 'admin') {
            setShowPrimaryAdminOption(true);
        } else {
            setShowPrimaryAdminOption(false);
            setData('is_primary', false);
        }
    }, [data.role]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('hr.employees.update', employee.employee_id));
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0.00';
        return `₱${parseFloat(amount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Auto-capitalize name fields
    const handleNameChange = (field, value) => {
        const capitalized = value.replace(/\b\w/g, char => char.toUpperCase());
        setData(field, capitalized);
    };

    const fullName = `${employee.firstname} ${employee.lastname}`;

    return (
        <HRLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                                Edit Employee
                            </h1>
                            <p className="text-gray-600 text-lg">Update information for {fullName}</p>
                            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                    </div>
                </div>

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
                                <p className="text-gray-600 text-sm">{employee.position}</p>
                            </div>

                            {/* Current Info */}
                            <div className="space-y-4 border-t border-gray-200 pt-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Current Department</label>
                                    <p className="text-sm font-semibold text-gray-800">{employee.department?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Current Salary</label>
                                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(employee.monthly_salary)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                        employee.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {employee.status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <form onSubmit={handleSubmit}>
                            {/* Personal Information */}
                            <FormSection title="Personal Information">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.firstname}
                                            onChange={(e) => handleNameChange('firstname', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Middle Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.middlename}
                                            onChange={(e) => handleNameChange('middlename', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        />
                                        {errors.middlename && <p className="text-red-500 text-xs mt-1">{errors.middlename}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.lastname}
                                            onChange={(e) => handleNameChange('lastname', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender *
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <select
                                                value={data.gender}
                                                onChange={(e) => setData('gender', e.target.value)}
                                                className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                                required
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            <EmployeeAvatar gender={data.gender} name={fullName} className="w-10 h-10" />
                                        </div>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth *
                                        </label>
                                        <input
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={(e) => setData('date_of_birth', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Civil Status *
                                        </label>
                                        <select
    value={data.civil_status}
    onChange={(e) => setData('civil_status', e.target.value)}
    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
    required
>
    <option value="">Select Civil Status</option>
    <optgroup label="Single">
        <option value="single_solo_parent">Single - Solo Parent</option>
        <option value="single_non_solo_parent">Single - Non Solo Parent</option>
    </optgroup>
    <optgroup label="Married">
        <option value="married_solo_parent">Married - Solo Parent</option>
        <option value="married_non_solo_parent">Married - Non Solo Parent</option>
    </optgroup>
    <optgroup label="Widowed">
        <option value="widowed_solo_parent">Widowed - Solo Parent</option>
        <option value="widowed_non_solo_parent">Widowed - Non Solo Parent</option>
    </optgroup>
    <optgroup label="Divorced">
        <option value="divorced_solo_parent">Divorced - Solo Parent</option>
        <option value="divorced_non_solo_parent">Divorced - Non Solo Parent</option>
    </optgroup>
</select>
                                        {errors.civil_status && <p className="text-red-500 text-xs mt-1">{errors.civil_status}</p>}
                                    </div>
                                </div>
                            </FormSection>

                            {/* Work Information */}
                            <FormSection title="Work Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Department *
                                        </label>
                                        <select
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Position *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Biometric ID
                                        </label>
                                        <input
                                            type="number"
                                            value={data.biometric_id}
                                            onChange={(e) => setData('biometric_id', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        />
                                        {errors.biometric_id && <p className="text-red-500 text-xs mt-1">{errors.biometric_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status *
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {data.status === 'inactive' && (
                                            <p className="text-amber-600 text-xs mt-2 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Employee will not be able to log in when inactive
                                            </p>
                                        )}
                                        {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="hr">HR Manager</option>
                                            <option value="admin">Administrator</option>
                                            <option value="dept_head">Department Head</option>
                                        </select>
                                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                    </div>
                                </div>

                                {/* Primary Admin Toggle */}
                                {showPrimaryAdminOption && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="is_primary"
                                                checked={data.is_primary}
                                                onChange={(e) => setData('is_primary', e.target.checked)}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <label htmlFor="is_primary" className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Set as Primary Administrator
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    This user will have full system administration privileges
                                                </span>
                                            </label>
                                        </div>
                                        {errors.is_primary && <p className="text-red-500 text-xs mt-1">{errors.is_primary}</p>}
                                    </div>
                                )}
                            </FormSection>

                            {/* Compensation */}
                            <FormSection title="Compensation">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monthly Salary *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.monthly_salary}
                                            onChange={(e) => setData('monthly_salary', parseFloat(e.target.value))}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Current: <span className="font-semibold">{formatCurrency(employee.monthly_salary)}</span>
                                        </p>
                                        {errors.monthly_salary && <p className="text-red-500 text-xs mt-1">{errors.monthly_salary}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Daily Rate *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.daily_rate}
                                            onChange={(e) => setData('daily_rate', parseFloat(e.target.value))}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Current: <span className="font-semibold">{formatCurrency(employee.daily_rate)}</span>
                                        </p>
                                        {errors.daily_rate && <p className="text-red-500 text-xs mt-1">{errors.daily_rate}</p>}
                                    </div>
                                </div>
                            </FormSection>

                            {/* Contact Information */}
                            <FormSection title="Contact Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contact Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.contact_number}
                                            onChange={(e) => setData('contact_number', e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                            required
                                        />
                                        {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address *
                                    </label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white/50 backdrop-blur-sm"
                                        required
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                            </FormSection>

                            {/* Password Update */}
                            <FormSection title="Password Update (Optional)">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <PasswordInput
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Leave blank to keep current password"
                                        error={errors.password}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Minimum 6 characters. Leave empty if you don't want to change the password.
                                    </p>
                                </div>
                            </FormSection>

                            {/* Action Buttons */}
                            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
                                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-center"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                                    >
                                        {processing ? 'Updating...' : 'Update Employee'}
                                    </button>
                                </div>
                            </div>
                        </form>
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