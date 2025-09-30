<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Carbon\Carbon;
use App\Models\LeaveCredit;
use App\Models\MonthlyCreditLog;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use Illuminate\Validation\Rule;
use App\Models\CreditConversion;
use App\Services\CreditConversionService;
use App\Services\NotificationService;
use App\Models\LeaveRecall;


class HRController extends Controller
{

    //EMPLOYEE MANAGEMENT
    public function employees(Request $request)
    {
        $perPage = 10; // Number of records per page
        
        $employees = Employee::with('department')
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
            ->when($request->department, function ($query, $department) {
                return $query->where('department_id', $department);
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString(); // Preserve all query parameters
    
        return Inertia::render('HR/Employees', [
            'employees' => $employees,
            'departments' => Department::all(),
            'filters' => $request->only(['search', 'department']),
        ]);
    }

public function storeEmployee(Request $request)
{
    $validated = $request->validate([
        'firstname' => 'required|string|max:255',
        'middlename' => 'nullable|string|max:255',
        'lastname' => 'required|string|max:255',
        'gender' => 'required|in:male,female',
        'date_of_birth' => 'required|date',
        'position' => 'required|string|max:255',
        'department_id' => 'required|exists:departments,id',
        'status' => 'required|in:active,inactive',
        'contact_number' => 'required|string|max:20',
        'address' => 'required|string|max:255',
        'civil_status' => 'required|in:single,married,widowed,divorced',
        'biometric_id' => 'nullable|integer|unique:employees,biometric_id',
        'monthly_salary' => 'required|numeric|min:0',
        'daily_rate' => 'required|numeric|min:0',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'role' => 'required|in:employee,hr,admin,dept_head',
        'is_primary' => 'nullable|boolean', // Add this validation
    ]);

    try {
        \DB::beginTransaction();
        
        // 1. Create the employee
        $employee = Employee::create([
            'firstname' => $validated['firstname'],
            'middlename' => $validated['middlename'],
            'lastname' => $validated['lastname'],
            'gender' => $validated['gender'],
            'date_of_birth' => $validated['date_of_birth'],
            'position' => $validated['position'],
            'department_id' => $validated['department_id'],
            'status' => $validated['status'],
            'contact_number' => $validated['contact_number'],
            'address' => $validated['address'],
            'civil_status' => $validated['civil_status'],
            'biometric_id' => $validated['biometric_id'] ?? null,
            'monthly_salary' => $validated['monthly_salary'],
            'daily_rate' => $validated['daily_rate'],
        ]);

        // 2. Determine if this user should be primary admin
        $isPrimary = false;
        if ($validated['role'] === 'admin' && isset($validated['is_primary']) && $validated['is_primary']) {
            $isPrimary = true;
        }

        // 3. Create the user and link to employee
        User::create([
            'name' => $validated['firstname'] . ' ' . $validated['lastname'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
            'employee_id' => $employee->employee_id,
            'is_primary' => $isPrimary, // Add this
        ]);

        // 4. Create default leave credit record for the new employee
        LeaveCredit::create([
            'employee_id' => $employee->employee_id,
            'sl_balance' => 0,
            'vl_balance' => 0,
            'last_updated' => now(),
            'remarks' => 'Initial balance for new employee',
        ]);

        \DB::commit();
        
        return redirect()->back()->with('success', 'Employee and user created successfully!');
    } catch (\Exception $e) {
        \DB::rollback();
        \Log::error('Error creating employee: ' . $e->getMessage(), [
            'data' => $validated,
            'trace' => $e->getTraceAsString()
        ]);
        
        return redirect()->back()->withErrors(['error' => 'Failed to create employee: ' . $e->getMessage()]);
    }
}


public function editEmployee(Employee $employee)
{
    // Laravel will automatically find the employee by employee_id
    // because we defined $primaryKey in the model

    $employee->load('user', 'department');

    return Inertia::render('HR/EditEmployee', [
        'employee' => $employee,
        'departments' => Department::all(),
    ]);
}
    /**
     * Update employee information
     */
public function updateEmployee(Request $request, Employee $employee)
{
    // Validate the incoming data - all fields optional
    $validated = $request->validate([
        'firstname' => 'nullable|string|max:255',
        'middlename' => 'nullable|string|max:255',
        'lastname' => 'nullable|string|max:255',
        'gender' => 'nullable|in:male,female',
        'date_of_birth' => 'nullable|date',
        'position' => 'nullable|string|max:255',
        'department_id' => 'nullable|exists:departments,id',
        'status' => 'nullable|in:active,inactive',
        'contact_number' => 'nullable|string|max:20',
        'address' => 'nullable|string|max:500',
        'civil_status' => 'nullable|in:single,married,widowed,divorced',
        'biometric_id' => [
            'nullable',
            'integer',
            Rule::unique('employees')->ignore($employee->employee_id, 'employee_id')
        ],
        'monthly_salary' => 'nullable|numeric|min:0',
        'daily_rate' => 'nullable|numeric|min:0',
        'role' => 'required|in:employee,hr,admin,dept_head',
        'is_primary' => 'nullable|boolean',
    ]);


    try {
        \DB::beginTransaction();

        // Update employee details
        $employee->update($validated);

        // If status was changed and employee has a user account
        if ($request->has('status') && $employee->user) {
            $newStatus = $request->status;
            
            if ($newStatus === 'inactive') {
                // Log the status change
                \Log::info("Employee {$employee->employee_id} status changed to inactive. User ID: {$employee->user->id}");
                
                // You could also broadcast an event here to force logout if needed
            }
        }

        // Update user information if provided
        if ($employee->user && isset($validated['role'])) {
            $userData = [
                'role' => $validated['role'],
                'is_primary' => ($validated['role'] === 'admin') ? ($validated['is_primary'] ?? false) : false,
            ];

            // Update password if provided
            if (!empty($validated['password'])) {
                $userData['password'] = bcrypt($validated['password']);
            }

            $employee->user->update($userData);
        }

        \DB::commit();
        
        return redirect()->route('hr.employees.show', $employee->employee_id)
            ->with('success', 'Employee information updated successfully!');

    } catch (\Exception $e) {
        \DB::rollback();
        \Log::error('Error updating employee: ' . $e->getMessage());
        
        return redirect()->back()->withErrors(['error' => 'Failed to update employee: ' . $e->getMessage()]);
    }
}


//LEAVE CREDITS
public function leaveCredits(Request $request)
{
    $perPage = 10;
    
    $employees = Employee::with(['leaveCredit', 'department', 'user'])
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
        ->when($request->department, function ($query, $department) {
            return $query->where('department_id', $department);
        })
        ->orderBy('firstname')
        ->orderBy('lastname')
        ->paginate($perPage)
        ->withQueryString();

    $now = Carbon::now();
    $year = $now->year;
    $month = $now->month;

    $alreadyCredited = MonthlyCreditLog::where('year', $year)
        ->where('month', $month)
        ->exists();

    return Inertia::render('HR/LeaveCredits', [
        'employees' => $employees,
        'alreadyCredited' => $alreadyCredited,
        'creditedMonth' => $now->format('F'),
        'creditedYear' => $year,
        'departments' => Department::all(),
        'filters' => $request->only(['search', 'department']),
    ]);
}

public function update(Request $request, User $employee)
{
    $request->validate([
        'sl_balance' => 'required|numeric|min:0',
        'vl_balance' => 'required|numeric|min:0',
    ]);

    $leaveCredit = LeaveCredit::firstOrCreate(
        ['employee_id' => $employee->id],
        ['sl_balance' => 0, 'vl_balance' => 0]
    );

    $leaveCredit->update([
        'sl_balance' => $request->sl_balance,
        'vl_balance' => $request->vl_balance,
    ]);

    return redirect()->back()->with('success', 'Leave credits updated successfully.');
}



public function addMonthlyCredits()
{
    $now = Carbon::now();
    $year = $now->year;
    $month = $now->month;

    // Check if already added this month
    $alreadyCredited = MonthlyCreditLog::where('year', $year)
        ->where('month', $month)
        ->exists();

    if ($alreadyCredited) {
        return redirect()->back()->with([
            'alreadyCredited' => true,
            'creditedMonth' => $now->format('F'),
            'creditedYear' => $year
        ]);
    }

    // Get all roles that should receive leave credits
    $employees = User::whereIn('role', ['employee', 'admin', 'hr', 'dept_head'])->get();

    foreach ($employees as $employee) {
        $credit = LeaveCredit::firstOrCreate(
            ['employee_id' => $employee->id],
            ['sl_balance' => 0, 'vl_balance' => 0]
        );

        $credit->increment('sl_balance', 1.25);
        $credit->increment('vl_balance', 1.25);
    }

    MonthlyCreditLog::create([
        'year' => $year,
        'month' => $month,
    ]);

    return redirect()->back()->with([
        'success' => 'Monthly leave credits added successfully.',
        'creditedMonth' => $now->format('F'),
        'creditedYear' => $year
    ]);
}


// Add this method to your HRController
public function showLeaveCredit($employee_id)
{
    $employee = Employee::with(['department', 'user', 'leaveCredit'])
        ->where('employee_id', $employee_id)
        ->firstOrFail();

    // Get SL and VL balances from leave_credits table
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
                'default_days' => $balance->leaveType->default_days,
                'earnable' => false,
                'description' => 'Fixed allocation'
            ];
        });

    return Inertia::render('HR/ShowLeaveCredit', [
        'employee' => $employee,
        'earnableLeaveCredits' => $earnableLeaveCredits,
        'nonEarnableLeaveBalances' => $nonEarnableLeaveBalances,
    ]);
}

//LEAVE TYPES
public function leaveTypes()
{
    $leaveTypes = LeaveType::paginate(8); // 10 items per page

    return Inertia::render('HR/LeaveTypes', [
        'leaveTypes' => $leaveTypes,
    ]);
}

public function storeLeaveType(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'code' => 'required|string|max:20|unique:leave_types,code',
        'earnable' => 'required|boolean',
        'deductible' => 'required|boolean',
        'document_required' => 'required|boolean',
        'default_days' => 'nullable|integer|min:0',
    ]);

    // Enforce rules: SL and VL cannot have default_days
    if (in_array(strtoupper($validated['code']), ['SL', 'VL'])) {
        $validated['default_days'] = null;
    }

    LeaveType::create($validated);

    return back()->with('success', 'Leave type created.');
}

public function updateLeaveType(Request $request, LeaveType $leaveType)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'code' => 'required|string|max:20|unique:leave_types,code,' . $leaveType->id,
        'earnable' => 'required|boolean',
        'deductible' => 'required|boolean',
        'document_required' => 'required|boolean',
        'default_days' => 'nullable|integer|min:0',
    ]);

    // Enforce rules: SL and VL cannot have default_days
    if (in_array(strtoupper($validated['code']), ['SL', 'VL'])) {
        $validated['default_days'] = null;
    }

    $leaveType->update($validated);

    return back()->with('success', 'Leave type updated.');
}

public function deleteLeaveType(LeaveType $leaveType)
{
    $leaveType->delete();
    return back()->with('success', 'Leave type deleted.');
}

// DEPARTMENT MANAGEMENT
// Display page
public function departments(Request $request)
{
    $perPage = 7; // Number of departments per page
    
    $departments = Department::with('head')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('HR/Departments', [
        'departments' => $departments,
    ]);
}

// Store
public function storeDepartment(Request $request)
{
    $request->validate(['name' => 'required|unique:departments,name']);
    Department::create($request->only('name'));

    return redirect()->back()->with('success', 'Department added!');
}

// Update
public function updateDepartment(Request $request, $id)
{
    $request->validate(['name' => 'required']);
    $dept = Department::findOrFail($id);
    $dept->update($request->only('name'));

    return redirect()->back()->with('success', 'Department updated!');
}

// Delete
public function deleteDepartment($id)
{
    Department::findOrFail($id)->delete();
    return redirect()->back()->with('success', 'Department deleted!');
}

// LEAVE REQUEST APPROVAL METHODS
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
    $fullyApprovedRequests = LeaveRequest::where('status', 'approved')->count();
    $rejectedRequests = LeaveRequest::where('status', 'rejected')->count();

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

    return Inertia::render('HR/Dashboard', [
        'pendingCount' => $pendingCount,
        'recentRequests' => $recentRequests,
        'requestsByStatus' => $requestsByStatus,
        'totalEmployees' => $totalEmployees,
        'totalDepartments' => $totalDepartments,
        'fullyApprovedRequests' => $fullyApprovedRequests,
        'rejectedRequests' => $rejectedRequests,
        'leaveTypeStats' => $leaveTypeStats,
        'monthlyStats' => $monthlyStats,
        'departmentStats' => $departmentStats,
    ]);
}

public function leaveRequests(Request $request)
{
    $perPage = 15; // Number of records per page
    
    $query = LeaveRequest::with([
            'leaveType',
            'employee.department',
            'details',
            'approvals'
        ])
        ->orderBy('created_at', 'desc');

    // Filter by approval status (using subqueries)
    if ($request->has('status') && $request->status !== 'all') {
        switch ($request->status) {
            case 'hr_pending':
                // Requests with no HR approval yet
                $query->whereDoesntHave('approvals', function ($q) {
                    $q->where('role', 'hr');
                });
                break;

            case 'approved_by_hr':
                // Requests approved by HR but not by dept_head or admin
                $query->whereHas('approvals', function ($q) {
                    $q->where('role', 'hr')->where('status', 'approved');
                })->whereDoesntHave('approvals', function ($q) {
                    $q->whereIn('role', ['dept_head', 'admin']);
                });
                break;

            case 'rejected':
                // Requests with any rejection
                $query->whereHas('approvals', function ($q) {
                    $q->where('status', 'rejected');
                });
                break;

            case 'fully_approved':
                // Requests with all three approvals
                $query->whereHas('approvals', function ($q) {
                    $q->where('role', 'hr')->where('status', 'approved');
                })->whereHas('approvals', function ($q) {
                    $q->where('role', 'dept_head')->where('status', 'approved');
                })->whereHas('approvals', function ($q) {
                    $q->where('role', 'admin')->where('status', 'approved');
                });
                break;

            default:
                // For 'all' or other statuses, no additional filtering
                break;
        }
    }

    // Filter by date range
    if ($request->has('date_from')) {
        $query->where('date_from', '>=', $request->date_from);
    }
    if ($request->has('date_to')) {
        $query->where('date_to', '<=', $request->date_to);
    }

    // Search by employee name
    if ($request->has('search')) {
        $search = $request->search;
        $query->whereHas('employee', function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
              ->orWhere('lastname', 'like', "%{$search}%");
        });
    }

    $leaveRequests = $query->paginate($perPage)->withQueryString();

    return Inertia::render('HR/LeaveRequests', [
        'leaveRequests' => $leaveRequests,
        'filters' => $request->only(['status', 'date_from', 'date_to', 'search']),
    ]);
}


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

    return Inertia::render('HR/ShowLeaveRequest', [
        'leaveRequest' => $leaveRequest,
        'workingDays' => $workingDays,
        'leaveCredit' => $leaveCredit,
    ]);
}


// In HRController - modify the approveLeaveRequest method
public function approveLeaveRequest(Request $request, $id)
{
    $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

    // Validate that the request is pending
    if ($leaveRequest->status !== 'pending') {
        return back()->withErrors(['message' => 'This request has already been processed.']);
    }

    // REMOVE THE BALANCE CHECK AND DEDUCTION LOGIC FROM HR APPROVAL
    // HR should only approve/reject, not deduct balances

    // // Simply update the status and create approval record
    // $leaveRequest->update(['status' => 'approved_by_hr']); // Use intermediate status

    // Create approval record
    \App\Models\LeaveApproval::create([
        'leave_id' => $leaveRequest->id,
        'approved_by' => $request->user()->id,
        'role' => 'hr',
        'status' => 'approved',
        'remarks' => $request->remarks ?? '',
        'approved_at' => now(),
    ]);

    // Send notification to employee
    $notificationService = new NotificationService();
    $notificationService->createLeaveRequestNotification(
        $leaveRequest->employee_id,
        'hr_approved',
        $id,
        $leaveRequest->leaveType->name ?? 'Leave',
        $leaveRequest->date_from,
        $leaveRequest->date_to,
        $request->remarks ?? ''
    );

    return redirect()->route('hr.leave-requests')->with('success', 'Leave request approved successfully.');
}


// In HRController - modify the bulkAction method
public function bulkAction(Request $request)
{
    $request->validate([
        'action' => 'required|in:approve,reject',
        'request_ids' => 'required|array',
        'request_ids.*' => 'exists:leave_requests,id',
        'remarks' => 'required_if:action,reject|string|max:500',
    ]);

    $leaveRequests = LeaveRequest::whereIn('id', $request->request_ids)
        ->where('status', 'pending')
        ->with(['employee', 'leaveType'])
        ->get();

    $notificationService = new NotificationService();
    $successfulApprovals = 0;

    foreach ($leaveRequests as $leaveRequest) {
        if ($request->action === 'approve') {
            // REMOVE BALANCE CHECK AND DEDUCTION FROM HR BULK APPROVAL
            // HR should not deduct balances
            
            // Update the leave request status
            $leaveRequest->update(['status' => 'approved_by_hr']);

            // Create approval record
            \App\Models\LeaveApproval::create([
                'leave_id' => $leaveRequest->id,
                'approved_by' => $request->user()->id,
                'role' => 'hr',
                'status' => 'approved',
                'remarks' => $request->remarks ?? '',
                'approved_at' => now(),
            ]);

            // Send notification to employee
            $notificationService->createLeaveRequestNotification(
                $leaveRequest->employee_id,
                'hr_approved',
                $leaveRequest->id,
                $leaveRequest->leaveType->name ?? 'Leave',
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $request->remarks ?? ''
            );

            $successfulApprovals++;
        } else {
            // Handle rejection (unchanged)
            $leaveRequest->update(['status' => 'rejected']);

            \App\Models\LeaveApproval::create([
                'leave_id' => $leaveRequest->id,
                'approved_by' => $request->user()->id,
                'role' => 'hr',
                'status' => 'rejected',
                'remarks' => $request->remarks,
                'approved_at' => now(),
            ]);

            $notificationService->createLeaveRequestNotification(
                $leaveRequest->employee_id,
                'hr_rejected',
                $leaveRequest->id,
                $leaveRequest->leaveType->name ?? 'Leave',
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $request->remarks
            );

            $successfulApprovals++;
        }
    }

    $action = $request->action === 'approve' ? 'approved' : 'rejected';
    $message = "{$successfulApprovals} leave requests {$action} successfully.";

    return redirect()->route('hr.leave-requests')->with('success', $message);
}

    public function rejectLeaveRequest(Request $request, $id)
    {
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

        // Validate that the request is pending
        if ($leaveRequest->status !== 'pending') {
            return back()->withErrors(['message' => 'This request has already been processed.']);
        }

        $request->validate([
            'remarks' => 'required|string|max:500',
        ]);

        // Update the leave request status
        $leaveRequest->update(['status' => 'rejected']);

        // Create approval record
        \App\Models\LeaveApproval::create([
            'leave_id' => $leaveRequest->id,
            'approved_by' => $request->user()->id,
            'role' => 'hr',
            'status' => 'rejected',
            'remarks' => $request->remarks,
            'approved_at' => now(),
        ]);

        // Send notification to employee - UPDATED STATUS
        $notificationService = new NotificationService();
        $notificationService->createLeaveRequestNotification(
            $leaveRequest->employee_id,
            'hr_rejected', // Changed from 'rejected' to 'hr_rejected'
            $id,
            $leaveRequest->leaveType->name ?? 'Leave',
            $leaveRequest->date_from,
            $leaveRequest->date_to,
            $request->remarks
        );

        return redirect()->route('hr.leave-requests')
            ->with('success', 'Leave request rejected successfully.');
    }

 
public function show($id)
{
    // Use where() with the correct column name
    $employee = Employee::with([
        'department',
        'user',
        'leaveCredits' // This should work now
    ])->where('employee_id', $id)->firstOrFail();

    return Inertia::render('HR/EmployeeShow', [
        'employee' => $employee,
    ]);
}

//Calendar View
// Add this method to your HRController
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

    return Inertia::render('HR/LeaveCalendar', [
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
     * Show credit conversion requests for HR approval
     */
   /**
 * Show credit conversion requests for HR approval
 */
public function creditConversions(Request $request)
{
    $perPage = 10; // Number of records per page
    
    $query = CreditConversion::with(['employee.department'])
        ->when($request->status, function ($query, $status) {
            return $query->where('status', $status);
        })
        ->when($request->employee, function ($query, $employee) {
            return $query->whereHas('employee', function ($q) use ($employee) {
                $q->where('firstname', 'like', "%{$employee}%")
                  ->orWhere('lastname', 'like', "%{$employee}%");
            });
        })
        ->orderBy('created_at', 'desc');

    $conversions = $query->paginate($perPage)->withQueryString();

    // Get statistics for dashboard cards
    $totalRequests = CreditConversion::count();
    $pendingRequests = CreditConversion::where('status', 'pending')->count();
    $approvedRequests = CreditConversion::where('status', 'approved')->count();
    $rejectedRequests = CreditConversion::where('status', 'rejected')->count();

    // Transform the data for the frontend
    $transformedConversions = $conversions->getCollection()->map(function ($conversion) {
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
            'employee' => $conversion->employee ? [
                'employee_id' => $conversion->employee->employee_id,
                'firstname' => $conversion->employee->firstname,
                'lastname' => $conversion->employee->lastname,
                'position' => $conversion->employee->position,
                'department' => $conversion->employee->department ? [
                    'id' => $conversion->employee->department->id,
                    'name' => $conversion->employee->department->name,
                ] : null,
            ] : null,
        ];
    });

    // Replace the collection with transformed data
    $conversions->setCollection($transformedConversions);

    return Inertia::render('HR/CreditConversions', [
        'conversions' => $conversions,
        'stats' => [
            'total' => $totalRequests,
            'pending' => $pendingRequests,
            'approved' => $approvedRequests,
            'rejected' => $rejectedRequests,
        ],
        'filters' => $request->only(['status', 'employee']),
    ]);
}

    /**
     * Show specific credit conversion request
     */
    public function showCreditConversion($id)
    {
        $conversion = CreditConversion::with(['employee.department', 'approver'])
            ->findOrFail($id);

        // Map leave type codes to readable names
        $leaveTypeNames = [
            'SL' => 'Sick Leave',
            'VL' => 'Vacation Leave'
        ];

        // Flatten the conversion data
        $flattenedConversion = [
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
            'employee' => $conversion->employee ? [
                'employee_id' => $conversion->employee->employee_id,
                'firstname' => $conversion->employee->firstname,
                'lastname' => $conversion->employee->lastname,
                'position' => $conversion->employee->position,
                'department' => $conversion->employee->department ? [
                    'id' => $conversion->employee->department->id,
                    'name' => $conversion->employee->department->name,
                ] : null,
            ] : null,
            'approver' => $conversion->approver ? [
                'id' => $conversion->approver->id,
                'name' => $conversion->approver->name,
            ] : null,
        ];

        return Inertia::render('HR/ShowCreditConversion', [
            'conversion' => $flattenedConversion,
        ]);
    }

    /**
     * Approve credit conversion request
     */
    public function approveCreditConversion(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $creditConversionService = new CreditConversionService();
            $conversion = $creditConversionService->approveConversion(
                $id,
                $request->user()->id,
                $validated['remarks']
            );

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createCreditConversionNotification(
                $conversion->employee_id,
                'approved',
                $id,
                $conversion->leave_type,
                $conversion->credits_requested,
                $conversion->equivalent_cash
            );

            return redirect()->route('hr.credit-conversions')->with('success', 'Credit conversion request approved successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reject credit conversion request
     */
    public function rejectCreditConversion(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => ['required', 'string', 'max:500'],
        ]);

        try {
            $creditConversionService = new CreditConversionService();
            $conversion = $creditConversionService->rejectConversion(
                $id,
                $request->user()->id,
                $validated['remarks']
            );

            // Send notification to employee
            $notificationService = new NotificationService();
            $notificationService->createCreditConversionNotification(
                $conversion->employee_id,
                'rejected',
                $id,
                $conversion->leave_type,
                $conversion->credits_requested,
                $conversion->equivalent_cash
            );

            return redirect()->route('hr.credit-conversions')->with('success', 'Credit conversion request rejected successfully!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    // LEAVE RECALL REQUESTS MANAGEMENT
    
    /**
     * Display a listing of recall requests that need HR approval
     */
  // LEAVE RECALL REQUESTS MANAGEMENT

/**
 * Display a listing of all recall requests with pagination and filtering
 */
public function recallRequests(Request $request)
{
    $perPage = 10; // Number of records per page
    
    $query = LeaveRecall::with([
        'leaveRequest.leaveType',
        'employee.department',
        'approvedByDeptHead',
        'approvedByHr'
    ]);

    // Filter by status
    if ($request->has('status') && $request->status !== 'all') {
        $query->where('status', $request->status);
    }

    // Search by employee name
    if ($request->has('search')) {
        $search = $request->search;
        $query->whereHas('employee', function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
              ->orWhere('lastname', 'like', "%{$search}%");
        });
    }

    // Filter by date range
    if ($request->has('date_from')) {
        $query->whereDate('created_at', '>=', $request->date_from);
    }
    if ($request->has('date_to')) {
        $query->whereDate('created_at', '<=', $request->date_to);
    }

    $recallRequests = $query->orderBy('created_at', 'desc')
        ->paginate($perPage)
        ->withQueryString();

    // Get statistics for dashboard cards
    $totalRequests = LeaveRecall::count();
    $pendingRequests = LeaveRecall::where('status', 'pending')->count();
    $approvedRequests = LeaveRecall::where('status', 'approved')->count();
    $rejectedRequests = LeaveRecall::where('status', 'rejected')->count();

    // Get recent activity (last 5 requests)
    $recentActivity = LeaveRecall::with(['employee', 'leaveRequest.leaveType'])
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get()
        ->map(function ($recall) {
            return [
                'id' => $recall->id,
                'employee_name' => $recall->employee->firstname . ' ' . $recall->employee->lastname,
                'leave_type' => $recall->leaveRequest->leaveType->name,
                'status' => $recall->status,
                'created_at' => $recall->created_at,
            ];
        });

    return Inertia::render('HR/RecallRequests', [
        'recallRequests' => $recallRequests,
        'stats' => [
            'total' => $totalRequests,
            'pending' => $pendingRequests,
            'approved' => $approvedRequests,
            'rejected' => $rejectedRequests,
        ],
        'recentActivity' => $recentActivity,
        'filters' => $request->only(['status', 'search', 'date_from', 'date_to']),
    ]);
}

/**
 * Show specific recall request details
 */
public function showRecallRequest($id)
{
    $recallRequest = LeaveRecall::with([
        'leaveRequest.leaveType',
        'employee.department',
        'approvedByDeptHead',
        'approvedByHr'
    ])->findOrFail($id);

    return Inertia::render('HR/ShowRecallRequest', [
        'recallRequest' => $recallRequest,
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
        $recallRequest = LeaveRecall::findOrFail($id);
        
        // Check if already processed
        if ($recallRequest->status !== 'pending') {
            return back()->with('error', 'This recall request has already been processed.');
        }

        // Check if dept head approval exists
        if (!$recallRequest->approved_by_depthead) {
            return back()->with('error', 'This recall request needs department head approval first.');
        }

        // Update recall request
        $recallRequest->update([
            'status' => 'approved',
            'approved_by_hr' => $request->user()->id
        ]);

        // Update the original leave request dates
        $leaveRequest = $recallRequest->leaveRequest;
        $leaveRequest->update([
            'date_from' => $recallRequest->new_leave_date_from,
            'date_to' => $recallRequest->new_leave_date_to
        ]);

        // Send notification to employee
        $notificationService = new NotificationService();
        $notificationService->createLeaveRecallNotification(
            $recallRequest->employee_id,
            'approved',
            $recallRequest->id,
            $recallRequest->leaveRequest->leaveType->name ?? 'Leave',
            $recallRequest->new_leave_date_from,
            $recallRequest->new_leave_date_to
        );

        return redirect()->route('hr.recall-requests')->with('success', 'Recall request approved successfully!');
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
        $recallRequest = LeaveRecall::findOrFail($id);
        
        // Check if already processed
        if ($recallRequest->status !== 'pending') {
            return back()->with('error', 'This recall request has already been processed.');
        }

        // Update recall request
        $recallRequest->update([
            'status' => 'rejected',
            'approved_by_hr' => $request->user()->id
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

        return redirect()->route('hr.recall-requests')->with('success', 'Recall request rejected successfully!');
    } catch (\Exception $e) {
        return back()->withErrors(['error' => $e->getMessage()]);
    }
}
//     /**
//      * Approve a recall request
//      */
//     public function approveRecallRequest(Request $request, $id)
//     {
//         $request->validate([
//             'remarks' => 'nullable|string|max:500'
//         ]);

//         try {
//             $recallRequest = LeaveRecall::findOrFail($id);
            
//             // Check if already processed
//             if ($recallRequest->status !== 'pending') {
//                 return back()->with('error', 'This recall request has already been processed.');
//             }

//             // Check if dept head approval exists
//             if (!$recallRequest->approved_by_depthead) {
//                 return back()->with('error', 'This recall request needs department head approval first.');
//             }

//             // Update recall request
//             $recallRequest->update([
//                 'status' => 'approved',
//                 'approved_by_hr' => $request->user()->id
//             ]);

//             // Update the original leave request dates
//             $leaveRequest = $recallRequest->leaveRequest;
//             $leaveRequest->update([
//                 'date_from' => $recallRequest->new_leave_date_from,
//                 'date_to' => $recallRequest->new_leave_date_to
//             ]);

//             // Send notification to employee
//             $notificationService = new NotificationService();
//             $notificationService->createLeaveRecallNotification(
//                 $recallRequest->employee_id,
//                 'approved',
//                 $recallRequest->id,
//                 $recallRequest->leaveRequest->leaveType->name ?? 'Leave',
//                 $recallRequest->new_leave_date_from,
//                 $recallRequest->new_leave_date_to
//             );

//             return redirect()->route('hr.recall-requests')->with('success', 'Recall request approved successfully!');
//         } catch (\Exception $e) {
//             return back()->withErrors(['error' => $e->getMessage()]);
//         }
//     }

//     /**
//      * Reject a recall request
//      */
//     public function rejectRecallRequest(Request $request, $id)
//     {
//         $request->validate([
//             'remarks' => 'required|string|max:500'
//         ]);

//         try {
//             $recallRequest = LeaveRecall::findOrFail($id);
            
//             // Check if already processed
//             if ($recallRequest->status !== 'pending') {
//                 return back()->with('error', 'This recall request has already been processed.');
//             }

//             // Update recall request
//             $recallRequest->update([
//                 'status' => 'rejected',
//                 'approved_by_hr' => $request->user()->id
//             ]);

//             // Send notification to employee
//             $notificationService = new NotificationService();
//             $notificationService->createLeaveRecallNotification(
//                 $recallRequest->employee_id,
//                 'rejected',
//                 $recallRequest->id,
//                 $recallRequest->leaveRequest->leaveType->name ?? 'Leave',
//                 $recallRequest->new_leave_date_from,
//                 $recallRequest->new_leave_date_to,
//                 $request->remarks
//             );

//             return redirect()->route('hr.recall-requests')->with('success', 'Recall request rejected successfully!');
//         } catch (\Exception $e) {
//             return back()->withErrors(['error' => $e->getMessage()]);
//         }
//     }

 }
