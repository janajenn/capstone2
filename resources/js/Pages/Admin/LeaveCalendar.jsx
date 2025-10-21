
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

// MonthAccordion Component
const MonthAccordion = ({ month, leaves }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="border border-gray-200 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
            >
                <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
                    <p className="text-gray-600 text-xs">
                        {leaves.length} leave{leaves.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <svg 
                    className={`w-4 h-4 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {leaves.map((leave) => (
                        <div key={leave.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                            {leave.employee_name}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                                            {leave.department}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            leave.leave_type_code === 'VL' 
                                                ? 'bg-green-100 text-green-800'
                                                : leave.leave_type_code === 'SL'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {leave.leave_type_code} - {leave.leave_type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <span className="font-medium">Dates: </span>
                                        {new Date(leave.start_date).toLocaleDateString()} 
                                        {' to '}
                                        {new Date(leave.end_date).toLocaleDateString()}
                                        {' • '}
                                        <span className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</span>
                                    </div>
                                    {leave.reason && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            <span className="font-medium">Reason: </span>
                                            {leave.reason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function LeaveCalendar({ events, leavesByMonth, departments, leaveTypes, filters, currentYear }) {
    const { flash } = usePage().props;
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('calendar');
    const [localFilters, setLocalFilters] = useState({
        year: filters.year || currentYear,
        month: filters.month || '',
        day: filters.day || '',
        department: filters.department || '',
        leave_type: filters.leave_type || ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const monthsPerPage = 6;

    // Calculate pagination
    const monthEntries = Object.entries(leavesByMonth);
    const totalPages = Math.ceil(monthEntries.length / monthsPerPage);
    const startIndex = (currentPage - 1) * monthsPerPage;
    const currentMonths = monthEntries.slice(startIndex, startIndex + monthsPerPage);

    // Calculate summary statistics
    const totalMonths = Object.keys(leavesByMonth).length;
    const totalLeaves = Object.values(leavesByMonth).reduce((total, leaves) => total + leaves.length, 0);
    const mostInMonth = Math.max(...Object.values(leavesByMonth).map(leaves => leaves.length), 0);

    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            if (key === 'month' || key === 'year') {
                if (newFilters.day) {
                    const daysInMonth = new Date(newFilters.year, newFilters.month, 0).getDate();
                    if (parseInt(newFilters.day) > daysInMonth) {
                        newFilters.day = '';
                    }
                }
            }
            return newFilters;
        });
    };

    const applyFilters = () => {
        router.get(route('admin.leave-calendar'), localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setLocalFilters({
            year: currentYear,
            month: '',
            day: '',
            department: '',
            leave_type: ''
        });
        router.get(route('admin.leave-calendar'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const renderEventContent = (eventInfo) => {
        return (
            <div className="fc-event-main-frame">
                <div className="fc-event-title-container">
                    <div className="fc-event-title fc-sticky">
                        {eventInfo.event.title}
                    </div>
                </div>
            </div>
        );
    };

    const calendarOptions = {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        initialView: 'dayGridMonth',
        events: events,
        eventClick: handleEventClick,
        eventContent: renderEventContent,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,listWeek'
        },
        height: 'auto',
        eventDisplay: 'block',
        eventOverlap: false,
        eventOrder: "start,-duration,allDay",
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        }
    };

    const isFilteredToPeriod = !!localFilters.month || !!localFilters.day;

    let title = `Leaves for ${localFilters.year}`;
    if (localFilters.month) {
        title += ` - ${new Date(2000, localFilters.month - 1, 1).toLocaleString('default', { month: 'long' })}`;
    }
    if (localFilters.day) {
        title += ` - Day ${localFilters.day}`;
    }

    let allLeaves = [];
    if (isFilteredToPeriod) {
        allLeaves = Object.values(leavesByMonth).flat().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Leave Calendar</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveView('list')}
                            className={`px-3 py-1.5 rounded-md font-medium text-sm ${
                                activeView === 'list' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setActiveView('calendar')}
                            className={`px-3 py-1.5 rounded-md font-medium text-sm ${
                                activeView === 'calendar' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Calendar View
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[100px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                            <select
                                value={localFilters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({length: 5}, (_, i) => {
                                    const year = currentYear - 2 + i;
                                    return (
                                        <option key={year} value={year}>{year}</option>
                                    );
                                })}
                            </select>
                        </div>
                        <div className="min-w-[100px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                            <select
                                value={localFilters.month}
                                onChange={(e) => handleFilterChange('month', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-[100px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                            <select
                                value={localFilters.day}
                                onChange={(e) => handleFilterChange('day', e.target.value)}
                                disabled={!localFilters.month}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {localFilters.month ? 'All' : 'Month first'}
                                </option>
                                {localFilters.month && Array.from({ length: new Date(localFilters.year, localFilters.month, 0).getDate() }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                            <select
                                value={localFilters.department}
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-[120px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type</label>
                            <select
                                value={localFilters.leave_type}
                                onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.code}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={applyFilters}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Only show in list view */}
                {activeView === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-xl font-bold text-blue-600">{totalMonths}</div>
                            <div className="text-xs text-gray-600">Months with Leaves</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-xl font-bold text-green-600">{totalLeaves}</div>
                            <div className="text-xs text-gray-600">Total Leaves</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-xl font-bold text-purple-600">{mostInMonth}</div>
                            <div className="text-xs text-gray-600">Most in a Month</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-xl font-bold text-orange-600">{localFilters.year}</div>
                            <div className="text-xs text-gray-600">Selected Year</div>
                        </div>
                    </div>
                )}

                {/* Calendar View */}
                {activeView === 'calendar' && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6">
                            <FullCalendar {...calendarOptions} />
                        </div>
                    </div>
                )}

                {/* List View */}
                {activeView === 'list' && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {title}
                                </h2>
                                {totalPages > 1 && !isFilteredToPeriod && (
                                    <div className="text-sm text-gray-600">
                                        Showing {startIndex + 1}-{Math.min(startIndex + monthsPerPage, monthEntries.length)} of {monthEntries.length} months
                                    </div>
                                )}
                            </div>
                            
                            {monthEntries.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-base">No leaves found for the selected filters.</p>
                                </div>
                            ) : (
                                <>
                                    {isFilteredToPeriod ? (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {allLeaves.map((leave) => (
                                                    <tr key={leave.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employee_name}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{leave.department}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                leave.leave_type_code === 'VL' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : leave.leave_type_code === 'SL'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {leave.leave_type_code} - {leave.leave_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{leave.total_days}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500 line-clamp-2">{leave.reason || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {currentMonths.map(([month, leaves]) => (
                                                    <MonthAccordion 
                                                        key={month} 
                                                        month={month} 
                                                        leaves={leaves} 
                                                    />
                                                ))}
                                            </div>

                                            {/* Pagination Controls */}
                                            {totalPages > 1 && (
                                                <div className="flex justify-center items-center space-x-2 mt-6">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Previous
                                                    </button>
                                                    <div className="flex space-x-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`px-2 py-1 rounded-md text-sm font-medium ${
                                                                    currentPage === page
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {isModalOpen && selectedEvent && (
    <div
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
    >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 z-10 px-5 py-4 flex justify-between items-center border-b border-gray-100">
                <h2 id="modal-title" className="text-xl font-bold text-gray-900">Leave Details</h2>
                <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Key Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{selectedEvent.extendedProps.employee_name}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Leave Type</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-1
                                ${selectedEvent.extendedProps.leave_type_code === 'VL' ? 'bg-green-100 text-green-800' :
                                  selectedEvent.extendedProps.leave_type_code === 'SL' ? 'bg-red-100 text-red-800' :
                                  'bg-purple-100 text-purple-800'}`}>
                                {selectedEvent.extendedProps.leave_type_code}
                            </span>
                            {selectedEvent.extendedProps.leave_type}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Date</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{new Date(selectedEvent.extendedProps.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">End Date</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{new Date(selectedEvent.extendedProps.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Days</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{selectedEvent.extendedProps.total_days} day(s)</p>
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason</label>
                    <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {selectedEvent.extendedProps.reason || 'No reason provided'}
                    </p>
                </div>

                {/* Approval Chain */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Approval Chain</label>
                    <div className="space-y-2">
                        {selectedEvent.extendedProps.approvals && selectedEvent.extendedProps.approvals.map((approval, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{approval.role}</p>
                                    <p className="text-xs text-gray-600">{approval.approver_name}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                        ${approval.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {approval.approved_at ? new Date(approval.approved_at).toLocaleDateString() : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 flex justify-end">
                <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}
            </div>
        </AdminLayout>
    );
};
