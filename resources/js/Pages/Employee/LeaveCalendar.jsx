// resources/js/Pages/Employee/LeaveCalendar.jsx
import EmployeeLayout from '@/Layouts/EmployeeLayout';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function LeaveCalendar({ events }) {
    const { flash } = usePage().props;
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const calendarOptions = {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        initialView: 'dayGridMonth',
        events: events,
        eventClick: handleEventClick,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,listWeek'
        },
        height: 'auto',
        eventDisplay: 'block',
        nextDayThreshold: '00:00:00',
        displayEventTime: false,
        eventOverlap: false,
        eventOrder: "start,-duration,allDay",
        dayMaxEvents: true,
        moreLinkClick: 'popover',
        // Enhanced styling for calendar with status-based colors
        eventDidMount: function(info) {
            const event = info.event;
            const status = event.extendedProps.status;
            
            // Color coding based on status
            let bgColor, borderColor, textColor;
            switch(status?.toLowerCase()) {
                case 'approved':
                    bgColor = '#10B981'; // Green
                    borderColor = '#059669';
                    textColor = '#FFFFFF';
                    break;
                case 'pending':
                case 'pending_admin':
                case 'pending_dept_head':
                case 'pending_hr':
                    bgColor = '#F59E0B'; // Orange
                    borderColor = '#D97706';
                    textColor = '#FFFFFF';
                    break;
                case 'rejected':
                    bgColor = '#EF4444'; // Red
                    borderColor = '#DC2626';
                    textColor = '#FFFFFF';
                    break;
                default:
                    bgColor = '#6B7280'; // Gray
                    borderColor = '#4B5563';
                    textColor = '#FFFFFF';
            }
            
            info.el.style.backgroundColor = bgColor;
            info.el.style.borderColor = borderColor;
            info.el.style.color = textColor;
            info.el.style.borderRadius = '6px';
            info.el.style.fontWeight = '500';
            info.el.style.fontSize = '0.875rem';
            info.el.style.padding = '2px 6px';
            info.el.style.borderWidth = '1px';
            info.el.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        },
        // Custom calendar styling
        dayCellClassNames: 'hover:bg-gray-50 transition-colors',
        dayHeaderClassNames: 'bg-gray-50 font-semibold text-gray-700',
        todayClassNames: 'bg-blue-50',
        buttonClassNames: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200',
        titleClassNames: 'text-xl font-bold text-gray-900',
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Leave Calendar</h1>
                                <p className="text-gray-600 text-lg">View all your leave requests with status colors</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                        <span>Approved Leaves</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                        <span>Pending Leaves</span>
                                    </div>
                                    <div className="flex items-center">
                                        
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success Message */}
                    {flash?.success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 flex items-center shadow-sm">
                            <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{flash.success}</span>
                        </div>
                    )}

                    {/* Calendar Container */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="p-8">
                            <FullCalendar {...calendarOptions} />
                        </div>
                    </div>
                </div>

                {/* Event Details Modal */}
                {isModalOpen && selectedEvent && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-8 py-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Request Details</h2>
                                        <div className="flex items-center space-x-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                selectedEvent.extendedProps.status === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedEvent.extendedProps.status === 'pending' || 
                                                      selectedEvent.extendedProps.status === 'pending_admin' ||
                                                      selectedEvent.extendedProps.status === 'pending_dept_head' ||
                                                      selectedEvent.extendedProps.status === 'pending_hr'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedEvent.extendedProps.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-gray-600">
                                                {selectedEvent.extendedProps.leave_type_code} - {selectedEvent.extendedProps.leave_type}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 space-y-6">
                                {/* Key Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-700">Start Date</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {new Date(selectedEvent.extendedProps.start_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-700">End Date</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {new Date(selectedEvent.extendedProps.end_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center mb-2">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-medium text-gray-700">Duration</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {selectedEvent.extendedProps.total_days} day{selectedEvent.extendedProps.total_days > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Reason Section */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Reason for Leave</label>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="text-gray-900 leading-relaxed">
                                            {selectedEvent.extendedProps.reason || 'No reason provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Approval Chain Section */}
                                {selectedEvent.extendedProps.approvals && selectedEvent.extendedProps.approvals.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Approval Status</label>
                                        <div className="space-y-3">
                                            {selectedEvent.extendedProps.approvals.map((approval, index) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                approval.status === 'approved'
                                                                    ? 'bg-green-100 text-green-600'
                                                                    : approval.status === 'rejected'
                                                                    ? 'bg-red-100 text-red-600'
                                                                    : 'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    {approval.status === 'approved' ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    ) : approval.status === 'rejected' ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    ) : (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 capitalize">{approval.role}</p>
                                                                <p className="text-sm text-gray-600">{approval.approver_name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                                approval.status === 'approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : approval.status === 'rejected'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {approval.status.toUpperCase()}
                                                            </span>
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                {approval.approved_at 
                                                                    ? new Date(approval.approved_at).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : 'Pending'
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {approval.remarks && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-medium">Remarks:</span> {approval.remarks}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
                                <div className="flex justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 font-medium shadow-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}