<?php

namespace App\Http\Controllers\DeptHead;
use Illuminate\Support\Facades\DB;
use App\Models\User;
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
                ],
                'chartData' => [
                    'leaveTypeData' => [],
                    'monthlyData' => []
                ],
                'selectedYear' => date('Y'),
                'availableYears' => []
            ]);
        }

        // Calculate statistics
        $stats = $this->getDepartmentStats($departmentId);

        // Get chart data
        $selectedYear = $request->get('year', date('Y'));
        $chartData = $this->getChartData($departmentId, $selectedYear);
        $availableYears = $this->getAvailableYears($departmentId);

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
            'stats' => $stats,
            'chartData' => $chartData,
            'selectedYear' => (int)$selectedYear,
            'availableYears' => $availableYears
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
     * Get chart data for dashboard
     */
    private function getChartData($departmentId, $year)
    {
        // Leave Usage by Type - Count approved leave requests by type
        $leaveTypeData = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('status', 'approved')
            ->whereYear('date_from', $year)
            ->with('leaveType')
            ->get()
            ->groupBy('leaveType.name')
            ->map(function ($requests, $type) {
                return [
                    'name' => $type,
                    'value' => $requests->count(),
                    'count' => $requests->count()
                ];
            })
            ->values()
            ->toArray();

        // Leaves by Month - Count approved leave requests by month
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthCount = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
                    $query->where('department_id', $departmentId);
                })
                ->where('status', 'approved')
                ->whereYear('date_from', $year)
                ->whereMonth('date_from', $month)
                ->count();
                
            $monthlyData[] = [
                'month' => Carbon::create()->month($month)->format('M'),
                'leaves' => $monthCount,
                'fullMonth' => Carbon::create()->month($month)->format('F')
            ];
        }

        return [
            'leaveTypeData' => $leaveTypeData,
            'monthlyData' => $monthlyData,
        ];
    }

    /**
     * Get available years for filtering
     */
    private function getAvailableYears($departmentId)
    {
        $years = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('status', 'approved')
            ->selectRaw('YEAR(date_from) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->filter()
            ->toArray();

        // If no years found, return current year
        if (empty($years)) {
            return [date('Y')];
        }

        return $years;
    }

    /**
     * API endpoint for chart data by year
     */
    public function getChartDataByYear(Request $request)
    {
        $user = $request->user();
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return response()->json([
                'leaveTypeData' => [],
                'monthlyData' => []
            ]);
        }

        $year = $request->get('year', date('Y'));
        $chartData = $this->getChartData($departmentId, $year);

        return response()->json($chartData);
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
        $departmentId = $user->employee->department_id ?? null;
    
        if (!$departmentId) {
            return Inertia::render('DeptHead/LeaveRequests', [
                'leaveRequests' => ['data' => [], 'links' => []],
                'departmentName' => 'No Department Assigned',
                'filters' => $request->only(['status', 'search'])
            ]);
        }
    
        $currentDeptHeadEmployeeId = $user->employee_id;
    
        $query = LeaveRequest::with([
                'employee.user', 
                'leaveType:id,name,code',
                'approvals' => function($query) {
                    $query->with('approver');
                }
            ])
            ->whereHas('employee', function($query) use ($departmentId, $currentDeptHeadEmployeeId) {
                $query->where('department_id', $departmentId)
                      ->where('employee_id', '!=', $currentDeptHeadEmployeeId);
            })
            ->orderBy('created_at', 'desc');
    
        // FIXED: Better status filtering logic
        if ($request->has('status') && $request->status !== 'all') {
            switch ($request->status) {
                case 'pending':
                    // Requests that need dept head approval
                    $query->where(function($q) {
                        $q->where('status', 'pending')
                          ->orWhere('status', 'pending_dept_head')
                          ->orWhere('status', 'pending_hr_to_dept');
                    })->whereDoesntHave('approvals', function($q) {
                        $q->where('role', 'dept_head');
                    });
                    break;
                    
                case 'approved_by_dept_head':
                    // Requests approved by dept head but pending other approvals
                    $query->where(function($q) {
                        $q->where('status', 'pending')
                          ->orWhere('status', 'pending_admin')
                          ->orWhere('status', 'pending_hr');
                    })->whereHas('approvals', function($q) {
                        $q->where('role', 'dept_head')->where('status', 'approved');
                    });
                    break;
                    
                case 'fully_approved':
                    // Fully approved requests
                    $query->where('status', 'approved')
                          ->whereHas('approvals', function($q) {
                              $q->where('role', 'admin')->where('status', 'approved');
                          });
                    break;
                    
                case 'rejected':
                    // Rejected requests (by anyone)
                    $query->where('status', 'rejected');
                    break;
            }
        }
    
        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->whereHas('employee', function($q) use ($searchTerm) {
                    $q->where('firstname', 'like', "%{$searchTerm}%")
                      ->orWhere('lastname', 'like', "%{$searchTerm}%")
                      ->orWhere('position', 'like', "%{$searchTerm}%");
                })
                ->orWhereHas('leaveType', function($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('code', 'like', "%{$searchTerm}%");
                })
                ->orWhere('reason', 'like', "%{$searchTerm}%");
            });
        }
    
        $leaveRequests = $query->paginate(10)
            ->through(function ($leaveRequest) {
                $deptHeadApproval = $leaveRequest->approvals->firstWhere('role', 'dept_head');
                $adminApproval = $leaveRequest->approvals->firstWhere('role', 'admin');
                $hrApproval = $leaveRequest->approvals->firstWhere('role', 'hr');
                
                // Improved status determination
                $displayStatus = 'pending';
                
                if ($leaveRequest->status === 'rejected') {
                    $displayStatus = 'rejected';
                } elseif ($adminApproval && $adminApproval->status === 'approved') {
                    $displayStatus = 'fully_approved';
                } elseif ($deptHeadApproval && $deptHeadApproval->status === 'approved') {
                    $displayStatus = 'approved_by_dept_head';
                }
                // Otherwise, it remains 'pending'
                
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
                    'status' => $leaveRequest->status, // actual database status
                    'display_status' => $displayStatus, // calculated display status
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
                    'hr_approval' => $hrApproval ? [
                        'status' => $hrApproval->status,
                        'remarks' => $hrApproval->remarks,
                        'approved_at' => $hrApproval->approved_at,
                        'approver_name' => $hrApproval->approver->name ?? 'Unknown'
                    ] : null,
                    'total_days' => Carbon::parse($leaveRequest->date_from)->diffInDays(Carbon::parse($leaveRequest->date_to)) + 1
                ];
            });
    
        return Inertia::render('DeptHead/LeaveRequests', [
            'leaveRequests' => $leaveRequests,
            'departmentName' => $user->employee->department->name ?? 'Department',
            'filters' => $request->only(['status', 'search'])
        ]);
    }
    /**
     * Approve a leave request
     */
    public function approveLeaveRequest(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Check if user is department head
            if ($user->role !== 'dept_head') {
                return redirect()->back()->with('error', 'Unauthorized access.');
            }
    
            DB::transaction(function () use ($request, $id, $user) {
                $leaveRequest = LeaveRequest::with(['employee', 'leaveType', 'employee.user'])->findOrFail($id);
        
                // FIXED: Check if request is in correct status for dept head approval
                $allowedStatuses = ['pending', 'pending_dept_head', 'pending_hr_to_dept'];
                if (!in_array($leaveRequest->status, $allowedStatuses)) {
                    throw new \Exception('This request is not pending department head approval. Current status: ' . $leaveRequest->status);
                }
    
                // Check if already processed by dept head
                $existingApproval = LeaveApproval::where('leave_id', $id)
                    ->where('role', 'dept_head')
                    ->first();
    
                if ($existingApproval) {
                    throw new \Exception('This request has already been processed by department head.');
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
    
                // FIXED: Update status based on the current workflow
                if ($leaveRequest->status === 'pending_hr_to_dept' || $leaveRequest->status === 'pending_dept_head') {
                    // Request came from HR, so after dept head approval it goes to admin
                    $leaveRequest->update(['status' => 'pending_admin']);
                } else {
                    // Regular flow: dept head -> HR -> admin
                    $leaveRequest->update(['status' => 'pending_hr']);
                }
    
                // FIXED: Use the centralized notification service instead of creating multiple notifications manually
                $notificationService = new NotificationService();
                
                // Notify the employee about department head approval
                $notificationService->notifyDeptHeadApproval(
                    $leaveRequest,
                    $user->id,
                    $request->remarks
                );
    
                // FIXED: Remove the manual notification creation below - it's already handled in notifyDeptHeadApproval
                // The notifyDeptHeadApproval method in NotificationService already handles:
                // 1. Notifying the employee
                // 2. Notifying the next approver (Admin for regular employees)
            });
    
            return redirect()->back()->with('success', 'Leave request approved successfully.');
    
        } catch (\Exception $e) {
            \Log::error('Department Head Approval Error: ' . $e->getMessage(), [
                'request_id' => $id,
                'user_id' => $request->user()->id,
                'trace' => $e->getTraceAsString()
            ]);
    
            return redirect()->back()->with('error', 'Failed to approve leave request: ' . $e->getMessage());
        }
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
                'employees' => [
                    'data' => [],
                    'links' => [],
                    'meta' => []
                ],
                'departmentName' => 'No Department Assigned'
            ]);
        }
    
        // Get employees in the department with pagination
        $employees = Employee::with(['user', 'department'])
            ->where('department_id', $departmentId)
            ->orderBy('firstname')
            ->paginate(10) // 10 employees per page
            ->through(function ($employee) {
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
   // In DeptHeadController.php - update leaveCalendar method to match admin/HR
public function leaveCalendar(Request $request)
{
    $user = $request->user();
    
    // Get department ID with null check
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return Inertia::render('DeptHead/LeaveCalendar', [
            'events' => [],
            'leavesByMonth' => [],
            'departmentName' => 'No Department Assigned',
            'departments' => [],
            'leaveTypes' => [],
            'filters' => $request->only(['year', 'month', 'day', 'leave_type']),
            'currentYear' => now()->year,
        ]);
    }

    // Get the current year or use the year from request - SAME AS ADMIN
    $year = $request->input('year', now()->year);
    $month = $request->input('month');
    $day = $request->input('day');

    // Define the filter period for overlapping leaves - SAME AS ADMIN
    $startDate = Carbon::createFromDate($year, $month ?: 1, $day ?: 1)->startOfDay();
    if (!$month) {
        $startDate->startOfYear();
    } elseif (!$day) {
        $startDate->startOfMonth();
    }

    $endDate = $startDate->copy()->endOfDay();
    if (!$month) {
        $endDate->endOfYear();
    } elseif (!$day) {
        $endDate->endOfMonth();
    }

    // Get fully approved leave requests for the specified period - FILTERED BY DEPARTMENT
    $query = LeaveRequest::where('status', 'approved')
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId); // DEPARTMENT FILTER
        })
        ->where('date_to', '>=', $startDate)
        ->where('date_from', '<=', $endDate)
        ->with(['employee', 'leaveType', 'approvals' => function ($query) {
            $query->with('approver');
        }]);

    // Apply additional filters if provided - SAME AS ADMIN
    if ($request->has('leave_type') && $request->leave_type) {
        $query->whereHas('leaveType', function ($q) use ($request) {
            $q->where('code', $request->leave_type);
        });
    }

    $approvedLeaveRequests = $query->get();

    // Group leaves by month for list view - SAME AS ADMIN
    $leavesByMonth = [];
    foreach ($approvedLeaveRequests as $leaveRequest) {
        $month = Carbon::parse($leaveRequest->date_from)->format('F Y');
        
        if (!isset($leavesByMonth[$month])) {
            $leavesByMonth[$month] = [];
        }

        $leavesByMonth[$month][] = [
            'id' => $leaveRequest->id,
            'employee_name' => $leaveRequest->employee->firstname . ' ' . $leaveRequest->employee->lastname,
            'leave_type' => $leaveRequest->leaveType->name,
            'leave_type_code' => $leaveRequest->leaveType->code,
            'start_date' => $leaveRequest->date_from,
            'end_date' => $leaveRequest->date_to,
            'total_days' => Carbon::parse($leaveRequest->date_from)->diffInDays(Carbon::parse($leaveRequest->date_to)) + 1,
            'reason' => $leaveRequest->reason,
            'department' => $leaveRequest->employee->department->name ?? 'No Department',
            'approvals' => $leaveRequest->approvals->map(function ($approval) {
                return [
                    'role' => $approval->role,
                    'status' => $approval->status,
                    'approver_name' => $approval->approver->name ?? 'Unknown',
                    'approved_at' => $approval->approved_at,
                    'remarks' => $approval->remarks
                ];
            })
        ];
    }

    // Sort months chronologically - SAME AS ADMIN
    uksort($leavesByMonth, function ($a, $b) {
        return strtotime($a) - strtotime($b);
    });

    // Format for calendar view - SAME AS ADMIN
    $calendarEvents = $approvedLeaveRequests->map(function ($leaveRequest) {
        return [
            'id' => $leaveRequest->id,
            'title' => $leaveRequest->leaveType->code,
            'start' => $leaveRequest->date_from,
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
                'department' => $leaveRequest->employee->department->name ?? 'No Department',
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
        'events' => $calendarEvents,
        'leavesByMonth' => $leavesByMonth,
        'departmentName' => $user->employee->department->name ?? 'Department',
        'leaveTypes' => LeaveType::all(),
        'filters' => $request->only(['year', 'month', 'day', 'leave_type']),
        'currentYear' => $year,
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


    /**
 * Update leave request status based on approvals
 */
private function updateLeaveRequestStatus($leaveRequestId)
{
    $leaveRequest = LeaveRequest::with(['approvals', 'employee.user'])->find($leaveRequestId);
    
    if (!$leaveRequest) return;
    
    $hrApproved = $leaveRequest->approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
    $deptHeadApproved = $leaveRequest->approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
    $adminApproved = $leaveRequest->approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();
    
    $isDeptHead = $leaveRequest->employee->user->role === 'dept_head';
    
    if ($adminApproved) {
        $leaveRequest->status = 'approved';
    } elseif ($deptHeadApproved && $hrApproved && !$isDeptHead) {
        $leaveRequest->status = 'pending_admin';
    } elseif ($hrApproved && $isDeptHead) {
        $leaveRequest->status = 'pending_admin';
    } elseif ($hrApproved && !$isDeptHead) {
        $leaveRequest->status = 'pending_dept_head';
    } else {
        $leaveRequest->status = 'pending';
    }
    
    $leaveRequest->save();
}


// Add this method to your DeptHeadController
public function showEmployeeLeaveCredits(Request $request, $employee_id)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return redirect()->back()->with('error', 'You are not assigned to a department.');
    }

    // Verify the employee belongs to the department head's department
    $employee = Employee::with(['department', 'user', 'leaveCredit'])
        ->where('employee_id', $employee_id)
        ->where('department_id', $departmentId)
        ->firstOrFail();

    // Get SL and VL balances from leave_credits table (earnable leaves)
    $earnableLeaveCredits = [
        [
            'type' => 'Sick Leave (SL)',
            'code' => 'SL',
            'balance' => $employee->leaveCredit->sl_balance ?? 0,
            'earnable' => true,
            'description' => 'Accumulates 1.25 days monthly'
        ],
        [
            'type' => 'Vacation Leave (VL)',
            'code' => 'VL',
            'balance' => $employee->leaveCredit->vl_balance ?? 0,
            'earnable' => true,
            'description' => 'Accumulates 1.25 days monthly'
        ]
    ];

    // Get non-earnable leave balances from leave_balances table
    $nonEarnableLeaveBalances = \App\Models\LeaveBalance::with('leaveType')
        ->where('employee_id', $employee_id)
        ->whereHas('leaveType', function($query) {
            $query->where('earnable', false);
        })
        ->get()
        ->map(function($balance) {
            return [
                'type' => $balance->leaveType->name,
                'code' => $balance->leaveType->code,
                'balance' => $balance->balance,
                'total_earned' => $balance->total_earned,
                'total_used' => $balance->total_used,
                'default_days' => $balance->leaveType->default_days,
                'earnable' => false,
                'description' => 'Fixed allocation'
            ];
        });

    return Inertia::render('DeptHead/ShowLeaveCredit', [
        'employee' => $employee,
        'earnableLeaveCredits' => $earnableLeaveCredits,
        'nonEarnableLeaveBalances' => $nonEarnableLeaveBalances,
    ]);
}
}