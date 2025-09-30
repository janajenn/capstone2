<?php

namespace App\Http\Controllers\Admin;
use App\Models\DelegatedApprover;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveRequest;
use App\Models\LeaveApproval;
use Illuminate\Support\Facades\DB;
use App\Services\LeaveCreditService;
use App\Models\LeaveType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use App\Services\NotificationService;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\LeaveBalance;
use App\Services\LeaveBalanceService;
use App\Models\Employee;
use App\Models\Department;  


class AdminController extends Controller
{

    public function leaveRequests(Request $request)
    {
        $status = $request->get('status', 'pending_to_admin');
        $perPage = 10;
        
        // Get current approver using static method
        $currentApprover = User::getCurrentApprover();
        
        // Check if current user is authorized to view leave requests
        if (!$currentApprover || $currentApprover->id !== auth()->id()) {
            return Inertia::render('Admin/Unauthorized', [
                'message' => 'You are not currently authorized to approve leave requests.',
                'currentApprover' => $currentApprover ? $currentApprover->name : 'No active approver'
            ]);
        }
    
        // Base query with relationships
        $query = LeaveRequest::with([
                'employee.user',
                'employee.department:id,name',
                'leaveType:id,name,code',
                'approvals' => function($q) {
                    $q->whereIn('role', ['hr', 'dept_head', 'admin'])
                      ->orderBy('created_at', 'desc');
                }
            ]);
    
        // Apply filters based on selected tab
        switch ($status) {
            case 'pending_to_admin':
                // ✅ FIXED: Requests approved by HR and Dept Head, waiting for Admin
                $query->where('status', 'pending') // Changed from 'approved' to 'pending'
                      ->whereHas('approvals', function ($q) {
                          $q->where('role', 'hr')->where('status', 'approved');
                      })
                      ->whereHas('approvals', function ($q) {
                          $q->where('role', 'dept_head')->where('status', 'approved');
                      })
                      ->whereDoesntHave('approvals', function ($q) {
                          $q->where('role', 'admin');
                      });
                break;
    
            case 'fully_approved':
                // Requests fully approved by Admin
                $query->where('status', 'approved')
                      ->whereHas('approvals', function($q) {
                          $q->where('role', 'admin')->where('status', 'approved');
                      });
                break;
    
            case 'rejected':
                // Requests rejected by Admin
                $query->where('status', 'rejected')
                      ->whereHas('approvals', function($q) {
                          $q->where('role', 'admin')->where('status', 'rejected');
                      });
                break;
        }
    
        // Get paginated results
        $paginatedRequests = $query->orderBy('created_at', 'desc')
                                  ->paginate($perPage)
                                  ->through(function ($request) {
                                      return [
                                          'id' => $request->id,
                                          'date_from' => $request->date_from,
                                          'date_to' => $request->date_to,
                                          'status' => $request->status,
                                          'total_days' => $request->total_days,
                                          'created_at' => $request->created_at,
                                          'employee' => [
                                              'id' => $request->employee->id,
                                              'firstname' => $request->employee->firstname,
                                              'lastname' => $request->employee->lastname,
                                              'department' => $request->employee->department?->name,
                                              'position' => $request->employee->position,
                                          ],
                                          'leaveType' => [
                                              'id' => $request->leaveType?->id,
                                              'name' => $request->leaveType?->name,
                                              'code' => $request->leaveType?->code,
                                          ],
                                          'hr_approval' => $request->approvals->firstWhere('role', 'hr'),
                                          'dept_head_approval' => $request->approvals->firstWhere('role', 'dept_head'),
                                          'admin_approval' => $request->approvals->firstWhere('role', 'admin'),
                                      ];
                                  });
    
        return Inertia::render('Admin/LeaveRequests', [
            'leaveRequests' => $paginatedRequests,
            'filters' => ['status' => $status],
            'currentApprover' => $currentApprover,
            'isActiveApprover' => auth()->user()->isActiveApprover(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ]);
    }

    public function approve(Request $request, $id)
    {
        // Check if user is currently authorized to approve
        $currentApprover = User::getCurrentApprover();
        
        if (!$currentApprover || $currentApprover->id !== auth()->id()) {
            return redirect()->back()->with('error', 
                'You are not currently authorized to approve leave requests. ' .
                'Current approver: ' . ($currentApprover ? $currentApprover->name : 'No active approver')
            );
        }
    
        \Log::info('👤 Admin approval attempt for leave request ID: ' . $id . ' by user: ' . auth()->user()->name);
    
        try {
            $leaveRequest = LeaveRequest::with('leaveType')->findOrFail($id);
            
            // Check if already approved by admin
            $existingAdminApproval = LeaveApproval::where('leave_id', $id)
                ->where('role', 'admin')
                ->first();
    
            if ($existingAdminApproval) {
                return redirect()->back()->with('error', 'This leave request has already been processed.');
            }
    
            // Wrap entire approval process in transaction
            DB::transaction(function () use ($request, $id, $leaveRequest, $currentApprover) {
                // Create admin approval record
                $approval = LeaveApproval::create([
                    'leave_id' => $id,
                    'approved_by' => $currentApprover->id,
                    'role' => 'admin',
                    'status' => 'approved',
                    'remarks' => $request->input('remarks', 'Approved by ' . $currentApprover->name),
                    'approved_at' => now()
                ]);
    
                // Update leave request status only (no approved_by/approved_at since they're in leave_approvals)
                $leaveRequest->status = 'approved';
                $leaveRequest->save();
    
                // Check if all approvals are complete
                $isFullyApproved = $this->isFullyApproved($leaveRequest);
    
                // Send notification to employee
                $notificationService = new NotificationService();
                $notificationService->createLeaveRequestNotification(
                    $leaveRequest->employee_id,
                    'approved',
                    $id,
                    $leaveRequest->leaveType->name ?? 'Leave',
                    $leaveRequest->date_from,
                    $leaveRequest->date_to,
                    $request->input('remarks', 'Approved by ' . $currentApprover->name)
                );
    
                if ($isFullyApproved) {
                    // Get leave type code to determine which service to use
                    $leaveTypeCode = $leaveRequest->leaveType->code;
                    
                    if (in_array($leaveTypeCode, ['SL', 'VL'])) {
                        // Process SL/VL leave types using LeaveCreditService
                        $leaveCreditService = new LeaveCreditService();
                        $result = $leaveCreditService->deductLeaveCredits($leaveRequest);
                        \Log::info("✅ Leave credits deducted for SL/VL leave type: {$leaveTypeCode}");
                    } else {
                        // Process other leave types using LeaveBalanceService
                        $leaveBalanceService = new LeaveBalanceService();
                        $result = $leaveBalanceService->deductLeaveBalance($leaveRequest);
                        
                        // FIX: Check if result is an array before accessing array keys
                        if (is_array($result) && isset($result['success']) && !$result['success']) {
                            // If balance deduction fails, throw an exception to rollback the transaction
                            throw new \Exception($result['message'] ?? "Failed to deduct leave balance for {$leaveTypeCode}");
                        }
                        
                        // If result is not an array (e.g., returns true for success), log success
                        if ($result === true) {
                            \Log::info("✅ Leave balance deducted successfully for leave type: {$leaveTypeCode}");
                        } else if (is_array($result) && $result['success']) {
                            \Log::info("✅ Leave balance deducted for leave type: {$leaveTypeCode}");
                        }
                    }
                }
    
                \Log::info("🎉 Leave request ID: {$id} fully processed and approved");
            });
    
            return redirect()->back()->with('success', 'Leave request approved successfully.');
    
        } catch (\Exception $e) {
            \Log::error('❌ Approval error: ' . $e->getMessage());
            \Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            return redirect()->back()->with('error', 'Error approving leave: ' . $e->getMessage());
        }
    }
/**
 * Check if all required approvals are complete for a leave request
 */
private function isFullyApproved(LeaveRequest $leaveRequest)
{
    // Get all required approval roles for this leave type or company policy
    $requiredRoles = ['hr', 'dept_head', 'admin']; // Adjust based on your requirements
    
    // Count how many approvals are already completed
    $completedApprovals = LeaveApproval::where('leave_id', $leaveRequest->id)
        ->where('status', 'approved')
        ->whereIn('role', $requiredRoles)
        ->count();
    
    // Check if all required roles have approved
    $isFullyApproved = $completedApprovals >= count($requiredRoles);
    
    \Log::info("📋 Approval status for leave ID {$leaveRequest->id}: {$completedApprovals}/" . 
               count($requiredRoles) . " approvals completed. Fully approved: " . 
               ($isFullyApproved ? 'Yes' : 'No'));
    
    return $isFullyApproved;
}


    public function reject(Request $request, $id)
    {
        // Check if user is currently authorized to reject
        $currentApprover = User::getCurrentApprover();
        
        if (!$currentApprover || $currentApprover->id !== auth()->id()) {
            return redirect()->back()->with('error', 
                'You are not currently authorized to reject leave requests. ' .
                'Current approver: ' . ($currentApprover ? $currentApprover->name : 'No active approver')
            );
        }

        $validated = $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        DB::transaction(function () use ($request, $id, $validated, $currentApprover) {
            $leaveRequest = LeaveRequest::findOrFail($id);
            
            LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $currentApprover->id,
                'role' => 'admin',
                'status' => 'rejected',
                'remarks' => $validated['remarks'],
                'approved_at' => now()
            ]);

            // Update leave request status to rejected
            $leaveRequest->update(['status' => 'rejected']);

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createLeaveRequestNotification(
                $leaveRequest->employee_id,
                'rejected',
                $id,
                $leaveRequest->leaveType->name ?? 'Leave',
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $validated['remarks']
            );
        });

        return redirect()->back()->with('success', 'Leave request rejected successfully.');
    }

    public function delegateApproval(Request $request)
{
    $currentUser = auth()->user();
    
    if (!$currentUser->canDelegateApproval()) {
        return redirect()->back()->with('error', 'You are not authorized to delegate approval rights.');
    }

    $validated = $request->validate([
        'to_admin_id' => 'required|exists:users,id',
        'start_date' => 'required|date|after_or_equal:today',
        'end_date' => 'required|date|after:start_date',
        'reason' => 'nullable|string|max:500'
    ]);

    // Check if target user is an admin
    $toUser = User::findOrFail($validated['to_admin_id']);
    if ($toUser->role !== 'admin') {
        return redirect()->back()->with('error', 'Selected user must be an admin.');
    }

    // REMOVED: Check for existing active delegation
    // Allow creating new delegations even when there's an active one
    // The system will handle multiple delegations based on dates

    DB::transaction(function () use ($validated, $currentUser) {
        $delegation = DelegatedApprover::create([
            'from_admin_id' => $currentUser->id,
            'to_admin_id' => $validated['to_admin_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'] ?? null,
            'status' => 'active'
        ]);

        // You can add notification logic here if needed
    });

    return redirect()->back()->with('success', 'Approval authority delegated successfully.');
}


    public function dashboard(Request $request)
    {
        // Get pending leave requests count
        $pendingCount = LeaveRequest::where('status', 'pending')->count();
    
        // Get recent leave requests
        $recentRequests = LeaveRequest::with(['leaveType', 'employee.department'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
    
        // Get leave requests by status
        $requestsByStatus = [
            'pending' => LeaveRequest::where('status', 'pending')->count(),
            'approved' => LeaveRequest::where('status', 'approved')->count(),
            'rejected' => LeaveRequest::where('status', 'rejected')->count(),
        ];
    
        // Analytics data for the dashboard
        $totalEmployees = Employee::count();
        $totalDepartments = Department::count();
        $totalUsers = User::count();
        $totalHRUsers = User::where('role', 'hr')->count();
        $fullyApprovedRequests = LeaveRequest::where('status', 'approved')->count();
        $rejectedRequests = LeaveRequest::where('status', 'rejected')->count();
    
        // Employee status counts
        $activeEmployees = Employee::where('status', 'active')->count();
        $inactiveEmployees = Employee::where('status', 'inactive')->count();
    
        // Leave type statistics
        $leaveTypeStats = LeaveRequest::with('leaveType')
            ->selectRaw('leave_type_id, count(*) as count')
            ->groupBy('leave_type_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->leaveType->name ?? 'Unknown',
                    'count' => $item->count
                ];
            });
    
        // Monthly statistics (last 12 months)
        $monthlyStats = LeaveRequest::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => date('M Y', strtotime($item->month . '-01')),
                    'count' => $item->count
                ];
            });
    
        // Department statistics
        $departmentStats = LeaveRequest::with('employee.department')
            ->selectRaw('employees.department_id, count(*) as count')
            ->join('employees', 'leave_requests.employee_id', '=', 'employees.employee_id')
            ->groupBy('employees.department_id')
            ->get()
            ->map(function ($item) {
                $department = Department::find($item->department_id);
                return [
                    'name' => $department->name ?? 'Unknown',
                    'count' => $item->count
                ];
            });
    
        return Inertia::render('Admin/Dashboard', [
            'pendingCount' => $pendingCount,
            'recentRequests' => $recentRequests,
            'requestsByStatus' => $requestsByStatus,
            'totalEmployees' => $totalEmployees,
            'totalDepartments' => $totalDepartments,
            'totalUsers' => $totalUsers,
            'totalHRUsers' => $totalHRUsers,
            'fullyApprovedRequests' => $fullyApprovedRequests,
            'rejectedRequests' => $rejectedRequests,
            'activeEmployees' => $activeEmployees,
            'inactiveEmployees' => $inactiveEmployees,
            'leaveTypeStats' => $leaveTypeStats,
            'monthlyStats' => $monthlyStats,
            'departmentStats' => $departmentStats,
        ]);
    }
    
        /**
         * Calculate average processing time for leave requests
         */
        private function getAverageProcessingTime()
        {
            $processedRequests = LeaveRequest::whereIn('status', ['approved', 'rejected'])
                ->whereNotNull('processed_at')
                ->get();
    
            if ($processedRequests->isEmpty()) {
                return 0;
            }
    
            $totalHours = 0;
            foreach ($processedRequests as $request) {
                $createdAt = $request->created_at;
                $processedAt = $request->processed_at;
                $hours = $createdAt->diffInHours($processedAt);
                $totalHours += $hours;
            }
    
            return round($totalHours / $processedRequests->count(), 2);
        }
    


    public function getUpdatedRequests(Request $request)
    {
        $lastUpdate = $request->input('lastUpdate');

        $query = LeaveRequest::with([
                'employee.user',
                'leaveType:id,name',
                'employee.department:id,name',
                'approvals' => function($q) {
                    $q->whereIn('role', ['hr', 'dept_head']);
                }
            ])
            ->where('status', 'approved')
            ->whereHas('approvals', function ($q) {
                $q->where('role', 'dept_head')->where('status', 'approved');
            })
            ->whereDoesntHave('approvals', function ($q) {
                $q->where('role', 'admin');
            });

        if ($lastUpdate) {
            $query->where('created_at', '>', $lastUpdate);
        }

        $newRequests = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                    'status' => $request->status,
                    'employee' => [
                        'firstname' => $request->employee->firstname,
                        'lastname' => $request->employee->lastname,
                        'department' => $request->employee->department?->name
                    ],
                    'leaveType' => $request->leaveType?->name,
                    'hr_approval' => $request->approvals->firstWhere('role', 'hr'),
                    'dept_head_approval' => $request->approvals->firstWhere('role', 'dept_head'),
                ];
            });

        return response()->json([
            'newRequests' => $newRequests,
            'lastUpdate' => now()->toDateTimeString()
        ]);
    }

    public function delegationIndex()
{
    $currentUser = auth()->user();
    
    // Get all delegations with employee relationships
    $delegations = DelegatedApprover::with([
        'fromAdmin.employee', 
        'toAdmin.employee'
    ])->orderBy('created_at', 'desc')
      ->get()
      ->map(function ($delegation) use ($currentUser) {
          $delegationArray = $delegation->toArray();
          $delegationArray['can_be_cancelled'] = $delegation->canBeCancelledBy($currentUser);
          $delegationArray['status_label'] = $delegation->status_label;
          $delegationArray['is_active'] = $delegation->is_active;
          $delegationArray['is_ended'] = $delegation->is_ended;
          $delegationArray['is_future'] = $delegation->is_future;
          
          // ADD DEBUG INFO
          $delegationArray['debug_info'] = $delegation->debug_info;
          
          return $delegationArray;
      });

    // Get available admins with employee data
    $availableAdmins = User::where('id', '!=', $currentUser->id)
        ->where('role', 'admin')
        ->with('employee')
        ->get(['id', 'name', 'email', 'is_primary']);

    // Get current active delegation with employee data
    $activeDelegation = DelegatedApprover::active()
        ->with(['fromAdmin.employee', 'toAdmin.employee'])
        ->first();

    // Server info for debugging
    $serverInfo = [
        'server_time' => now()->toDateTimeString(),
        'server_date' => now()->format('Y-m-d'),
        'timezone' => config('app.timezone'),
    ];

    return Inertia::render('Admin/Delegation/Index', [
        'delegations' => $delegations,
        'availableAdmins' => $availableAdmins,
        'activeDelegation' => $activeDelegation,
        'canDelegate' => $currentUser->canDelegateApproval(),
        'isPrimaryAdmin' => $currentUser->is_primary,
        'currentUser' => $currentUser,
        'serverInfo' => $serverInfo, // Add server info
    ]);
}


    public function cancelDelegation($id)
    {
        $delegation = DelegatedApprover::findOrFail($id);
        $currentUser = auth()->user();
    
        // Check if user can cancel this delegation
        if (!$delegation->canBeCancelledBy($currentUser)) {
            return redirect()->back()->with('error', 'You are not authorized to cancel this delegation.');
        }
    
        // Check if delegation is active
        if (!$delegation->is_active) {
            return redirect()->back()->with('error', 'This delegation is not active.');
        }
    
        $delegation->cancel();
    
        return redirect()->back()->with('success', 'Delegation cancelled successfully. Control reverted to primary admin.');
    }

    public function endDelegation($id)
    {
        $delegation = DelegatedApprover::findOrFail($id);
        $currentUser = auth()->user();

        // Check if user can end this delegation
        if ($delegation->from_admin_id !== $currentUser->id && !$currentUser->is_primary) {
            return redirect()->back()->with('error', 'You are not authorized to end this delegation.');
        }

        $delegation->update([
            'status' => 'ended',
            'end_date' => now()
        ]);

        return redirect()->back()->with('success', 'Delegation ended successfully.');
    }

    // // Helper method to check if all approvals are complete
    // private function isFullyApproved(LeaveRequest $leaveRequest)
    // {
    //     $approvals = $leaveRequest->approvals()->get();
    //     $hrApproved = $approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
    //     $deptHeadApproved = $approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
    //     $adminApproved = $approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();

    //     return $hrApproved && $deptHeadApproved && $adminApproved;
    // }




    public function leaveCalendar(Request $request)
{
    // Get the current year or use the year from request
    $currentYear = $request->year ?? now()->year;
    
    // Get fully approved leave requests for the specified year
    $query = LeaveRequest::where('status', 'approved')
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'hr')->where('status', 'approved');
        })
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'dept_head')->where('status', 'approved');
        })
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->whereYear('date_from', $currentYear) // Filter by year
        ->with(['employee', 'leaveType', 'approvals' => function ($query) {
            $query->with('approver');
        }]);

    // Apply additional filters if provided
    if ($request->has('department') && $request->department) {
        $query->whereHas('employee', function ($q) use ($request) {
            $q->where('department_id', $request->department);
        });
    }

    if ($request->has('leave_type') && $request->leave_type) {
        $query->whereHas('leaveType', function ($q) use ($request) {
            $q->where('code', $request->leave_type);
        });
    }

    $approvedLeaveRequests = $query->get();

    // Group leaves by month for list view
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

    // Sort months chronologically
    uksort($leavesByMonth, function ($a, $b) {
        return strtotime($a) - strtotime($b);
    });

    // Format for calendar view (existing functionality)
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

    return Inertia::render('Admin/LeaveCalendar', [
        'events' => $calendarEvents,
        'leavesByMonth' => $leavesByMonth,
        'departments' => Department::all(),
        'leaveTypes' => LeaveType::all(),
        'filters' => $request->only(['year', 'department', 'leave_type']),
        'currentYear' => $currentYear,
    ]);
}


// Helper method to assign colors based on leave type
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

    // Default color kung wala sa list
    return $colors[$leaveTypeCode] ?? '#9CA3AF';
}
}