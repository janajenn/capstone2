<?php

namespace App\Http\Controllers\DeptHead;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveRequest;
use App\Models\LeaveRecall;
use App\Services\NotificationService;
use App\Models\Employee;
use Carbon\Carbon;
use App\Models\LeaveApproval;
use App\Models\LeaveType;
use App\Models\LeaveRequestDetail;
use App\Models\LeaveCredit;
use App\Models\LeaveBalance;


class DeptHeadController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Get department ID with null check
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return Inertia::render('DeptHead/Dashboard', [
                'leaveRequests' => [],
                'departmentName' => 'No Department Assigned',
                'stats' => [
                    'totalEmployees' => 0,
                    'approvedLeaveRequests' => 0,
                    'rejectedLeaveRequests' => 0
                ]
            ]);
        }

        // Calculate statistics
        $stats = $this->getDepartmentStats($departmentId);

        // Minimal data for dashboard since content moved to leave request page
        $recentRequests = LeaveRequest::with([
            'employee.user', 
            'leaveType:id,name',
        ])
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get()
        ->map(function ($request) {
            return [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $request->status,
                'employee' => $request->employee ? [
                    'firstname' => $request->employee->firstname,
                    'lastname' => $request->employee->lastname,
                ] : null,
                'leaveType' => $request->leaveType ? [
                    'name' => $request->leaveType->name
                ] : null
            ];
        });

        return Inertia::render('DeptHead/Dashboard', [
            'recentRequests' => $recentRequests,
            'departmentName' => $user->employee->department->name ?? 'Department',
            'stats' => $stats
        ]);
    }

    public function getUpdatedRequests(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return response()->json([
            'recentRequests' => [],
            'stats' => [
                'totalEmployees' => 0,
                'approvedLeaveRequests' => 0,
                'rejectedLeaveRequests' => 0,
            ]
        ]);
    }

    // Get stats
    $stats = $this->getDepartmentStats($departmentId);

    // Get recent requests
    $recentRequests = LeaveRequest::with([
            'employee.user',
            'leaveType:id,name',
        ])
        ->whereHas('employee', function ($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get()
        ->map(function ($request) {
            return [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $request->status,
                'employee' => $request->employee ? [
                    'firstname' => $request->employee->firstname,
                    'lastname' => $request->employee->lastname,
                ] : null,
                'leaveType' => $request->leaveType ? [
                    'name' => $request->leaveType->name,
                ] : null,
            ];
        });

    return response()->json([
        'recentRequests' => $recentRequests,
        'stats' => $stats,
    ]);
}

    /**
     * Calculate department statistics
     */
    private function getDepartmentStats($departmentId)
    {
        // Total Employees under the Dept Head's Department
        $totalEmployees = Employee::where('department_id', $departmentId)->count();

        // Total Approved Leave Requests (final approval by Admin)
        $approvedLeaveRequests = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->whereHas('approvals', function($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->count();

        // Total Rejected Leave Requests
        $rejectedLeaveRequests = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->where('status', 'rejected')
        ->count();

        return [
            'totalEmployees' => $totalEmployees,
            'approvedLeaveRequests' => $approvedLeaveRequests,
            'rejectedLeaveRequests' => $rejectedLeaveRequests
        ];
    }

    public function leaveRequests(Request $request)
    {
        $user = $request->user();
        
        // Get department ID with null check
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return Inertia::render('DeptHead/LeaveRequests', [
                'leaveRequests' => [],
                'departmentName' => 'No Department Assigned',
                'filters' => $request->only(['status'])
            ]);
        }

        // Get leave requests for employees in the department
        $query = LeaveRequest::with([
                'employee.user', 
                'leaveType:id,name,code',
                'approvals' => function($query) {
                    $query->with('approver');
                }
            ])
            ->whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            switch ($request->status) {
                case 'pending':
                    $query->where('status', 'pending')
                        ->whereDoesntHave('approvals', function($q) {
                            $q->where('role', 'dept_head');
                        });
                    break;
                    
                case 'approved_by_dept_head':
                    $query->whereHas('approvals', function($q) {
                        $q->where('role', 'dept_head')->where('status', 'approved');
                    })->where('status', 'pending'); // Still pending overall
                    break;
                    
                case 'fully_approved':
                    $query->where('status', 'approved')
                        ->whereHas('approvals', function($q) {
                            $q->where('role', 'admin')->where('status', 'approved');
                        });
                    break;
                    
                case 'rejected':
                    $query->where('status', 'rejected');
                    break;
            }
        }

        $leaveRequests = $query->get()
            ->map(function ($leaveRequest) {
                $deptHeadApproval = $leaveRequest->approvals->firstWhere('role', 'dept_head');
                $adminApproval = $leaveRequest->approvals->firstWhere('role', 'admin');
                
                return [
                    'id' => $leaveRequest->id,
                    'employee_name' => $leaveRequest->employee->firstname . ' ' . $leaveRequest->employee->lastname,
                    'employee_id' => $leaveRequest->employee->employee_id,
                    'position' => $leaveRequest->employee->position,
                    'leave_type' => $leaveRequest->leaveType->name,
                    'leave_type_code' => $leaveRequest->leaveType->code,
                    'date_from' => $leaveRequest->date_from,
                    'date_to' => $leaveRequest->date_to,
                    'reason' => $leaveRequest->reason,
                    'status' => $leaveRequest->status,
                    'created_at' => $leaveRequest->created_at,
                    'dept_head_approval' => $deptHeadApproval ? [
                        'status' => $deptHeadApproval->status,
                        'remarks' => $deptHeadApproval->remarks,
                        'approved_at' => $deptHeadApproval->approved_at,
                        'approver_name' => $deptHeadApproval->approver->name ?? 'Unknown'
                    ] : null,
                    'admin_approval' => $adminApproval ? [
                        'status' => $adminApproval->status,
                        'remarks' => $adminApproval->remarks,
                        'approved_at' => $adminApproval->approved_at,
                        'approver_name' => $adminApproval->approver->name ?? 'Unknown'
                    ] : null,
                    'total_days' => Carbon::parse($leaveRequest->date_from)->diffInDays(Carbon::parse($leaveRequest->date_to)) + 1
                ];
            });

        return Inertia::render('DeptHead/LeaveRequests', [
            'leaveRequests' => $leaveRequests,
            'departmentName' => $user->employee->department->name ?? 'Department',
            'filters' => $request->only(['status'])
        ]);
    }

    /**
     * Approve a leave request
     */
    public function approveLeaveRequest(Request $request, $id)
    {
        $user = $request->user();
        
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

        // Check if already processed by dept head
        $existingApproval = LeaveApproval::where('leave_id', $id)
            ->where('role', 'dept_head')
            ->first();

        if ($existingApproval) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        // Create approval record
        LeaveApproval::create([
            'leave_id' => $leaveRequest->id,
            'approved_by' => $user->id,
            'role' => 'dept_head',
            'status' => 'approved',
            'remarks' => $request->remarks,
            'approved_at' => now(),
        ]);

        // Send notification to employee - STATUS ALREADY CORRECT
        $notificationService = new NotificationService();
        $notificationService->createLeaveRequestNotification(
            $leaveRequest->employee_id,
            'dept_head_approved', // Correct status for Dept Head approval
            $id,
            $leaveRequest->leaveType->name ?? 'Leave',
            $leaveRequest->date_from,
            $leaveRequest->date_to,
            $request->remarks
        );

        return redirect()->back()->with('success', 'Leave request approved successfully.');
    }

    /**
     * Reject a leave request
     */
    public function rejectLeaveRequest(Request $request, $id)
    {
        $user = $request->user();
        
        $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

        // Check if already processed by dept head
        $existingApproval = LeaveApproval::where('leave_id', $id)
            ->where('role', 'dept_head')
            ->first();

        if ($existingApproval) {
            return redirect()->back()->with('error', 'This request has already been processed.');
        }

        // Create approval record
        LeaveApproval::create([
            'leave_id' => $leaveRequest->id,
            'approved_by' => $user->id,
            'role' => 'dept_head',
            'status' => 'rejected',
            'remarks' => $request->remarks,
            'approved_at' => now(),
        ]);

        // Update leave request status to rejected
        $leaveRequest->update(['status' => 'rejected']);

        // Send notification to employee - UPDATED STATUS
        $notificationService = new NotificationService();
        $notificationService->createLeaveRequestNotification(
            $leaveRequest->employee_id,
            'dept_head_rejected', // Changed from 'rejected' to 'dept_head_rejected'
            $id,
            $leaveRequest->leaveType->name ?? 'Leave',
            $leaveRequest->date_from,
            $leaveRequest->date_to,
            $request->remarks
        );

        return redirect()->back()->with('success', 'Leave request rejected successfully.');
    }

    /**
     * Show leave request details
     */
    public function showLeaveRequest($id)
    {
        $leaveRequest = LeaveRequest::with([
                'leaveType',
                'employee.department',
                'details',
                'approvals.approver'
            ])
            ->findOrFail($id);

        // Calculate working days (excluding weekends)
        $startDate = new \DateTime($leaveRequest->date_from);
        $endDate = new \DateTime($leaveRequest->date_to);
        $workingDays = 0;

        for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
            $dayOfWeek = $date->format('N');
            if ($dayOfWeek < 6) { // Monday to Friday
                $workingDays++;
            }
        }

        // Get leave balance information if available
        $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

        return Inertia::render('DeptHead/ShowLeaveRequest', [
            'leaveRequest' => $leaveRequest,
            'workingDays' => $workingDays,
            'leaveCredit' => $leaveCredit,
        ]);
    }

    // LEAVE RECALL REQUESTS MANAGEMENT
    
    /**
     * Display a listing of recall requests for the department
     */
    public function recallRequests(Request $request)
    {
        $user = $request->user();
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return Inertia::render('DeptHead/RecallRequests', [
                'recallRequests' => [],
                'departmentName' => 'No Department Assigned'
            ]);
        }

        $recallRequests = LeaveRecall::with([
            'leaveRequest.leaveType',
            'employee.department'
        ])
        ->where('status', 'pending')
        ->whereNull('approved_by_depthead')
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->orderBy('created_at', 'desc')
        ->get();

        return Inertia::render('DeptHead/RecallRequests', [
            'recallRequests' => $recallRequests,
            'departmentName' => $user->employee->department->name ?? 'Department'
        ]);
    }

    /**
     * Approve a recall request
     */
    public function approveRecallRequest(Request $request, $id)
    {
        $request->validate([
            'remarks' => 'nullable|string|max:500'
        ]);

        try {
            $user = $request->user();
            $recallRequest = LeaveRecall::findOrFail($id);
            
            // Check if already processed
            if ($recallRequest->status !== 'pending') {
                return back()->with('error', 'This recall request has already been processed.');
            }

            // Check if user is dept head of the employee's department
            $employeeDepartmentId = $recallRequest->employee->department_id;
            $userDepartmentId = $user->employee->department_id;
            
            if ($employeeDepartmentId !== $userDepartmentId) {
                return back()->with('error', 'You are not authorized to approve this recall request.');
            }

            // Update recall request
            $recallRequest->update([
                'approved_by_depthead' => $user->id
            ]);

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createLeaveRecallNotification(
                $recallRequest->employee_id,
                'dept_head_approved',
                $recallRequest->id,
                $recallRequest->leaveRequest->leaveType->name ?? 'Leave',
                $recallRequest->new_leave_date_from,
                $recallRequest->new_leave_date_to
            );

            return redirect()->route('dept_head.recall-requests')->with('success', 'Recall request approved successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reject a recall request
     */
    public function rejectRecallRequest(Request $request, $id)
    {
        $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        try {
            $user = $request->user();
            $recallRequest = LeaveRecall::findOrFail($id);
            
            // Check if already processed
            if ($recallRequest->status !== 'pending') {
                return back()->with('error', 'This recall request has already been processed.');
            }

            // Check if user is dept head of the employee's department
            $employeeDepartmentId = $recallRequest->employee->department_id;
            $userDepartmentId = $user->employee->department_id;
            
            if ($employeeDepartmentId !== $userDepartmentId) {
                return back()->with('error', 'You are not authorized to reject this recall request.');
            }

            // Update recall request
            $recallRequest->update([
                'status' => 'rejected',
                'approved_by_depthead' => $user->id
            ]);

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createLeaveRecallNotification(
                $recallRequest->employee_id,
                'rejected',
                $recallRequest->id,
                $recallRequest->leaveRequest->leaveType->name ?? 'Leave',
                $recallRequest->new_leave_date_from,
                $recallRequest->new_leave_date_to,
                $request->remarks
            );

            return redirect()->route('dept_head.recall-requests')->with('success', 'Recall request rejected successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function employees(Request $request)
    {
        $user = $request->user();
        
        // Get department ID with null check
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return Inertia::render('DeptHead/Employees', [
                'employees' => [],
                'departmentName' => 'No Department Assigned'
            ]);
        }

        // Get employees in the department
        $employees = Employee::with(['user', 'department'])
            ->where('department_id', $departmentId)
            ->orderBy('firstname')
            ->get()
            ->map(function ($employee) {
                return [
                    'employee_id' => $employee->employee_id,
                    'firstname' => $employee->firstname,
                    'middlename' => $employee->middlename,
                    'lastname' => $employee->lastname,
                    'position' => $employee->position,
                    'status' => $employee->status,
                    'contact_number' => $employee->contact_number,
                    'email' => $employee->user->email ?? 'N/A',
                    'department' => $employee->department ? [
                        'id' => $employee->department->id,
                        'name' => $employee->department->name,
                    ] : null,
                ];
            });

        return Inertia::render('DeptHead/Employees', [
            'employees' => $employees,
            'departmentName' => $user->employee->department->name ?? 'Department'
        ]);
    }




    public function removeFromDepartment(Request $request, $employeeId)
    {
        $user = $request->user();
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return redirect()->back()->with('error', 'You are not assigned to a department.');
        }

        // Find the employee
        $employee = Employee::where('employee_id', $employeeId)
            ->where('department_id', $departmentId)
            ->firstOrFail();

        // Remove from department by setting department_id to null
        $employee->update([
            'department_id' => null
        ]);

        return redirect()->back()->with('success', 'Employee removed from department successfully.');
    }



    // LEAVE CALENDAR
    public function leaveCalendar(Request $request)
    {
        $user = $request->user();
        
        // Get department ID with null check
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return Inertia::render('DeptHead/LeaveCalendar', [
                'events' => [],
                'departmentName' => 'No Department Assigned'
            ]);
        }

        // Get fully approved leave requests for employees in the department
        $approvedLeaveRequests = LeaveRequest::where('status', 'approved')
            ->whereHas('approvals', function ($query) {
                $query->where('role', 'admin')->where('status', 'approved');
            })
            ->whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->with(['employee', 'leaveType', 'approvals' => function ($query) {
                $query->with('approver');
            }])
            ->get()
            ->map(function ($leaveRequest) {
                return [
                    'id' => $leaveRequest->id,
                    'title' => $leaveRequest->leaveType->code . ' - ' . $leaveRequest->employee->firstname,
                    'start' => $leaveRequest->date_from, // Only the start date
                    'allDay' => true,
                    'backgroundColor' => $this->getLeaveTypeColor($leaveRequest->leaveType->code),
                    'borderColor' => $this->getLeaveTypeColor($leaveRequest->leaveType->code),
                    'extendedProps' => [
                        'employee_name' => $leaveRequest->employee->firstname . ' ' . $leaveRequest->employee->lastname,
                        'leave_type' => $leaveRequest->leaveType->name,
                        'leave_type_code' => $leaveRequest->leaveType->code,
                        'start_date' => $leaveRequest->date_from,
                        'end_date' => $leaveRequest->date_to,
                        'total_days' => Carbon::parse($leaveRequest->date_from)->diffInDays(Carbon::parse($leaveRequest->date_to)) + 1,
                        'reason' => $leaveRequest->reason,
                        'approvals' => $leaveRequest->approvals->map(function ($approval) {
                            return [
                                'role' => $approval->role,
                                'status' => $approval->status,
                                'approver_name' => $approval->approver->name ?? 'Unknown',
                                'approved_at' => $approval->approved_at,
                                'remarks' => $approval->remarks
                            ];
                        })
                    ]
                ];
            });

        return Inertia::render('DeptHead/LeaveCalendar', [
            'events' => $approvedLeaveRequests,
            'departmentName' => $user->employee->department->name ?? 'Department'
        ]);
    }

    /**
     * Helper method to assign colors based on leave type
     */
    private function getLeaveTypeColor($leaveTypeCode)
    {
        $colors = [
            'VL'    => '#3B82F6', // Vacation Leave - Blue
            'SL'    => '#EF4444', // Sick Leave - Red
            'ML'    => '#EC4899', // Maternity Leave - Pink
            'PL'    => '#10B981', // Paternity Leave - Green
            'FL'    => '#6B7280', // Forced Leave - Gray
            'SPL'   => '#F97316', // Special Privilege Leave - Orange
            'SOLOPL'=> '#14B8A6', // Solo Parent Leave - Teal
            'STL'   => '#F59E0B', // Study Leave - Amber
            '10DVL' => '#8B5CF6', // 10-Day VAWC Leave - Purple
            'RP'    => '#4B5563', // Rehabilitation Privilege - Dark Gray
            'SLBW'  => '#D946EF', // Special Leave Benefits for Women - Violet
            'SE'    => '#06B6D4', // Special Emergency Leave - Cyan
            'AL'    => '#84CC16', // Adoption Leave - Lime Green
        ];

        // Default color if not in list
        return $colors[$leaveTypeCode] ?? '#9CA3AF';
    }
}







