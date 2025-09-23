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

class AdminController extends Controller
{
    public function leaveRequests(Request $request)
    {
        $filters = $request->only(['status']);
        
        // Get current approver using static method
        $currentApprover = User::getCurrentApprover();
        
        // Check if current user is authorized to view leave requests
        if (!$currentApprover || $currentApprover->id !== auth()->id()) {
            return Inertia::render('Admin/Unauthorized', [
                'message' => 'You are not currently authorized to approve leave requests.',
                'currentApprover' => $currentApprover ? $currentApprover->name : 'No active approver'
            ]);
        }

        $leaveRequests = LeaveRequest::with([
                'employee.user',
                'employee.department:id,name',
                'leaveType:id,name',
                'approvals' => function($q) {
                    $q->whereIn('role', ['hr', 'dept_head', 'admin']);
                }
            ])
            ->when(isset($filters['status']) && $filters['status'] !== 'all', function($query) use ($filters) {
                switch ($filters['status']) {
                    case 'pending':
                        $query->where(function($q) {
                            $q->where('status', 'approved')
                              ->whereDoesntHave('approvals', function($subQ) {
                                  $subQ->where('role', 'admin');
                              });
                        })->orWhere(function($q) {
                            $q->where('status', 'pending')
                              ->whereHas('approvals', function($subQ) {
                                  $subQ->where('role', 'hr')->where('status', 'approved');
                              })
                              ->whereHas('approvals', function($subQ) {
                                  $subQ->where('role', 'dept_head')->where('status', 'approved');
                              });
                        });
                        break;
                    case 'approved_by_admin':
                        $query->whereHas('approvals', function($q) {
                            $q->where('role', 'admin')->where('status', 'approved');
                        })->where('status', '!=', 'rejected');
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
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                    'status' => $request->status,
                    'total_days' => $request->total_days,
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
            'leaveRequests' => $leaveRequests,
            'filters' => $filters,
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

                // Check if all approvals are complete
                $isFullyApproved = $this->isFullyApproved($leaveRequest);

                // Always set status to 'approved'
                $leaveRequest->status = 'approved';
                $leaveRequest->save();

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
                    // Process leave credit deduction
                    $leaveCreditService = new LeaveCreditService();
                    $result = $leaveCreditService->deductLeaveCredits($leaveRequest);
                }
            });

            return redirect()->back()->with('success', 'Leave request approved successfully.');

        } catch (\Exception $e) {
            \Log::error('❌ Approval error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error approving leave: ' . $e->getMessage());
        }
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

        // Check for existing active delegation
        $existingDelegation = DelegatedApprover::active()->first();
        if ($existingDelegation) {
            return redirect()->back()->with('error', 
                'There is already an active delegation. Please end it first before creating a new one.'
            );
        }

        DB::transaction(function () use ($validated, $currentUser) {
            $delegation = DelegatedApprover::create([
                'from_admin_id' => $currentUser->id,
                'to_admin_id' => $validated['to_admin_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'reason' => $validated['reason'] ?? null,
                'status' => 'active'
            ]);

            // Send notification to the delegated admin (implement this in NotificationService if needed)
            // $notificationService = new NotificationService();
            // $notificationService->createDelegationNotification(...);
        });

        return redirect()->back()->with('success', 'Approval authority delegated successfully.');
    }

    public function dashboard(Request $request)
    {
        // Check if user is authorized to view dashboard
        $currentApprover = User::getCurrentApprover();
        
        // Only show leave requests if user is the current approver
        $leaveRequests = [];
        if ($currentApprover && $currentApprover->id === auth()->id()) {
            $leaveRequests = LeaveRequest::with([
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
                })
                ->orderBy('created_at', 'desc')
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
                        'dept_head_approval' => $request->approvals->firstWhere('role', 'dept_head'),
                        'hr_approval' => $request->approvals->firstWhere('role', 'hr'),
                    ];
                });
        }

        return Inertia::render('Admin/Dashboard', [
            'leaveRequests' => $leaveRequests,
            'currentApprover' => $currentApprover,
            'isActiveApprover' => auth()->user()->isActiveApprover(),
        ]);
    }

    protected function deductLeaveCredits($leaveRequest)
    {
        $employeeId = $leaveRequest->employee_id;
        $type = $leaveRequest->leave_type;

        // Calculate working days (excluding weekends)
        $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
        $workingDays = collect($period)->filter(function ($date) {
            return !$date->isWeekend();
        })->count();

        \Log::info('Working days to deduct: ' . $workingDays);

        // Get leave credit record
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        if (!$leaveCredit) {
            \Log::error('No leave credits found for employee: ' . $employeeId);
            throw new \Exception('No leave credits found for this employee.');
        }

        \Log::info('Current leave credits - SL: ' . $leaveCredit->sl_balance . ', VL: ' . $leaveCredit->vl_balance);

        // Deduct based on type
        if ($type === 'SL') {
            $leaveCredit->sl_balance -= $workingDays;
        } elseif ($type === 'VL') {
            $leaveCredit->vl_balance -= $workingDays;
        }

        $leaveCredit->last_updated = now();
        $leaveCredit->save();

        \Log::info('Updated leave credits - SL: ' . $leaveCredit->sl_balance . ', VL: ' . $leaveCredit->vl_balance);

        // Log the deduction
        LeaveCreditLog::create([
            'employee_id' => $employeeId,
            'type' => $type,
            'month' => now()->month,
            'year' => now()->year,
            'dates_deducted' => $period->filter(fn($date) => !$date->isWeekend())->implode(', '),
            'points_deducted' => $workingDays,
            'remaining_balance' => $type === 'SL' ? $leaveCredit->sl_balance : $leaveCredit->vl_balance,
            'remarks' => 'Auto deducted after Admin approval of leave request ID #' . $leaveRequest->id,
        ]);

        \Log::info('Created leave credit log entry');
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
    
        return Inertia::render('Admin/Delegation/Index', [
            'delegations' => $delegations,
            'availableAdmins' => $availableAdmins,
            'activeDelegation' => $activeDelegation,
            'canDelegate' => $currentUser->canDelegateApproval(),
            'isPrimaryAdmin' => $currentUser->is_primary,
            'currentUser' => $currentUser,
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

    // Helper method to check if all approvals are complete
    private function isFullyApproved(LeaveRequest $leaveRequest)
    {
        $approvals = $leaveRequest->approvals()->get();
        $hrApproved = $approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
        $deptHeadApproved = $approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
        $adminApproved = $approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();

        return $hrApproved && $deptHeadApproved && $adminApproved;
    }
}