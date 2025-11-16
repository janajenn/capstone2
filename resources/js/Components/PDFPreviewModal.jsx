// resources/js/Components/PDFPreviewModal.jsx
import { useEffect } from 'react';

const PDFPreviewModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    employees, 
    departments, 
    selectedDepartment, 
    searchTerm 
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sortedEmployees = employees.data ? [...employees.data].sort((a, b) => {
        const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
        const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
    }) : [];

    const getFilterInfo = () => {
        if (selectedDepartment && searchTerm) {
            const deptName = departments.find(d => d.id == selectedDepartment)?.name;
            return `Department: ${deptName}, Search: "${searchTerm}"`;
        } else if (selectedDepartment) {
            const deptName = departments.find(d => d.id == selectedDepartment)?.name;
            return `Department: ${deptName}`;
        } else if (searchTerm) {
            return `Search: "${searchTerm}"`;
        }
        return 'All Employees';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-start justify-center p-4 pt-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header with Action Buttons */}
                <div className="flex-shrink-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-indigo-800 bg-clip-text text-transparent">
                            PDF Preview
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Review the employee list before downloading
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!employees.data || employees.data.length === 0}
                            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center text-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg ml-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Preview Content - Scrollable */}
                <div className="flex-1 overflow-hidden p-6">
                    {/* Preview Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Employee List</h3>
                            <div className="text-gray-600 text-sm space-y-1">
                                <p>Generated on: {new Date().toLocaleDateString()}</p>
                                <p>Total Employees: {employees.total}</p>
                                <p className="font-medium text-indigo-600">{getFilterInfo()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Table Container */}
                    <div className="border border-gray-200 rounded-2xl overflow-hidden flex-1 flex flex-col max-h-[calc(100%-200px)]">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                        <th className="p-3 font-semibold text-left whitespace-nowrap text-xs">Name</th>
                                        <th className="p-3 font-semibold text-left whitespace-nowrap text-xs">Position</th>
                                        <th className="p-3 font-semibold text-left whitespace-nowrap text-xs">Department</th>
                                        <th className="p-3 font-semibold text-left whitespace-nowrap text-xs">Status</th>
                                        <th className="p-3 font-semibold text-left whitespace-nowrap text-xs">Contact Number</th>
                                    </tr>
                                </thead>
                                <tbody className="overflow-y-auto">
                                    {sortedEmployees.map((emp, index) => (
                                        <tr 
                                            key={emp.employee_id} 
                                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        >
                                            <td className="p-3 border-t border-gray-200 whitespace-nowrap">
                                                <div className="font-medium text-gray-900 text-xs">
                                                    {emp.firstname} {emp.lastname}
                                                </div>
                                            </td>
                                            <td className="p-3 border-t border-gray-200 text-gray-700 whitespace-nowrap text-xs">
                                                {emp.position || 'N/A'}
                                            </td>
                                            <td className="p-3 border-t border-gray-200 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {emp.department?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-3 border-t border-gray-200 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    emp.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                                        emp.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                                    }`}></span>
                                                    {emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-3 border-t border-gray-200 text-gray-600 whitespace-nowrap text-xs">
                                                {emp.contact_number || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(!sortedEmployees || sortedEmployees.length === 0) && (
                            <div className="text-center py-12 text-gray-500 flex-1 flex items-center justify-center">
                                <div>
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                    <p className="text-base font-medium text-gray-600">No employees to display</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Footer Note */}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start">
                            <svg className="w-4 h-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="text-xs">
                                <p className="font-medium text-amber-800">This is a preview</p>
                                <p className="text-amber-700 mt-1">
                                    The actual PDF will include additional formatting, page numbers, and will be optimized for printing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;