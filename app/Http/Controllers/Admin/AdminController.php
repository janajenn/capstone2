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
use App\Models\CreditConversion;
use App\Services\CreditConversionService;


class AdminController extends Controller
{

    protected $creditConversionService;


    public function __construct(CreditConversionService $creditConversionService, NotificationService $notificationService)
    {
        $this->creditConversionService = $creditConversionService;
        $this->notificationService = $notificationService;
    }


    // In AdminController.php - leaveRequests method
    public function leaveRequests(Request $request)
    {
        $status = $request->get('status', 'pending_to_admin');
        $search = $request->get('search');
        $department = $request->get('department');
        $perPage = 10;
    
        $currentApprover = User::getCurrentApprover();
    
        if (!$currentApprover || $currentApprover->id !== auth()->id()) {
            return Inertia::render('Admin/Unauthorized', [
                'message' => 'You are not currently authorized to approve leave requests.',
                'currentApprover' => $currentApprover ? [
                    'name' => $currentApprover->name,
                    'is_primary' => $currentApprover->is_primary
                ] : null
            ]);
        }
    
        // DEBUG: Check what's happening with pending_admin requests
        $allPendingAdmin = LeaveRequest::with([
            'employee.user', 
            'approvals' => function($q) {
                $q->whereIn('role', ['hr', 'dept_head', 'admin']);
            }
        ])
        ->where('status', 'pending_admin')
        ->get();
    
        \Log::info("DEBUG - All pending_admin requests before filtering:", [
            'total' => $allPendingAdmin->count(),
            'requests' => $allPendingAdmin->map(function($req) {
                return [
                    'id' => $req->id,
                    'employee' => $req->employee->firstname . ' ' . $req->employee->lastname,
                    'employee_role' => $req->employee->user->role,
                    'approvals_count' => $req->approvals->count(),
                    'hr_approved' => $req->approvals->where('role', 'hr')->where('status', 'approved')->count() > 0,
                    'dept_head_approved' => $req->approvals->where('role', 'dept_head')->where('status', 'approved')->count() > 0,
                    'admin_approved' => $req->approvals->where('role', 'admin')->count() > 0,
                ];
            })
        ]);
    
        $query = LeaveRequest::with([
            'employee.user',
            'employee.department:id,name',
            'leaveType:id,name,code',
            'approvals' => function ($q) {
                $q->whereIn('role', ['hr', 'dept_head', 'admin'])
                  ->orderBy('created_at', 'desc');
            },
            'recalls'
        ]);
    
        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($q2) use ($search) {
                    $q2->where('firstname', 'like', "%{$search}%")
                       ->orWhere('lastname', 'like', "%{$search}%")
                       ->orWhere('position', 'like', "%{$search}%");
                })->orWhereHas('leaveType', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%");
                });
            });
        }
    
        // Apply department filter
        if ($department) {
            $query->whereHas('employee', function ($q) use ($department) {
                $q->where('department_id', $department);
            });
        }
    
        // Apply status filter
        switch ($status) {
            case 'pending_to_admin':
                $query->where(function ($q) {
                    $q->where(function ($q2) {
                        // Regular employees: Approved by HR and Dept Head, waiting for Admin
                        $q2->where('status', 'pending_admin')
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'hr')->where('status', 'approved');
                           })
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'dept_head')->where('status', 'approved');
                           })
                           ->whereHas('employee.user', function ($q3) {
                               $q3->where('role', 'employee');
                           });
                    })->orWhere(function ($q2) {
                        // Department heads: Approved by HR only, waiting for Admin
                        $q2->where('status', 'pending_admin')
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'hr')->where('status', 'approved');
                           })
                           ->whereHas('employee.user', function ($q3) {
                               $q3->where('role', 'dept_head');
                           });
                    })->orWhere(function ($q2) {
                        // Admins: Approved by HR only, waiting for Admin
                        $q2->where('status', 'pending_admin')
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'hr')->where('status', 'approved');
                           })
                           ->whereHas('employee.user', function ($q3) {
                               $q3->where('role', 'admin');
                           });
                    })->orWhere(function ($q2) {
                        // Approved by HR and Dept Head, waiting for Admin
                        $q2->where('status', 'pending_admin')
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'hr')->where('status', 'approved');
                           })
                           ->whereHas('approvals', function ($q3) {
                               $q3->where('role', 'dept_head')->where('status', 'approved');
                           })
                           ->whereHas('employee.user', function ($q3) {
                               $q3->where('role', 'hr'); // For HR role employees
                           });
                    });
                })->whereDoesntHave('approvals', function ($q) {
                    $q->where('role', 'admin');
                });
                break;
    
            case 'dept_head_requests':
                $query->where('status', 'pending_admin')
                      ->whereHas('employee.user', function ($q) {
                          $q->where('role', 'dept_head');
                      })
                      ->whereHas('approvals', function ($q) {
                          $q->where('role', 'hr')->where('status', 'approved');
                      });
                break;
    
            case 'approved':
                $query->where('status', 'approved')
                      ->whereHas('approvals', function ($q) {
                          $q->where('role', 'admin')->where('status', 'approved');
                      });
                break;
    
            case 'rejected':
                $query->where('status', 'rejected')
                      ->whereHas('approvals', function ($q) {
                          $q->where('role', 'admin')->where('status', 'rejected');
                      });
                break;
    
            case 'recalled':
                $query->where('status', 'recalled')
                      ->whereHas('recalls');
                break;
        }
    
        // DEBUG: Log the final query results
        $finalQueryCount = $query->count();
        \Log::info("DEBUG - Final query results:", [
            'status_filter' => $status,
            'final_count' => $finalQueryCount,
            'search_term' => $search,
            'department_filter' => $department
        ]);
    
        $paginatedRequests = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(function ($request) {
                $isDeptHead = $request->employee->user->role === 'dept_head';
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
                    'recall_data' => $recallData ? [
                        'reason' => $recallData->reason_for_change,
                        'new_date_from' => $recallData->new_leave_date_from,
                        'new_date_to' => $recallData->new_leave_date_to,
                        'recalled_at' => $recallData->created_at,
                        'recalled_by' => $recallData->approved_by_admin
                    ] : null
                ];
            });
    
        return Inertia::render('Admin/LeaveRequests', [
            'leaveRequests' => $paginatedRequests,
            'filters' => $request->only(['status', 'search', 'department']),
            'currentApprover' => [
                'name' => $currentApprover->name,
                'is_primary' => $currentApprover->is_primary
            ],
            'isActiveApprover' => auth()->user()->isActiveApprover(),
            'departments' => Department::select('id', 'name')->get(),
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
            if ($leaveRequest->status === 'approved') {
                // Get leave type code to determine which service to use
                $leaveTypeCode = $leaveRequest->leaveType->code;
                
                // ✅ ADD DEBUG LOGGING HERE
                \Log::info("🔍 DEBUG - Leave Request Details Before Deduction:");
                \Log::info("  - Leave ID: " . $leaveRequest->id);
                \Log::info("  - Date From: " . $leaveRequest->date_from);
                \Log::info("  - Date To: " . $leaveRequest->date_to);
                \Log::info("  - Selected Dates: " . json_encode($leaveRequest->selected_dates));
                \Log::info("  - Total Days in DB: " . $leaveRequest->total_days);
                \Log::info("  - Leave Type: " . $leaveTypeCode);
                
                // In your admin approve method:
                if (in_array($leaveTypeCode, ['SL', 'VL'])) {
                    // Process SL/VL leave types using LeaveCreditService
                    $leaveCreditService = new LeaveCreditService();
                    $result = $leaveCreditService->deductLeaveCredits($leaveRequest);
    
    // Log the result
    if (is_array($result) && isset($result['success']) && $result['success']) {
        \Log::info("✅ Leave credits processed for {$leaveTypeCode}. Deducted: {$result['days_deducted']}, Without Pay: {$result['days_without_pay']}");
    }

                    
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

    return Inertia::render('Admin/ShowLeaveRequest', [
        'leaveRequest' => $leaveRequest,
        'selectedDates' => $selectedDates, // Pass selected dates to frontend
        'selectedDatesCount' => $selectedDatesCount,
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
// In AdminController - update the isFullyApproved method:

private function isFullyApproved(LeaveRequest $leaveRequest)
{
    $isDeptHeadRequest = $leaveRequest->employee->user->role === 'dept_head' || 
                        $leaveRequest->is_dept_head_request;
    $isAdminRequest = $leaveRequest->employee->user->role === 'admin';

    if ($isDeptHeadRequest || $isAdminRequest) {
        // Department heads AND Admins only need HR and Admin approval
        $requiredRoles = ['hr', 'admin'];
        $requestType = $isDeptHeadRequest ? 'Department head' : 'Admin';
        \Log::info("👨‍💼 {$requestType} request detected for leave ID {$leaveRequest->id}. Required roles: " . implode(', ', $requiredRoles));
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
    // Get filter values from request
    $year = $request->year ?? now()->year;
    $month = $request->month ?? null;
    
    // Get available years for filter dropdown
    $availableYears = $this->getAvailableYears();

    // Get pending leave requests count with filters
    $pendingQuery = LeaveRequest::where('status', 'pending');
    if ($month) {
        $pendingQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
    } else {
        $pendingQuery->whereYear('created_at', $year);
    }
    $pendingCount = $pendingQuery->count();

    // Get recent leave requests with filters
    $recentQuery = LeaveRequest::with(['leaveType', 'employee.department'])
        ->orderBy('created_at', 'desc')
        ->limit(5);
    
    if ($month) {
        $recentQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
    } else {
        $recentQuery->whereYear('created_at', $year);
    }
    $recentRequests = $recentQuery->get();

    // Get leave requests by status with filters
    $statusQuery = LeaveRequest::selectRaw('status, count(*) as count');
    if ($month) {
        $statusQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
    } else {
        $statusQuery->whereYear('created_at', $year);
    }
    $statusResults = $statusQuery->groupBy('status')->get();
    
    $requestsByStatus = [
        'pending' => $statusResults->where('status', 'pending')->first()->count ?? 0,
        'approved' => $statusResults->where('status', 'approved')->first()->count ?? 0,
        'rejected' => $statusResults->where('status', 'rejected')->first()->count ?? 0,
    ];

    // 🔔 UPDATED: Get pending approvals counts (matches leaveRequests page logic)
    $pendingLeaveRequestsCount = LeaveRequest::where(function ($q) {
        $q->where(function ($q2) {
            // Regular employees: Approved by HR and Dept Head, waiting for Admin
            $q2->where('status', 'pending_admin')
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'hr')->where('status', 'approved');
               })
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'dept_head')->where('status', 'approved');
               })
               ->whereHas('employee.user', function ($q3) {
                   $q3->where('role', 'employee');
               });
        })->orWhere(function ($q2) {
            // Department heads: Approved by HR only, waiting for Admin
            $q2->where('status', 'pending_admin')
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'hr')->where('status', 'approved');
               })
               ->whereHas('employee.user', function ($q3) {
                   $q3->where('role', 'dept_head');
               });
        })->orWhere(function ($q2) {
            // Admins: Approved by HR only, waiting for Admin
            $q2->where('status', 'pending_admin')
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'hr')->where('status', 'approved');
               })
               ->whereHas('employee.user', function ($q3) {
                   $q3->where('role', 'admin');
               });
        })->orWhere(function ($q2) {
            // ✅ ADDED: HR employees: Approved by HR and Dept Head, waiting for Admin
            $q2->where('status', 'pending_admin')
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'hr')->where('status', 'approved');
               })
               ->whereHas('approvals', function ($q3) {
                   $q3->where('role', 'dept_head')->where('status', 'approved');
               })
               ->whereHas('employee.user', function ($q3) {
                   $q3->where('role', 'hr'); // For HR role employees
               });
        });
    })->whereDoesntHave('approvals', function ($q) {
        $q->where('role', 'admin');
    })->count();

    $pendingCreditConversionsCount = CreditConversion::where('status', 'dept_head_approved')->count();

    // Analytics data for the dashboard
    $totalEmployees = Employee::count();
    $totalDepartments = Department::count();
    $totalUsers = User::count();
    $totalHRUsers = User::where('role', 'hr')->count();

    // Fully approved and rejected requests with filters
    $approvedQuery = LeaveRequest::where('status', 'approved');
    $rejectedQuery = LeaveRequest::where('status', 'rejected');
    
    if ($month) {
        $approvedQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
        $rejectedQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
    } else {
        $approvedQuery->whereYear('created_at', $year);
        $rejectedQuery->whereYear('created_at', $year);
    }
    
    $fullyApprovedRequests = $approvedQuery->count();
    $rejectedRequests = $rejectedQuery->count();

    // Employee status counts (no date filter needed)
    $activeEmployees = Employee::where('status', 'active')->count();
    $inactiveEmployees = Employee::where('status', 'inactive')->count();

    // Leave type statistics with filters
    $leaveTypeQuery = LeaveRequest::with('leaveType')
        ->selectRaw('leave_type_id, count(*) as count');
    
    if ($month) {
        $leaveTypeQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
    } else {
        $leaveTypeQuery->whereYear('created_at', $year);
    }
    
    $leaveTypeStats = $leaveTypeQuery->groupBy('leave_type_id')
        ->get()
        ->map(function ($item) {
            return [
                'name' => $item->leaveType->name ?? 'Unknown',
                'count' => $item->count
            ];
        });

    // Monthly statistics (for the selected year)
    $monthlyQuery = LeaveRequest::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
        ->whereYear('created_at', $year);
    
    if ($month) {
        // If specific month is selected, show daily data instead
        $monthlyStats = LeaveRequest::selectRaw('DATE(created_at) as day, count(*) as count')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => date('M d', strtotime($item->day)),
                    'count' => $item->count
                ];
            });
    } else {
        // Show monthly data for the year
        $monthlyStats = $monthlyQuery->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => date('M Y', strtotime($item->month . '-01')),
                    'count' => $item->count
                ];
            });
    }

    // Department statistics with filters
    $departmentQuery = LeaveRequest::with('employee.department')
        ->selectRaw('employees.department_id, count(*) as count')
        ->join('employees', 'leave_requests.employee_id', '=', 'employees.employee_id');
    
    if ($month) {
        $departmentQuery->whereMonth('leave_requests.created_at', $month)->whereYear('leave_requests.created_at', $year);
    } else {
        $departmentQuery->whereYear('leave_requests.created_at', $year);
    }
    
    $departmentStats = $departmentQuery->groupBy('employees.department_id')
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
        
        // 🔔 UPDATED: Pending approvals data (now matches leaveRequests page)
        'pendingLeaveRequestsCount' => $pendingLeaveRequestsCount,
        'pendingCreditConversionsCount' => $pendingCreditConversionsCount,
        
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
        'availableYears' => $availableYears,
        'currentYear' => $year,
        'currentMonth' => $month,
        'filters' => $request->only(['year', 'month']),
    ]);
}

/**
 * Get available years for filtering
 */
private function getAvailableYears()
{
    $currentYear = now()->year;
    $years = [];
    
    // Get the earliest leave request year
    $earliestRequest = LeaveRequest::orderBy('created_at')->first();
    $startYear = $earliestRequest ? $earliestRequest->created_at->year : $currentYear - 2;
    
    for ($i = $startYear; $i <= $currentYear + 1; $i++) {
        $years[] = $i;
    }
    
    return $years;
}

    /**
     * Get available years for filtering
     */
   
/**
 * Get available years for filtering
 */

    
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
    $year = $request->input('year', now()->year);
    $month = $request->input('month');
    $day = $request->input('day');

    // Define the filter period for overlapping leaves
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

    // Get fully approved leave requests for the specified period
    $query = LeaveRequest::where('status', 'approved')
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->where('date_to', '>=', $startDate)
        ->where('date_from', '<=', $endDate)
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
        'filters' => $request->only(['year', 'month', 'day', 'department', 'leave_type']),
        'currentYear' => $year,
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
/**
 * Admin recall leave request (only for Vacation Leave) - Simplified version
 */
/**
 * Admin recall leave request (only for Vacation Leave) - Simplified version
 */
/**
 * Admin recall leave request (only for Vacation Leave) - Simplified version
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
        ]);

        DB::transaction(function () use ($leaveRequest, $validated, $id) {
            // Create simplified recall record
            $recall = $leaveRequest->recalls()->create([
                'employee_id' => $leaveRequest->employee_id,
                'approved_leave_date' => $leaveRequest->date_from,
                'status' => 'approved',
                'approved_by_admin' => auth()->id(),
                'reason' => $validated['reason'],
            ]);

            // Restore leave credits - ONLY DAYS WITH PAY
            $restorationResult = $this->restoreLeaveCredits($leaveRequest);

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

            $daysRestored = $restorationResult['days_restored'] ?? 0;
            $daysWithoutPay = $restorationResult['days_without_pay_ignored'] ?? 0;
            
            \Log::info("✅ Leave request ID: {$id} recalled by admin. Restored {$daysRestored} credits, ignored {$daysWithoutPay} days without pay.");
        });

        return redirect()->back()->with('success', 'Leave request recalled successfully. Only days with pay have been restored to leave credits.');

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
/**
 * Restore leave credits for recalled leave request - CORRECTED VERSION
 * Only restores the days that were actually deducted (days with pay)
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

    // Get the actual days that were deducted (days with pay)
    $daysToRestore = $leaveRequest->days_with_pay ?? 0;
    $daysWithoutPay = $leaveRequest->days_without_pay ?? 0;
    $totalDays = $leaveRequest->total_days ?? ($daysToRestore + $daysWithoutPay);

    \Log::info("📊 Recall analysis for leave ID {$leaveRequest->id}:");
    \Log::info("   - Total days: {$totalDays}");
    \Log::info("   - Days with pay: {$daysToRestore}");
    \Log::info("   - Days without pay: {$daysWithoutPay}");

    // If no days were with pay, nothing to restore
    if ($daysToRestore <= 0) {
        \Log::info("⏭️ No days with pay to restore for recalled leave request ID: {$leaveRequest->id}");
        return;
    }

    // Store balance before restoration
    $balanceBefore = $leaveCredit->vl_balance;

    // Restore only the VL credits that were actually deducted (days with pay)
    $leaveCredit->vl_balance += $daysToRestore;
    $leaveCredit->last_updated = now();
    $leaveCredit->save();

    // Store balance after restoration
    $balanceAfter = $leaveCredit->vl_balance;

    // Log the restoration
    LeaveCreditLog::create([
        'employee_id' => $leaveRequest->employee_id,
        'type' => 'VL',
        'date' => now(),
        'year' => now()->year,
        'month' => now()->month,
        'points_deducted' => -$daysToRestore, // Use negative value to indicate addition
        'balance_before' => $balanceBefore,
        'balance_after' => $balanceAfter,
        'remarks' => "Credits restored after admin recall of leave request ID #{$leaveRequest->id}. Restored {$daysToRestore} days (with pay) out of {$totalDays} total days. {$daysWithoutPay} days without pay were not restored.",
    ]);

    \Log::info("✅ Successfully restored {$daysToRestore} VL credits for employee {$leaveRequest->employee_id}");
    \Log::info("💰 Balance before: {$balanceBefore}, After: {$balanceAfter}, Net change: +{$daysToRestore}");
    \Log::info("📝 Note: {$daysWithoutPay} days without pay were NOT restored (as expected)");

    return [
        'days_restored' => $daysToRestore,
        'days_without_pay_ignored' => $daysWithoutPay,
        'balance_before' => $balanceBefore,
        'balance_after' => $balanceAfter
    ];
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


//clickable stats card

// Employees Management
public function employeesIndex(Request $request)
{
    $perPage = 10;
    
    $employees = Employee::with(['department', 'user'])
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                  ->orWhere('lastname', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        })
        ->orderBy('firstname')
        ->orderBy('lastname')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/Employees/Index', [
        'employees' => $employees,
        'filters' => $request->only(['search']),
        'pageTitle' => 'All Employees',
        'totalCount' => Employee::count(),
        'activeCount' => Employee::where('status', 'active')->count(),
        'inactiveCount' => Employee::where('status', 'inactive')->count(),
    ]);
}

public function activeEmployees(Request $request)
{
    $perPage = 10;
    
    $employees = Employee::with(['department', 'user'])
        ->where('status', 'active')
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                  ->orWhere('lastname', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        })
        ->orderBy('firstname')
        ->orderBy('lastname')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/Employees/Index', [
        'employees' => $employees,
        'filters' => $request->only(['search']),
        'pageTitle' => 'Active Employees',
        'totalCount' => Employee::where('status', 'active')->count(),
        'activeCount' => Employee::where('status', 'active')->count(),
        'inactiveCount' => Employee::where('status', 'inactive')->count(),
    ]);
}

public function inactiveEmployees(Request $request)
{
    $perPage = 10;
    
    $employees = Employee::with(['department', 'user'])
        ->where('status', 'inactive')
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                  ->orWhere('lastname', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        })
        ->orderBy('firstname')
        ->orderBy('lastname')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/Employees/Index', [
        'employees' => $employees,
        'filters' => $request->only(['search']),
        'pageTitle' => 'Inactive Employees',
        'totalCount' => Employee::where('status', 'inactive')->count(),
        'activeCount' => Employee::where('status', 'active')->count(),
        'inactiveCount' => Employee::where('status', 'inactive')->count(),
    ]);
}

// Users Management
public function usersIndex(Request $request)
{
    $perPage = 10;
    
    $users = User::with(['employee.department'])
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($q) use ($search) {
                      $q->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('biometric_id', 'like', "%{$search}%");
                  });
            });
        })
        ->orderBy('name')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/Users/Index', [
        'users' => $users,
        'filters' => $request->only(['search']),
        'pageTitle' => 'All System Users',
        'totalCount' => User::count(),
    ]);
}

public function hrUsers(Request $request)
{
    $perPage = 10;
    
    $users = User::with(['employee.department'])
        ->where('role', 'hr')
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('employee', function ($q) use ($search) {
                      $q->where('firstname', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('biometric_id', 'like', "%{$search}%");
                  });
            });
        })
        ->orderBy('name')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/Users/Index', [
        'users' => $users,
        'filters' => $request->only(['search']),
        'pageTitle' => 'HR Users',
        'totalCount' => User::where('role', 'hr')->count(),
    ]);
}

// Leave Requests
public function fullyApprovedRequests(Request $request)
{
    \Log::info('fullyApprovedRequests method called');
    
    // Temporary: Check what's being returned
    try {
        $perPage = 10;
        
        $leaveRequests = LeaveRequest::with([
                'employee.department',
                'leaveType',
                'approvals' => function($q) {
                    $q->whereIn('role', ['hr', 'dept_head', 'admin'])
                      ->orderBy('created_at', 'desc');
                }
            ])
            ->where('status', 'approved')
            ->whereHas('approvals', function($q) {
                $q->where('role', 'admin')->where('status', 'approved');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        \Log::info('Query successful', ['count' => $leaveRequests->count()]);

        $response = Inertia::render('Admin/LeaveRequests/Approved', [
            'leaveRequests' => $leaveRequests,
            'filters' => $request->only(['search']),
            'pageTitle' => 'Fully Approved Leave Requests',
            'totalCount' => $leaveRequests->total(),
        ]);

        \Log::info('Inertia response created successfully');
        return $response;

    } catch (\Exception $e) {
        \Log::error('Error in fullyApprovedRequests: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        // Return a simple error page
        return Inertia::render('Admin/Error', [
            'error' => $e->getMessage()
        ]);
    }
}

public function rejectedRequests(Request $request)
{
    $perPage = 10;
    
    $leaveRequests = LeaveRequest::with([
            'employee.department',
            'leaveType',
            'approvals' => function($q) {
                $q->whereIn('role', ['hr', 'dept_head', 'admin'])
                  ->orderBy('created_at', 'desc');
            }
        ])
        ->where('status', 'rejected')
        ->whereHas('approvals', function($q) {
            $q->where('role', 'admin')->where('status', 'rejected');
        })
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($q) use ($search) {
                    $q->where('firstname', 'like', "%{$search}%")
                      ->orWhere('lastname', 'like', "%{$search}%");
                })
                ->orWhereHas('leaveType', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        })
        ->orderBy('created_at', 'desc')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('Admin/LeaveRequests/Rejected', [
        'leaveRequests' => $leaveRequests,
        'filters' => $request->only(['search']),
        'pageTitle' => 'Rejected Leave Requests',
        'totalCount' => LeaveRequest::where('status', 'rejected')
            ->whereHas('approvals', function($q) {
                $q->where('role', 'admin')->where('status', 'rejected');
            })->count(),
    ]);
}

// Departments
public function departmentsIndex(Request $request)
{
    $perPage = 10;
    
    $departments = Department::with(['employees.user'])
        ->when($request->search, function ($query, $search) {
            return $query->where('name', 'like', "%{$search}%");
        })
        ->orderBy('name')
        ->paginate($perPage)
        ->withQueryString();

    // Get department heads
    $departmentHeads = User::where('role', 'dept_head')
        ->with('employee.department')
        ->get()
        ->mapWithKeys(function ($user) {
            return [$user->employee->department_id => $user->name];
        });

    return Inertia::render('Admin/Departments/Index', [
        'departments' => $departments,
        'departmentHeads' => $departmentHeads,
        'filters' => $request->only(['search']),
        'pageTitle' => 'All Departments',
        'totalCount' => Department::count(),
    ]);
}



// Add these methods to your existing AdminController class



/**
 * Display credit conversion requests for Admin approval
 */




 public function creditConversions(Request $request)
 {
     $perPage = 10;
     $adminUserId = auth()->id();
     
     // Only show requests that are approved by Department Head (ready for Admin)
     $query = CreditConversion::with([
             'employee.department', 
             'hrApprover', 
             'deptHeadApprover', 
             'adminApprover'
         ])
         ->where('status', 'dept_head_approved') // Only show Dept Head approved requests to Admin
         ->when($request->status, function ($query, $status) {
             if ($status === 'pending_admin') {
                 return $query->where('status', 'dept_head_approved');
             } elseif ($status === 'fully_approved') {
                 return $query->where('status', 'admin_approved');
             } elseif ($status === 'rejected') {
                 return $query->where('status', 'rejected');
             }
             return $query;
         })
         ->when($request->employee, function ($query, $employee) {
             return $query->whereHas('employee', function ($q) use ($employee) {
                 $q->where('firstname', 'like', "%{$employee}%")
                   ->orWhere('lastname', 'like', "%{$employee}%");
             });
         })
         ->orderBy('submitted_at', 'desc');
 
     $conversions = $query->paginate($perPage)->withQueryString();
 
     // Transform conversions with status mapping
     $transformedConversions = $conversions->getCollection()->map(function ($conversion) {
         return $this->transformConversionData($conversion);
     });
 
     $conversions->setCollection($transformedConversions);
 
     // Get statistics - Admin specific
     $totalRequests = CreditConversion::where('status', 'dept_head_approved')->count(); // Only requests that reached admin
     $pendingAdminRequests = CreditConversion::where('status', 'dept_head_approved')->count();
     
     // For approved by current admin, check admin_approved_by column
     $approvedByAdminRequests = CreditConversion::where('status', 'admin_approved')
         ->where('admin_approved_by', $adminUserId)
         ->count();
     
     // For rejected requests, we need to determine who rejected it based on your business logic
     // Since you don't have a rejected_by column, we'll assume admin rejects are tracked differently
     // Let's check if the request was rejected and has admin_remarks (indicating admin rejection)
     $rejectedByAdminRequests = CreditConversion::where('status', 'rejected')
         ->whereNotNull('admin_remarks') // Assuming admin remarks indicate admin rejection
         ->count();
 
     return Inertia::render('Admin/CreditConversions', [
         'conversions' => $conversions,
         'stats' => [
             'total' => $totalRequests,
             'pending' => $pendingAdminRequests,
             'approved' => $approvedByAdminRequests,
             'rejected' => $rejectedByAdminRequests,
         ],
         'filters' => $request->only(['status', 'employee']),
     ]);
 }
 
 /**
  * Admin approves credit conversion request (FINAL APPROVAL)
  */
 public function approveCreditConversion(Request $request, $id)
 {
     try {
         \Log::info('=== ADMIN APPROVAL START ===');
         
         $conversionBefore = CreditConversion::find($id);
         
         // Verify this request is actually pending admin approval
         if ($conversionBefore->status !== 'dept_head_approved') {
             return back()->with('error', 'This request is not ready for admin approval.');
         }
 
         \Log::info('Conversion before admin approval', [
             'id' => $conversionBefore->conversion_id,
             'status' => $conversionBefore->status,
         ]);
 
         // NO REMARKS VALIDATION FOR APPROVAL
         $conversion = $this->creditConversionService->adminApproveConversion(
             $id,
             $request->user()->id,
             null // No remarks for approval
         );
 
         // Verify the conversion was updated
         $conversionAfter = CreditConversion::find($id);
         \Log::info('Conversion after admin approval', [
             'status' => $conversionAfter->status,
             'admin_approved_by' => $conversionAfter->admin_approved_by,
         ]);
 
         \Log::info('Admin Approval Successful');
 
         return redirect()->route('admin.credit-conversions')
             ->with('success', 'Credit conversion request approved successfully! Credits have been deducted.');
         
     } catch (\Exception $e) {
         \Log::error('Admin Approval Failed', [
             'conversion_id' => $id,
             'error' => $e->getMessage(),
         ]);
 
         return back()->with('error', 'Failed to approve conversion: ' . $e->getMessage());
     }
 }
 
 /**
  * Admin rejects credit conversion request
  */
 public function rejectCreditConversion(Request $request, $id)
 {
     // Remarks still required for rejection
     $validated = $request->validate([
         'remarks' => ['required', 'string', 'max:500'],
     ]);
 
     try {
         $conversionBefore = CreditConversion::find($id);
         
         // Verify this request is actually pending admin approval
         if ($conversionBefore->status !== 'dept_head_approved') {
             return back()->with('error', 'This request is not ready for admin action.');
         }
 
         $conversion = $this->creditConversionService->rejectConversion(
             $id,
             $request->user()->id,
             $validated['remarks'],
             'admin' // Rejected by Admin
         );
 
         return redirect()->route('admin.credit-conversions')
             ->with('success', 'Credit conversion request rejected successfully!');
     } catch (\Exception $e) {
         return back()->withErrors(['error' => $e->getMessage()]);
     }
 }
/**
 * Show specific credit conversion request details for Admin
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

    return Inertia::render('Admin/ShowCreditConversion', [
        'conversion' => $transformedConversion,
    ]);
}

/**
 * Admin approves credit conversion request (FINAL APPROVAL)
 */


/**
 * Admin rejects credit conversion request
 */

/**
 * Transform conversion data for display
 */
private function transformConversionData($conversion)
{
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

}