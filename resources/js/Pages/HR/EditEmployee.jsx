import HRLayout from '@/Layouts/HRLayout';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function EditEmployee() {
    const { employee, departments, errors } = usePage().props;

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
                password: '',
            });
        }
    }, [employee]);

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

    return (
        <HRLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        <h1 className="text-2xl font-bold">Edit Employee</h1>
                        <p className="text-blue-100">
                            Update information for {employee.firstname} {employee.lastname}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.firstname}
                                        onChange={(e) => setData('firstname', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.middlename}
                                        onChange={(e) => setData('middlename', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.middlename && <p className="text-red-500 text-xs mt-1">{errors.middlename}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.lastname}
                                        onChange={(e) => setData('lastname', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender *
                                    </label>
                                    <select
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Civil Status *
                                    </label>
                                    <select
                                        value={data.civil_status}
                                        onChange={(e) => setData('civil_status', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="widowed">Widowed</option>
                                        <option value="divorced">Divorced</option>
                                    </select>
                                    {errors.civil_status && <p className="text-red-500 text-xs mt-1">{errors.civil_status}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Work Information */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Work Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department *
                                    </label>
                                    <select
                                        value={data.department_id}
                                        onChange={(e) => setData('department_id', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Biometric ID *
                                    </label>
                                    <input
                                        type="number"
                                        value={data.biometric_id}
                                        onChange={(e) => setData('biometric_id', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

                                    />
                                    {errors.biometric_id && <p className="text-red-500 text-xs mt-1">{errors.biometric_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role *
                                    </label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="hr">HR</option>
                                        <option value="admin">Admin</option>
                                        <option value="dept_head">Department Head</option>
                                    </select>
                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Compensation */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Compensation
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Monthly Salary *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.monthly_salary}
                                        onChange={(e) => setData('monthly_salary', parseFloat(e.target.value))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Current: {formatCurrency(employee.monthly_salary)}
                                    </p>
                                    {errors.monthly_salary && <p className="text-red-500 text-xs mt-1">{errors.monthly_salary}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Daily Rate *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.daily_rate}
                                        onChange={(e) => setData('daily_rate', parseFloat(e.target.value))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Current: {formatCurrency(employee.daily_rate)}
                                    </p>
                                    {errors.daily_rate && <p className="text-red-500 text-xs mt-1">{errors.daily_rate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address *
                                </label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>
                        </div>

                        {/* Password Update */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                                Password Update (Optional)
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Leave blank to keep current password"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum 6 characters. Leave empty if you don't want to change the password.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </HRLayout>
    );
}
