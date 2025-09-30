import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { usePage } from '@inertiajs/react';
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
                className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
            >
                <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-800">{month}</h3>
                    <p className="text-gray-600 text-sm">
                        {leaves.length} leave{leaves.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <svg 
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                        <div key={leave.id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                                        <span className="font-medium text-gray-900">
                                            {leave.employee_name}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {leave.department}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            leave.leave_type_code === 'VL' 
                                                ? 'bg-green-100 text-green-800'
                                                : leave.leave_type_code === 'SL'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {leave.leave_type_code} - {leave.leave_type}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Dates: </span>
                                        {new Date(leave.start_date).toLocaleDateString()} 
                                        {' to '}
                                        {new Date(leave.end_date).toLocaleDateString()}
                                        {' • '}
                                        <span className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</span>
                                    </div>
                                    {leave.reason && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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

export default function LeaveCalendar({ events, leavesByMonth, departmentName, leaveTypes, filters, currentYear }) {
    const { flash } = usePage().props;
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('calendar'); // 'calendar' or 'list'
    const [localFilters, setLocalFilters] = useState({
        year: filters.year || currentYear,
        leave_type: filters.leave_type || ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const monthsPerPage = 6; // Show 6 months at a time

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
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        window.location.href = route('dept_head.leave-calendar', localFilters);
    };

    const clearFilters = () => {
        setLocalFilters({
            year: currentYear,
            leave_type: ''
        });
        window.location.href = route('dept_head.leave-calendar');
    };

    // Custom event content renderer
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
        },
        // Remove end date from events to only show start date
        eventDidMount: function(info) {
            // Remove any end date processing to ensure only start date is displayed
            info.el.querySelector('.fc-event-time')?.remove();
        }
    };

    return (
        <DeptHeadLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Leave Calendar</h1>
                            <p className="text-gray-600 mt-1">View approved leaves for {departmentName} department</p>
                            <p className="text-sm text-gray-500 mt-1">
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Only start dates are marked on the calendar
                            </p>
                        </div>
                        <div className="flex space-x-2 mt-4 md:mt-0">
                            <button
                                onClick={() => setActiveView('list')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeView === 'list' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                List View
                            </button>
                            <button
                                onClick={() => setActiveView('calendar')}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    activeView === 'calendar' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Calendar View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select
                                value={localFilters.year}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({length: 5}, (_, i) => {
                                    const year = currentYear - 2 + i;
                                    return (
                                        <option key={year} value={year}>{year}</option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                            <select
                                value={localFilters.leave_type}
                                onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Leave Types</option>
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.code}>{type.name} ({type.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end space-x-2">
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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
                            <div className="text-2xl font-bold text-blue-600">{totalMonths}</div>
                            <div className="text-sm text-gray-600">Months with Leaves</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-2xl font-bold text-green-600">{totalLeaves}</div>
                            <div className="text-sm text-gray-600">Total Leaves</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-2xl font-bold text-purple-600">{mostInMonth}</div>
                            <div className="text-sm text-gray-600">Most in a Month</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                            <div className="text-2xl font-bold text-orange-600">{currentYear}</div>
                            <div className="text-sm text-gray-600">Current Year</div>
                        </div>
                    </div>
                )}

                {/* Calendar View */}
                {activeView === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                            <FullCalendar {...calendarOptions} />
                        </div>
                    </div>
                )}

                {/* List View */}
                {activeView === 'list' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Leaves for {currentYear} - {departmentName} Department
                                </h2>
                                {totalPages > 1 && (
                                    <div className="text-sm text-gray-600">
                                        Showing {startIndex + 1}-{Math.min(startIndex + monthsPerPage, monthEntries.length)} of {monthEntries.length} months
                                    </div>
                                )}
                            </div>
                            
                            {monthEntries.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-lg">No leaves found for the selected filters.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
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
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            
                                            <div className="flex space-x-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {isModalOpen && selectedEvent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800">Leave Request Details</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                        <p className="text-gray-900">{selectedEvent.extendedProps.employee_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                        <p className="text-gray-900">
                                            {selectedEvent.extendedProps.leave_type_code} - {selectedEvent.extendedProps.leave_type}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <p className="text-gray-900">{new Date(selectedEvent.extendedProps.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <p className="text-gray-900">{new Date(selectedEvent.extendedProps.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                                        <p className="text-gray-900">{selectedEvent.extendedProps.total_days} day(s)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                        <p className="text-gray-900">
                                            {selectedEvent.extendedProps.total_days > 1 
                                                ? `${selectedEvent.extendedProps.total_days} days` 
                                                : '1 day'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {selectedEvent.extendedProps.reason || 'No reason provided'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Approval Chain</label>
                                    <div className="space-y-2">
                                        {selectedEvent.extendedProps.approvals && selectedEvent.extendedProps.approvals.map((approval, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900 capitalize">{approval.role}</p>
                                                    <p className="text-sm text-gray-600">{approval.approver_name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        approval.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {approval.status}
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

                            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DeptHeadLayout>
    );
}