import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

export default function Dashboard({
    initialLeaveRequests = [],
    departmentName,
}) {
    const [leaveRequests, setLeaveRequests] = useState(
        () => initialLeaveRequests || []
    );
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectRemarks, setRejectRemarks] = useState("");
    const [isPolling, setIsPolling] = useState(false);
    const { post } = useForm();
    const pollingIntervalRef = useRef(null);
    const isMountedRef = useRef(true);
    const isInitialLoadRef = useRef(true); // Add this flag
    const knownRequestIds = useRef(
        new Set(initialLeaveRequests.map((r) => r.id))
    );

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
                const response = await fetch("/admin/updated-requests");

                if (!response.ok)
                    throw new Error("Network response was not ok");

                const { newRequests } = await response.json();

                if (!isMountedRef.current || !Array.isArray(newRequests))
                    return;

                if (newRequests.length > 0) {
                    setLeaveRequests((prev) => {
                        const existingIds = new Set(prev.map((r) => r.id));
                        const filteredNewRequests = newRequests.filter(
                            (r) => !existingIds.has(r.id)
                        );

                        // Find truly new requests that we haven't seen before
                        const trulyNewRequests = filteredNewRequests.filter(
                            (r) => !knownRequestIds.current.has(r.id)
                        );

                        // Add new IDs to our known set
                        trulyNewRequests.forEach((r) =>
                            knownRequestIds.current.add(r.id)
                        );

                        // Only show notification during polling (not initial load) for new requests
                        if (
                            !isInitialLoadRef.current &&
                            pollingIntervalRef.current &&
                            trulyNewRequests.length > 0
                        ) {
                            const latestRequest = trulyNewRequests[0];
                            Swal.fire({
                                toast: true,
                                position: "top-end",
                                icon: "info",
                                title: `New request from ${latestRequest.employee.firstname} ${latestRequest.employee.lastname}`,
                                showConfirmButton: false,
                                timer: 5000,
                            });
                        }

                        return [...filteredNewRequests, ...prev];
                    });
                }
            } catch (error) {
                console.error("Polling error:", error);
            } finally {
                if (isMountedRef.current) {
                    setIsPolling(false);
                    isInitialLoadRef.current = false; // Mark initial load as complete
                }
            }
        };

        // Initial fetch - won't show notifications
        fetchUpdatedRequests();

        // Set up polling interval
        pollingIntervalRef.current = setInterval(fetchUpdatedRequests, 5000);

        return () => {
            clearInterval(pollingIntervalRef.current);
        };
    }, []);

    const handleApprove = (id) => {
        Swal.fire({
            title: "Approve this leave request?",
            text: "This will move the request to the next approval stage",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, approve",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                post(`/admin/leave-requests/${id}/approve`, {
                    onSuccess: () => {
                        setLeaveRequests((prev) =>
                            prev.filter((r) => r.id !== id)
                        );
                        Swal.fire(
                            "Approved!",
                            "The leave request has been approved.",
                            "success"
                        );
                    },
                    onError: () => {
                        Swal.fire(
                            "Error",
                            "There was a problem approving the request",
                            "error"
                        );
                    },
                });
            }
        });
    };

    const handleReject = (id) => {
        if (!rejectRemarks.trim()) {
            Swal.fire("Error", "Please enter rejection remarks", "error");
            return;
        }

        post(`/admin/leave-requests/${id}/reject`, {
            remarks: rejectRemarks,
            onSuccess: () => {
                setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
                setRejectingId(null);
                setRejectRemarks("");
                Swal.fire(
                    "Rejected!",
                    "The leave request has been rejected.",
                    "success"
                );
            },
            onError: () => {
                Swal.fire(
                    "Error",
                    "There was a problem rejecting the request",
                    "error"
                );
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold">
                                    {departmentName} - Pending Leave Approvals
                                </h1>
                                {isPolling && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <svg
                                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    </span>
                                )}
                            </div>

                            {leaveRequests.length === 0 ? (
                                <p className="text-gray-500">
                                    No pending leave requests requiring your
                                    approval.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Employee
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Leave Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Dates
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    HR Approval
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Dept Head Approval
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {leaveRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {
                                                                request.employee
                                                                    .firstname
                                                            }{" "}
                                                            {
                                                                request.employee
                                                                    .lastname
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                request.employee
                                                                    .department
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.leaveType}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.date_from} to{" "}
                                                        {request.date_to}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.hr_approval ? (
                                                            <div className="flex flex-col">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                                                    Approved by
                                                                    HR
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(
                                                                        request.hr_approval.approved_at
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                Pending HR
                                                                Approval
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {request.dept_head_approval ? (
                                                            <div className="flex flex-col">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">
                                                                    Approved by
                                                                    Dept Head
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(
                                                                        request.dept_head_approval.approved_at
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                Pending Dept
                                                                Head
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {rejectingId ===
                                                        request.id ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={
                                                                        rejectRemarks
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setRejectRemarks(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="w-full border rounded p-2 text-sm"
                                                                    placeholder="Enter rejection reason (required)"
                                                                    rows={3}
                                                                    required
                                                                />
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleReject(
                                                                                request.id
                                                                            )
                                                                        }
                                                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                                    >
                                                                        Confirm
                                                                        Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            setRejectingId(
                                                                                null
                                                                            )
                                                                        }
                                                                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            request.id
                                                                        )
                                                                    }
                                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setRejectingId(
                                                                            request.id
                                                                        )
                                                                    }
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
        </AdminLayout>
    );
}
