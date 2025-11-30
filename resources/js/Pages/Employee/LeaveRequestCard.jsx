// resources/js/Components/LeaveRequestCard.jsx
import { Link } from '@inertiajs/react';
import LeaveProgressTracker from './LeaveProgressTracker';

export default function LeaveRequestCard({ request }) {
    if (!request) return null;

    const startDate = new Date(request.date_from);
    const endDate = new Date(request.date_to);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="bg-white rounded-lg shadow p-6 col-span-3 relative">
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Latest Leave Request</h2>
                <Link
                    href="/employee/my-leave-requests"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                    View All
                </Link>
            </div>

            <div className="space-y-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                        <span className="text-blue-600">
                            {request.leave_type.code === 'VL' ? '🏖️' :
                             request.leave_type.code === 'SL' ? '🤒' :
                             request.leave_type.code === 'MAT' ? '👶' : '📋'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{request.leave_type.name}</h3>
                        <p className="text-sm text-gray-500">{request.leave_type.code}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                        <p className="text-sm text-gray-500">Date Range</p>
                        <p className="text-sm font-medium">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="text-sm font-medium">
                        {request.selected_dates_count || duration} day{(request.selected_dates_count || duration) !== 1 ? 's' : ''}
                        </p>
                    </div> */}
                    <div>
                        <p className="text-sm text-gray-500">Reason</p>
                        <p className="text-sm font-medium line-clamp-1">
                            {request.reason}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className={`text-sm font-medium ${
                            request.status === 'approved' ? 'text-green-600' :
                            request.status === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                        }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </p>
                    </div>
                </div>

                <div className="pt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Approval Progress</h4>
    <LeaveProgressTracker 
        approvals={request.approvals} 
        isDeptHead={request.is_dept_head_request}
    />
</div>
            </div>
        </div>
    );
}
