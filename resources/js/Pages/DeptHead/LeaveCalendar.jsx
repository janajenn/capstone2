import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function LeaveCalendar({ events, departmentName }) {
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

                {/* Calendar Container */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <FullCalendar {...calendarOptions} />
                    </div>
                </div>

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