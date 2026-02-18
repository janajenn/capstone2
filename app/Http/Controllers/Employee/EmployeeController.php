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
use App\Models\Holiday;
use App\Services\LeaveDonationService;
use App\Models\LeaveDonation;
use App\Models\Employee;
use App\Models\LeaveRescheduleRequest;
use App\Models\LeaveBalanceLog;





class EmployeeController extends Controller
{


    protected $notificationService;
    protected $creditConversionService;
    protected $leaveDonationService;

    public function __construct(
        NotificationService $notificationService, 
        CreditConversionService $creditConversionService,
        LeaveDonationService $leaveDonationService // Add this
    )
    {
        $this->notificationService = $notificationService;
        $this->creditConversionService = $creditConversionService;
        $this->leaveDonationService = $leaveDonationService; // Add this
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

    // Get prefill data from request
    $prefill = [
        'date' => $request->input('prefill_date'),
        'for_absence' => $request->has('prefill_for_absence'),
    ];

    // Get leave balances and existing requests (your existing code)
    $leaveBalances = [];
    if ($employeeId) {
        $leaveBalances = \App\Models\LeaveBalance::with('leaveType')
            ->where('employee_id', $employeeId)
            ->whereHas('leaveType', function($query) {
                $query->where('earnable', false);
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

    // Fetch holidays
    $holidays = \App\Models\Holiday::select('date', 'name', 'type')
        ->where('date', '>=', now()->startOfYear())
        ->orderBy('date')
        ->get()
        ->map(function ($holiday) {
            return [
                'date' => $holiday->date,
                'name' => $holiday->name,
                'type' => $holiday->type,
            ];
        });

        return Inertia::render('Employee/RequestLeave', [
            'leaveTypes' => $leaveTypes,
            'existingRequests' => $existingRequests,
            'leaveCredits' => [
                'sl' => $leaveCredit->sl_balance ?? 0,
                'vl' => $leaveCredit->vl_balance ?? 0,
            ],
            'leaveBalances' => $leaveBalances,
            'employeeGender' => $user->employee->gender ?? null,
            'employeeCivilStatus' => $user->employee->civil_status ?? null, // Add this line
            'holidays' => $holidays,
            'prefill' => $prefill, // Pass prefill data to frontend
        ]);
}

public function submitLeaveRequest(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    \Log::info('Leave Request Submission Data:', $request->all());
    \Log::info('Selected Dates:', ['selectedDates' => $request->input('selectedDates')]);

    // Updated validation to handle selectedDates array
    $validated = $request->validate([
        'leave_type_id' => ['required', 'exists:leave_types,id'],
        'selectedDates' => ['required', 'array', 'min:1'],
        'selectedDates.*' => ['required', 'date'],
        'date_from' => ['sometimes', 'date'], 
        'date_to' => ['sometimes', 'date'],   
        'reason' => ['required', 'string'],
        'details' => ['required', 'string'],
        'attachment' => ['nullable', 'file', 'max:10240'],
        'working_days' => ['sometimes', 'integer'],
    ]);

    // Get leave type
    $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
    $code = strtoupper($leaveType->code);

    // Use selectedDates array as the single source of truth
    $selectedDates = $validated['selectedDates'];
    sort($selectedDates); // Ensure dates are in order
    
    \Log::info('Processed Selected Dates:', $selectedDates);

    // Set date_from and date_to from the selected dates (for display purposes)
    $dateFrom = min($selectedDates);
    $dateTo = max($selectedDates);

    // Calculate working days based ONLY on selected dates (excluding weekends)
    $workingDays = 0;
    foreach ($selectedDates as $date) {
        $dateObj = new \DateTime($date);
        $dayOfWeek = $dateObj->format('N'); // 1-7 (Monday-Sunday)
        if ($dayOfWeek < 6) { // 1-5 are weekdays
            $workingDays++;
        }
    }

    // ENSURE workingDays is a whole number
    $workingDays = (int) round($workingDays);

    \Log::info('Calculated Values:', [
        'date_from' => $dateFrom,
        'date_to' => $dateTo,
        'working_days' => $workingDays,
        'selected_dates_count' => count($selectedDates)
    ]);

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

    // NEW LOGIC: Initialize days with pay and without pay with WHOLE NUMBERS
    $daysWithPay = 0;
    $daysWithoutPay = 0;

    // Check balance for SL and VL leave types
    if (in_array($code, ['SL', 'VL'])) {
        $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

        if (!$leaveCredit) {
            // No credits found, all days without pay
            $daysWithPay = 0;
            $daysWithoutPay = $workingDays;
        } else {
            $availableBalance = $code === 'SL' ? $leaveCredit->sl_balance : $leaveCredit->vl_balance;
            
            // NEW LOGIC: Convert to whole number and reserve 1 day
            $wholeBalance = (int) floor($availableBalance); // Remove decimals
            $usablePaidDays = max(0, $wholeBalance - 1); // Always reserve 1 day
            
            if ($workingDays <= $usablePaidDays) {
                // All days can be paid
                $daysWithPay = $workingDays;
                $daysWithoutPay = 0;
            } else {
                // Split between paid and unpaid
                $daysWithPay = $usablePaidDays;
                $daysWithoutPay = $workingDays - $usablePaidDays;
            }
            
            // ENSURE both values are integers (no decimals)
            $daysWithPay = (int) $daysWithPay;
            $daysWithoutPay = (int) $daysWithoutPay;
        }
    } else {
        // For non-SL/VL leave types, all days are with pay (if approved)
        $daysWithPay = $workingDays;
        $daysWithoutPay = 0;
    }

    // Check for overlapping requests using the ACTUAL selected dates
    $overlappingRequest = LeaveRequest::where('employee_id', $employeeId)
        ->whereIn('status', ['pending', 'approved'])
        ->where(function ($query) use ($selectedDates) {
            foreach ($selectedDates as $date) {
                $query->orWhere(function ($q) use ($date) {
                    $q->whereDate('date_from', '<=', $date)
                      ->whereDate('date_to', '>=', $date);
                });
            }
        })
        ->first();

    if ($overlappingRequest) {
        return back()->withErrors([
            'selectedDates' => 'The selected dates overlap with an existing leave request.',
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

    // Create leave request - store the actual selected dates as the source of truth
    // In your submitLeaveRequest method
$leaveRequest = LeaveRequest::create([
    'employee_id' => $employeeId,
    'leave_type_id' => $validated['leave_type_id'],
    'date_from' => $dateFrom,
    'date_to' => $dateTo,
    'selected_dates' => $selectedDates,
    'total_days' => count($selectedDates), // This should match the actual selected dates count
    'reason' => $validated['reason'],
    'status' => $status,
    'attachment_path' => $attachmentPath,
    'days_with_pay' => $daysWithPay,
    'days_without_pay' => $daysWithoutPay,
    'is_dept_head_request' => $isDeptHead,
]);

    \Log::info('Leave Request Created:', [
        'id' => $leaveRequest->id,
        'selected_dates_stored' => $leaveRequest->selected_dates
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
        
        // Format dates based on ACTUAL selected dates
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');

        $this->notificationService->createEmployeeNotification(
            $employeeId,
            'leave_request_submitted',
            'Leave Request Submitted',
            "Your {$leaveTypeName} leave request from {$dateFromFormatted} to {$dateToFormatted} ({$workingDays} days) has been submitted successfully and is pending approval.",
            [
                'request_id' => $leaveRequest->id,
                'leave_type' => $leaveTypeName,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'total_days' => $workingDays,
                'selected_dates_count' => count($selectedDates),
            ]
        );
    } catch (\Exception $e) {
        \Log::error('Failed to create employee notification: ' . $e->getMessage());
    }

    return redirect()->route('employee.my-leave-requests')->with('success', 'Leave request submitted successfully!');
}



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
            
            // Get selected dates from the database
            $selectedDates = [];
            if (!empty($request->selected_dates)) {
                if (is_array($request->selected_dates)) {
                    $selectedDates = $request->selected_dates;
                } else if (is_string($request->selected_dates)) {
                    $selectedDates = json_decode($request->selected_dates, true) ?? [];
                }
            }
            $selectedDatesCount = count($selectedDates);
            
            // Use selected dates for accurate duration calculation
            $actualDuration = $selectedDatesCount > 0 ? $selectedDatesCount : 
                (($request->date_from && $request->date_to) ? 
                    \Carbon\Carbon::parse($request->date_from)->diffInDays(\Carbon\Carbon::parse($request->date_to)) + 1 : 0);
            
            // FIXED: Calculate approval and rejection statuses first
            $hrApproved = $request->approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
            $deptHeadApproved = $request->approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
            $adminApproved = $request->approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();
            
            $hrRejected = $request->approvals->where('role', 'hr')->where('status', 'rejected')->isNotEmpty();
            $deptHeadRejected = $request->approvals->where('role', 'dept_head')->where('status', 'rejected')->isNotEmpty();
            $adminRejected = $request->approvals->where('role', 'admin')->where('status', 'rejected')->isNotEmpty();
            
            // FIXED: Calculate display status with proper rejection handling
            $displayStatus = $request->status;
            
            // FIRST: Check for rejection statuses (these should take priority)
            if ($adminRejected) {
                $displayStatus = 'rejected';
            } elseif ($hrRejected) {
                $displayStatus = 'rejected';
            } elseif ($deptHeadRejected) {
                $displayStatus = 'rejected';
            } 
            // If not rejected, then check for approvals
            elseif ($adminApproved) {
                $displayStatus = 'approved';
            } else {
                $isDeptHeadRequest = $request->is_dept_head_request || $user->role === 'dept_head';
                
                if ($isDeptHeadRequest) {
                    // Department head request – no dept_head approval needed
                    if ($hrApproved) {
                        $displayStatus = 'pending_admin';
                    } else {
                        $displayStatus = 'pending_hr';   // Waiting for HR
                    }
                } else {
                    // Regular employee request
                    if ($deptHeadApproved && $hrApproved) {
                        $displayStatus = 'pending_admin';
                    } elseif ($hrApproved) {
                        $displayStatus = 'pending_dept_head';
                    } else {
                        $displayStatus = 'pending';      // Waiting for HR
                    }
                }
            }
            
            // Also check if the main request status is 'recalled'
            if ($request->status === 'recalled') {
                $displayStatus = 'recalled';
            }

            return [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $displayStatus,
                'actual_status' => $request->status,
                'total_days' => $actualDuration,
                'calculated_days' => $request->total_days,
                'created_at' => $request->created_at,
                'reason' => $request->reason,
                'days_with_pay' => $request->days_with_pay,
                'days_without_pay' => $request->days_without_pay,
                'attachment_path' => $request->attachment_path,
                'is_dept_head_request' => $request->is_dept_head_request || $user->role === 'dept_head',
                'selected_dates' => $selectedDates,
                'selected_dates_count' => $selectedDatesCount,
                
                // Add recall information
                'is_recalled' => $request->status === 'recalled',
                'recall_data' => $latestRecall ? [
                    'id' => $latestRecall->id,
                    'reason' => $latestRecall->reason,
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
                    $approver = \App\Models\User::find($approval->approved_by);
                    return [
                        'id' => $approval->id,
                        'role' => $approval->role,
                        'status' => $approval->status,
                        'remarks' => $approval->remarks,
                        'approved_at' => $approval->approved_at,
                        'approved_by' => $approval->approved_by,
                        'approver_name' => $approver ? $approver->name : 'Unknown',
                        'approver' => $approver ? [
                            'name' => $approver->name,
                            'firstname' => $approver->firstname ?? null,
                            'lastname' => $approver->lastname ?? null,
                        ] : null,
                    ];
                }),
                
                'recalls' => $request->recalls->map(function($recall) {
                    return [
                        'id' => $recall->id,
                        'status' => $recall->status,
                        'reason' => $recall->reason,
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
        'employee' => $user->employee->load('user'),
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

    // ADDED: Get received donations for this employee
    $receivedDonations = LeaveDonation::with('donor')
        ->where('recipient_employee_id', $employeeId)
        ->where('status', 'completed')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function($donation) {
            return [
                'id' => $donation->id,
                'days_donated' => $donation->days_donated,
                'donor_name' => $donation->donor->firstname . ' ' . $donation->donor->lastname,
                'donor_employee_id' => $donation->donor_employee_id,
                'donated_at' => $donation->donated_at->format('M d, Y'),
                'remarks' => $donation->remarks
            ];
        });

    // MODIFIED: Get eligible recipients for donation - only male employees
    $eligibleRecipients = Employee::with(['department', 'user'])
        ->where('gender', 'male')
        ->where('status', 'active')
        ->where('employee_id', '!=', $employeeId)
        ->get()
        ->map(function ($employee) {
            return [
                'employee_id' => $employee->employee_id,
                'name' => $employee->firstname . ' ' . $employee->lastname,
                'position' => $employee->position,
                'department' => $employee->department?->name,
                'searchable_text' => strtolower($employee->firstname . ' ' . $employee->lastname . ' ' . $employee->position . ' ' . ($employee->department?->name ?? ''))
            ];
        });

    // ADDED: Search functionality for recipients
    if ($request->has('search_recipient') && $request->search_recipient) {
        $searchTerm = strtolower($request->search_recipient);
        $eligibleRecipients = $eligibleRecipients->filter(function ($recipient) use ($searchTerm) {
            return str_contains($recipient['searchable_text'], $searchTerm);
        });
    }

    // ADDED: Check donation eligibility
    $canDonate = $this->leaveDonationService->canDonateMaternityLeave($employeeId);

    return Inertia::render('Employee/LeaveBalances', [
        'earnableLeaveCredits' => $earnableLeaveCredits,
        'nonEarnableLeaveBalances' => $nonEarnableLeaveBalances,
        'employee' => $user->employee,
        // ADDED: New props for donation functionality
        'receivedDonations' => $receivedDonations,
        'eligibleRecipients' => $eligibleRecipients->values(), // Reset keys
        'canDonate' => $canDonate,
    ]);
}

// ADD NEW METHOD: Search recipients endpoint
public function searchRecipients(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        return response()->json(['error' => 'Employee not found'], 400);
    }

    $searchTerm = $request->input('search', '');

    $recipients = Employee::with(['department'])
        ->where('gender', 'male')
        ->where('status', 'active')
        ->where('employee_id', '!=', $employeeId)
        ->when($searchTerm, function ($query) use ($searchTerm) {
            $query->where(function ($q) use ($searchTerm) {
                $q->where('firstname', 'like', "%{$searchTerm}%")
                  ->orWhere('lastname', 'like', "%{$searchTerm}%")
                  ->orWhere('position', 'like', "%{$searchTerm}%")
                  ->orWhereHas('department', function ($deptQuery) use ($searchTerm) {
                      $deptQuery->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        })
        ->orderBy('firstname')
        ->orderBy('lastname')
        ->limit(50) // Limit results for performance
        ->get()
        ->map(function ($employee) {
            return [
                'employee_id' => $employee->employee_id,
                'name' => $employee->firstname . ' ' . $employee->lastname,
                'position' => $employee->position,
                'department' => $employee->department?->name,
            ];
        });

    return response()->json($recipients);
}

/**
 * Show employee leave history (approved leaves only)
 */
/**
 * Show employee leave history (ALL leave requests - pending, approved, rejected, recalled)
 */
public function leaveHistory(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    \Log::info('=== LEAVE HISTORY DEBUG START ===');
    \Log::info('Employee ID: ' . $employeeId);

    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

    $leaveHistory = LeaveRequest::with([
            'leaveType', 
            'details', 
            'approvals', 
            'recalls',
            'rescheduleRequests' => function($query) {
                $query->orderBy('created_at', 'desc');
            },
            'latestReschedule',
            'balanceLogs' // ✅ ADD THIS RELATIONSHIP
        ])
        ->where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->through(function ($request) use ($employeeId, $leaveCredit) {
            \Log::info('--- Processing Leave Request ID: ' . $request->id . ' ---');
            
            // DEBUG: Check the problematic values
            \Log::info('DEBUG - Problematic Values:');
            \Log::info('  - days_with_pay: ' . $request->days_with_pay);
            \Log::info('  - days_without_pay: ' . $request->days_without_pay);
            \Log::info('  - total_days: ' . $request->total_days);

            // FIXED: More robust selected_dates handling
            $selectedDates = [];
            $selectedDatesCount = 0;
            
            if (!empty($request->selected_dates)) {
                if (is_array($request->selected_dates)) {
                    $selectedDates = $request->selected_dates;
                } elseif (is_string($request->selected_dates)) {
                    $decoded = json_decode($request->selected_dates, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $selectedDates = $decoded;
                    }
                }
            }
            
            // If Method 1 failed, try raw database value
            if (empty($selectedDates)) {
                try {
                    $rawSelectedDates = $request->getRawOriginal('selected_dates');
                    if (!empty($rawSelectedDates) && is_string($rawSelectedDates)) {
                        $decoded = json_decode($rawSelectedDates, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $selectedDates = $decoded;
                        }
                    }
                } catch (\Exception $e) {
                    \Log::info('  - Error accessing raw value: ' . $e->getMessage());
                }
            }

            $selectedDatesCount = count($selectedDates);
            
            // FIXED: Use selected dates count for accurate duration
            $actualDuration = $selectedDatesCount > 0 ? $selectedDatesCount : $request->total_days;
            
            // FIXED: Calculate correct days_with_pay and days_without_pay based on actual duration
            $daysWithPay = $request->days_with_pay;
            $daysWithoutPay = $request->days_without_pay;
            
            // If the values seem incorrect (like 29 and 57 for 5 total days), recalculate them
            if ($daysWithPay + $daysWithoutPay != $actualDuration && $actualDuration > 0) {
                \Log::info('DEBUG - Correcting days_with_pay/days_without_pay mismatch');
                \Log::info('  - Current: with_pay=' . $daysWithPay . ', without_pay=' . $daysWithoutPay . ', total=' . ($daysWithPay + $daysWithoutPay));
                \Log::info('  - Expected total: ' . $actualDuration);
                
                // For approved leaves with VL/SL, assume all days are with pay if there's sufficient balance
                if ($request->status === 'approved' && in_array($request->leaveType->code ?? '', ['VL', 'SL'])) {
                    $availableBalance = 0;
                    if ($leaveCredit) {
                        $availableBalance = ($request->leaveType->code === 'SL') ? $leaveCredit->sl_balance : $leaveCredit->vl_balance;
                    }
                    
                    if ($availableBalance >= $actualDuration) {
                        $daysWithPay = $actualDuration;
                        $daysWithoutPay = 0;
                    } else {
                        $daysWithPay = $availableBalance;
                        $daysWithoutPay = $actualDuration - $availableBalance;
                    }
                } else {
                    // For other cases or if we can't determine, make them match the actual duration
                    $daysWithPay = $actualDuration;
                    $daysWithoutPay = 0;
                }
                
                \Log::info('  - Corrected: with_pay=' . $daysWithPay . ', without_pay=' . $daysWithoutPay);
            }

            // Calculate approved_at using the eager-loaded approvals collection
            $approvedAt = $request->approvals
                ->where('status', 'approved')
                ->sortByDesc('approved_at')
                ->first()
                ?->approved_at;

            // ✅ UPDATED: Get balance from balance logs instead of calculating
            $before = 'N/A';
            $after = 'N/A';
            
            if ($request->status === 'approved') {
                // Try to get balance from stored values first (if admin stored them)
                if ($request->balance_before && $request->balance_after) {
                    $before = $request->balance_before;
                    $after = $request->balance_after;
                } 
                // If not stored, try to get from balance logs
                elseif ($request->balanceLogs && $request->balanceLogs->isNotEmpty()) {
                    $latestBalanceLog = $request->balanceLogs->sortByDesc('created_at')->first();
                    $before = $latestBalanceLog->balance_before;
                    $after = $latestBalanceLog->balance_after;
                }
                // Fallback to calculation (only for SL/VL)
                elseif (in_array($request->leaveType->code ?? '', ['SL', 'VL'])) {
                    $code = $request->leaveType->code ?? '';
                    if ($leaveCredit) {
                        $currentBalance = ($code === 'SL') ? $leaveCredit->sl_balance : $leaveCredit->vl_balance;
                        $after = $currentBalance;
                        $before = $currentBalance + $daysWithPay;
                    }
                }
            }

            // Get recall information
            $latestRecall = $request->recalls->sortByDesc('created_at')->first();

            // Get reschedule information
            $latestReschedule = $request->latestReschedule;
            $hasRescheduleHistory = $request->rescheduleRequests->isNotEmpty();
            $rescheduleHistory = json_decode($request->reschedule_history ?? '[]', true);

            \Log::info('DEBUG - Final Values Being Returned:');
            \Log::info('  - total_days: ' . $actualDuration);
            \Log::info('  - days_with_pay: ' . $daysWithPay);
            \Log::info('  - days_without_pay: ' . $daysWithoutPay);
            \Log::info('  - balance_before: ' . $before);
            \Log::info('  - balance_after: ' . $after);

            $result = [
                'id' => $request->id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'status' => $request->status,
                'total_days' => $actualDuration,
                'calculated_days' => $request->total_days,
                'created_at' => $request->created_at,
                'reason' => $request->reason,
                // FIXED: Use corrected values
                'days_with_pay' => $daysWithPay,
                'days_without_pay' => $daysWithoutPay,
                'attachment_path' => $request->attachment_path,
                'approved_at' => $approvedAt,
                'balance_before' => $before,
                'balance_after' => $after,
                'is_recalled' => $request->status === 'recalled',
                'selected_dates' => $selectedDates,
                'selected_dates_count' => $selectedDatesCount,
                'has_balance_logs' => $request->balanceLogs && $request->balanceLogs->isNotEmpty(), // ✅ ADD THIS
                
                'recall_data' => $latestRecall ? [
                    'id' => $latestRecall->id,
                    'reason' => $latestRecall->reason,
                    'recalled_at' => $latestRecall->created_at,
                    'recalled_by' => $latestRecall->approved_by_admin,
                    'status' => $latestRecall->status,
                ] : null,
                
                // Reschedule information
                'has_reschedule_history' => $hasRescheduleHistory,
                'is_rescheduled' => $latestReschedule && $latestReschedule->status === 'approved',
                'reschedule_data' => $latestReschedule ? [
                    'id' => $latestReschedule->id,
                    'status' => $latestReschedule->status,
                    'reason' => $latestReschedule->reason,
                    'proposed_dates' => $latestReschedule->proposed_dates,
                    'submitted_at' => $latestReschedule->submitted_at,
                    'processed_at' => $latestReschedule->processed_at,
                    'hr_remarks' => $latestReschedule->hr_remarks,
                    'dept_head_remarks' => $latestReschedule->dept_head_remarks,
                ] : null,
                'reschedule_history' => $rescheduleHistory,
                'all_reschedule_requests' => $request->rescheduleRequests->map(function($reschedule) {
                    return [
                        'id' => $reschedule->id,
                        'status' => $reschedule->status,
                        'reason' => $reschedule->reason,
                        'proposed_dates' => $reschedule->proposed_dates,
                        'submitted_at' => $reschedule->submitted_at,
                        'processed_at' => $reschedule->processed_at,
                        'hr_remarks' => $reschedule->hr_remarks,
                        'dept_head_remarks' => $reschedule->dept_head_remarks,
                        'hr_reviewed_at' => $reschedule->hr_reviewed_at,
                        'dept_head_reviewed_at' => $reschedule->dept_head_reviewed_at,
                    ];
                }),
                
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

                'approvals' => $request->approvals->map(function($approval) {
                    $approver = \App\Models\User::find($approval->approved_by);
                    return [
                        'id' => $approval->id,
                        'role' => $approval->role,
                        'status' => $approval->status,
                        'remarks' => $approval->remarks,
                        'approved_at' => $approval->approved_at,
                        'approved_by' => $approval->approved_by,
                        'approver_name' => $approver ? $approver->name : 'Unknown',
                    ];
                }),
                
                // ✅ ADD BALANCE LOGS
                'balance_logs' => $request->balanceLogs ? $request->balanceLogs->map(function($log) {
                    return [
                        'id' => $log->id,
                        'transaction_type' => $log->transaction_type,
                        'amount' => $log->amount,
                        'balance_before' => $log->balance_before,
                        'balance_after' => $log->balance_after,
                        'remarks' => $log->remarks,
                        'created_at' => $log->created_at,
                        'created_by' => $log->created_by,
                    ];
                }) : [],
            ];

            \Log::info('--- End Processing Leave Request ID: ' . $request->id . ' ---');
            return $result;
        });

    \Log::info('=== LEAVE HISTORY DEBUG END ===');
    \Log::info('Total records found: ' . $leaveHistory->total());

    return Inertia::render('Employee/LeaveHistory', [
        'leaveHistory' => $leaveHistory,
        'employee' => $user->employee->load('user'),
    ]);
}




// app/Http/Controllers/Employee/EmployeeController.php

/**
 * Submit a leave reschedule request
 */
public function submitRescheduleRequest(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        return redirect()->back()->with('error', 'Employee profile not found.');
    }

    $validated = $request->validate([
        'original_leave_request_id' => ['required', 'exists:leave_requests,id'],
        'proposed_dates' => ['required', 'array', 'min:1'],
        'proposed_dates.*' => ['required', 'date'],
        'reason' => ['required', 'string', 'max:1000'],
    ]);

    try {
        // Check if the original leave request exists and is approved
        $originalLeave = LeaveRequest::where('id', $validated['original_leave_request_id'])
            ->where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->first();

        if (!$originalLeave) {
            return redirect()->back()->with('error', 'Original leave request not found or not approved.');
        }

        // Check for existing pending reschedule request for this leave
        $existingReschedule = LeaveRescheduleRequest::where('original_leave_request_id', $validated['original_leave_request_id'])
            ->whereIn('status', ['pending_hr', 'pending_dept_head'])
            ->exists();

        if ($existingReschedule) {
            return redirect()->back()->with('error', 'A pending reschedule request already exists for this leave.');
        }

        // Determine initial status based on user role
        $initialStatus = 'pending_hr';
        $autoApproved = false;

        if (in_array($user->role, ['dept_head', 'admin'])) {
            $initialStatus = 'approved'; // Auto-approve for dept heads and admins
            $autoApproved = true;
        }

        // Create the reschedule request
        $rescheduleRequest = LeaveRescheduleRequest::create([
            'original_leave_request_id' => $validated['original_leave_request_id'],
            'employee_id' => $employeeId,
            'proposed_dates' => $validated['proposed_dates'],
            'reason' => $validated['reason'],
            'status' => $initialStatus,
            'submitted_at' => now(),
        ]);

        // If auto-approved for dept heads/admins, set processed info and update dates
        if ($autoApproved) {
            $rescheduleRequest->update([
                'processed_by' => $user->id,
                'processed_at' => now(),
                'dept_head_remarks' => 'Auto-approved: Department Head/Admin request',
                'dept_head_reviewed_by' => $user->id,
                'dept_head_reviewed_at' => now(),
            ]);

            // Update the original leave request with new dates
            $this->updateLeaveRequestDates($originalLeave, $validated['proposed_dates'], $rescheduleRequest);
        }

        // 🔔 Send notifications
        try {
            if (!$autoApproved) {
                $this->notificationService->notifyRescheduleRequestSubmission($rescheduleRequest);
            } else {
                $this->notificationService->notifyRescheduleAutoApproval($rescheduleRequest);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send reschedule notifications: ' . $e->getMessage());
        }

        // 🔔 Create employee notification
        try {
            $notificationType = $autoApproved ? 'reschedule_auto_approved' : 'reschedule_submitted';
            $notificationTitle = $autoApproved ? 'Reschedule Auto-Approved' : 'Reschedule Request Submitted';
            $notificationMessage = $autoApproved 
                ? "Your reschedule request has been automatically approved as Department Head/Admin. Your leave dates have been updated."
                : "Your reschedule request has been submitted and is pending HR approval.";

            $this->notificationService->createEmployeeNotification(
                $employeeId,
                $notificationType,
                $notificationTitle,
                $notificationMessage,
                [
                    'reschedule_id' => $rescheduleRequest->id,
                    'original_leave_id' => $originalLeave->id,
                    'status' => $initialStatus,
                ]
            );
        } catch (\Exception $e) {
            \Log::error('Failed to create employee notification: ' . $e->getMessage());
        }

        $successMessage = $autoApproved 
            ? 'Reschedule request submitted and automatically approved! Your leave dates have been updated.' 
            : 'Reschedule request submitted successfully!';

        return redirect()->route('employee.leave-history')->with([
            'success' => $successMessage,
            'auto_approved' => $autoApproved
        ]);

    } catch (\Exception $e) {
        \Log::error('Reschedule request submission failed: ' . $e->getMessage());
        return redirect()->back()->with('error', 'Failed to submit reschedule request. Please try again.');
    }
}

/**
 * Update original leave request with new dates and create reschedule history
 */
private function updateLeaveRequestDates($originalLeave, $proposedDates, $rescheduleRequest)
{
    try {
        $dates = collect($proposedDates)->sort()->values();
        $dateFrom = $dates->first();
        $dateTo = $dates->last();

        // Calculate working days (excluding weekends)
        $workingDays = 0;
        foreach ($dates as $date) {
            $dateObj = new \DateTime($date);
            $dayOfWeek = $dateObj->format('N');
            if ($dayOfWeek < 6) { // 1-5 are weekdays
                $workingDays++;
            }
        }

        // Store the original dates in reschedule history
        $rescheduleHistory = array_merge(
            json_decode($originalLeave->reschedule_history ?? '[]', true),
            [
                [
                    'reschedule_id' => $rescheduleRequest->id,
                    'original_dates' => [
                        'date_from' => $originalLeave->date_from,
                        'date_to' => $originalLeave->date_to,
                        'total_days' => $originalLeave->total_days,
                    ],
                    'new_dates' => [
                        'date_from' => $dateFrom,
                        'date_to' => $dateTo,
                        'total_days' => $workingDays,
                    ],
                    'rescheduled_at' => now()->toISOString(),
                    'reason' => $rescheduleRequest->reason,
                    'approved_by' => $rescheduleRequest->processed_by,
                    'remarks' => $rescheduleRequest->dept_head_remarks
                ]
            ]
        );

        // Update the original leave request
        $originalLeave->update([
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'total_days' => $workingDays,
            'selected_dates' => json_encode($dates),
            'reschedule_history' => json_encode($rescheduleHistory)
        ]);

    } catch (\Exception $e) {
        \Log::error('Failed to update leave request dates: ' . $e->getMessage());
        throw $e;
    }
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



public function checkDonationEligibility(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        if ($request->header('X-Inertia')) {
            return back()->with('error', 'Employee profile not found.');
        }
        return response()->json(['can_donate' => false]);
    }

    $canDonate = $this->leaveDonationService->canDonateMaternityLeave($employeeId);

    if ($request->header('X-Inertia')) {
        return back()->with([
            'can_donate' => $canDonate,
            'employee_gender' => $user->employee->gender
        ]);
    }

    return response()->json([
        'can_donate' => $canDonate,
        'employee_gender' => $user->employee->gender
    ]);
}

/**
 * Get eligible recipients for maternity leave donation
 */
public function getEligibleRecipients(Request $request)
{
    $recipients = $this->leaveDonationService->getEligibleRecipients();
    
    if ($request->header('X-Inertia')) {
        return back()->with('eligible_recipients', $recipients);
    }

    return response()->json($recipients);
}

/**
 * Handle maternity leave donation
 */
// In EmployeeController - update the donateMaternityLeave method
public function donateMaternityLeave(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        if ($request->header('X-Inertia')) {
            return back()->with('error', 'Employee profile not found.');
        }
        return response()->json(['error' => 'Employee profile not found.'], 400);
    }

    $validated = $request->validate([
        'recipient_employee_id' => ['required', 'exists:employees,employee_id'],
        'days' => ['sometimes', 'integer', 'min:1', 'max:7']
    ]);

    try {
        $days = $validated['days'] ?? 7;
        
        $result = $this->leaveDonationService->donateMaternityLeave(
            $employeeId,
            $validated['recipient_employee_id'],
            $days
        );

        if ($request->header('X-Inertia')) {
            return redirect()->route('employee.leave-balances')->with([
                'success' => $result['message'] ?? 'Donation request submitted successfully! Waiting for HR approval.',
                'donation_data' => $result
            ]);
        }

        return response()->json($result);

    } catch (\Exception $e) {
        \Log::error('Maternity leave donation failed: ' . $e->getMessage());
        
        if ($request->header('X-Inertia')) {
            return back()->with('error', $e->getMessage());
        }
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 400);
    }
}


/**
 * Display employee leave credits transaction log
 */
/**
 * Display employee leave credits transaction log
 */
public function creditsLog(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    // Get paginated credits log with employee relationship
    $query = \App\Models\LeaveCreditLog::with('employee')
        ->where('employee_id', $employeeId);

    // Apply month filter if provided
    if ($request->has('month') && $request->month) {
        $date = \Carbon\Carbon::parse($request->month);
        $query->where('year', $date->year)
              ->where('month', $date->month);
    }

    $creditsLog = $query->orderBy('date', 'desc')
        ->orderBy('created_at', 'desc')
        ->paginate(15)
        ->through(function ($log) {
            // Use more precise formatting for small values
            $points = (float) $log->points_deducted;
            $balanceBefore = (float) $log->balance_before;
            $balanceAfter = (float) $log->balance_after;
            
            return [
                'id' => $log->id,
                'type' => $log->type,
                'date' => $log->date,
                'year' => $log->year,
                'month' => $log->month,
                'points_deducted' => $points,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'remarks' => $log->remarks,
                'created_at' => $log->created_at,
                'formatted_date' => \Carbon\Carbon::parse($log->date)->format('M d, Y'),
                'formatted_created_at' => $log->created_at->format('M d, Y h:i A'),
                // Add calculated fields for frontend
                'actual_balance_change' => $balanceAfter - $balanceBefore,
                'is_late_deduction' => stripos($log->remarks ?? '', 'late') !== false,
            ];
        });

    // Get current leave credits for summary
    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

    return Inertia::render('Employee/CreditsLog', [
        'creditsLog' => $creditsLog,
        'currentBalances' => [
            'sl' => (float) ($leaveCredit->sl_balance ?? 0),
            'vl' => (float) ($leaveCredit->vl_balance ?? 0),
        ],
        'employee' => $user->employee->load('user'),
        'filters' => $request->only(['month']),
    ]);
}
}

