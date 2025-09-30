import DeptHeadLayout from '@/Layouts/DeptHeadLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard({ 
    initialLeaveRequests = [], 
    departmentName, 
    stats,
    chartData,
    selectedYear,
    availableYears
}) {
    const [leaveRequests, setLeaveRequests] = useState(() => initialLeaveRequests || []);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [isPolling, setIsPolling] = useState(false);
    const [currentChartData, setCurrentChartData] = useState(chartData);
    const [currentYear, setCurrentYear] = useState(selectedYear);
    const { post } = useForm();
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);
    const isInitialLoadRef = useRef(true);
    const knownRequestIds = useRef(new Set(initialLeaveRequests.map(r => r.id)));

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearInterval(pollingIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchUpdatedRequests = async () => {
            if (!isMountedRef.current) return;

            try {
                setIsPolling(true);
                const response = await fetch('/dept-head/updated-requests');

                if (!response.ok) throw new Error('Network response was not ok');

                const { newRequests } = await response.json();

                if (!isMountedRef.current || !Array.isArray(newRequests)) return;

                if (newRequests.length > 0) {
                    setLeaveRequests(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const filteredNewRequests = newRequests.filter(r => !existingIds.has(r.id));

                        const trulyNewRequests = filteredNewRequests.filter(
                            r => !knownRequestIds.current.has(r.id)
                        );

                        trulyNewRequests.forEach(r => knownRequestIds.current.add(r.id));

                        if (!isInitialLoadRef.current && pollingIntervalRef.current && trulyNewRequests.length > 0) {
                            const latestRequest = trulyNewRequests[0];
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'info',
                                title: `New request from ${latestRequest.employee.firstname} ${latestRequest.employee.lastname}`,
                                showConfirmButton: false,
                                timer: 5000
                            });
                        }

                        return [...filteredNewRequests, ...prev];
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
            } finally {
                if (isMountedRef.current) {
                    setIsPolling(false);
                    isInitialLoadRef.current = false;
                }
            }
        };

        fetchUpdatedRequests();
        pollingIntervalRef.current = setInterval(fetchUpdatedRequests, 5000);

        return () => {
            clearInterval(pollingIntervalRef.current);
        };
    }, []);

    // Fetch chart data when year changes
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await fetch(`/dept-head/chart-data?year=${currentYear}`);
                const data = await response.json();
                setCurrentChartData(data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        fetchChartData();
    }, [currentYear]);

    const handleYearChange = (year) => {
        setCurrentYear(year);
        // Update URL without page reload
        router.get(`/dept-head/dashboard?year=${year}`, {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (id) => {
        Swal.fire({
            title: 'Approve this leave request?',
            text: 'This will move the request to the next approval stage',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                post(`/dept-head/leave-requests/${id}/approve`, {
                    onSuccess: () => {
                        setLeaveRequests(prev => prev.filter(r => r.id !== id));
                        Swal.fire('Approved!', 'The leave request has been approved.', 'success');
                    },
                    onError: () => {
                        Swal.fire('Error', 'There was a problem approving the request', 'error');
                    }
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire('Error', 'Please enter rejection remarks', 'error');
            return;
        }

        post(`/dept-head/leave-requests/${id}/reject`, {
            remarks: rejectRemarks,
            onSuccess: () => {
                setLeaveRequests(prev => prev.filter(r => r.id !== id));
                setRejectingId(null);
                setRejectRemarks('');
                Swal.fire('Rejected!', 'The leave request has been rejected.', 'success');
            },
            onError: () => {
                Swal.fire('Error', 'There was a problem rejecting the request', 'error');
            }
        });
    };

    // Custom tooltip for pie chart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-medium">{`${data.name}`}</p>
                    <p className="text-sm text-gray-600">{`Leaves: ${data.value}`}</p>
                    <p className="text-sm text-gray-600">{`Percentage: ${((data.payload.percent || 0) * 100).toFixed(1)}%`}</p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for bar chart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                    <p className="font-medium">{`${label}`}</p>
                    <p className="text-sm text-blue-600">{`Leaves: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <DeptHeadLayout>
            <Head title="Department Head Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Year Filter */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Department Head Dashboard</h1>
                            <p className="text-sm text-gray-600 mt-1">{departmentName}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
                                Filter by Year:
                            </label>
                            <select
                                id="year-select"
                                value={currentYear}
                                onChange={(e) => handleYearChange(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Total Employees Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Total Employees
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.totalEmployees}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approved Leave Requests Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Approved Leaves
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.approvedLeaveRequests}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rejected Leave Requests Card */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Rejected Leaves
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.rejectedLeaveRequests}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Leave Usage by Type - Pie Chart */}
                        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Leave Usage by Type ({currentYear})
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={currentChartData.leaveTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => 
                                                `${name} (${(percent * 100).toFixed(0)}%)`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {currentChartData.leaveTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Leaves by Month - Bar Chart */}
                        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Leaves by Month ({currentYear})
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentChartData.monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Legend />
                                        <Bar dataKey="leaves" name="Number of Leaves" fill="#0088FE" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Pending Leave Requests Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">
                                    Pending Leave Approvals
                                </h2>
                                {isPolling && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Live Updates
                                    </span>
                                )}
                            </div>

                            {leaveRequests.length === 0 ? (
                                <p className="text-gray-500">No pending leave requests requiring your approval.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR Approval</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {leaveRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {request.employee.firstname} {request.employee.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.employee.department}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.leaveType}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.date_from} to {request.date_to}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.hr_approval ? (
                                                            <div className="flex flex-col">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                                                    Approved by HR
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(request.hr_approval.approved_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                Pending HR Approval
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {rejectingId === request.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={rejectRemarks}
                                                                    onChange={(e) => setRejectRemarks(e.target.value)}
                                                                    className="w-full border rounded p-2 text-sm"
                                                                    placeholder="Enter rejection reason (required)"
                                                                    rows={3}
                                                                    required
                                                                />
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => handleReject(request.id)}
                                                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                    >
                                                                        Confirm Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRejectingId(null)}
                                                                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleApprove(request.id)}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectingId(request.id)}
                                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DeptHeadLayout>
    );
}