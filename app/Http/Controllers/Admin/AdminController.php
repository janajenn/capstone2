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

    // In AdminController.php - leaveRequests method
    public function leaveRequests(Request $request)
{
    $status = $request->get('status', 'pending_to_admin');
    $perPage = 10;
    
    $currentApprover = User::getCurrentApprover();
    
    if (!$currentApprover || $currentApprover->id !== auth()->id()) {
        return Inertia::render('Admin/Unauthorized', [
            'message' => 'You are not currently authorized to approve leave requests.',
            'currentApprover' => $currentApprover ? $currentApprover->name : 'No active approver'
        ]);
    }

    $query = LeaveRequest::with([
            'employee.user',
            'employee.department:id,name',
            'leaveType:id,name,code',
            'approvals' => function($q) {
                $q->whereIn('role', ['hr', 'dept_head', 'admin'])
                  ->orderBy('created_at', 'desc');
            },
            'recalls'
        ]);

    switch ($status) {
        case 'pending_to_admin':
            // FIXED: Properly query for requests that need admin approval
            $query->where(function($q) {
                $q->where(function($q2) {
                    // Regular employees: Approved by HR and Dept Head, waiting for Admin
                    $q2->where('status', 'pending_admin')
                       ->whereHas('approvals', function($q3) {
                           $q3->where('role', 'hr')->where('status', 'approved');
                       })
                       ->whereHas('approvals', function($q3) {
                           $q3->where('role', 'dept_head')->where('status', 'approved');
                       })
                       ->whereHas('employee.user', function($q3) {
                           $q3->where('role', '!=', 'dept_head');
                       });
                })->orWhere(function($q2) {
                    // Dept heads: Approved by HR only (bypassed dept head), waiting for Admin
                    $q2->where('status', 'pending_admin')
                       ->whereHas('approvals', function($q3) {
                           $q3->where('role', 'hr')->where('status', 'approved');
                       })
                       ->whereHas('employee.user', function($q3) {
                           $q3->where('role', 'dept_head');
                       });
                });
            })->whereDoesntHave('approvals', function($q) {
                $q->where('role', 'admin');
            });
            break;

        case 'dept_head_requests':
            $query->where('status', 'pending_admin')
                  ->whereHas('employee.user', function($q) {
                      $q->where('role', 'dept_head');
                  })
                  ->whereHas('approvals', function($q) {
                      $q->where('role', 'hr')->where('status', 'approved');
                  });
            break;

            case 'fully_approved':
                $query->where('status', 'approved')
                      ->whereHas('approvals', function($q) {
                          $q->where('role', 'admin')->where('status', 'approved');
                      });
                break;
    
            case 'rejected':
                $query->where('status', 'rejected')
                      ->whereHas('approvals', function($q) {
                          $q->where('role', 'admin')->where('status', 'rejected');
                      });
                break;
    }

    $paginatedRequests = $query->orderBy('created_at', 'desc')
                      ->paginate($perPage)
                      ->through(function ($request) {
                          $isDeptHead = $request->employee->user->role === 'dept_head';

                           // ADD RECALL ELIGIBILITY CHECK
                           $canBeRecalled = $this->canBeRecalled($request);
                           $hasRecall = $request->recalls->isNotEmpty();
                           $recallData = $request->recalls->first();
                          
                          return [
                              'id' => $request->id,
                              'date_from' => $request->date_from,
                              'date_to' => $request->date_to,
                              'status' => $request->status,
                              'total_days' => $request->total_days,
                              'created_at' => $request->created_at,
                              'is_dept_head_request' => $isDeptHead,
                              'employee' => [
                                  'id' => $request->employee->id,
                                  'firstname' => $request->employee->firstname,
                                  'lastname' => $request->employee->lastname,
                                  'department' => $request->employee->department?->name,
                                  'position' => $request->employee->position,
                                  'role' => $request->employee->user->role,
                              ],
                              'leaveType' => [
                                  'id' => $request->leaveType?->id,
                                  'name' => $request->leaveType?->name,
                                  'code' => $request->leaveType?->code,
                              ],
                              'hr_approval' => $request->approvals->firstWhere('role', 'hr'),
                              'dept_head_approval' => $request->approvals->firstWhere('role', 'dept_head'),
                              'admin_approval' => $request->approvals->firstWhere('role', 'admin'),
                              'can_be_recalled' => $canBeRecalled,
                              'is_recalled' => $request->status === 'recalled',
                              'recall_data' => $request->recalls->first() ? [
                                  'reason' => $request->recalls->first()->reason_for_change,
                                  'new_date_from' => $request->recalls->first()->new_leave_date_from,
                                  'new_date_to' => $request->recalls->first()->new_leave_date_to,
                                  'recalled_at' => $request->recalls->first()->created_at,
                                  'recalled_by' => $request->recalls->first()->approved_by_admin
                              ] : null
                          ];
                      });

    return Inertia::render('Admin/LeaveRequests', [
        'leaveRequests' => $paginatedRequests,
        'filters' => ['status' => $status],
        'currentApprover' => $currentApprover,
        'isActiveApprover' => auth()->user()->isActiveApprover(),
    ]);
}


private function canBeRecalled(LeaveRequest $request)
{
    // Only Vacation Leave (VL) can be recalled
    if ($request->leaveType->code !== 'VL') {
        return false;
    }
    
    // Must be fully approved
    if ($request->status !== 'approved') {
        return false;
    }
    
    // Must have admin approval
    if (!$request->approvals->where('role', 'admin')->where('status', 'approved')->first()) {
        return false;
    }
    
    // Must not already be recalled
    if ($request->recalls->isNotEmpty()) {
        return false;
    }
    
    // Must not be in the past (optional - you might want to allow recalling past leaves)
    $today = now()->startOfDay();
    $leaveEndDate = \Carbon\Carbon::parse($request->date_to)->startOfDay();
    
    // Allow recalling if the leave hasn't ended yet, or ended recently (within 7 days)
    if ($leaveEndDate->lessThan($today->subDays(7))) {
        return false;
    }
    
    return true;
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
            $leaveRequest = LeaveRequest::with('leaveType', 'employee.user')->findOrFail($id);
            
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
    
                // CHECK IF THIS IS A DEPARTMENT HEAD REQUEST
                $isDeptHeadRequest = $leaveRequest->employee->user->role === 'dept_head' || 
                                    $leaveRequest->is_dept_head_request;
    
                if ($isDeptHeadRequest) {
                    // For department heads: HR + Admin = Fully Approved
                    $leaveRequest->status = 'approved';
                    \Log::info("✅ Department Head request fully approved: HR + Admin approvals complete");
                } else {
                    // For regular employees: Check if all approvals are complete
                    $isFullyApproved = $this->isFullyApproved($leaveRequest);
                    $leaveRequest->status = $isFullyApproved ? 'approved' : 'pending_admin';
                    
                    if ($isFullyApproved) {
                        \Log::info("✅ Regular employee request fully approved: HR + Dept Head + Admin approvals complete");
                    }
                }
    
                $leaveRequest->save();
    
                // Check if all approvals are complete
                $isFullyApproved = $this->isFullyApproved($leaveRequest);
    
               // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createLeaveRequestNotification(
                $leaveRequest->employee_id,
                'approved', // This will send approved notification
                $id,
                $leaveRequest->leaveType->name ?? 'Leave',
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $request->input('remarks', 'Approved by ' . $currentApprover->name)
            );

            // Only deduct credits if fully approved
            if ($leaveRequest->status === 'approved') {
                // Get leave type code to determine which service to use
                $leaveTypeCode = $leaveRequest->leaveType->code;
                
                if (in_array($leaveTypeCode, ['SL', 'VL'])) {
                    // Process SL/VL leave types using LeaveCreditService
                    $leaveCreditService = new LeaveCreditService();
                    $result = $leaveCreditService->deductLeaveCredits($leaveRequest);
                    
                    // Check if deduction was successful
                    if (is_array($result) && isset($result['success']) && !$result['success']) {
                        // If insufficient balance, allow approval but mark as days without pay
                        \Log::info("⚠️ Insufficient SL/VL balance for leave type: {$leaveTypeCode}. Request approved as days without pay.");
                        \Log::info("📊 Available balance: {$result['available_balance']}, Required: {$result['required_days']}");
                        
                        // Update the leave request to reflect days without pay
                        $leaveRequest->update([
                            'days_with_pay' => 0,
                            'days_without_pay' => $this->calculateWorkingDays($leaveRequest->date_from, $leaveRequest->date_to)
                        ]);
                    } else if (is_array($result) && isset($result['success']) && $result['success']) {
                        \Log::info("✅ Leave credits deducted for SL/VL leave type: {$leaveTypeCode}");
                        \Log::info("📊 Days deducted: {$result['days_deducted']}, New balance: {$result['new_balance']}");
                    } else {
                        \Log::info("✅ Leave credits deducted for SL/VL leave type: {$leaveTypeCode} (legacy format)");
                    }
                } else {
                    // Process other leave types using LeaveBalanceService
                    $leaveBalanceService = new LeaveBalanceService();
                    $result = $leaveBalanceService->deductLeaveBalance($leaveRequest);
                    
                    // Check if deduction was successful
                    if (is_array($result) && isset($result['success']) && !$result['success']) {
                        // If insufficient balance, allow approval but mark as days without pay
                        \Log::info("⚠️ Insufficient balance for leave type: {$leaveTypeCode}. Request approved as days without pay.");
                        \Log::info("📊 Available balance: {$result['available_balance']}, Required: {$result['required_days']}");
                        
                        // Update the leave request to reflect days without pay
                        $leaveRequest->update([
                            'days_with_pay' => 0,
                            'days_without_pay' => $this->calculateWorkingDays($leaveRequest->date_from, $leaveRequest->date_to)
                        ]);
                    } else if (is_array($result) && isset($result['success']) && $result['success']) {
                        \Log::info("✅ Leave balance deducted for leave type: {$leaveTypeCode}");
                        \Log::info("📊 Days deducted: {$result['days_deducted']}, New balance: {$result['new_balance']}");
                    } else {
                        \Log::info("✅ Leave balance deducted for leave type: {$leaveTypeCode} (legacy format)");
                    }
                }
            }

            \Log::info("🎉 Leave request ID: {$id} processed. Final status: {$leaveRequest->status}");
        });

        return redirect()->back()->with('success', 'Leave request approved successfully.');

    } catch (\Exception $e) {
        \Log::error('❌ Approval error: ' . $e->getMessage());
        \Log::error('📝 Stack trace: ' . $e->getTraceAsString());
        return redirect()->back()->with('error', 'Error approving leave: ' . $e->getMessage());
    }
}

// Helper method to calculate working days
private function calculateWorkingDays($startDate, $endDate)
{
    $start = new \DateTime($startDate);
    $end = new \DateTime($endDate);
    $workingDays = 0;

    for ($date = clone $start; $date <= $end; $date->modify('+1 day')) {
        $dayOfWeek = $date->format('N');
        if ($dayOfWeek < 6) { // Monday to Friday
            $workingDays++;
        }
    }

    return $workingDays;
}

// Show leave request details for Admin
public function showLeaveRequest($id)
{
    $leaveRequest = LeaveRequest::with([
            'leaveType',
            'employee.department',
            'employee.user',
            'details',
            'approvals.approver',
            'employee.leaveCreditLogs' => function($query) {
                $query->orderBy('created_at', 'desc');
            }
        ])
        ->findOrFail($id);

    // Calculate working days (excluding weekends)
    $workingDays = $this->calculateWorkingDays($leaveRequest->date_from, $leaveRequest->date_to);

    // Get leave balance information if available
    $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

    return Inertia::render('Admin/ShowLeaveRequest', [
        'leaveRequest' => $leaveRequest,
        'workingDays' => $workingDays,
        'leaveCredit' => $leaveCredit,
    ]);
}

/**
 * Check if all required approvals are complete for a leave request
 */
/**
 * Check if all required approvals are complete for a leave request
 */
private function isFullyApproved(LeaveRequest $leaveRequest)
{
    $isDeptHeadRequest = $leaveRequest->employee->user->role === 'dept_head' || 
                        $leaveRequest->is_dept_head_request;

    if ($isDeptHeadRequest) {
        // Department heads only need HR and Admin approval
        $requiredRoles = ['hr', 'admin'];
        \Log::info("👨‍💼 Department head request detected for leave ID {$leaveRequest->id}. Required roles: " . implode(', ', $requiredRoles));
    } else {
        // Regular employees need HR, Dept Head, and Admin approval
        $requiredRoles = ['hr', 'dept_head', 'admin'];
        \Log::info("👤 Regular employee request detected for leave ID {$leaveRequest->id}. Required roles: " . implode(', ', $requiredRoles));
    }

    // Count how many approvals are already completed for the required roles
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



/**
 * Admin recall leave request (only for Vacation Leave)
 */
/**
 * Admin recall leave request (only for Vacation Leave)
 */
/**
 * Admin recall leave request (only for Vacation Leave)
 */
public function recallLeaveRequest(Request $request, $id)
{
    \Log::info('👤 Admin recall attempt for leave request ID: ' . $id . ' by user: ' . auth()->user()->name);

    try {
        $leaveRequest = LeaveRequest::with(['leaveType', 'employee'])->findOrFail($id);
        
        // Check if this is a Vacation Leave request
        if ($leaveRequest->leaveType->code !== 'VL') {
            return redirect()->back()->with('error', 'Only Vacation Leave (VL) requests can be recalled.');
        }

        // Check if leave request is already recalled
        if ($leaveRequest->recalls()->where('status', 'approved')->exists()) {
            return redirect()->back()->with('error', 'This leave request has already been recalled.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'new_leave_date_from' => 'required|date|after_or_equal:today',
            'new_leave_date_to' => 'required|date|after_or_equal:new_leave_date_from'
        ]);

        DB::transaction(function () use ($leaveRequest, $validated, $id) {
            // Create recall record with new dates
            $recall = $leaveRequest->recalls()->create([
                'employee_id' => $leaveRequest->employee_id,
                'approved_leave_date' => $leaveRequest->date_from,
                'new_leave_date_from' => $validated['new_leave_date_from'],
                'new_leave_date_to' => $validated['new_leave_date_to'],
                'reason_for_change' => $validated['reason'],
                'status' => 'approved', // Admin recall is automatically approved
                'approved_by_depthead' => null, // Bypass department head approval
                'approved_by_hr' => null,       // Bypass HR approval
                'approved_by_admin' => auth()->id(), // Admin directly approves
            ]);

            // Restore leave credits
            $this->restoreLeaveCredits($leaveRequest);

            // Update leave request status to recalled
            $leaveRequest->update(['status' => 'recalled']);

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createLeaveRequestNotification(
                $leaveRequest->employee_id,
                'recalled',
                $id,
                $leaveRequest->leaveType->name ?? 'Leave',
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $validated['reason']
            );

            \Log::info("✅ Leave request ID: {$id} recalled by admin. New dates: {$validated['new_leave_date_from']} to {$validated['new_leave_date_to']}");
        });

        return redirect()->back()->with('success', 'Leave request recalled successfully. Leave credits have been restored.');

    } catch (\Exception $e) {
        \Log::error('❌ Recall error: ' . $e->getMessage());
        \Log::error('📝 Stack trace: ' . $e->getTraceAsString());
        return redirect()->back()->with('error', 'Error recalling leave: ' . $e->getMessage());
    }
}
/**
 * Restore leave credits for recalled leave request
 */
/**
 * Restore leave credits for recalled leave request
 */
private function restoreLeaveCredits(LeaveRequest $leaveRequest)
{
    $leaveTypeCode = $leaveRequest->leaveType->code;
    
    // Only restore credits for VL leave type
    if ($leaveTypeCode !== 'VL') {
        \Log::info("⏭️ Skipping credit restoration for non-VL leave type: {$leaveTypeCode}");
        return;
    }

    $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();
    
    if (!$leaveCredit) {
        \Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
        throw new \Exception('No leave credits found for this employee.');
    }

    // Calculate working days to restore
    $period = \Carbon\CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
    $workingDays = collect($period)->filter(function ($date) {
        return !$date->isWeekend();
    })->count();

    // Store balance before restoration
    $balanceBefore = $leaveCredit->vl_balance;

    // Restore VL credits
    $leaveCredit->vl_balance += $workingDays;
    $leaveCredit->last_updated = now();
    $leaveCredit->save();

    // Store balance after restoration
    $balanceAfter = $leaveCredit->vl_balance;

    // Log the restoration - USE THE CORRECT FIELD NAME
    LeaveCreditLog::create([
        'employee_id' => $leaveRequest->employee_id,
        'type' => 'VL',
        'date' => now(),
        'year' => now()->year,
        'month' => now()->month,
        'points_deducted' => -$workingDays, // Use negative value to indicate addition
        'balance_before' => $balanceBefore,
        'balance_after' => $balanceAfter,
        'remarks' => "Credits restored after admin recall of leave request ID #{$leaveRequest->id}",
    ]);

    \Log::info("✅ Restored {$workingDays} VL credits for employee {$leaveRequest->employee_id}. New balance: {$leaveCredit->vl_balance}");
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


}