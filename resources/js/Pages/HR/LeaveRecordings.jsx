import React from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import HRLayout from '@/Layouts/HRLayout';
import { Search, Building, Calendar, Download, Users, Eye } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { 
        opacity: 0, 
        y: 20,
        scale: 0.98
    },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
};

const listItemVariants = {
    hidden: { 
        opacity: 0, 
        x: -20
    },
    visible: { 
        opacity: 1, 
        x: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    }
};

const buttonHover = {
    hover: { 
        scale: 1.02,
        transition: { duration: 0.2 }
    }
};

const LeaveRecordings = () => {
    const { employees, departments, filters, years } = usePage().props;
    const currentYear = new Date().getFullYear();

    const { data, setData } = useForm({
        search: filters.search || '',
        department: filters.department || '',
        export_year: currentYear,
    });

    const handleFilter = () => {
        router.get(route('hr.leave-recordings'), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            search: '',
            department: '',
            export_year: currentYear,
        });
        router.get(route('hr.leave-recordings'));
    };

    const viewEmployeeRecordings = (employee) => {
        router.visit(route('hr.leave-recordings.employee', { 
            employee: employee.employee_id 
        }));
    };

    // Export functions
    const exportDepartment = () => {
        const params = new URLSearchParams({
            department_id: data.department || '',
            year: data.export_year,
        });
        
        window.location.href = route('hr.leave-recordings.export.department') + '?' + params.toString();
    };

    const exportAll = () => {
        const params = new URLSearchParams({
            year: data.export_year,
        });
        
        window.location.href = route('hr.leave-recordings.export.all') + '?' + params.toString();
    };

    return (
        <HRLayout>
            <Head title="Leave Recordings" />
            
            <motion.div 
                className="py-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        className="bg-white rounded-2xl shadow-sm mb-8 border border-gray-100 overflow-hidden"
                        variants={itemVariants}
                    >
                        <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Leave Recordings</h1>
                                    <p className="text-gray-600 mt-1">View and manage employee leave records</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Filters and Export Section */}
                    <motion.div 
                        className="bg-white rounded-2xl shadow-sm mb-8 border border-gray-100 p-6"
                        variants={itemVariants}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Employee
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={data.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Export Year
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={data.export_year}
                                        onChange={(e) => setData('export_year', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors appearance-none"
                                    >
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-end space-x-3">
                                <motion.button
                                    onClick={handleFilter}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors font-medium"
                                    variants={buttonHover}
                                    whileHover="hover"
                                >
                                    Apply Filters
                                </motion.button>
                                <motion.button
                                    onClick={handleReset}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                                    variants={buttonHover}
                                    whileHover="hover"
                                >
                                    Reset
                                </motion.button>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="border-t pt-6">
                            <div className="flex flex-wrap gap-3 items-center">
                                <motion.button
                                    onClick={exportDepartment}
                                    disabled={!data.department}
                                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                        data.department 
                                            ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200 shadow-sm hover:shadow-md' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                    variants={buttonHover}
                                    whileHover="hover"
                                    // disabled={!data.department}
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export Current Department</span>
                                </motion.button>
                                
                                <motion.button
                                    onClick={exportAll}
                                    className="flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-sm hover:shadow-md font-medium"
                                    variants={buttonHover}
                                    whileHover="hover"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export All Departments</span>
                                </motion.button>
                                
                                <span className="text-sm text-gray-500 flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Exports for {data.export_year}</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Employees List */}
                    <motion.div 
                        className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                        variants={itemVariants}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    <span>Employees ({employees.data.length})</span>
                                </h3>
                            </div>
                        </div>

                        <AnimatePresence>
                            <div className="divide-y divide-gray-100">
                                {employees.data.map((employee, index) => (
                                    <motion.div 
                                        key={employee.employee_id} 
                                        className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200"
                                        variants={listItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {employee.firstname} {employee.lastname}
                                                </h4>
                                                <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                    <span className="flex items-center space-x-1">
                                                        <Building className="w-4 h-4" />
                                                        <span>{employee.department?.name}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{employee.position}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <motion.button
                                                onClick={() => viewEmployeeRecordings(employee)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-medium shadow-sm hover:shadow-md"
                                                variants={buttonHover}
                                                whileHover="hover"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>View Recordings</span>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>

                        {/* Empty State */}
                        {employees.data.length === 0 && (
                            <motion.div 
                                className="text-center py-12"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <motion.div 
                                    className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                    animate={{ 
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Users className="w-10 h-10 text-gray-400" />
                                </motion.div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No employees found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Try adjusting your search or filter criteria to see employee records.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Pagination */}
                    {employees.links && employees.links.length > 3 && (
                        <motion.div 
                            className="mt-8 flex justify-center"
                            variants={itemVariants}
                        >
                            <nav className="flex space-x-1 bg-white rounded-xl shadow-sm p-2 border border-gray-100">
                                {employees.links.map((link, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(link.url, {}, { preserveState: true, preserveScroll: true });
                                            }
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            link.active
                                                ? 'bg-blue-600 text-white shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        variants={buttonHover}
                                        whileHover="hover"
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </HRLayout>
    );
};

export default LeaveRecordings;