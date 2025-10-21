<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\LeaveCredit;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestDetail;
use App\Models\CreditConversion;
use App\Services\CreditConversionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Models\User;
use Illuminate\Pagination\Paginator;
use App\Services\NotificationService;
use App\Models\LeaveApproval;




class EmployeeController extends Controller
{


    protected $notificationService;
    protected $creditConversionService;

    // ADD THIS CONSTRUCTOR
    public function __construct(NotificationService $notificationService, CreditConversionService $creditConversionService)
    {
        $this->notificationService = $notificationService;
        $this->creditConversionService = $creditConversionService;
    }

 public function dashboard(Request $request)
{
    $user = $request->user()->load(['employee.department']);
    $employeeId = $user->employee?->employee_id;
    $leaveCredit = $employeeId ? LeaveCredit::where('employee_id', $employeeId)->first() : null;

    // Get the latest leave request with approvals
    $latestLeaveRequest = null;
    if ($employeeId) {
        $latestLeaveRequest = LeaveRequest::with(['leaveType', 'approvals'])
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->first();
    }

    return Inertia::render('Employee/Dashboard', [
        'userName' => $user->name,
        'departmentName' => $user->employee?->department?->name,
        'leaveCredits' => [
            'sl' => $leaveCredit->sl_balance ?? 0,
            'vl' => $leaveCredit->vl_balance ?? 0,
        ],
        'latestLeaveRequest' => $latestLeaveRequest,
    ]);
}

public function showLeaveRequest(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    $leaveCredit = $employeeId
        ? LeaveCredit::where('employee_id', $employeeId)->first()
        : null;

    $leaveTypes = LeaveType::select('id', 'name', 'code', 'document_required', 'earnable', 'default_days')
        ->orderBy('name')->get();

    // Get leave balances for fixed leave types
    $leaveBalances = [];
    if ($employeeId) {
        $leaveBalances = \App\Models\LeaveBalance::with('leaveType')
            ->where('employee_id', $employeeId)
            ->whereHas('leaveType', function($query) {
                $query->where('earnable', false); // Only fixed leave types
            })
            ->get()
            ->keyBy('leave_type_id');
    }

    $existingRequests = [];
    if ($employeeId) {
        $existingRequests = LeaveRequest::where('employee_id', $employeeId)
            ->whereIn('status', ['pending', 'approved'])
            ->select('date_from', 'date_to', 'status')
            ->get()
            ->map(function ($request) {
                return [
                    'start' => $request->date_from,
                    'end' => $request->date_to,
                    'status' => $request->status,
                ];
            });
    }

    return Inertia::render('Employee/RequestLeave', [
        'leaveTypes' => $leaveTypes,
        'existingRequests' => $existingRequests,
        'leaveCredits' => [
            'sl' => $leaveCredit->sl_balance ?? 0,
            'vl' => $leaveCredit->vl_balance ?? 0,
        ],
        'leaveBalances' => $leaveBalances,
        'employeeGender' => $user->employee->gender ?? null, // Add this line
    ]);
}


public function submitLeaveRequest(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $validated = $request->validate([
        'leave_type_id' => ['required', 'exists:leave_types,id'],
        'date_from' => ['required', 'date'],
        'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        'reason' => ['required', 'string'],
        'details' => ['required', 'string'],
        'attachment' => ['nullable', 'file', 'max:10240'],
        'working_days' => ['sometimes', 'integer'],
    ]);

    // Get leave type
    $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
    $code = strtoupper($leaveType->code);

    // Get working days
    $workingDays = $request->input('working_days') ?? 0;
    if ($workingDays === 0) {
        $startDate = new \DateTime($validated['date_from']);
        $endDate = new \DateTime($validated['date_to']);
        $workingDays = 0;

        for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
            $dayOfWeek = $date->format('N');
            if ($dayOfWeek < 6) {
                $workingDays++;
            }
        }
    }

    // Validate fixed leave balance
    if (!$leaveType->earnable) {
        $leaveBalance = \App\Models\LeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveType->id)
            ->first();

        $availableBalance = $leaveBalance ? $leaveBalance->balance : $leaveType->default_days;

        if ($workingDays > $availableBalance) {
            return back()->withErrors([
                'balance' => "You only have {$availableBalance} days available for {$leaveType->name}. Please adjust your dates.",
            ])->withInput();
        }
    }

    // Validate sick leave document requirement
    if ($code === 'SL' && $workingDays > 5 && !$request->hasFile('attachment')) {
        return back()->withErrors([
            'attachment' => 'A medical certificate is required for sick leaves exceeding 5 days.',
        ])->withInput();
    }

    // Initialize days with pay and without pay
    $daysWithPay = $workingDays;
    $daysWithoutPay = 0;

    // Check balance for SL and VL leave types (for splitting, not blocking)
    if (in_array($code, ['SL', 'VL'])) {
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        if (!$leaveCredit) {
            // No credits found, all days without pay
            $daysWithPay = 0;
            $daysWithoutPay = $workingDays;
        } else {
            $availableBalance = $code === 'SL' ? $leaveCredit->sl_balance : $leaveCredit->vl_balance;

            if ($workingDays > $availableBalance) {
                // Only count whole days for paid leave (floor the available balance)
                $wholeDaysAvailable = floor($availableBalance);

                // Split days: whole available credits as with pay, remainder as without pay
                $daysWithPay = min($wholeDaysAvailable, $workingDays);
                $daysWithoutPay = $workingDays - $daysWithPay;
            }
        }
    }

    // Check for overlapping requests (still block overlapping requests)
    $overlappingRequest = LeaveRequest::where('employee_id', $employeeId)
        ->whereIn('status', ['pending', 'approved'])
        ->where(function ($query) use ($validated) {
            $query->whereBetween('date_from', [$validated['date_from'], $validated['date_to']])
                ->orWhereBetween('date_to', [$validated['date_from'], $validated['date_to']])
                ->orWhere(function ($q) use ($validated) {
                    $q->where('date_from', '<=', $validated['date_from'])
                        ->where('date_to', '>=', $validated['date_to']);
                });
        })
        ->first();

    if ($overlappingRequest) {
        return back()->withErrors([
            'date_from' => 'The selected dates overlap with an existing leave request.',
        ])->withInput();
    }

    // Validate required fields based on leave type
    $requiredByType = [
        'SL' => ['sick_type'],
        'SLBW' => ['slbw_condition'],
        'STL' => ['study_purpose'],
        'VL' => ['vacation_location'],
        'MAT' => ['expected_delivery_date', 'physician_name'],
    ];

    $additionalRequired = $requiredByType[$code] ?? [];
    if (!empty($additionalRequired)) {
        $details = $request->input('details', []);
        if (is_string($details)) {
            $details = json_decode($details, true) ?? [];
        }

        $detailNames = collect($details)->pluck('field_name')->all();
        foreach ($additionalRequired as $requiredField) {
            if (!in_array($requiredField, $detailNames, true)) {
                return back()->withErrors([
                    'details' => 'Missing required field for this leave type: ' . $requiredField,
                ])->withInput();
            }
        }
    }

    // Save attachment
    $attachmentPath = null;
    if ($request->hasFile('attachment')) {
        $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
    }

    // Check if employee is a department head
    $isDeptHead = $user->role === 'dept_head';
    
    // If dept head is applying, set special status
    $status = $isDeptHead ? 'pending_hr_to_admin' : 'pending';

    // Create leave request
    $leaveRequest = LeaveRequest::create([
        'employee_id' => $employeeId,
        'leave_type_id' => $validated['leave_type_id'],
        'date_from' => $validated['date_from'],
        'date_to' => $validated['date_to'],
        'reason' => $validated['reason'],
        'status' => $status, // Use special status for dept heads
        'attachment_path' => $attachmentPath,
        'days_with_pay' => $daysWithPay,
        'days_without_pay' => $daysWithoutPay,
        'total_days' => $workingDays,
        'is_dept_head_request' => $isDeptHead, // Add this flag
    ]);

    // Save details
    $details = $request->input('details', []);
    if (is_string($details)) {
        $details = json_decode($details, true) ?? [];
    }

    foreach ($details as $detail) {
        LeaveRequestDetail::create([
            'leave_request_id' => $leaveRequest->id,
            'field_name' => $detail['field_name'],
            'field_value' => $detail['field_value'] ?? null,
        ]);
    }

    // 🔔 Send notifications to HR, Department Head, and Admin
        try {
            $this->notificationService->notifyLeaveRequestSubmission($leaveRequest);
        } catch (\Exception $e) {
            \Log::error('Failed to send leave request notifications: ' . $e->getMessage());
        }

        // 🔔 Create employee notification for the requester
        try {
            $employeeName = $user->employee->firstname . ' ' . $user->employee->lastname;
            $leaveTypeName = $leaveRequest->leaveType->name;
            $dateFromFormatted = \Carbon\Carbon::parse($leaveRequest->date_from)->format('M d, Y');
            $dateToFormatted = \Carbon\Carbon::parse($leaveRequest->date_to)->format('M d, Y');

            $this->notificationService->createEmployeeNotification(
                $employeeId,
                'leave_request_submitted',
                'Leave Request Submitted',
                "Your {$leaveTypeName} leave request from {$dateFromFormatted} to {$dateToFormatted} has been submitted successfully and is pending approval.",
                [
                    'request_id' => $leaveRequest->id,
                    'leave_type' => $leaveTypeName,
                    'date_from' => $leaveRequest->date_from,
                    'date_to' => $leaveRequest->date_to,
                ]
            );
        } catch (\Exception $e) {
            \Log::error('Failed to create employee notification: ' . $e->getMessage());
        }

    return redirect()->route('employee.my-leave-requests')->with('success', 'Leave request submitted successfully!');
}



   // In EmployeeController.php
// In EmployeeController.php
// In EmployeeController.php - myLeaveRequests method
public function myLeaveRequests(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $leaveRequests = LeaveRequest::with([
            'leaveType', 
            'details', 
            'approvals', 
            'recalls',
            'employee.department'
        ])
        ->where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->paginate(5)
        ->through(function ($request) use ($user) {
            $latestRecall = $request->recalls->sortByDesc('created_at')->first();
            
            // FIXED: Calculate display status based on approvals
            $displayStatus = $request->status;
            $hrApproved = $request->approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
            $deptHeadApproved = $request->approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
            $adminApproved = $request->approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();
            
            // Calculate user-friendly status for display
            if ($adminApproved) {
                $displayStatus = 'approved';
            } elseif ($deptHeadApproved && $hrApproved) {
                $displayStatus = 'pending_admin';
            } elseif ($hrApproved) {
                $displayStatus = 'pending_dept_head';
            } else {
                $displayStatus = 'pending';
            }
            
            return [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $displayStatus, // Use calculated display status
                'actual_status' => $request->status, // Keep original status
                'total_days' => $request->total_days,
                'created_at' => $request->created_at,
                'reason' => $request->reason,
                'days_with_pay' => $request->days_with_pay,
                'days_without_pay' => $request->days_without_pay,
                'attachment_path' => $request->attachment_path,
                'is_dept_head_request' => $request->is_dept_head_request || $user->role === 'dept_head',
                
                // Add recall information
                'is_recalled' => $request->status === 'recalled',
                'recall_data' => $latestRecall ? [
                    'id' => $latestRecall->id,
                    'reason' => $latestRecall->reason_for_change,
                    'new_date_from' => $latestRecall->new_leave_date_from,
                    'new_date_to' => $latestRecall->new_leave_date_to,
                    'recalled_at' => $latestRecall->created_at,
                    'recalled_by' => $latestRecall->approved_by_admin,
                    'status' => $latestRecall->status,
                ] : null,
                
                // Relationships
                'leave_type' => $request->leaveType ? [
                    'id' => $request->leaveType->id,
                    'name' => $request->leaveType->name,
                    'code' => $request->leaveType->code,
                ] : null,
                
                'approvals' => $request->approvals->map(function($approval) {
                    return [
                        'id' => $approval->id,
                        'role' => $approval->role,
                        'status' => $approval->status,
                        'remarks' => $approval->remarks,
                        'approved_at' => $approval->approved_at,
                        'approved_by' => $approval->approved_by,
                    ];
                }),
                
                'recalls' => $request->recalls->map(function($recall) {
                    return [
                        'id' => $recall->id,
                        'status' => $recall->status,
                        'reason' => $recall->reason_for_change,
                        'created_at' => $recall->created_at,
                    ];
                }),
                
                'details' => $request->details->map(function($detail) {
                    return [
                        'id' => $detail->id,
                        'field_name' => $detail->field_name,
                        'field_value' => $detail->field_value,
                    ];
                }),
                
                'employee' => $request->employee ? [
                    'id' => $request->employee->id,
                    'firstname' => $request->employee->firstname,
                    'lastname' => $request->employee->lastname,
                    'department' => $request->employee->department ? [
                        'id' => $request->employee->department->id,
                        'name' => $request->employee->department->name,
                    ] : null,
                ] : null,
            ];
        });

        return Inertia::render('Employee/MyLeaveRequests', [
            'leaveRequests' => $leaveRequests,
            'employee' => $user->employee->load('user'), // ← ADD THIS LINE
        ]);
}
//leave balance

/**
 * Display employee leave credits and balances
 */
public function leaveBalances(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    // Get SL and VL balances from leave_credits table
    $leaveCredits = LeaveCredit::where('employee_id', $employeeId)->first();
    
    $earnableLeaveCredits = [
        [
            'type' => 'Sick Leave (SL)',
            'code' => 'SL',
            'balance' => $leaveCredits->sl_balance ?? 0,
            'earnable' => true,
            'description' => 'Accumulates 1.25 days monthly'
        ],
        [
            'type' => 'Vacation Leave (VL)',
            'code' => 'VL',
            'balance' => $leaveCredits->vl_balance ?? 0,
            'earnable' => true,
            'description' => 'Accumulates 1.25 days monthly'
        ]
    ];

    // Get non-earnable leave balances from leave_balances table
    $nonEarnableLeaveBalances = \App\Models\LeaveBalance::with('leaveType')
        ->where('employee_id', $employeeId)
        ->whereHas('leaveType', function($query) {
            $query->where('earnable', false);
        })
        ->get()
        ->map(function($balance) {
            return [
                'type' => $balance->leaveType->name,
                'code' => $balance->leaveType->code,
                'default_days' => $balance->leaveType->default_days,
                'total_used' => $balance->total_used ?? 0,
                'balance' => $balance->balance ?? 0,
                'earnable' => false,
                'description' => 'Fixed allocation'
            ];
        });

    return Inertia::render('Employee/LeaveBalances', [
        'earnableLeaveCredits' => $earnableLeaveCredits,
        'nonEarnableLeaveBalances' => $nonEarnableLeaveBalances,
        'employee' => $user->employee,
    ]);
}

/**
 * Show employee leave history (approved leaves only)
 */
public function leaveHistory(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

    $leaveHistory = LeaveRequest::with(['leaveType', 'details', 'approvals'])
        ->where('employee_id', $employeeId)
        ->where('status', 'approved') // Only show approved leaves
        ->orderBy('date_from', 'desc')
        ->paginate(10)
        ->through(function ($request) use ($employeeId, $leaveCredit) {
            // Calculate approved_at using the eager-loaded approvals collection
            $approvedAt = $request->approvals
                ->where('status', 'approved')
                ->sortByDesc('approved_at')
                ->first()
                ?->approved_at;

            // Calculate balance before/after based on leave type
            $before = 'N/A';
            $after = 'N/A';

            $code = $request->leaveType->code ?? '';

            $subsequentSum = 0;
            if ($approvedAt) {
                $subsequentSum = LeaveRequest::where('employee_id', $employeeId)
                    ->where('leave_type_id', $request->leave_type_id)
                    ->where('status', 'approved')
                    ->whereRaw('(SELECT MAX(approved_at) FROM leave_approvals WHERE leave_id = leave_requests.id AND status = "approved") > ?', [$approvedAt])
                    ->sum('days_with_pay');
            }

            if (in_array($code, ['SL', 'VL'])) {
                // For VL/SL, calculate from current leave_credits balances
                $current = 0;
                if ($leaveCredit) {
                    $current = ($code === 'SL') ? $leaveCredit->sl_balance : $leaveCredit->vl_balance;
                }
                $after = $current + $subsequentSum;
                $before = $after + $request->days_with_pay;
            } else {
                // For non-VL/SL (non-earnable), calculate from leave_balances table
                $leaveBalance = \App\Models\LeaveBalance::where('employee_id', $employeeId)
                    ->where('leave_type_id', $request->leave_type_id)
                    ->first();

                if ($leaveBalance) {
                    $after = $leaveBalance->balance + $subsequentSum;
                    $before = $after + $request->days_with_pay;
                }
            }

            return [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $request->status,
                'total_days' => $request->total_days,
                'created_at' => $request->created_at,
                'reason' => $request->reason,
                'days_with_pay' => $request->days_with_pay,
                'days_without_pay' => $request->days_without_pay,
                'attachment_path' => $request->attachment_path,
                'approved_at' => $approvedAt,
                'balance_before' => $before,
                'balance_after' => $after,
                
                'leave_type' => $request->leaveType ? [
                    'id' => $request->leaveType->id,
                    'name' => $request->leaveType->name,
                    'code' => $request->leaveType->code,
                ] : null,
                
                'details' => $request->details->map(function($detail) {
                    return [
                        'id' => $detail->id,
                        'field_name' => $detail->field_name,
                        'field_value' => $detail->field_value,
                    ];
                }),
            ];
        });

    return Inertia::render('Employee/LeaveHistory', [
        'leaveHistory' => $leaveHistory,
        'employee' => $user->employee->load('user'),
    ]);
}
//employee calendar

public function leaveCalendar(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    // Get ALL leave requests for the employee (both pending and approved)
    $leaveRequests = LeaveRequest::where('employee_id', $employeeId)
        ->whereIn('status', ['pending', 'approved', 'pending_admin', 'pending_dept_head', 'pending_hr'])
        ->with(['leaveType', 'approvals' => function ($query) {
            $query->with('approver');
        }])
        ->get()
        ->map(function ($leaveRequest) {
            // Determine event color based on status
            $backgroundColor = '#F59E0B'; // Orange for pending
            $borderColor = '#D97706';
            
            if ($leaveRequest->status === 'approved') {
                $backgroundColor = '#10B981'; // Green for approved
                $borderColor = '#059669';
            }

            return [
                'id' => $leaveRequest->id,
                'title' => $leaveRequest->leaveType->code . ' - ' . $leaveRequest->leaveType->name,
                'start' => $leaveRequest->date_from,
                'end' => $leaveRequest->date_to,
                'allDay' => true,
                'backgroundColor' => $backgroundColor,
                'borderColor' => $borderColor,
                'display' => 'block',
                'extendedProps' => [
                    'leave_type' => $leaveRequest->leaveType->name,
                    'leave_type_code' => $leaveRequest->leaveType->code,
                    'start_date' => $leaveRequest->date_from,
                    'end_date' => $leaveRequest->date_to,
                    'total_days' => \Carbon\Carbon::parse($leaveRequest->date_from)->diffInDays(\Carbon\Carbon::parse($leaveRequest->date_to)) + 1,
                    'reason' => $leaveRequest->reason,
                    'status' => $leaveRequest->status,
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

    return Inertia::render('Employee/LeaveCalendar', [
        'events' => $leaveRequests,
    ]);
}


    /**
     * Show credit conversion request form
     */
    public function showCreditConversion(Request $request)
{
    $user = $request->user();
    
    // Try to load the employee relationship
    $user->load('employee');
    
    // Debug logging to help troubleshoot
    \Log::info('User data:', [
        'user_id' => $user->id,
        'user_role' => $user->role,
        'employee_id_in_user' => $user->employee_id,
        'employee_loaded' => $user->employee ? 'yes' : 'no',
        'employee_data' => $user->employee ? [
            'employee_id' => $user->employee->employee_id,
            'firstname' => $user->employee->firstname,
            'lastname' => $user->employee->lastname,
        ] : null
    ]);
    
    // Try multiple ways to get the employee ID
    $employeeId = null;
    
    if ($user->employee && $user->employee->employee_id) {
        $employeeId = $user->employee->employee_id;
    } elseif ($user->employee_id) {
        // Fallback: try to find employee directly
        $employee = \App\Models\Employee::where('employee_id', $user->employee_id)->first();
        if ($employee) {
            $employeeId = $employee->employee_id;
            \Log::info('Found employee through direct query', ['employee_id' => $employeeId]);
        }
    }
    
    if (!$employeeId) {
        // More detailed error message
        $errorMessage = 'Employee profile not found for user. ';
        $errorMessage .= 'User ID: ' . $user->id . ', ';
        $errorMessage .= 'User Role: ' . $user->role . ', ';
        $errorMessage .= 'Employee ID in User: ' . ($user->employee_id ?? 'null');
        
        \Log::error('Employee profile not found:', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'employee_id_in_user' => $user->employee_id,
            'employee_relationship' => $user->employee ? 'exists' : 'missing'
        ]);
        
        abort(400, $errorMessage);
    }

    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
    
    // USE THE INJECTED SERVICE INSTEAD OF CREATING NEW
    $slEligibility = $this->creditConversionService->checkEligibility($employeeId, 'SL');
    $vlEligibility = $this->creditConversionService->checkEligibility($employeeId, 'VL');
    
    $conversionStats = $this->creditConversionService->getEmployeeConversionStats($employeeId);

    return Inertia::render('Employee/CreditConversion', [
        'auth' => ['user' => $user],
        'leaveCredits' => [
            'sl' => $leaveCredit->sl_balance ?? 0,
            'vl' => $leaveCredit->vl_balance ?? 0,
        ],
        'eligibility' => [
            'sl' => $slEligibility,
            'vl' => $vlEligibility,
        ],
        'conversionStats' => $conversionStats,
    ]);
}

    /**
     * Submit credit conversion request
     */
    public function submitCreditConversion(Request $request)
{
    $user = $request->user();
    $user->load('employee');
    
    // Try multiple ways to get the employee ID
    $employeeId = null;
    
    if ($user->employee && $user->employee->employee_id) {
        $employeeId = $user->employee->employee_id;
    } elseif ($user->employee_id) {
        // Fallback: try to find employee directly
        $employee = \App\Models\Employee::where('employee_id', $user->employee_id)->first();
        if ($employee) {
            $employeeId = $employee->employee_id;
            \Log::info('Found employee through direct query in submitCreditConversion', ['employee_id' => $employeeId]);
        }
    }

    if (!$employeeId) {
        $errorMessage = 'Employee profile not found for user. ';
        $errorMessage .= 'User ID: ' . $user->id . ', ';
        $errorMessage .= 'User Role: ' . $user->role . ', ';
        $errorMessage .= 'Employee ID in User: ' . ($user->employee_id ?? 'null');
        
        \Log::error('Employee profile not found in submitCreditConversion:', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'employee_id_in_user' => $user->employee_id,
            'employee_relationship' => $user->employee ? 'exists' : 'missing'
        ]);
        
        abort(400, $errorMessage);
    }

    $validated = $request->validate([
        'leave_type' => ['required', 'in:SL,VL'],
        'credits_requested' => ['required', 'numeric', 'min:1', 'max:10'],
        'remarks' => ['nullable', 'string', 'max:500'],
    ]);

    try {
        // USE THE INJECTED SERVICE INSTEAD OF CREATING NEW
        $conversion = $this->creditConversionService->requestConversion(
            $employeeId,
            $validated['leave_type'],
            $validated['credits_requested'],
            $validated['remarks']
        );

        return redirect()->route('employee.credit-conversions')->with('success', 'Credit conversion request submitted successfully!');
    } catch (\Exception $e) {
        return back()->withErrors(['error' => $e->getMessage()]);
    }
}
    /**
     * Debug method to check user-employee relationship
     */
    public function debugUserEmployee(Request $request)
    {
        $user = $request->user();
        $userWithEmployee = $request->user()->load('employee');
        
        $debugInfo = [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'user_employee_id' => $user->employee_id,
            'employee_loaded' => $userWithEmployee->employee ? 'yes' : 'no',
            'employee_data' => $userWithEmployee->employee ? [
                'employee_id' => $userWithEmployee->employee->employee_id,
                'firstname' => $userWithEmployee->employee->firstname,
                'lastname' => $userWithEmployee->employee->lastname,
                'position' => $userWithEmployee->employee->position,
            ] : null,
            'database_check' => [
                'users_table' => \DB::table('users')->where('id', $user->id)->first(),
                'employees_table' => $user->employee_id ? \DB::table('employees')->where('employee_id', $user->employee_id)->first() : null,
                'leave_credits_table' => $user->employee_id ? \DB::table('leave_credits')->where('employee_id', $user->employee_id)->first() : null,
            ]
        ];
        
        return response()->json($debugInfo);
    }

    /**
     * Show employee's credit conversion history
     */
   /**
 * Show employee's credit conversion history
 */
public function myCreditConversions(Request $request)
{
    $user = $request->user();
    $user->load('employee');
    
    // Try multiple ways to get the employee ID
    $employeeId = null;
    
    if ($user->employee && $user->employee->employee_id) {
        $employeeId = $user->employee->employee_id;
    } elseif ($user->employee_id) {
        // Fallback: try to find employee directly
        $employee = \App\Models\Employee::where('employee_id', $user->employee_id)->first();
        if ($employee) {
            $employeeId = $employee->employee_id;
        }
    }

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $conversions = CreditConversion::where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($conversion) {
            // Use the same transformation logic as HRController
            return $this->transformConversionData($conversion);
        });

    // USE THE INJECTED SERVICE INSTEAD OF CREATING NEW
    $conversionStats = $this->creditConversionService->getEmployeeConversionStats($employeeId);

    return Inertia::render('Employee/MyCreditConversions', [
        'auth' => ['user' => $user],
        'conversions' => $conversions,
        'conversionStats' => $conversionStats,
    ]);
}

/**
 * Use the same transformation method as HRController for consistency
 */
private function transformConversionData($conversion)
{
    $leaveTypeNames = [
        'SL' => 'Sick Leave',
        'VL' => 'Vacation Leave'
    ];

    // Use the same status mapping as HRController
    $statusDisplay = [
        'pending' => 'Pending HR Review',
        'approved' => 'Approved - Forwarded to Accounting',
        'rejected' => 'Rejected'
    ];

    // Calculate cash equivalent using the same formula
    $monthlySalary = $conversion->employee->monthly_salary ?? 0;
    $calculatedCash = $this->calculateCashEquivalent($monthlySalary);

    return [
        'conversion_id' => $conversion->conversion_id,
        'employee_id' => $conversion->employee_id,
        'leave_type_code' => $conversion->leave_type,
        'leave_type_name' => $leaveTypeNames[$conversion->leave_type] ?? 'Unknown',
        'credits_requested' => $conversion->credits_requested,
        'equivalent_cash' => $calculatedCash,
        'status' => $conversion->status,
        'status_display' => $statusDisplay[$conversion->status] ?? $conversion->status,
        'submitted_at' => $conversion->submitted_at,
        'approved_at' => $conversion->approved_at,
        'approved_by' => $conversion->approved_by,
        'remarks' => $conversion->remarks,
        'created_at' => $conversion->created_at,
        'updated_at' => $conversion->updated_at,
    ];
}

/**
 * Calculate cash equivalent using the same formula as HRController
 */
private function calculateCashEquivalent($monthlySalary)
{
    // Same formula as used in HRController and CreditConversionService
    $cashValue = $monthlySalary * 10 * 0.0481927;
    return round($cashValue, 2);
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

