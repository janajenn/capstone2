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
use App\Models\CreditConversion;
use App\Services\CreditConversionService;
use App\Models\AttendanceCorrection; // Add this import
use App\Models\LeaveRescheduleRequest;
use App\Models\LeaveBalanceLog;



class DeptHeadController extends Controller
{

    protected $creditConversionService;


    public function __construct(CreditConversionService $creditConversionService, NotificationService $notificationService)
    {
        $this->creditConversionService = $creditConversionService;
        $this->notificationService = $notificationService;
    }




    public function dashboard(Request $request)
{
    $user = $request->user();
    
    // Get department ID with null check
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return Inertia::render('DeptHead/Dashboard', [
            'initialLeaveRequests' => [],
            'departmentName' => 'No Department Assigned',
            'stats' => [
                'totalEmployees' => 0,
                'approvedLeaveRequests' => 0,
                'rejectedLeaveRequests' => 0,
                'pendingLeaveRequestsCount' => 0 // NEW
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

    // 🔔 NEW: Get pending counts instead of full list
    $pendingLeaveRequestsCount = LeaveRequest::whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId)
                  ->whereHas('user', function($userQuery) {
                      $userQuery->whereNotIn('role', ['admin', 'dept_head']);
                  });
        })
        ->where(function($query) {
            $query->where('status', 'pending')
                  ->orWhere('status', 'pending_dept_head')
                  ->orWhere('status', 'pending_hr_to_dept');
        })
        ->whereDoesntHave('approvals', function($q) {
            $q->where('role', 'dept_head');
        })
        ->count();

    // Add the pending count to stats
    $stats['pendingLeaveRequestsCount'] = $pendingLeaveRequestsCount;

    // Keep the existing recent requests for the dashboard display (optional)
    $pendingRequests = LeaveRequest::with([
        'employee.user', 
        'leaveType:id,name',
    ])
    ->whereHas('employee', function($query) use ($departmentId) {
        $query->where('department_id', $departmentId)
              ->whereHas('user', function($userQuery) {
                  $userQuery->whereNotIn('role', ['admin', 'dept_head']);
              });
    })
        ->where(function($query) {
            $query->where('status', 'pending')
                  ->orWhere('status', 'pending_dept_head')
                  ->orWhere('status', 'pending_hr_to_dept');
        })
        ->whereDoesntHave('approvals', function($q) {
            $q->where('role', 'dept_head');
        })
        ->orderBy('created_at', 'desc')
        ->limit(3) // Show only 3 recent ones
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
                ] : null,
                'created_at' => $request->created_at,
            ];
        });

    return Inertia::render('DeptHead/Dashboard', [
        'initialLeaveRequests' => $pendingRequests,
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
            'newRequests' => [],
            'stats' => [
                'totalEmployees' => 0,
                'approvedLeaveRequests' => 0,
                'rejectedLeaveRequests' => 0,
            ]
        ]);
    }

    // Get stats
    $stats = $this->getDepartmentStats($departmentId);

    // Get pending requests (same query as dashboard)
    $newRequests = LeaveRequest::with([
            'employee.user',
            'leaveType:id,name',
        ])
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->where(function($query) {
            $query->where('status', 'pending')
                  ->orWhere('status', 'pending_dept_head')
                  ->orWhere('status', 'pending_hr_to_dept');
        })
        ->whereDoesntHave('approvals', function($q) {
            $q->where('role', 'dept_head');
        })
        ->orderBy('created_at', 'desc')
        ->limit(10)
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
                'created_at' => $request->created_at,
            ];
        });

    return response()->json([
        'newRequests' => $newRequests,
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
                'filters' => $request->only(['status', 'search']),
                'pendingRescheduleCount' => 0
            ]);
        }
    
        // Get pending reschedule count for the badge
        $pendingRescheduleCount = LeaveRescheduleRequest::where('status', 'pending_dept_head')
            ->whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId)
                      ->whereHas('user', function($userQuery) {
                          $userQuery->whereIn('role', ['employee', 'hr']);
                      });
            })
            ->count();
    
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
                  ->where('employee_id', '!=', $currentDeptHeadEmployeeId)
                  ->whereHas('user', function($userQuery) {
                      // Exclude employees with Admin or Dept Head roles
                      $userQuery->whereNotIn('role', ['admin', 'dept_head']);
                  });
        })
        //  Only show requests that have HR approval
        ->whereHas('approvals', function($query) {
            $query->where('role', 'hr')
                  ->where('status', 'approved');
        })
        ->orderBy('created_at', 'desc');
    
        
        if ($request->has('status') && $request->status !== 'all') {
            switch ($request->status) {
                case 'pending':
                    // Requests that have HR approval and need dept head approval
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
                $hrApproval = $leaveRequest->approvals->firstWhere('role', 'hr');
                $deptHeadApproval = $leaveRequest->approvals->firstWhere('role', 'dept_head');
                $adminApproval = $leaveRequest->approvals->firstWhere('role', 'admin');
                
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
                    'hr_approval' => $hrApproval ? [
                        'status' => $hrApproval->status,
                        'remarks' => $hrApproval->remarks,
                        'approved_at' => $hrApproval->approved_at,
                        'approver_name' => $hrApproval->approver->name ?? 'Unknown'
                    ] : null,
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
            'filters' => $request->only(['status', 'search']),
            'pendingRescheduleCount' => $pendingRescheduleCount
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
        
                // Check if request is in correct status for dept head approval
                // ❌ FIX: Dept Head should ONLY see pending_dept_head status
                // (HR routes regular employees to pending_dept_head)
                $allowedStatuses = ['pending_dept_head']; 
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
    
                // ✅ UPDATE STATUS - ALWAYS GO TO ADMIN AFTER DEPT HEAD
                $leaveRequest->update(['status' => 'pending_admin']);
                
                \Log::info("Department Head approved. Status updated to pending_admin", [
                    'request_id' => $id,
                    'applicant' => $leaveRequest->employee->firstname . ' ' . $leaveRequest->employee->lastname
                ]);
    
                // Use the centralized notification service
                $notificationService = new NotificationService();
                
                // Notify the employee about department head approval
                $notificationService->notifyDeptHeadApproval(
                    $leaveRequest,
                    $user->id,
                    $request->remarks
                );
    
                \Log::info("Department Head approval completed", [
                    'request_id' => $id,
                    'new_status' => 'pending_admin'
                ]);
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
   /**
 * Reject a leave request (Dept Head action)
 */
public function rejectLeaveRequest(Request $request, $id)
{
    // Validate – if fails, Laravel automatically throws ValidationException (422 response)
    $validated = $request->validate([
        'remarks' => 'required|string|max:500',
    ]);

    // All business logic inside a transaction
    DB::transaction(function () use ($request, $id, $validated) {
        $user = $request->user();
        $deptHeadDeptId = $user->employee->department_id ?? null;

        if (!$deptHeadDeptId) {
            throw new \Exception('You are not assigned to any department.');
        }

        // 👇 Add 'leaveType' here
        $leaveRequest = LeaveRequest::with(['employee', 'approvals', 'leaveType'])->findOrFail($id);

        
        if (!$deptHeadDeptId) {
            throw new \Exception('You are not assigned to any department.');
        }

        $leaveRequest = LeaveRequest::with(['employee', 'approvals'])->findOrFail($id);

        if ($leaveRequest->employee->department_id !== $deptHeadDeptId) {
            throw new \Exception('This employee does not belong to your department.');
        }

        if (!in_array($leaveRequest->status, ['pending_dept_head', 'pending', 'pending_hr_to_dept'])) {
            throw new \Exception('This request cannot be rejected at this stage.');
        }

        if ($leaveRequest->approvals->where('role', 'dept_head')->isNotEmpty()) {
            throw new \Exception('This request has already been processed by the department head.');
        }

        LeaveApproval::create([
            'leave_id'    => $leaveRequest->id,
            'approved_by' => $user->id,
            'role'        => 'dept_head',
            'status'      => 'rejected',
            'remarks'     => $validated['remarks'],
            'approved_at' => now(),
        ]);

        $leaveRequest->update(['status' => 'rejected']);

        $this->notificationService->createLeaveRequestNotification(
            $leaveRequest->employee_id,
            'dept_head_rejected',
            $leaveRequest->id,
            $leaveRequest->leaveType->name ?? 'Leave',
            $leaveRequest->date_from,
            $leaveRequest->date_to,
            $validated['remarks']
        );
    });

    // Success – redirect with flash
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

    // FIXED: Use selected_dates for accurate duration calculation
    $selectedDates = [];
    $selectedDatesCount = 0;
    
    if (!empty($leaveRequest->selected_dates)) {
        if (is_array($leaveRequest->selected_dates)) {
            $selectedDates = $leaveRequest->selected_dates;
        } elseif (is_string($leaveRequest->selected_dates)) {
            $decoded = json_decode($leaveRequest->selected_dates, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $selectedDates = $decoded;
            }
        }
        $selectedDatesCount = count($selectedDates);
    }

    // Calculate working days based on selected dates (excluding weekends)
    $workingDays = 0;
    if ($selectedDatesCount > 0) {
        foreach ($selectedDates as $date) {
            $dateObj = new \DateTime($date);
            $dayOfWeek = $dateObj->format('N'); // 1-7 (Monday-Sunday)
            if ($dayOfWeek < 6) { // 1-5 are weekdays
                $workingDays++;
            }
        }
    } else {
        // Fallback: calculate from date range for old records
        $startDate = new \DateTime($leaveRequest->date_from);
        $endDate = new \DateTime($leaveRequest->date_to);
        for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
            $dayOfWeek = $date->format('N');
            if ($dayOfWeek < 6) {
                $workingDays++;
            }
        }
    }

    // Get leave balance information if available
    $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

    return Inertia::render('DeptHead/ShowLeaveRequest', [
        'leaveRequest' => $leaveRequest,
        'selectedDates' => $selectedDates, // Pass selected dates to frontend
        'selectedDatesCount' => $selectedDatesCount,
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


public function creditConversions(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return Inertia::render('DeptHead/CreditConversions', [
            'conversions' => ['data' => [], 'links' => []],
            'departmentName' => 'No Department Assigned',
            'stats' => [
                'total' => 0,
                'pending' => 0,
                'approved' => 0,
                'rejected' => 0
            ],
            'filters' => $request->only(['status', 'employee'])
        ]);
    }

    $perPage = 10;
    
    $query = CreditConversion::with([
            'employee.department', 
            'hrApprover', 
            'deptHeadApprover', 
            'adminApprover'
        ])
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        });

    // Apply status filters
    if ($request->has('status') && $request->status !== 'all') {
        switch ($request->status) {
            case 'pending_dept_head':
                $query->where('status', 'hr_approved');
                break;
            case 'dept_head_approved':
                $query->where('status', 'dept_head_approved');
                break;
            case 'fully_approved':
                $query->where('status', 'admin_approved');
                break;
            case 'rejected':
                $query->where('status', 'rejected');
                break;
            default:
                $query->where('status', 'hr_approved');
                break;
        }
    } else {
        // Default: Show only pending department head approval
        $query->where('status', 'hr_approved');
    }

    // Employee search filter
    if ($request->has('employee') && !empty($request->employee)) {
        $query->whereHas('employee', function ($q) use ($request) {
            $q->where('firstname', 'like', "%{$request->employee}%")
              ->orWhere('lastname', 'like', "%{$request->employee}%");
        });
    }

    $conversions = $query->orderBy('submitted_at', 'desc')
                        ->paginate($perPage)
                        ->withQueryString();

    // Transform conversions
    $transformedConversions = $conversions->getCollection()->map(function ($conversion) {
        return $this->transformConversionData($conversion);
    });

    $conversions->setCollection($transformedConversions);

    // UPDATED STATS: Department Head specific statistics
    $totalRequests = CreditConversion::whereHas('employee', function($query) use ($departmentId) {
        $query->where('department_id', $departmentId);
    })
    ->whereIn('status', ['hr_approved', 'dept_head_approved', 'admin_approved', 'rejected'])
    ->count();

    $pendingRequests = CreditConversion::where('status', 'hr_approved')
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->count();

    $approvedByDeptHead = CreditConversion::where('status', 'dept_head_approved')
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->count();

    $rejectedByDeptHead = CreditConversion::where('status', 'rejected')
        ->where('dept_head_approved_by', $user->id) // Only count rejections by this dept head
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->count();

    return Inertia::render('DeptHead/CreditConversions', [
        'conversions' => $conversions,
        'departmentName' => $user->employee->department->name ?? 'Department',
        'stats' => [
            'total' => $totalRequests,
            'pending' => $pendingRequests,
            'approved' => $approvedByDeptHead,
            'rejected' => $rejectedByDeptHead,
        ],
        'filters' => $request->only(['status', 'employee']),
    ]);
}

/**
 * Show specific credit conversion request details
 */
public function showCreditConversion($id)
{
    $conversion = CreditConversion::with([
        'employee.department',
        'hrApprover',
        'deptHeadApprover', 
        'adminApprover'
    ])->findOrFail($id);

    $transformedConversion = $this->transformConversionData($conversion);

    return Inertia::render('DeptHead/ShowCreditConversion', [
        'conversion' => $transformedConversion,
    ]);
}

/**
 * Department Head approves credit conversion request
 */
/**
 * Department Head approves credit conversion request
 */
public function approveCreditConversion(Request $request, $id)
{
    try {
        \Log::info('=== DEPT HEAD APPROVAL START ===');
        
        $conversionBefore = CreditConversion::find($id);
        \Log::info('Conversion before dept head approval', [
            'id' => $conversionBefore->conversion_id,
            'status' => $conversionBefore->status,
        ]);

        // NO REMARKS VALIDATION FOR APPROVAL
        $conversion = $this->creditConversionService->deptHeadApproveConversion(
            $id,
            $request->user()->id,
            null // No remarks for approval
        );

        // Verify the conversion was updated
        $conversionAfter = CreditConversion::find($id);
        \Log::info('Conversion after dept head approval', [
            'status' => $conversionAfter->status,
            'dept_head_approved_by' => $conversionAfter->dept_head_approved_by,
        ]);

        \Log::info('Dept Head Approval Successful');

        return redirect()->route('dept_head.credit-conversions')->with('success', 'Credit conversion request approved successfully!');
        
    } catch (\Exception $e) {
        \Log::error('Dept Head Approval Failed', [
            'conversion_id' => $id,
            'error' => $e->getMessage(),
        ]);

        return back()->with('error', 'Failed to approve conversion: ' . $e->getMessage());
    }
}
/**
 * Department Head rejects credit conversion request
 */
/**
 * Department Head rejects credit conversion request
 */
public function rejectCreditConversion(Request $request, $id)
{
    // Remarks still required for rejection
    $validated = $request->validate([
        'remarks' => ['required', 'string', 'max:500'],
    ]);

    try {
        $conversion = $this->creditConversionService->rejectConversion(
            $id,
            $request->user()->id,
            $validated['remarks'],
            'dept_head'
        );

        return redirect()->route('dept_head.credit-conversions')->with('success', 'Credit conversion request rejected successfully!');
    } catch (\Exception $e) {
        return back()->withErrors(['error' => $e->getMessage()]);
    }
}
/**
 * Transform conversion data for display
 */
private function transformConversionData($conversion)
{
    \Log::info('Transforming conversion:', [
        'conversion_id' => $conversion->conversion_id,
        'employee_id' => $conversion->employee_id,
        'status' => $conversion->status,
        'employee_loaded' => !is_null($conversion->employee),
        'department_loaded' => !is_null($conversion->employee?->department)
    ]);

    $leaveTypeNames = [
        'SL' => 'Sick Leave',
        'VL' => 'Vacation Leave'
    ];

    // Calculate cash equivalent using the same formula as service
    $monthlySalary = $conversion->employee->monthly_salary ?? 0;
    $calculatedCash = $this->calculateCashEquivalent($monthlySalary, $conversion->credits_requested);

    // Safe employee data
    $employee = $conversion->employee;
    
    return [
        'conversion_id' => $conversion->conversion_id,
        'employee_id' => $conversion->employee_id,
        'employee' => $employee ? [
            'firstname' => $employee->firstname,
            'lastname' => $employee->lastname,
            'position' => $employee->position,
            'department' => $employee->department ? [
                'name' => $employee->department->name,
            ] : null,
        ] : null,
        'employee_name' => $employee ? $employee->firstname . ' ' . $employee->lastname : 'Unknown Employee',
        'department' => $employee && $employee->department ? $employee->department->name : 'No Department',
        'leave_type_code' => $conversion->leave_type,
        'leave_type_name' => $leaveTypeNames[$conversion->leave_type] ?? 'Unknown',
        'credits_requested' => (float) $conversion->credits_requested,
        'equivalent_cash' => $calculatedCash,
        'status' => $conversion->status,
        'status_display' => $conversion->getStatusDisplay(),
        'submitted_at' => $conversion->submitted_at?->format('Y-m-d H:i:s'),
        'hr_approved_at' => $conversion->hr_approved_at?->format('Y-m-d H:i:s'),
        'dept_head_approved_at' => $conversion->dept_head_approved_at?->format('Y-m-d H:i:s'),
        'admin_approved_at' => $conversion->admin_approved_at?->format('Y-m-d H:i:s'),
        'employee_remarks' => $conversion->employee_remarks,
        'hr_remarks' => $conversion->hr_remarks,
        'dept_head_remarks' => $conversion->dept_head_remarks,
        'admin_remarks' => $conversion->admin_remarks,
        'hr_approver_name' => $conversion->hrApprover->name ?? null,
        'dept_head_approver_name' => $conversion->deptHeadApprover->name ?? null,
        'admin_approver_name' => $conversion->adminApprover->name ?? null,
        'current_approver_role' => $conversion->getCurrentApproverRole(),
        'created_at' => $conversion->created_at?->format('Y-m-d H:i:s'),
        'updated_at' => $conversion->updated_at?->format('Y-m-d H:i:s'),
    ];
}

/**
 * Calculate cash equivalent using the same formula as CreditConversionService
 */
private function calculateCashEquivalent($monthlySalary, $credits)
{
    // Use the same formula as in CreditConversionService
    $dailyRate = $monthlySalary / 22; // Assuming 22 working days per month
    $cashValue = $dailyRate * $credits;
    return round($cashValue, 2);
}

/**
 * Get credit conversion statistics for dashboard
 */
public function getCreditConversionStats(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return response()->json([
            'pending_conversions' => 0,
            'total_conversions' => 0
        ]);
    }

    $pendingConversions = CreditConversion::where('status', 'hr_approved')
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })->count();

    $totalConversions = CreditConversion::whereHas('employee', function($query) use ($departmentId) {
        $query->where('department_id', $departmentId);
    })->count();

    return response()->json([
        'pending_conversions' => $pendingConversions,
        'total_conversions' => $totalConversions
    ]);
}




/**
 * Display attendance correction requests for department head review
 */
public function attendanceCorrections(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return Inertia::render('DeptHead/AttendanceCorrections', [
            'corrections' => ['data' => [], 'links' => []],
            'departmentName' => 'No Department Assigned',
            'stats' => [
                'pending' => 0,
                'reviewed' => 0,
                'total' => 0
            ],
            'filters' => $request->only(['status', 'employee'])
        ]);
    }

    $perPage = 10;
    
    $query = AttendanceCorrection::with([
            'employee', 
            'reviewer', 
            'approver',
            'department'
        ])
        ->where('department_id', $departmentId)
        ->where('status', 'Pending'); // Only show pending corrections initially

    // Apply status filters
    if ($request->has('status') && $request->status !== 'all') {
        $query->where('status', $request->status);
    }

    // Employee search filter
    if ($request->has('employee') && !empty($request->employee)) {
        $query->whereHas('employee', function ($q) use ($request) {
            $q->where('firstname', 'like', "%{$request->employee}%")
              ->orWhere('lastname', 'like', "%{$request->employee}%");
        });
    }

    $corrections = $query->orderBy('created_at', 'desc')
                        ->paginate($perPage)
                        ->withQueryString();

    // Transform corrections for frontend
    $transformedCorrections = $corrections->getCollection()->map(function ($correction) {
        return $this->transformCorrectionData($correction);
    });

    $corrections->setCollection($transformedCorrections);

    // Statistics
    $pendingCount = AttendanceCorrection::where('department_id', $departmentId)
        ->where('status', 'Pending')
        ->count();

    $reviewedCount = AttendanceCorrection::where('department_id', $departmentId)
        ->where('status', 'Reviewed')
        ->count();

    $totalCount = AttendanceCorrection::where('department_id', $departmentId)->count();

    return Inertia::render('DeptHead/AttendanceCorrections', [
        'corrections' => $corrections,
        'departmentName' => $user->employee->department->name ?? 'Department',
        'stats' => [
            'pending' => $pendingCount,
            'reviewed' => $reviewedCount,
            'total' => $totalCount,
        ],
        'filters' => $request->only(['status', 'employee']),
    ]);
}

/**
 * Show specific attendance correction request details
 */
public function showAttendanceCorrection($id)
{
    $correction = AttendanceCorrection::with([
        'employee.department',
        'reviewer',
        'approver',
        'department'
    ])->findOrFail($id);

    $transformedCorrection = $this->transformCorrectionData($correction);

    return Inertia::render('DeptHead/ShowAttendanceCorrection', [
        'correction' => $transformedCorrection,
    ]);
}

/**
 * Mark correction as reviewed and forward to HR
 */
public function reviewAttendanceCorrection(Request $request, $id)
{
    try {
        $user = $request->user();
        
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500'
        ]);

        $correction = AttendanceCorrection::with(['employee', 'department'])->findOrFail($id);

        // Check if correction belongs to department head's department
        $departmentId = $user->employee->department_id ?? null;
        if ($correction->department_id !== $departmentId) {
            return back()->with('error', 'You are not authorized to review this correction request.');
        }

        // Check if already processed
        if ($correction->status !== 'Pending') {
            return back()->with('error', 'This correction request has already been processed.');
        }

        // Update correction status to Reviewed
        $correction->update([
            'status' => 'Reviewed',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
            'remarks' => $validated['remarks']
        ]);

        // Send notifications
        $this->notificationService->notifyAttendanceCorrectionReview(
            $correction,
            $user->id,
            $validated['remarks']
        );

        return redirect()->route('dept_head.attendance-corrections')->with('success', 'Correction request marked as reviewed and forwarded to HR!');

    } catch (\Exception $e) {
        \Log::error('Failed to review attendance correction: ' . $e->getMessage(), [
            'correction_id' => $id,
            'user_id' => $request->user()->id
        ]);

        return back()->with('error', 'Failed to review correction request: ' . $e->getMessage());
    }
}

/**
 * Reject attendance correction request
 */
public function rejectAttendanceCorrection(Request $request, $id)
{
    try {
        $user = $request->user();
        
        $validated = $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        $correction = AttendanceCorrection::with(['employee', 'department'])->findOrFail($id);

        // Check if correction belongs to department head's department
        $departmentId = $user->employee->department_id ?? null;
        if ($correction->department_id !== $departmentId) {
            return back()->with('error', 'You are not authorized to reject this correction request.');
        }

        // Check if already processed
        if ($correction->status !== 'Pending') {
            return back()->with('error', 'This correction request has already been processed.');
        }

        // Update correction status to Rejected
        $correction->update([
            'status' => 'Rejected',
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
            'remarks' => $validated['remarks']
        ]);

        // Notify employee about rejection
        $this->notificationService->createEmployeeNotification(
            $correction->employee_id,
            'attendance_correction_rejected',
            'Attendance Correction Request Rejected',
            "Your attendance correction request for {$correction->attendance_date} has been rejected by your Department Head. Reason: {$validated['remarks']}",
            [
                'correction_id' => $correction->id,
                'attendance_date' => $correction->attendance_date,
                'remarks' => $validated['remarks'],
                'status' => 'Rejected'
            ]
        );

        return redirect()->route('dept_head.attendance-corrections')->with('success', 'Correction request rejected successfully!');

    } catch (\Exception $e) {
        \Log::error('Failed to reject attendance correction: ' . $e->getMessage(), [
            'correction_id' => $id,
            'user_id' => $request->user()->id
        ]);

        return back()->with('error', 'Failed to reject correction request: ' . $e->getMessage());
    }
}

/**
 * Transform correction data for display
 */
private function transformCorrectionData($correction)
{
    return [
        'id' => $correction->id,
        'employee_id' => $correction->employee_id,
        'employee_name' => $correction->employee ? 
            $correction->employee->firstname . ' ' . $correction->employee->lastname : 
            'Unknown Employee',
        'department' => $correction->department ? $correction->department->name : 'No Department',
        'attendance_date' => $correction->attendance_date,
        'attendance_date_formatted' => \Carbon\Carbon::parse($correction->attendance_date)->format('M d, Y'),
        'explanation' => $correction->explanation,
        'proof_image' => $correction->proof_image,
        'status' => $correction->status,
        'remarks' => $correction->remarks,
        'reviewed_by' => $correction->reviewer ? $correction->reviewer->name : null,
        'reviewed_at' => $correction->reviewed_at ? 
            $correction->reviewed_at->format('M d, Y g:i A') : null,
        'approved_by' => $correction->approver ? $correction->approver->name : null,
        'approved_at' => $correction->approved_at ? 
            $correction->approved_at->format('M d, Y g:i A') : null,
        'created_at' => $correction->created_at->format('M d, Y g:i A'),
        'created_at_raw' => $correction->created_at,
    ];
}

/**
 * Get attendance correction statistics for dashboard
 */
public function getAttendanceCorrectionStats(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return response()->json([
            'pending_corrections' => 0,
            'total_corrections' => 0
        ]);
    }

    $pendingCorrections = AttendanceCorrection::where('department_id', $departmentId)
        ->where('status', 'Pending')
        ->count();

    $totalCorrections = AttendanceCorrection::where('department_id', $departmentId)->count();

    return response()->json([
        'pending_corrections' => $pendingCorrections,
        'total_corrections' => $totalCorrections
    ]);
}

/**
 * View proof image for department head
 */
public function viewProofImage($id)
{
    $correction = AttendanceCorrection::findOrFail($id);
    $user = auth()->user();
    
    // Check if department head has access to this correction
    $departmentId = $user->employee->department_id ?? null;
    if ($correction->department_id !== $departmentId) {
        abort(403, 'Unauthorized action.');
    }

    if (!$correction->proof_image || !Storage::disk('public')->exists($correction->proof_image)) {
        abort(404, 'Proof image not found.');
    }

    // Return the image as a response for viewing
    $filePath = Storage::disk('public')->path($correction->proof_image);
    $mimeType = mime_content_type($filePath);
    
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="' . basename($correction->proof_image) . '"'
    ]);
}


public function rescheduleRequests(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
        return Inertia::render('DeptHead/RescheduleRequests', [
            'rescheduleRequests' => ['data' => []],
            'departmentName' => 'No Department Assigned',
            'pendingCount' => 0,
            'filters' => $request->only(['status'])
        ]);
    }

    $perPage = 10;
    
    // Get counts for all statuses
    $pendingCount = LeaveRescheduleRequest::where('status', 'pending_dept_head')
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId)
                  ->whereHas('user', function($userQuery) {
                      $userQuery->whereIn('role', ['employee', 'hr']);
                  });
        })
        ->count();

    // Get reschedule requests for display - ALL STATUSES
    $query = LeaveRescheduleRequest::with([
            'employee.department',
            'employee.user',
            'originalLeaveRequest.leaveType',
            'hrReviewedBy',
            'deptHeadReviewedBy' // Add this to show who approved/rejected
        ])
        ->whereHas('employee', function($query) use ($departmentId) {
            $query->where('department_id', $departmentId)
                  ->whereHas('user', function($userQuery) {
                      $userQuery->whereIn('role', ['employee', 'hr']);
                  });
        });

    // Apply status filter if provided
    if ($request->has('status') && $request->status !== 'all') {
        switch ($request->status) {
            case 'pending':
                $query->where('status', 'pending_dept_head');
                break;
            case 'approved':
                $query->where('status', 'approved');
                break;
            case 'rejected':
                $query->where('status', 'rejected');
                break;
        }
    } else {
        // Default: show pending requests
        $query->where('status', 'pending_dept_head');
    }

    $rescheduleRequests = $query->orderBy('submitted_at', 'desc')
        ->paginate($perPage)
        ->through(function ($request) {
            return [
                'id' => $request->id,
                'employee' => $request->employee ? [
                    'id' => $request->employee->id,
                    'firstname' => $request->employee->firstname,
                    'lastname' => $request->employee->lastname,
                    'department' => $request->employee->department ? [
                        'id' => $request->employee->department->id,
                        'name' => $request->employee->department->name,
                    ] : null,
                    'user' => $request->employee->user ? [
                        'role' => $request->employee->user->role,
                    ] : null,
                ] : null,
                'original_leave_request' => $request->originalLeaveRequest ? [
                    'id' => $request->originalLeaveRequest->id,
                    'date_from' => $request->originalLeaveRequest->date_from,
                    'date_to' => $request->originalLeaveRequest->date_to,
                    'total_days' => $request->originalLeaveRequest->total_days,
                    'reason' => $request->originalLeaveRequest->reason,
                    'leave_type' => $request->originalLeaveRequest->leaveType ? [
                        'id' => $request->originalLeaveRequest->leaveType->id,
                        'name' => $request->originalLeaveRequest->leaveType->name,
                        'code' => $request->originalLeaveRequest->leaveType->code,
                    ] : null,
                ] : null,
                'proposed_dates' => $request->proposed_dates,
                'reason' => $request->reason,
                'status' => $request->status,
                'submitted_at' => $request->submitted_at,
                'hr_reviewed_at' => $request->hr_reviewed_at,
                'dept_head_reviewed_at' => $request->dept_head_reviewed_at,
                'hr_remarks' => $request->hr_remarks,
                'dept_head_remarks' => $request->dept_head_remarks,
                'hr_approver' => $request->hrReviewedBy ? [
                    'name' => $request->hrReviewedBy->name,
                ] : null,
                'dept_head_approver' => $request->deptHeadReviewedBy ? [ // Add this
                    'name' => $request->deptHeadReviewedBy->name,
                ] : null,
            ];
        });

    return Inertia::render('DeptHead/RescheduleRequests', [
        'rescheduleRequests' => $rescheduleRequests,
        'departmentName' => $user->employee->department->name ?? 'Department',
        'pendingCount' => $pendingCount,
        'filters' => $request->only(['status']),
    ]);
}
    /**
     * Show specific reschedule request details
     */
   /**
 * Show specific reschedule request details
 */
public function showRescheduleRequest($id)
{
    $rescheduleRequest = LeaveRescheduleRequest::with([
        'employee.department',
        'employee.user',
        'originalLeaveRequest.leaveType',
        'hrReviewedBy', // CHANGED FROM hrApprover
        'deptHeadReviewedBy' // CHANGED FROM deptHeadApprover
    ])->findOrFail($id);

    $transformedRequest = [
        'id' => $rescheduleRequest->id,
        'employee' => $rescheduleRequest->employee ? [
            'id' => $rescheduleRequest->employee->id,
            'firstname' => $rescheduleRequest->employee->firstname,
            'lastname' => $rescheduleRequest->employee->lastname,
            'department' => $rescheduleRequest->employee->department ? [
                'id' => $rescheduleRequest->employee->department->id,
                'name' => $rescheduleRequest->employee->department->name,
            ] : null,
            'user' => $rescheduleRequest->employee->user ? [
                'role' => $rescheduleRequest->employee->user->role,
            ] : null,
        ] : null,
        'original_leave_request' => $rescheduleRequest->originalLeaveRequest ? [
            'id' => $rescheduleRequest->originalLeaveRequest->id,
            'date_from' => $rescheduleRequest->originalLeaveRequest->date_from,
            'date_to' => $rescheduleRequest->originalLeaveRequest->date_to,
            'total_days' => $rescheduleRequest->originalLeaveRequest->total_days,
            'reason' => $rescheduleRequest->originalLeaveRequest->reason,
            'leave_type' => $rescheduleRequest->originalLeaveRequest->leaveType ? [
                'id' => $rescheduleRequest->originalLeaveRequest->leaveType->id,
                'name' => $rescheduleRequest->originalLeaveRequest->leaveType->name,
                'code' => $rescheduleRequest->originalLeaveRequest->leaveType->code,
            ] : null,
        ] : null,
        'proposed_dates' => $rescheduleRequest->proposed_dates,
        'reason' => $rescheduleRequest->reason,
        'status' => $rescheduleRequest->status,
        'submitted_at' => $rescheduleRequest->submitted_at,
        'hr_reviewed_at' => $rescheduleRequest->hr_reviewed_at,
        'dept_head_reviewed_at' => $rescheduleRequest->dept_head_reviewed_at,
        'hr_remarks' => $rescheduleRequest->hr_remarks,
        'dept_head_remarks' => $rescheduleRequest->dept_head_remarks,
        'hr_approver' => $rescheduleRequest->hrReviewedBy ? [ // CHANGED FROM hrApprover
            'name' => $rescheduleRequest->hrReviewedBy->name,
        ] : null,
        'dept_head_approver' => $rescheduleRequest->deptHeadReviewedBy ? [ // CHANGED FROM deptHeadApprover
            'name' => $rescheduleRequest->deptHeadReviewedBy->name,
        ] : null,
    ];

    return Inertia::render('DeptHead/ShowRescheduleRequest', [
        'rescheduleRequest' => $transformedRequest,
    ]);
}

    /**
     * Approve a reschedule request (Dept Head action)
     */
    public function approveRescheduleRequest(Request $request, $id)
    {
        $rescheduleRequest = LeaveRescheduleRequest::with(['employee', 'originalLeaveRequest'])->findOrFail($id);

        // Check if request is pending department head approval
        if ($rescheduleRequest->status !== 'pending_dept_head') {
            return back()->with('error', 'This reschedule request has already been processed.');
        }

        try {
            $user = $request->user();

            DB::transaction(function () use ($rescheduleRequest, $user) {
                // Update reschedule request - Dept Head approval is final for employee/hr requests
                $rescheduleRequest->update([
                    'status' => 'approved',
                    'dept_head_reviewed_by' => $user->id,
                    'dept_head_reviewed_at' => now(),
                    'processed_by' => $user->id,
                    'processed_at' => now(),
                    'dept_head_remarks' => $request->remarks ?? 'Approved by Department Head',
                ]);

                // Update the original leave request with new dates
                $this->updateLeaveRequestDates($rescheduleRequest);
            });

            // Send notifications
            // $this->notificationService->notifyRescheduleDeptHeadApproval($rescheduleRequest);

            return redirect()->route('dept_head.reschedule-requests')
                ->with('success', 'Reschedule request approved successfully.');

        } catch (\Exception $e) {
            \Log::error('Dept Head reschedule approval failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to approve reschedule request: ' . $e->getMessage());
        }
    }

    /**
     * Reject a reschedule request (Dept Head action)
     */
    public function rejectRescheduleRequest(Request $request, $id)
    {
        $rescheduleRequest = LeaveRescheduleRequest::with(['employee'])->findOrFail($id);

        // Check if request is pending department head approval
        if ($rescheduleRequest->status !== 'pending_dept_head') {
            return back()->with('error', 'This reschedule request has already been processed.');
        }

        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:1000'],
        ]);

        try {
            $user = $request->user();

            $rescheduleRequest->update([
                'status' => 'rejected',
                'dept_head_reviewed_by' => $user->id,
                'dept_head_reviewed_at' => now(),
                'processed_by' => $user->id,
                'processed_at' => now(),
                'dept_head_remarks' => $validated['remarks'],
            ]);

            // Send notifications
            // $this->notificationService->notifyRescheduleDeptHeadRejection($rescheduleRequest);

            return redirect()->route('dept_head.reschedule-requests')
                ->with('success', 'Reschedule request rejected successfully.');

        } catch (\Exception $e) {
            \Log::error('Dept Head reschedule rejection failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to reject reschedule request: ' . $e->getMessage());
        }
    }

    /**
     * Update original leave request with new dates
     */
    private function updateLeaveRequestDates($rescheduleRequest)
    {
        DB::beginTransaction();
        try {
            $originalLeave = $rescheduleRequest->originalLeaveRequest;
            $dates = collect($rescheduleRequest->proposed_dates)->sort()->values();
            $dateFrom = $dates->first();
            $dateTo = $dates->last();

            // Calculate working days (excluding weekends)
            $workingDays = $this->calculateWorkingDays($dates);

            // Store the original dates in reschedule history
            $rescheduleHistory = $this->buildRescheduleHistory($originalLeave, $rescheduleRequest, $dates, $workingDays);

            // Update the original leave request with new dates and "Rescheduled" status
            $originalLeave->update([
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'total_days' => $workingDays,
                'selected_dates' => json_encode($dates),
                'reschedule_history' => json_encode($rescheduleHistory),
                'status' => 'rescheduled', // Mark as rescheduled
                'rescheduled_at' => now(), // Track when it was rescheduled
            ]);

            // Update any related approvals to reflect the new dates
            $this->updateRelatedApprovals($originalLeave);

            \Log::info("Original leave request updated with new dates by Dept Head", [
                'leave_request_id' => $originalLeave->id,
                'employee_id' => $originalLeave->employee_id,
                'original_dates' => $originalLeave->getOriginal('date_from') . ' to ' . $originalLeave->getOriginal('date_to'),
                'new_dates' => $dateFrom . ' to ' . $dateTo,
                'working_days' => $workingDays,
                'reschedule_request_id' => $rescheduleRequest->id
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Failed to update leave request dates: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calculate working days from proposed dates (excluding weekends)
     */
    private function calculateWorkingDays($dates)
    {
        $workingDays = 0;
        foreach ($dates as $date) {
            $dateObj = new \DateTime($date);
            $dayOfWeek = $dateObj->format('N');
            if ($dayOfWeek < 6) { // 1-5 are weekdays (Monday to Friday)
                $workingDays++;
            }
        }
        return $workingDays;
    }

    /**
     * Build reschedule history array
     */
    private function buildRescheduleHistory($originalLeave, $rescheduleRequest, $dates, $workingDays)
    {
        $dateFrom = $dates->first();
        $dateTo = $dates->last();

        $historyEntry = [
            'reschedule_id' => $rescheduleRequest->id,
            'original_dates' => [
                'date_from' => $originalLeave->getOriginal('date_from'),
                'date_to' => $originalLeave->getOriginal('date_to'),
                'total_days' => $originalLeave->getOriginal('total_days'),
            ],
            'new_dates' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'total_days' => $workingDays,
            ],
            'rescheduled_at' => now()->toISOString(),
            'reason' => $rescheduleRequest->reason,
            'approved_by' => $rescheduleRequest->processed_by,
            'approver_role' => 'dept_head',
            'remarks' => $rescheduleRequest->dept_head_remarks ?? $rescheduleRequest->hr_remarks
        ];

        // Get existing history and append new entry
        $existingHistory = json_decode($originalLeave->reschedule_history ?? '[]', true);
        $existingHistory[] = $historyEntry;

        return $existingHistory;
    }

    /**
     * Update related approvals to reflect the rescheduled status
     */
    private function updateRelatedApprovals($leaveRequest)
    {
        // Update approval remarks to mention rescheduling
        $approvals = $leaveRequest->approvals;
        
        foreach ($approvals as $approval) {
            if ($approval->approved_at && $approval->status === 'approved') {
                $approval->update([
                    'remarks' => ($approval->remarks ?? '') . " [Dates were rescheduled and approved on " . now()->format('M d, Y') . "]"
                ]);
            }
        }
    }

    /**
     * Get pending reschedule count for badge
     */
    public function getPendingRescheduleCount(Request $request)
    {
        $user = $request->user();
        $departmentId = $user->employee->department_id ?? null;

        if (!$departmentId) {
            return response()->json(['count' => 0]);
        }

        $pendingCount = LeaveRescheduleRequest::where('status', 'pending_dept_head')
            ->whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId)
                      ->whereHas('user', function($userQuery) {
                          $userQuery->whereIn('role', ['employee', 'hr']);
                      });
            })
            ->count();

        return response()->json(['count' => $pendingCount]);
    }

}