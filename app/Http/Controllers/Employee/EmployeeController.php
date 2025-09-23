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


class EmployeeController extends Controller
{
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

    $leaveTypes = LeaveType::select('id', 'name', 'code', 'document_required')
        ->orderBy('name')->get();

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

    // Get working days from request or calculate
    $workingDays = $request->input('working_days') ?? 0;
    if ($workingDays === 0) {
        // Calculate working days if not provided
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

    // Get leave type
    $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
    $code = strtoupper($leaveType->code);

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

    // Create leave request with partial credits
    $leaveRequest = LeaveRequest::create([
        'employee_id' => $employeeId,
        'leave_type_id' => $validated['leave_type_id'],
        'date_from' => $validated['date_from'],
        'date_to' => $validated['date_to'],
        'reason' => $validated['reason'],
        'status' => 'pending',
        'attachment_path' => $attachmentPath,
        'days_with_pay' => $daysWithPay,
        'days_without_pay' => $daysWithoutPay,
        'total_days' => $workingDays,
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

    return redirect()->route('employee.my-leave-requests')->with('success', 'Leave request submitted successfully!');
}



   // In EmployeeController.php
// In EmployeeController.php
public function myLeaveRequests(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $leaveRequests = LeaveRequest::with(['leaveType', 'details', 'approvals', 'recalls'])
        ->where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->paginate(5);

    // Debug: Check the structure
    logger('Pagination structure:', [
        'has_data' => $leaveRequests->count(),
        'total' => $leaveRequests->total(),
        'structure' => $leaveRequests->toArray()
    ]);

    return Inertia::render('Employee/MyLeaveRequests', [
        'leaveRequests' => $leaveRequests,
        'employee' => $user->employee,
    ]);
}

//employee calendar

// In your EmployeeController.php
public function leaveCalendar(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    // Get fully approved leave requests (all three approvals: hr, dept_head, admin)
    $approvedLeaveRequests = LeaveRequest::where('employee_id', $employeeId)
        ->where('status', 'approved')
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'hr')->where('status', 'approved');
        })
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'dept_head')->where('status', 'approved');
        })
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->with(['leaveType', 'approvals' => function ($query) {
            $query->with('approver');
        }])
        ->get()
        ->map(function ($leaveRequest) {
            return [
                'id' => $leaveRequest->id,
                'title' => $leaveRequest->leaveType->code . ' - ' . $leaveRequest->leaveType->name,
                'start' => $leaveRequest->date_from,
                'end' => $leaveRequest->date_to,
                'allDay' => true,
                'backgroundColor' => '#10B981', // Green color for approved leaves
                'borderColor' => '#059669',
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
        'events' => $approvedLeaveRequests,
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
        $creditConversionService = new CreditConversionService();
        
        $slEligibility = $creditConversionService->checkEligibility($employeeId, 'SL');
        $vlEligibility = $creditConversionService->checkEligibility($employeeId, 'VL');
        
        $conversionStats = $creditConversionService->getEmployeeConversionStats($employeeId);

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
            $creditConversionService = new CreditConversionService();
            $conversion = $creditConversionService->requestConversion(
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
                \Log::info('Found employee through direct query in myCreditConversions', ['employee_id' => $employeeId]);
            }
        }

        if (!$employeeId) {
            $errorMessage = 'Employee profile not found for user. ';
            $errorMessage .= 'User ID: ' . $user->id . ', ';
            $errorMessage .= 'User Role: ' . $user->role . ', ';
            $errorMessage .= 'Employee ID in User: ' . ($user->employee_id ?? 'null');
            
            \Log::error('Employee profile not found in myCreditConversions:', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'employee_id_in_user' => $user->employee_id,
                'employee_relationship' => $user->employee ? 'exists' : 'missing'
            ]);
            
            abort(400, $errorMessage);
        }

        $conversions = CreditConversion::where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($conversion) {
                // Map leave type codes to readable names
                $leaveTypeNames = [
                    'SL' => 'Sick Leave',
                    'VL' => 'Vacation Leave'
                ];
                
                return [
                    'conversion_id' => $conversion->conversion_id,
                    'employee_id' => $conversion->employee_id,
                    'leave_type_code' => $conversion->leave_type,
                    'leave_type_name' => $leaveTypeNames[$conversion->leave_type] ?? 'Unknown',
                    'credits_requested' => $conversion->credits_requested,
                    'equivalent_cash' => $conversion->equivalent_cash,
                    'status' => $conversion->status,
                    'submitted_at' => $conversion->submitted_at,
                    'approved_at' => $conversion->approved_at,
                    'approved_by' => $conversion->approved_by,
                    'remarks' => $conversion->remarks,
                    'created_at' => $conversion->created_at,
                    'updated_at' => $conversion->updated_at,
                ];
            });

        $creditConversionService = new CreditConversionService();
        $conversionStats = $creditConversionService->getEmployeeConversionStats($employeeId);

        return Inertia::render('Employee/MyCreditConversions', [
            'auth' => ['user' => $user],
            'conversions' => $conversions,
            'conversionStats' => $conversionStats,
        ]);
    }
}

