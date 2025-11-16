<?php

namespace App\Http\Controllers\HR;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmployeeWelcomeMail;
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
use App\Models\LeaveCreditLog;
use App\Exports\EmployeeRecordingsExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Holiday;
use App\Models\LeaveRescheduleRequest;


class HRController extends Controller
{



    protected $creditConversionService;
    protected $notificationService;
    

    // ADD THIS CONSTRUCTOR
    public function __construct(CreditConversionService $creditConversionService, NotificationService $notificationService)
    {
        $this->creditConversionService = $creditConversionService;
        $this->notificationService = $notificationService;
    }

    //EMPLOYEE MANAGEMENT
   // In HRController - update the employees method
// In HRController - update the employees method
public function employees(Request $request)
{
    $perPage = 10;
    
    $employees = Employee::with('department')
        ->when($request->filled('search'), function ($query) use ($request) {
            return $query->where(function ($q) use ($request) {
                $q->where('firstname', 'like', "%{$request->search}%")
                  ->orWhere('lastname', 'like', "%{$request->search}%")
                  ->orWhere('position', 'like', "%{$request->search}%")
                  ->orWhereHas('department', function ($q) use ($request) {
                      $q->where('name', 'like', "%{$request->search}%");
                  });
            });
        })
        ->when($request->filled('department'), function ($query) use ($request) {
            return $query->where('department_id', $request->department);
        })
        ->orderBy('firstname')
        ->paginate($perPage)
        ->withQueryString();

    // Get departments with their heads
    $departmentsWithHeads = Department::with('head')->get()->map(function($department) {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'head_employee_id' => $department->head_employee_id,
            'head' => $department->head ? [
                'employee_id' => $department->head->employee_id,
                'firstname' => $department->head->firstname,
                'lastname' => $department->head->lastname,
                'position' => $department->head->position,
            ] : null
        ];
    });

    return Inertia::render('HR/Employees', [
        'employees' => $employees,
        'departments' => $departmentsWithHeads,
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
            'is_primary' => 'nullable|boolean',
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
            $user = User::create([
                'name' => $validated['firstname'] . ' ' . $validated['lastname'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'employee_id' => $employee->employee_id,
                'is_primary' => $isPrimary,
            ]);
    
            // 4. Create default leave credit record for SL/VL (earnable leaves)
            LeaveCredit::create([
                'employee_id' => $employee->employee_id,
                'sl_balance' => 0,
                'vl_balance' => 0,
                'last_updated' => now(),
                'remarks' => 'Initial balance for new employee',
            ]);
    
            // 5. Create leave balance records for non-earnable leave types with fixed allocations
            $this->createFixedLeaveBalances($employee->employee_id);
    
            // 6. Attempt to send welcome email (but don't fail if it doesn't work)
            $emailSent = false;
            try {
                Mail::to($validated['email'])->send(
                    new EmployeeWelcomeMail($employee, $validated['email'], $validated['password'])
                );
                $emailSent = true;
                \Log::info('Welcome email sent successfully to: ' . $validated['email']);
            } catch (\Exception $emailException) {
                // Just log the error but continue with success response
                \Log::warning('Welcome email failed for ' . $validated['email'] . ': ' . $emailException->getMessage());
                $emailSent = false;
            }
    
            \DB::commit();
            
            // Return appropriate message based on email status
            if ($emailSent) {
                return redirect()->back()->with('success', 'Employee created successfully! Welcome email sent.');
            } else {
                return redirect()->back()->with('success', 'Employee created successfully! Please provide login credentials to the employee in person.');
            }
            
        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Error creating employee: ' . $e->getMessage(), [
                'data' => $validated,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Failed to create employee: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Create fixed allocation leave balances for non-earnable leave types
     */
    /**
 * Create fixed allocation leave balances for non-earnable leave types
 */
private function createFixedLeaveBalances($employeeId)
{
    $currentYear = now()->year;
    
    \Log::info("Starting createFixedLeaveBalances for employee {$employeeId}");
    
    // Get ALL non-earnable leave types (including those with 0 or null default_days)
    $nonEarnableLeaveTypes = \App\Models\LeaveType::where('earnable', false)->get();
    
    \Log::info("Found {$nonEarnableLeaveTypes->count()} non-earnable leave types");
    
    $createdCount = 0;
    
    foreach ($nonEarnableLeaveTypes as $leaveType) {
        // Use default_days if set, otherwise 0
        $defaultDays = $leaveType->default_days ?? 0;
        
        \Log::info("Processing {$leaveType->name} with default_days: {$defaultDays}");
        
        // Check if balance already exists
        $existingBalance = \App\Models\LeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveType->id)
            ->where('year', $currentYear)
            ->first();
            
        if ($existingBalance) {
            \Log::info("Leave balance already exists for {$leaveType->name}, skipping");
            continue;
        }
        
        try {
            \App\Models\LeaveBalance::create([
                'employee_id' => $employeeId,
                'leave_type_id' => $leaveType->id,
                'year' => $currentYear,
                'total_earned' => $defaultDays,
                'total_used' => 0,
                'balance' => $defaultDays,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $createdCount++;
            \Log::info("✅ Created leave balance for employee {$employeeId}: {$leaveType->name} - {$defaultDays} days");
            
        } catch (\Exception $e) {
            \Log::error("❌ Failed to create leave balance for {$leaveType->name}: " . $e->getMessage());
        }
    }

    \Log::info("Created {$createdCount} leave balances for employee {$employeeId}");
    
    return $createdCount;
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

    return Inertia::render('HR/LeaveCredits', [
        'employees' => $employees,
        'departments' => Department::all(),
        'filters' => $request->only(['search', 'department']),
        // Remove monthly credit related props
    ]);
}


public function update(Request $request, $employee_id)
{
    $request->validate([
        'sl_balance' => 'required|numeric|min:0',
        'vl_balance' => 'required|numeric|min:0',
        'imported_at' => 'nullable|date',
    ]);

    try {
        // Find or create leave credit record for the employee
        $leaveCredit = LeaveCredit::firstOrCreate(
            ['employee_id' => $employee_id],
            [
                'sl_balance' => 0, 
                'vl_balance' => 0,
                'last_updated' => now()
            ]
        );

        $leaveCredit->update([
            'sl_balance' => $request->sl_balance,
            'vl_balance' => $request->vl_balance,
            'imported_at' => $request->imported_at ?: $leaveCredit->imported_at,
            'last_updated' => now(),
        ]);

        // Optional: Create a log entry for the override
        \App\Models\LeaveCreditLog::create([
            'employee_id' => $employee_id,
            'type' => 'MANUAL_OVERRIDE',
            'date' => now(),
            'year' => now()->year,
            'month' => now()->month,
            'points_deducted' => 0,
            'balance_before_sl' => $leaveCredit->getOriginal('sl_balance'),
            'balance_after_sl' => $request->sl_balance,
            'balance_before_vl' => $leaveCredit->getOriginal('vl_balance'),
            'balance_after_vl' => $request->vl_balance,
            'remarks' => 'Manual override by HR',
        ]);

        return redirect()->back()->with('success', 'Leave credits updated successfully.');

    } catch (\Exception $e) {
        \Log::error('Error updating leave credits: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Failed to update leave credits: ' . $e->getMessage()]);
    }
}






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
                'total_earned' => $balance->total_earned,
                'total_used' => $balance->total_used,
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


/**
 * Debug method to check leave balances for a specific employee
 */
public function debugLeaveBalances($employee_id)
{
    $employee = Employee::findOrFail($employee_id);
    
    // Check what leave types exist
    $allLeaveTypes = \App\Models\LeaveType::all();
    echo "All Leave Types:\n";
    foreach ($allLeaveTypes as $type) {
        echo " - {$type->name} (Code: {$type->code}, Earnable: {$type->earnable}, Default Days: {$type->default_days})\n";
    }
    
    echo "\nNon-earnable leave types with default_days > 0:\n";
    $nonEarnableTypes = \App\Models\LeaveType::where('earnable', false)
        ->whereNotNull('default_days')
        ->where('default_days', '>', 0)
        ->get();
    foreach ($nonEarnableTypes as $type) {
        echo " - {$type->name} (Default Days: {$type->default_days})\n";
    }
    
    // Check what leave balances exist for this employee
    echo "\nExisting Leave Balances for Employee {$employee_id}:\n";
    $leaveBalances = \App\Models\LeaveBalance::where('employee_id', $employee_id)->get();
    if ($leaveBalances->count() > 0) {
        foreach ($leaveBalances as $balance) {
            $leaveType = \App\Models\LeaveType::find($balance->leave_type_id);
            echo " - {$leaveType->name}: {$balance->balance} days (Total Earned: {$balance->total_earned}, Used: {$balance->total_used})\n";
        }
    } else {
        echo " - No leave balances found!\n";
    }
    
    // Check leave credits
    $leaveCredit = \App\Models\LeaveCredit::where('employee_id', $employee_id)->first();
    echo "\nLeave Credits:\n";
    if ($leaveCredit) {
        echo " - SL Balance: {$leaveCredit->sl_balance}\n";
        echo " - VL Balance: {$leaveCredit->vl_balance}\n";
    } else {
        echo " - No leave credits found!\n";
    }
    
    die(); // Stop execution to see the output
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
// In HRController - update the departments method
// In HRController - update the departments method


public function departments(Request $request)
    {
        $perPage = 7;
        
        $departments = Department::with(['head', 'employees.user'])
            ->paginate($perPage)
            ->withQueryString();

        // Get ALL active employees regardless of role
        $employees = Employee::with(['user', 'department'])
            ->where('status', 'active')
            ->get()
            ->map(function($employee) {
                $currentHeadDepartment = Department::where('head_employee_id', $employee->employee_id)->first();
                
                return [
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->firstname . ' ' . $employee->lastname,
                    'firstname' => $employee->firstname,
                    'lastname' => $employee->lastname,
                    'position' => $employee->position,
                    'department_id' => $employee->department_id,
                    'current_department' => $employee->department ? $employee->department->name : 'No Department',
                    'role' => $employee->user ? $employee->user->role : 'employee',
                    'is_current_dept_head' => $currentHeadDepartment ? true : false,
                    'current_head_department' => $currentHeadDepartment ? $currentHeadDepartment->name : null,
                    'current_head_department_id' => $currentHeadDepartment ? $currentHeadDepartment->id : null,
                ];
            });

        return Inertia::render('HR/Departments', [
            'departments' => $departments,
            'employees' => $employees,
        ]);
    }

    public function showEmployees(Request $request, $id)
{
    $perPage = 10;

    $department = Department::with('head')->findOrFail($id);

    $employees = Employee::with('user')
        ->where('department_id', $id)
        ->where('status', 'active')
        ->paginate($perPage)
        ->withQueryString()
        ->through(function($employee) {
            return [
                'employee_id' => $employee->employee_id,
                'name' => $employee->firstname . ' ' . $employee->lastname,
                'firstname' => $employee->firstname,
                'lastname' => $employee->lastname,
                'position' => $employee->position,
                'role' => $employee->user ? $employee->user->role : 'employee',
            ];
        });

    return Inertia::render('HR/DepartmentEmployees', [
        'department' => [
            'id' => $department->id,
            'name' => $department->name,
            'status' => $department->status,
            'head' => $department->head ? [
                'employee_id' => $department->head->employee_id,
                'name' => $department->head->firstname . ' ' . $department->head->lastname,
                'position' => $department->head->position,
            ] : null,
            'employee_count' => $department->employees()->where('status', 'active')->count(),
        ],
        'employees' => $employees,
    ]);
}

    public function storeDepartment(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:departments,name',
            'head_employee_id' => 'nullable|exists:employees,employee_id',
            'status' => 'required|in:active,inactive',
            'transfer_from' => 'nullable|exists:departments,id',
            'transfer_employee_id' => 'nullable|exists:employees,employee_id'
        ]);

        DB::beginTransaction();
        try {
            $department = Department::create([
                'name' => $request->name,
                'status' => $request->status,
            ]);

            $transferFrom = $request->input('transfer_from');
            $transferEmployeeId = $request->input('transfer_employee_id');
            $isTransferRequest = !empty($transferFrom) && !empty($transferEmployeeId);

            if ($isTransferRequest) {
                $this->transferDepartmentHead($transferFrom, $department->id, $transferEmployeeId);
            } else if ($request->has('head_employee_id') && !empty($request->head_employee_id)) {
                $employeeId = $request->head_employee_id;
                $existingHeadDepartment = $this->isEmployeeAlreadyDeptHead($employeeId);
                
                if ($existingHeadDepartment) {
                    throw new \Exception("This employee is already the department head of {$existingHeadDepartment->name}. Please transfer them instead.");
                }
                
                $this->assignDepartmentHead($department->id, $employeeId);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Department created successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to create department: ' . $e->getMessage()]);
        }
    }

    public function updateDepartment(Request $request, $id)
    {
        Log::info('=== DEPARTMENT UPDATE START ===');
        Log::info('Request Data:', $request->all());
        Log::info('Department ID: ' . $id);
        Log::info('User ID: ' . $request->user()->id);

        $request->validate([
            'name' => 'required|unique:departments,name,' . $id,
            'head_employee_id' => 'nullable|exists:employees,employee_id',
            'status' => 'required|in:active,inactive',
            'transfer_from' => 'nullable|exists:departments,id',
            'transfer_employee_id' => 'nullable|exists:employees,employee_id'
        ]);

        Log::info('Validation passed');

        DB::beginTransaction();
        try {
            $department = Department::findOrFail($id);
            Log::info('Department found:', ['id' => $department->id, 'name' => $department->name]);

            // Update basic department info
            $department->update([
                'name' => $request->name,
                'status' => $request->status,
            ]);

            Log::info('Department basic info updated');

            $transferFrom = $request->input('transfer_from');
            $transferEmployeeId = $request->input('transfer_employee_id');
            $isTransferRequest = !empty($transferFrom) && !empty($transferEmployeeId);

            Log::info('Transfer check:', [
                'transfer_from' => $transferFrom,
                'transfer_employee_id' => $transferEmployeeId,
                'is_transfer_request' => $isTransferRequest
            ]);

            if ($isTransferRequest) {
                Log::info('Processing transfer request');
                $this->transferDepartmentHead($transferFrom, $department->id, $transferEmployeeId);
            } else if ($request->has('head_employee_id')) {
                $employeeId = $request->head_employee_id;
                Log::info('Processing head employee assignment:', ['employee_id' => $employeeId]);

                if (!empty($employeeId)) {
                    $existingHeadDepartment = $this->isEmployeeAlreadyDeptHead($employeeId, $department->id);
                    Log::info('Existing head check:', [
                        'existing_department' => $existingHeadDepartment ? $existingHeadDepartment->name : null
                    ]);
                    
                    if ($existingHeadDepartment) {
                        throw new \Exception("This employee is already the department head of {$existingHeadDepartment->name}. Please transfer them instead.");
                    }
                    
                    $this->assignDepartmentHead($department->id, $employeeId);
                    Log::info('Department head assigned successfully');
                } else {
                    Log::info('No head_employee_id provided, removing department head if exists');
                    if ($department->head_employee_id) {
                        $this->removeDepartmentHead($department->id);
                        Log::info('Department head removed');
                    }
                }
            } else {
                Log::info('No head_employee_id in request, removing department head if exists');
                if ($department->head_employee_id) {
                    $this->removeDepartmentHead($department->id);
                    Log::info('Department head removed');
                }
            }

            DB::commit();
            Log::info('=== DEPARTMENT UPDATE SUCCESS ===');
            
            return redirect()->back()->with('success', 'Department updated successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Department update failed:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Failed to update department: ' . $e->getMessage()]);
        }
    }

    private function isEmployeeAlreadyDeptHead($employeeId, $excludingDepartmentId = null)
    {
        $query = Department::where('head_employee_id', $employeeId);
        
        if ($excludingDepartmentId) {
            $query->where('id', '!=', $excludingDepartmentId);
        }
        
        $result = $query->first();
        Log::info('Employee head check:', [
            'employee_id' => $employeeId,
            'excluding_department' => $excludingDepartmentId,
            'found_department' => $result ? $result->name : null
        ]);
        
        return $result;
    }

    private function assignDepartmentHead($departmentId, $employeeId)
    {
        Log::info('=== ASSIGN DEPARTMENT HEAD START ===');
        Log::info('Department ID: ' . $departmentId);
        Log::info('Employee ID: ' . $employeeId);

        $department = Department::findOrFail($departmentId);
        $employee = Employee::with('user')->findOrFail($employeeId);

        Log::info('Department:', [
            'name' => $department->name,
            'current_head_employee_id' => $department->head_employee_id
        ]);
        Log::info('Employee:', ['name' => $employee->firstname . ' ' . $employee->lastname]);

        $existingHeadDepartment = $this->isEmployeeAlreadyDeptHead($employeeId, $departmentId);
        
        if ($existingHeadDepartment) {
            throw new \Exception("This employee is already the department head of {$existingHeadDepartment->name}. Please transfer them instead.");
        }

        // Check if we're assigning the SAME employee as head (no change needed)
        if ($department->head_employee_id == $employeeId) {
            Log::info('Same employee assigned as head, no changes needed');
            return; // No changes needed
        }

        // If department has a different head, remove the current head first
        if ($department->head_employee_id && $department->head_employee_id != $employeeId) {
            Log::info('Removing current department head before assigning new one');
            $this->removeDepartmentHead($departmentId);
        }

        $currentHead = $department->head_employee_id ? Employee::with('user')->find($department->head_employee_id) : null;
        Log::info('Current head after removal:', ['current_head' => $currentHead ? $currentHead->firstname . ' ' . $currentHead->lastname : 'None']);

        // Update the new employee to be department head
        if ($employee->user) {
            $employee->user->update(['role' => 'dept_head']);
            Log::info('New head role updated to dept_head');
        }

        $department->update(['head_employee_id' => $employeeId]);
        Log::info('Department head_employee_id updated to: ' . $employeeId);

        // Optional: Update employee's department if different
        if ($employee->department_id != $departmentId) {
            $employee->update(['department_id' => $departmentId]);
            Log::info('Employee department updated to new department');
        }

        Log::info('=== ASSIGN DEPARTMENT HEAD SUCCESS ===');
    }

    private function removeDepartmentHead($departmentId)
    {
        Log::info('=== REMOVE DEPARTMENT HEAD START ===');
        Log::info('Department ID: ' . $departmentId);

        $department = Department::with('head.user')->findOrFail($departmentId);
        
        Log::info('Department before removal:', [
            'name' => $department->name,
            'current_head_employee_id' => $department->head_employee_id
        ]);

        if ($department->head && $department->head->user) {
            $originalRole = $this->getOriginalRole($department->head);
            $department->head->user->update(['role' => $originalRole]);
            Log::info('Previous head role reverted to: ' . $originalRole);
        }

        $department->update(['head_employee_id' => null]);
        Log::info('Department head_employee_id set to null');

        Log::info('=== REMOVE DEPARTMENT HEAD SUCCESS ===');
    }

    private function getOriginalRole($employee)
    {
        $currentRole = $employee->user->role;
        
        // If the employee was admin/hr before becoming dept head, keep that role
        if (in_array($currentRole, ['admin', 'hr'])) {
            return $currentRole;
        }
        
        // Otherwise, revert to employee role
        return 'employee';
    }

    private function transferDepartmentHead($fromDepartmentId, $toDepartmentId, $employeeId)
    {
        $fromDepartment = Department::findOrFail($fromDepartmentId);
        $toDepartment = Department::findOrFail($toDepartmentId);
        $employee = Employee::with('user')->findOrFail($employeeId);

        if ($fromDepartment->head_employee_id != $employeeId) {
            throw new \Exception("Employee is not the department head of {$fromDepartment->name}");
        }

        if ($toDepartment->head_employee_id && $toDepartment->head_employee_id != $employeeId) {
            throw new \Exception("The target department already has a department head. Please remove them first.");
        }

        $fromDepartment->update(['head_employee_id' => null]);
        $toDepartment->update(['head_employee_id' => $employeeId]);
        $employee->update(['department_id' => $toDepartment->id]);
        
        if ($employee->user) {
            $employee->user->update(['role' => 'dept_head']);
        }
    }

    public function deleteDepartment($id)
    {
        DB::beginTransaction();
        try {
            $department = Department::with('head.user')->findOrFail($id);

            if ($department->head && $department->head->user) {
                $originalRole = $this->getOriginalRole($department->head);
                $department->head->user->update(['role' => $originalRole]);
            }

            $department->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Department deleted successfully!');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete department: ' . $e->getMessage()]);
        }
    }

// LEAVE REQUEST APPROVAL METHODS
public function dashboard(Request $request)
{
    // Get filter values
    $year = $request->get('year', date('Y'));
    $month = $request->get('month', '');
    
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

    // Analytics data for the dashboard
    $totalEmployees = Employee::count();
    $totalDepartments = Department::count();

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

    // FIXED: Remove the 'approved' status filter to get ALL leave requests
    $leaveReportsQuery = Employee::with(['department', 'leaveRequests.leaveType', 'leaveRequests.approvals'])
        ->whereHas('leaveRequests', function ($query) use ($year, $month) {
            // REMOVED: ->where('status', 'approved')
            $query->whereYear('date_from', $year);
            
            if ($month) {
                $query->whereMonth('date_from', $month);
            }
        });

    $leaveReportsData = $leaveReportsQuery->get()->map(function ($employee) {
        // Get ALL leave requests (not just approved)
        $employee->setRelation('leave_requests', 
            $employee->leaveRequests->map(function ($request) {
                // Add status display and duration calculation
                $request->status_display = $this->getStatusDisplay($request);
                $request->duration = $this->calculateDuration($request->date_from, $request->date_to);
                return $request;
            })
        );
        return $employee;
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
        'availableYears' => $availableYears,
        'currentYear' => $year,
        'currentMonth' => $month,
        'filters' => $request->only(['year', 'month']),
        'leaveReportsData' => $leaveReportsData // Make sure this is included
    ]);
}



// Add these helper methods to your HRController
private function getStatusDisplay($leaveRequest)
{
    $status = $leaveRequest->status;
    $approvals = $leaveRequest->approvals;
    
    // Check if fully approved (has admin approval)
    $hasAdminApproval = $approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();
    $hasHrApproval = $approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
    $hasDeptHeadApproval = $approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
    
    if ($hasAdminApproval) {
        return 'Fully Approved';
    }
    
    switch ($status) {
        case 'approved':
            return 'Fully Approved';
        case 'pending':
            return 'Pending HR Approval';
        case 'pending_dept_head':
            return 'Pending Dept Head';
        case 'pending_admin':
            return 'Pending Admin';
        case 'rejected':
            return 'Rejected';
        default:
            return ucfirst(str_replace('_', ' ', $status));
    }
}

private function calculateDuration($startDate, $endDate)
{
    if (!$startDate || !$endDate) return 0;
    
    $start = \Carbon\Carbon::parse($startDate);
    $end = \Carbon\Carbon::parse($endDate);
    
    return $start->diffInDays($end) + 1; // +1 to include both start and end dates
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

public function leaveRequests(Request $request)
{
    $perPage = 15;
    
    $query = LeaveRequest::with([
            'leaveType',
            'employee.department',
            'employee.user',
            'details',
            'approvals.approver',
            'employee.leaveCreditLogs' => function($query) {
                $query->orderBy('created_at', 'desc');
            }
        ])
        ->orderBy('created_at', 'desc');

    // Filter by status using database status and approval relationships
    if ($request->filled('status') && $request->status !== 'all') {
        switch ($request->status) {
            case 'hr_pending':
                // All requests pending HR approval (status = 'pending')
                $query->where('status', 'pending');
                break;

            case 'dept_head_pending':
                // Department head requests that need HR approval
                $query->where('status', 'pending')
                      ->where(function($q) {
                          $q->where('is_dept_head_request', true)
                            ->orWhereHas('employee', function($employeeQuery) {
                                $employeeQuery->whereHas('user', function($userQuery) {
                                    $userQuery->where('role', 'dept_head');
                                });
                            });
                      });
                break;

            case 'approved_by_hr':
                // Show ALL requests that have HR approval, regardless of final status
                $query->whereHas('approvals', function($q) {
                    $q->where('role', 'hr')->where('status', 'approved');
                });
                break;

            case 'dept_head_to_admin':
                // Dept head requests that went directly to admin after HR approval
                $query->where('status', 'pending_admin')
                      ->whereHas('employee.user', function($q) {
                          $q->where('role', 'dept_head');
                      })
                      ->whereHas('approvals', function($q) {
                          $q->where('role', 'hr')->where('status', 'approved');
                      });
                break;

            case 'rejected':
                $query->where('status', 'rejected');
                break;

            case 'fully_approved':
                // Show all fully approved requests - both regular employees and department heads
                $query->where('status', 'approved')
                      ->where(function($q) {
                          $q->where(function($q2) {
                              // Regular employees: Need HR, Dept Head, and Admin approval
                              $q2->whereHas('approvals', function($q3) {
                                      $q3->where('role', 'hr')->where('status', 'approved');
                                  })
                                  ->whereHas('approvals', function($q3) {
                                      $q3->where('role', 'dept_head')->where('status', 'approved');
                                  })
                                  ->whereHas('approvals', function($q3) {
                                      $q3->where('role', 'admin')->where('status', 'approved');
                                  })
                                  ->whereHas('employee.user', function($q3) {
                                      $q3->where('role', '!=', 'dept_head');
                                  });
                          })->orWhere(function($q2) {
                              // Department heads: Only need HR and Admin approval (bypass dept head)
                              $q2->whereHas('approvals', function($q3) {
                                      $q3->where('role', 'hr')->where('status', 'approved');
                                  })
                                  ->whereHas('approvals', function($q3) {
                                      $q3->where('role', 'admin')->where('status', 'approved');
                                  })
                                  ->whereHas('employee.user', function($q3) {
                                      $q3->where('role', 'dept_head');
                                  });
                          });
                      });
                break;
            default:
                break;
        }
    }

    // Filter by date range - use filled() to check if values exist and are not empty
    if ($request->filled('date_from')) {
        $query->where('date_from', '>=', $request->date_from);
    }
    if ($request->filled('date_to')) {
        $query->where('date_to', '<=', $request->date_to);
    }

    // Search by employee name
    if ($request->filled('search')) {
        $search = $request->search;
        $query->whereHas('employee', function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
              ->orWhere('lastname', 'like', "%{$search}%");
        });
    }

    // ADD DEPARTMENT FILTER - FIXED POSITION
    if ($request->filled('department')) {
        $query->whereHas('employee', function ($q) use ($request) {
            $q->where('department_id', $request->department);
        });
    }

    $leaveRequests = $query->paginate($perPage)->withQueryString();


    $rescheduleRequestsCount = LeaveRescheduleRequest::where('status', 'pending_hr')->count();


    return Inertia::render('HR/LeaveRequests', [
        'leaveRequests' => $leaveRequests,
        'departments' => Department::all(),
        'rescheduleRequestsCount' => $rescheduleRequestsCount, // Add this
        'filters' => $request->only(['status', 'date_from', 'date_to', 'search', 'department']),
    ]);
}





public function showLeaveRequest($id)
{
    $leaveRequest = LeaveRequest::with([
            'leaveType',
            'employee.department',
            'employee.leaveCredits',
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


public function approveLeaveRequest(Request $request, $id)
{
    try {
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType', 'employee.user'])->findOrFail($id);

        // Validate that the request is pending
        if (!in_array($leaveRequest->status, ['pending', 'pending_hr_to_admin'])) {
            return back()->withErrors(['message' => 'This request has already been processed.']);
        }

        $isDeptHeadRequest = $leaveRequest->employee->user->role === 'dept_head' || 
                            $leaveRequest->is_dept_head_request;
        $isAdminRequest = $leaveRequest->employee->user->role === 'admin';

        // Create HR approval record
        \App\Models\LeaveApproval::create([
            'leave_id' => $leaveRequest->id,
            'approved_by' => $request->user()->id,
            'role' => 'hr',
            'status' => 'approved',
            'remarks' => $request->remarks ?? '',
            'approved_at' => now(),
        ]);

        // Update status correctly based on employee type
        if ($isDeptHeadRequest || $isAdminRequest) {
            $leaveRequest->update(['status' => 'pending_admin']);
        } else {
            $leaveRequest->update(['status' => 'pending_dept_head']);
        }

        $this->handleHRNotificationsManually($leaveRequest, $request->remarks);

        return redirect()->route('hr.leave-requests')->with('success', 'Leave request approved successfully.');

    } catch (\Exception $e) {
        \Log::error('HR Approval Error: ' . $e->getMessage(), [
            'request_id' => $id,
            'user_id' => $request->user()->id,
            'trace' => $e->getTraceAsString()
        ]);

        return back()->withErrors(['error' => 'Failed to approve leave request: ' . $e->getMessage()]);
    }
}


private function handleHRNotificationsManually($leaveRequest, $remarks)
{
    $employee = $leaveRequest->employee;
    $userRole = $employee->user->role;
    
    $isAdminRequest = $userRole === 'admin';
    $isDeptHeadRequest = $userRole === 'dept_head';

    if ($isAdminRequest || $isDeptHeadRequest) {
        // For Admin/Dept Head requests - notify Admin and Employee
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            $adminEmployeeId = $this->notificationService->getEmployeeIdFromUserId($admin->id);
            if ($adminEmployeeId) {
                // Fix the grammar and make it more professional
                $roleText = $isAdminRequest ? 'Admin' : 'Department Head';
                $article = $isAdminRequest ? 'An' : 'A';
                
                $this->notificationService->createNotification(
                    $adminEmployeeId,
                    'leave_request',
                    'Special Leave Request Requires Approval',
                    "{$article} {$roleText} has submitted a {$leaveRequest->leaveType->name} leave request from " . 
                    \Carbon\Carbon::parse($leaveRequest->date_from)->format('M d, Y') . " to " . 
                    \Carbon\Carbon::parse($leaveRequest->date_to)->format('M d, Y') . " that requires your approval.",
                    [
                        'request_id' => $leaveRequest->id,
                        'notification_for' => 'admin'
                    ]
                );
            }
        }
        
    //     // Notify the employee (admin/dept head) - BUT ONLY IF THEY ARE NOT THE CURRENT USER
    //     // This prevents admins from getting notifications about their own requests
    //     $currentUserEmployeeId = $this->notificationService->getEmployeeIdFromUserId(auth()->id());
    //     if ($leaveRequest->employee_id !== $currentUserEmployeeId) {
    //         $this->notificationService->createNotification(
    //             $leaveRequest->employee_id,
    //             'leave_request',
    //             'Leave Request Approved by HR',
    //             "Your {$leaveRequest->leaveType->name} leave request from " . 
    //             \Carbon\Carbon::parse($leaveRequest->date_from)->format('M d, Y') . " to " . 
    //             \Carbon\Carbon::parse($leaveRequest->date_to)->format('M d, Y') . " has been approved by HR and is pending Admin approval.",
    //             [
    //                 'request_id' => $leaveRequest->id,
    //                 'notification_for' => 'employee'
    //             ]
    //         );
    //     }
    } else {
        // For regular employees - notify Dept Head and Employee
        $deptHeadUser = User::where('role', 'dept_head')
            ->whereHas('employee', function($query) use ($employee) {
                $query->where('department_id', $employee->department_id);
            })->first();

        if ($deptHeadUser) {
            $deptHeadEmployeeId = $this->notificationService->getEmployeeIdFromUserId($deptHeadUser->id);
            if ($deptHeadEmployeeId) {
                $this->notificationService->createNotification(
                    $deptHeadEmployeeId,
                    'leave_request',
                    'Leave Request Requires Your Approval',
                    "A {$leaveRequest->leaveType->name} leave request from " . 
                    \Carbon\Carbon::parse($leaveRequest->date_from)->format('M d, Y') . " to " . 
                    \Carbon\Carbon::parse($leaveRequest->date_to)->format('M d, Y') . " has been approved by HR and requires your department head approval.",
                    [
                        'request_id' => $leaveRequest->id,
                        'notification_for' => 'dept_head'
                    ]
                );
            }
        }
        
        // Notify the employee
        $this->notificationService->createNotification(
            $leaveRequest->employee_id,
            'leave_request',
            'Leave Request Approved by HR',
            "Your {$leaveRequest->leaveType->name} leave request from " . 
            \Carbon\Carbon::parse($leaveRequest->date_from)->format('M d, Y') . " to " . 
            \Carbon\Carbon::parse($leaveRequest->date_to)->format('M d, Y') . " has been approved by HR and is pending Department Head approval.",
            [
                'request_id' => $leaveRequest->id,
                'notification_for' => 'employee'
            ]
        );
    }
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
/// In HRController.php - update leaveCalendar method to match admin
public function leaveCalendar(Request $request)
{
    // Get the current year or use the year from request
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

    // Get fully approved leave requests for the specified period - SAME AS ADMIN
    $query = LeaveRequest::where('status', 'approved')
        ->whereHas('approvals', function ($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->where('date_to', '>=', $startDate)
        ->where('date_from', '<=', $endDate)
        ->with(['employee', 'leaveType', 'approvals' => function ($query) {
            $query->with('approver');
        }]);

    // Apply additional filters if provided - SAME AS ADMIN
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

    return Inertia::render('HR/LeaveCalendar', [
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
     * Show credit conversion requests for HR approval
     */
   /**
 * Show credit conversion requests for HR approval
 */


    /**
     * Transform conversion data with consistent cash calculation
     */
   
    /**
     * Show credit conversion requests for HR approval
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

        return Inertia::render('HR/ShowCreditConversion', [
            'conversion' => $transformedConversion,
        ]);
    }

    // Add this method to your HRController
    public function showMonetizationForm($id)
    {
        $conversion = CreditConversion::with([
            'employee.department',
            'employee.leaveCredit', // Add this to get leave credit data
            'hrApprover',
            'deptHeadApprover', 
            'adminApprover'
        ])->findOrFail($id);
    
        $transformedConversion = $this->transformConversionData($conversion);
    
        // Get current VL balance for calculations
        $currentVlBalance = $conversion->employee->leaveCredit->vl_balance ?? 0;
        $creditsRequested = (float) $conversion->credits_requested;
        
        // Calculate the leave credit breakdown
        $leaveCreditData = [
            'total_earned' => $currentVlBalance + $creditsRequested, // Total before deduction
            'less_application' => $creditsRequested,
            'balance' => $currentVlBalance, // Balance after deduction
        ];
    
        // Get approvers for the form
        $approvers = [];
        
        if ($conversion->hrApprover) {
            $approvers[] = [
                'role' => 'HRMO-Designate',
                'name' => $conversion->hrApprover->name,
                'approved_at' => $conversion->hr_approved_at
            ];
        }
        
        if ($conversion->deptHeadApprover) {
            $approvers[] = [
                'role' => 'Department Head',
                'name' => $conversion->deptHeadApprover->name,
                'approved_at' => $conversion->dept_head_approved_at
            ];
        }
        
        if ($conversion->adminApprover) {
            $approvers[] = [
                'role' => 'Municipal Vice Mayor',
                'name' => $conversion->adminApprover->name,
                'approved_at' => $conversion->admin_approved_at
            ];
        }
    
        return Inertia::render('HR/MonetizationForm', [
            'conversion' => array_merge($transformedConversion, [
                'leave_credit_data' => $leaveCreditData
            ]),
            'employee' => [
                'full_name' => $conversion->employee->firstname . ' ' . $conversion->employee->lastname,
                'department' => $conversion->employee->department,
                'position' => $conversion->employee->position,
                'monthly_salary' => $conversion->employee->monthly_salary,
                'current_vl_balance' => $currentVlBalance,
            ],
            'approvers' => $approvers,
        ]);
    }

    // In HRController - update the credit conversion methods

/**
 * Show credit conversion requests for HR approval
 */
public function creditConversions(Request $request)
{
    $perPage = 10;
    
    $query = CreditConversion::with(['employee.department', 'hrApprover', 'deptHeadApprover', 'adminApprover'])
        ->when($request->status, function ($query, $status) {
            if ($status === 'pending_hr') {
                return $query->where('status', 'pending');
            } elseif ($status === 'hr_approved') {
                return $query->where('status', 'hr_approved');
            } elseif ($status === 'dept_head_approved') {
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

    // Transform conversions with new status mapping
    $transformedConversions = $conversions->getCollection()->map(function ($conversion) {
        return $this->transformConversionData($conversion);
    });

    $conversions->setCollection($transformedConversions);

    // Get statistics
    $currentYear = now()->year;
    $totalRequests = CreditConversion::count();
    $pendingHrRequests = CreditConversion::where('status', 'pending')->count();
    $hrApprovedRequests = CreditConversion::where('status', 'hr_approved')->count();
    $deptHeadApprovedRequests = CreditConversion::where('status', 'dept_head_approved')->count();
    $fullyApprovedRequests = CreditConversion::where('status', 'admin_approved')->count();
    $rejectedRequests = CreditConversion::where('status', 'rejected')->count();

    return Inertia::render('HR/CreditConversions', [
        'conversions' => $conversions,
        'stats' => [
            'total' => $totalRequests,
            'pending' => $pendingHrRequests,
            'hr_approved' => $hrApprovedRequests,
            'dept_head_approved' => $deptHeadApprovedRequests,
            'approved' => $fullyApprovedRequests,
            'rejected' => $rejectedRequests,
        ],
        'filters' => $request->only(['status', 'employee']),
    ]);
}

/**
 * Transform conversion data for display
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

/**
 * HR approves credit conversion request
 */
public function approveCreditConversion(Request $request, $id)
{
    \Log::info('=== HR APPROVAL START ===');
    \Log::info('HR Approval Attempt', [
        'conversion_id' => $id,
        'user_id' => $request->user()->id,
        'user_name' => $request->user()->name,
        'user_role' => $request->user()->role,
        'ip' => $request->ip()
    ]);

    // Validate the request
    $validated = $request->validate([
        'remarks' => ['nullable', 'string', 'max:500'],
    ]);

    \Log::info('Validation passed', ['remarks' => $validated['remarks'] ?? 'No remarks']);

    try {
        \Log::info('Calling credit conversion service...');
        
        // Find the conversion first to check its current state
        $conversionBefore = CreditConversion::find($id);
        \Log::info('Conversion before approval', [
            'id' => $conversionBefore->conversion_id,
            'status' => $conversionBefore->status,
            'employee_id' => $conversionBefore->employee_id,
            'leave_type' => $conversionBefore->leave_type
        ]);

        $conversion = $this->creditConversionService->hrApproveConversion(
            $id,
            $request->user()->id,
            $validated['remarks'] ?? null
        );

        // Verify the conversion was updated
        $conversionAfter = CreditConversion::find($id);
        \Log::info('Conversion after approval', [
            'status' => $conversionAfter->status,
            'hr_approved_by' => $conversionAfter->hr_approved_by,
            'hr_approved_at' => $conversionAfter->hr_approved_at
        ]);

        \Log::info('HR Approval Successful - Redirecting to credit conversions list');

        return redirect()->route('hr.credit-conversions')->with('success', 'Credit conversion request approved and forwarded to Department Head!');
        
    } catch (\Exception $e) {
        \Log::error('HR Approval Failed', [
            'conversion_id' => $id,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return back()->with('error', 'Failed to approve conversion: ' . $e->getMessage());
    }
}
/**
 * HR approves credit conversion request
 */


/**
 * Reject credit conversion request
 */
public function rejectCreditConversion(Request $request, $id)
{
    $validated = $request->validate([
        'remarks' => ['required', 'string', 'max:500'],
    ]);

    try {
        $conversion = $this->creditConversionService->rejectConversion(
            $id,
            $request->user()->id,
            $validated['remarks'],
            'hr' // Rejected by HR
        );

        return redirect()->route('hr.credit-conversions')->with('success', 'Credit conversion request rejected successfully!');
    } catch (\Exception $e) {
        return back()->withErrors(['error' => $e->getMessage()]);
    }
}



    /**
     * Approve credit conversion request
     */
// HR approves credit conversion request

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



// LEAVE RECORDINGS MANAGEMENT

/**
 * Display leave recordings for all employees
 */
/**
 * Display leave recordings for all employees (simplified view)
 */
/**
 * Display leave recordings for all employees (simplified view)
 */
public function leaveRecordings(Request $request)
{
    $perPage = 10;
    
    // Get employees with basic info
    $query = Employee::with(['department', 'user'])
        ->when($request->search, function ($query, $search) {
            return $query->where(function ($q) use ($search) {
                $q->where('firstname', 'like', "%{$search}%")
                  ->orWhere('lastname', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        })
        ->when($request->department, function ($query, $department) {
            return $query->where('department_id', $department);
        });

    $employees = $query->orderBy('firstname')
        ->orderBy('lastname')
        ->paginate($perPage)
        ->withQueryString();

    return Inertia::render('HR/LeaveRecordings', [
        'employees' => $employees,
        'departments' => Department::all(),
        'years' => $this->getAvailableYears(),
        'filters' => $request->only(['search', 'department']),
    ]);
}

/**
 * Display specific employee's leave recordings
 */
public function showEmployeeRecordings($employeeId, Request $request)
{
    $year = $request->year ?? now()->year;
    
    $employee = Employee::with(['department'])->findOrFail($employeeId);
    $recordings = $this->getEmployeeLeaveRecordings($employeeId, $year);

    return Inertia::render('HR/EmployeeRecordings', [
        'employee' => [
            'employee_id' => $employee->employee_id,
            'firstname' => $employee->firstname,
            'lastname' => $employee->lastname,
            'department' => $employee->department->name,
            'position' => $employee->position,
        ],
        'recordings' => $recordings,
        'year' => $year,
        'years' => $this->getAvailableYears(),
    ]);
}

/**
 * Get available years for filtering
 */


/**
 * Calculate the imported balance for a leave type
 */
private function calculateImportedBalance($employeeId, $type, $importedAt)
{
    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

    $currentBalance = ($type === 'VL') ? $leaveCredit->vl_balance : $leaveCredit->sl_balance;

    $start = $importedAt->startOfMonth();

    $end = Carbon::now()->startOfMonth();

    $totalMonths = $start->diffInMonths($end) + 1;

    $totalEarned = $totalMonths * 1.25;

    $totalDed = LeaveCreditLog::where('employee_id', $employeeId)
        ->where('type', $type)
        ->where('date', '>=', $start)
        ->sum('points_deducted');

    return $currentBalance - $totalEarned + $totalDed;
}

/**
 * Get monthly used leaves from logs
 */
/**
 * Get monthly used leaves from logs (excluding late deductions)
 */
/**
 * 
 * Get monthly used leaves from logs (INCLUDING all deductions)
 */
private function getMonthlyUsed($employeeId, $type, $year, $month)
{
    return LeaveCreditLog::where('employee_id', $employeeId)
        ->where('type', $type)
        ->where('year', $year)
        ->where('month', $month)
        ->where('points_deducted', '>', 0) // Only positive deductions
        ->sum('points_deducted');
}

/**
 * Get leave earned for the month
 */
private function getLeaveEarned($employeeId, $type, $year, $month)
{
    $currentDate = Carbon::now();
    $targetDate = Carbon::create($year, $month, 1);
    
    // If target month is in the future, return null
    if ($targetDate->gt($currentDate->endOfMonth())) {
        return null;
    }
    
    // Check if monthly credits were actually added for this period
    $creditsAdded = MonthlyCreditLog::where('year', $year)
        ->where('month', $month)
        ->exists();
    
    if (!$creditsAdded) {
        return null;
    }
    
    // Check employee status and import date
    $employee = Employee::find($employeeId);
    if (!$employee || $employee->status !== 'active') {
        return 0;
    }
    
    $importedAt = $employee->leaveCredit->imported_at ?? null;
    
    if ($importedAt && $targetDate->lt($importedAt->startOfMonth())) {
        return null;
    }
    
    return 1.25;
}


private function getEmployeeLeaveRecordings($employeeId, $year)
{
    $recordings = [];
    
    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
    $currentDate = Carbon::now();

    if (!$leaveCredit || !$leaveCredit->imported_at) {
        $importedAt = Carbon::create($year, 1, 1);
    } else {
        $importedAt = Carbon::parse($leaveCredit->imported_at);
    }

    $importedYear = $importedAt->year;
    $importedMonth = $importedAt->month;

    $previous_vl = null;
    $previous_sl = null;
    
    // Log start of calculation
    \Log::info("=== START LEAVE RECORDING CALCULATION ===");
    \Log::info("Employee ID: {$employeeId}, Year: {$year}");
    \Log::info("Current VL Balance: " . ($leaveCredit->vl_balance ?? 0));
    \Log::info("Current SL Balance: " . ($leaveCredit->sl_balance ?? 0));
    \Log::info("Imported At: " . ($leaveCredit->imported_at ?? 'Not set'));
    
    for ($month = 1; $month <= 12; $month++) {
        $monthStart = Carbon::create($year, $month, 1);
        $monthEnd = $monthStart->copy()->endOfMonth();
        
        $isManual = $year < $importedYear || ($year === $importedYear && $month < $importedMonth);
        $isFuture = $monthStart->gt($currentDate->endOfMonth());
        
        $remarks = $this->getRemarks($employeeId, $year, $month);
        
        $earned = null;
        $vl_balance = null;
        $sl_balance = null;
        $vl_used = 0;
        $sl_used = 0;
        $lates = 0; // Initialize lates here
        
        if ($isManual) {
            $remarks = 'Imported data';
        } elseif ($isFuture) {
            $remarks = 'Future month';
            $earned = null;
        } else {
            $earned = $this->getLeaveEarned($employeeId, 'VL', $year, $month);
            
            if ($previous_vl === null) {
                $previous_vl = $this->calculateImportedBalance($employeeId, 'VL', $importedAt);
                $previous_sl = $this->calculateImportedBalance($employeeId, 'SL', $importedAt);
            }
            
            // Get usage values
            $vl_used = $this->getMonthlyUsed($employeeId, 'VL', $year, $month);
            $sl_used = $this->getMonthlyUsed($employeeId, 'SL', $year, $month);
            $lates = $this->getLateDeductions($employeeId, $year, $month);
            $vl_used_regular = $this->getRegularMonthlyUsed($employeeId, 'VL', $year, $month);
            
            // Log detailed calculation for this month
            \Log::info("--- Month {$month} ({$this->formatMonthYear($month, $year)}) ---");
            \Log::info("Earned: " . ($earned ?? 'null'));
            \Log::info("VL Used (all): {$vl_used}");
            \Log::info("VL Used (regular): {$vl_used_regular}");
            \Log::info("SL Used: {$sl_used}");
            \Log::info("Lates: {$lates}");
            \Log::info("Previous VL: {$previous_vl}");
            \Log::info("Previous SL: {$previous_sl}");
            
            // Only calculate balances if earned is not null
            if ($earned !== null) {
                $vl_balance = round($previous_vl + $earned - $vl_used, 3);
                $sl_balance = round($previous_sl + $earned - $sl_used, 3);
                
                \Log::info("New VL Balance: {$vl_balance}");
                \Log::info("New SL Balance: {$sl_balance}");
                
                $previous_vl = $vl_balance;
                $previous_sl = $sl_balance;
            } else {
                $vl_balance = $previous_vl;
                $sl_balance = $previous_sl;
                \Log::info("No credits added - keeping previous balances");
            }
        }
        
        // Get inclusive dates and log them
        $inclusiveDates = $this->getInclusiveDates($employeeId, $year, $month);
        $workingDaysFromLeaves = $this->calculateWorkingDaysFromInclusiveDates($inclusiveDates);
        
        \Log::info("Inclusive Dates Count: " . $inclusiveDates->count());
        \Log::info("Working Days from Leaves: {$workingDaysFromLeaves}");
        foreach ($inclusiveDates as $date) {
            \Log::info("  - {$date['from']} to {$date['to']} ({$date['type']}) - Status: {$date['status']}");
        }
        
        // Get credit logs for this month and log them
        $creditLogs = LeaveCreditLog::where('employee_id', $employeeId)
            ->where('year', $year)
            ->where('month', $month)
            ->get();
            
        \Log::info("Credit Logs Count: " . $creditLogs->count());
        foreach ($creditLogs as $log) {
            $isLate = stripos($log->remarks ?? '', 'late') !== false;
            \Log::info("  - {$log->type}: {$log->points_deducted} points - '{$log->remarks}' - Late: " . ($isLate ? 'YES' : 'NO'));
        }
        
        $recordings[] = [
            'month' => $month,
            'year' => $year,
            'date_month' => $this->formatMonthYear($month, $year),
            'inclusive_dates' => $inclusiveDates,
            'total_lates' => round($lates, 3), // Now $lates is always defined
            'vl_earned' => $earned,
            'vl_used' => round($vl_used, 3),
            'vl_balance' => $vl_balance,
            'sl_earned' => $earned,
            'sl_used' => round($sl_used, 3),
            'sl_balance' => $sl_balance,
            'remarks' => $remarks,
            'total_vl_sl' => ($vl_balance !== null && $sl_balance !== null) ? round($vl_balance + $sl_balance, 3) : null,
        ];
    }
    
    \Log::info("=== END LEAVE RECORDING CALCULATION ===");
    
    return $recordings;
}

/**
 * Calculate working days from inclusive dates
 */
private function calculateWorkingDaysFromInclusiveDates($inclusiveDates)
{
    $totalWorkingDays = 0;
    
    foreach ($inclusiveDates as $dateRange) {
        try {
            $start = new \DateTime($dateRange['from']);
            $end = new \DateTime($dateRange['to']);
            
            for ($date = clone $start; $date <= $end; $date->modify('+1 day')) {
                $dayOfWeek = $date->format('N');
                if ($dayOfWeek < 6) { // Monday to Friday
                    $totalWorkingDays++;
                }
            }
        } catch (\Exception $e) {
            \Log::warning("Error calculating working days for date range: {$dateRange['from']} to {$dateRange['to']}");
        }
    }
    
    return $totalWorkingDays;
}

/**
 * Get regular monthly used leaves (EXCLUDING late deductions)
 */
private function getRegularMonthlyUsed($employeeId, $type, $year, $month)
{
    return LeaveCreditLog::where('employee_id', $employeeId)
        ->where('type', $type)
        ->where('year', $year)
        ->where('month', $month)
        ->where('points_deducted', '>', 0)
        ->where(function($query) {
            $query->whereNull('remarks')
                  ->orWhere('remarks', 'not like', '%Late%')
                  ->orWhere('remarks', 'not like', '%late%')
                  ->orWhere('remarks', 'not like', '%LATE%');
        })
        ->sum('points_deducted');
}

/**
 * Trigger debug logging for a specific employee and year
 */
public function triggerDebugLog(Request $request)
{
    $employeeId = $request->input('employee_id', 26);
    $year = $request->input('year', 2025);
    
    try {
        \Log::info("=== MANUAL DEBUG TRIGGERED ===");
        \Log::info("Parameters - Employee: {$employeeId}, Year: {$year}");
        
        // This will trigger all the logging in getEmployeeLeaveRecordings
        $recordings = $this->getEmployeeLeaveRecordings($employeeId, $year);
        
        \Log::info("=== MANUAL DEBUG COMPLETED ===");
        
        return response()->json([
            'message' => 'Debug logging completed for employee ' . $employeeId . ', year ' . $year,
            'check_laravel_log' => true,
            'log_file' => storage_path('logs/laravel.log')
        ]);
        
    } catch (\Exception $e) {
        \Log::error("Debug trigger failed: " . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}



/**
 * Get late deductions from leave credit logs
 */
private function getLateDeductions($employeeId, $year, $month)
{
    return LeaveCreditLog::where('employee_id', $employeeId)
        ->where('type', 'VL') // Late deductions affect VL balance
        ->where('year', $year)
        ->where('month', $month)
        ->where(function($query) {
            $query->where('remarks', 'like', '%Late%')
                  ->orWhere('remarks', 'like', '%late%')
                  ->orWhere('remarks', 'like', '%LATE%');
        })
        ->sum('points_deducted');
}
/**
 * Get inclusive dates from leave requests (SL and VL only)
 */
/**
 * Get inclusive dates from leave requests (SL and VL only) - ONLY FULLY APPROVED
 */
/**
 * Get inclusive dates from leave requests (SL and VL only) - ONLY admin approved leaves
 */
/**
 * Get inclusive dates from leave requests (SL and VL only) - ONLY admin approved leaves
 */
private function getInclusiveDates($employeeId, $year, $month)
{
    $startDate = "{$year}-{$month}-01";
    $endDate = date('Y-m-t', strtotime($startDate));
    
    $leaveRequests = LeaveRequest::where('employee_id', $employeeId)
        ->where('status', 'approved') // ONLY fully approved leaves
        ->whereHas('approvals', function($query) {
            $query->where('role', 'admin')->where('status', 'approved');
        })
        ->whereHas('leaveType', function($query) {
            $query->whereIn('code', ['VL', 'SL']);
        })
        ->where(function ($query) use ($startDate, $endDate) {
            $query->whereBetween('date_from', [$startDate, $endDate])
                  ->orWhereBetween('date_to', [$startDate, $endDate])
                  ->orWhere(function ($q) use ($startDate, $endDate) {
                      $q->where('date_from', '<=', $startDate)
                        ->where('date_to', '>=', $endDate);
                  });
        })
        ->with(['leaveType', 'approvals'])
        ->get();
    
    return $leaveRequests->map(function ($request) {
        return [
            'from' => $request->date_from,
            'to' => $request->date_to,
            'type' => $request->leaveType->name ?? 'Leave',
            'code' => $request->leaveType->code ?? '',
            'status' => $request->status,
            'approvals' => $request->approvals->map(function($approval) {
                return [
                    'role' => $approval->role,
                    'status' => $approval->status,
                ];
            })
        ];
    });
}
/**
 * Get total lates from attendance logs
 */
/**
 * Get total late deductions from leave_credit_logs for VL type with "Late" remarks
 */
private function getTotalLates($employeeId, $year, $month)
{
    return $this->getLateDeductions($employeeId, $year, $month);
}

/**
 * Get remarks for the month from the latest log entry
 */
private function getRemarks($employeeId, $year, $month)
{
    // Get the latest log entry for any leave type in this month
    $log = \App\Models\LeaveCreditLog::where('employee_id', $employeeId)
        ->where('year', $year)
        ->where('month', $month)
        ->orderBy('date', 'desc')
        ->orderBy('created_at', 'desc')
        ->first();
    
    return $log->remarks ?? '';
}

/**
 * Update remarks for a specific recording
 */
public function updateRemarks(Request $request, $id)
{
    $request->validate([
        'remarks' => 'nullable|string|max:500',
        'employee_id' => 'required|exists:employees,employee_id',
        'year' => 'required|integer',
        'month' => 'required|integer|between:1,12',
    ]);

    try {
        // Find or create leave credit log for the specified month
        $log = \App\Models\LeaveCreditLog::where('employee_id', $request->employee_id)
            ->where('year', $request->year)
            ->where('month', $request->month)
            ->first();

        if ($log) {
            $log->update(['remarks' => $request->remarks]);
        } else {
            // Create a new log entry if none exists
            \App\Models\LeaveCreditLog::create([
                'employee_id' => $request->employee_id,
                'year' => $request->year,
                'month' => $request->month,
                'remarks' => $request->remarks,
                'type' => 'REMARKS', // Special type for remarks-only entries
                'points_deducted' => 0,
                'balance_before' => 0,
                'balance_after' => 0,
                'date' => now(),
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Remarks updated successfully.']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Failed to update remarks: ' . $e->getMessage()], 500);
    }
}

/**
 * Get available years for filtering
 */


/**
 * Format month and year for display
 */
private function formatMonthYear($month, $year)
{
    return date('F Y', strtotime("{$year}-{$month}-01"));
}


/**
 * Debug method to check leave deduction process
 */
public function debugLeaveDeduction($leaveRequestId)
{
    try {
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($leaveRequestId);
        
        \Log::info("=== LEAVE DEDUCTION DEBUG ===");
        \Log::info("Leave Request ID: " . $leaveRequest->id);
        \Log::info("Employee: " . $leaveRequest->employee->firstname . " " . $leaveRequest->employee->lastname);
        \Log::info("Leave Type: " . $leaveRequest->leaveType->name . " (" . $leaveRequest->leaveType->code . ")");
        \Log::info("Dates: " . $leaveRequest->date_from . " to " . $leaveRequest->date_to);
        \Log::info("Status: " . $leaveRequest->status);
        
        // Check if this is SL or VL
        $isSLorVL = in_array($leaveRequest->leaveType->code, ['SL', 'VL']);
        \Log::info("Is SL/VL: " . ($isSLorVL ? 'YES' : 'NO'));
        
        if ($isSLorVL) {
            // Calculate working days
            $workingDays = $this->calculateWorkingDays($leaveRequest->date_from, $leaveRequest->date_to);
            \Log::info("Working Days: " . $workingDays);
            
            // Check current balance
            $currentBalance = $this->getCurrentLeaveBalance($leaveRequest->employee_id, $leaveRequest->leaveType->code);
            \Log::info("Current Balance: " . $currentBalance);
            
            // Check if deduction logs exist
            $existingLogs = \App\Models\LeaveCreditLog::where('employee_id', $leaveRequest->employee_id)
                ->where('type', $leaveRequest->leaveType->code)
                ->whereBetween('date', [$leaveRequest->date_from, $leaveRequest->date_to])
                ->get();
                
            \Log::info("Existing Deduction Logs: " . $existingLogs->count());
            
            foreach ($existingLogs as $log) {
                \Log::info(" - Log ID: " . $log->id . ", Points: " . $log->points_deducted . ", Date: " . $log->date);
            }
        }
        
        \Log::info("=== END DEBUG ===");
        
        return response()->json([
            'success' => true,
            'data' => [
                'leave_request' => $leaveRequest,
                'is_sl_vl' => $isSLorVL,
                'working_days' => $isSLorVL ? $workingDays : null,
                'current_balance' => $isSLorVL ? $currentBalance : null,
                'existing_logs' => $isSLorVL ? $existingLogs : null,
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error("Debug Leave Deduction Error: " . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

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

private function getCurrentLeaveBalance($employeeId, $type)
{
    $latestLog = \App\Models\LeaveCreditLog::where('employee_id', $employeeId)
        ->where('type', $type)
        ->orderBy('date', 'desc')
        ->orderBy('created_at', 'desc')
        ->first();
        
    if ($latestLog) {
        return $latestLog->balance_after;
    }
    
    $leaveCredit = \App\Models\LeaveCredit::where('employee_id', $employeeId)->first();
    return $type === 'VL' ? ($leaveCredit->vl_balance ?? 0) : ($leaveCredit->sl_balance ?? 0);
}

/**
 * Manual fix for missing leave deductions
 */
public function fixMissingDeductions($leaveRequestId)
{
    try {
        $leaveRequest = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($leaveRequestId);
        
        \Log::info("=== FIXING MISSING DEDUCTIONS ===");
        \Log::info("Leave Request: " . $leaveRequest->id . " (" . $leaveRequest->leaveType->code . ")");
        \Log::info("Leave Dates: " . $leaveRequest->date_from . " to " . $leaveRequest->date_to);
        
        // Check if this is SL/VL
        if (!in_array($leaveRequest->leaveType->code, ['SL', 'VL'])) {
            return response()->json([
                'success' => false, 
                'message' => 'Not an SL/VL leave type - no deduction needed'
            ]);
        }
        
        // Check if deduction already exists (with correct dates)
        $leaveYear = date('Y', strtotime($leaveRequest->date_from));
        $leaveMonth = date('n', strtotime($leaveRequest->date_from));
        
        $existingLogs = \App\Models\LeaveCreditLog::where('employee_id', $leaveRequest->employee_id)
            ->where('type', $leaveRequest->leaveType->code)
            ->where('year', $leaveYear)
            ->where('month', $leaveMonth)
            ->get();
            
        if ($existingLogs->count() > 0) {
            \Log::info("Deduction logs already exist for month {$leaveMonth}/{$leaveYear}: " . $existingLogs->count());
            return response()->json([
                'success' => false,
                'message' => 'Deduction logs already exist for this request month'
            ]);
        }
        
        // Process the deduction with correct dates
        $workingDays = $this->calculateWorkingDays($leaveRequest->date_from, $leaveRequest->date_to);
        $currentBalance = $this->getCurrentLeaveBalance($leaveRequest->employee_id, $leaveRequest->leaveType->code);
        $newBalance = $currentBalance - $workingDays;
        
        \Log::info("Creating deduction with:", [
            'working_days' => $workingDays,
            'current_balance' => $currentBalance,
            'new_balance' => $newBalance,
            'year' => $leaveYear,
            'month' => $leaveMonth
        ]);
        
        $log = \App\Models\LeaveCreditLog::create([
            'employee_id' => $leaveRequest->employee_id,
            'type' => $leaveRequest->leaveType->code,
            'date' => $leaveRequest->date_from,
            'year' => $leaveYear,
            'month' => $leaveMonth,
            'points_deducted' => $workingDays,
            'balance_before' => $currentBalance,
            'balance_after' => $newBalance,
            'remarks' => 'Manual fix: Leave deduction for ' . $leaveRequest->leaveType->name . ' (Request #' . $leaveRequest->id . ')',
        ]);
        
        \Log::info("Missing deduction fixed successfully. Log ID: " . $log->id);
        
        return response()->json([
            'success' => true,
            'message' => 'Deduction created successfully',
            'log_id' => $log->id,
            'working_days' => $log->points_deducted,
            'balance_before' => $log->balance_before, 
            'balance_after' => $log->balance_after,
            'year' => $log->year,
            'month' => $log->month
        ]);
        
    } catch (\Exception $e) {
        \Log::error("Fix missing deductions failed: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
}


public function exportDepartmentRecordings(Request $request)
{
    $request->validate([
        'department_id' => 'nullable|exists:departments,id',
        'year' => 'required|integer',
    ]);

    $departmentId = $request->department_id;
    $year = $request->year;
    
    $department = $departmentId 
        ? Department::find($departmentId)->name 
        : 'All_Departments';

    $filename = "employee_recordings_{$department}_{$year}_" . now()->format('Y-m-d') . '.xlsx';

    return Excel::download(new EmployeeRecordingsExport($departmentId, $year), $filename);
}

/**
 * Export all employee recordings
 */
public function exportAllRecordings(Request $request)
{
    $request->validate([
        'year' => 'required|integer',
    ]);

    $year = $request->year;
    $filename = "all_employee_recordings_{$year}_" . now()->format('Y-m-d') . '.xlsx';

    return Excel::download(new EmployeeRecordingsExport(null, $year), $filename);
}







// public function generatePDF(Request $request)
// {
//     try {
//         $leaveRequestId = $request->input('leave_request_id');
        
//         if (!$leaveRequestId) {
//             return back()->with('error', 'Leave request ID is required');
//         }
        
//         // First, get the leave request without relationships to debug
//         $leaveRequest = LeaveRequest::find($leaveRequestId);
        
//         if (!$leaveRequest) {
//             return back()->with('error', 'Leave request not found');
//         }
        
//         // Debug: Check what relationships are available
//         \Log::info('LeaveRequest relationships: ' . implode(', ', array_keys($leaveRequest->getRelations())));
        
//         // Load relationships one by one to find the correct names
//         $leaveRequest->load([
//             'employee.department',
//             'employee.leaveCreditLogs',
//             'details',
//         ]);
        
//         // Try to load approvals with different names
//         if (method_exists($leaveRequest, 'approvals')) {
//             $leaveRequest->load(['approvals.approver']);
//             $approvers = $leaveRequest->approvals;
//         } elseif (method_exists($leaveRequest, 'leaveApprovals')) {
//             $leaveRequest->load(['leaveApprovals.approver']);
//             $approvers = $leaveRequest->leaveApprovals;
//         } elseif (method_exists($leaveRequest, 'approvers')) {
//             $leaveRequest->load(['approvers']);
//             $approvers = $leaveRequest->approvers;
//         } else {
//             $approvers = collect(); // Empty collection if no relationship found
//         }
        
//         // Prepare data for PDF
//         $data = [
//             'leaveRequest' => $leaveRequest,
//             'employee' => $leaveRequest->employee,
//             'approvers' => $approvers,
//         ];

//         // Generate PDF
//         $pdf = PDF::loadView('pdf.leave-form', $data)
//             ->setPaper('a4', 'portrait')
//             ->setOptions([
//                 'dpi' => 150,
//                 'defaultFont' => 'Arial',
//                 'isHtml5ParserEnabled' => true,
//                 'isRemoteEnabled' => true,
//             ]);

//         return $pdf->download("leave-request-{$leaveRequest->id}.pdf");

//     } catch (\Exception $e) {
//         \Log::error('PDF Generation Error: ' . $e->getMessage());
//         return back()->with('error', 'Failed to generate PDF: ' . $e->getMessage());
//     }
// }


public function holidays(Request $request)
{
    $perPage = 10;
    
    $holidays = Holiday::orderBy('date', 'asc')
        ->when($request->search, function ($query, $search) {
            return $query->where('name', 'like', "%{$search}%");
        })
        ->when($request->year, function ($query, $year) {
            return $query->whereYear('date', $year);
        })
        ->when($request->type, function ($query, $type) {
            return $query->where('type', $type);
        })
        ->paginate($perPage)
        ->withQueryString();

    // Get available years for filter
    $availableYears = Holiday::selectRaw('YEAR(date) as year')
        ->distinct()
        ->orderBy('year', 'desc')
        ->pluck('year');

    return Inertia::render('HR/Holidays', [
        'holidays' => $holidays,
        'filters' => $request->only(['search', 'year', 'type']),
        'availableYears' => $availableYears,
    ]);
}

/**
 * Store a newly created holiday
 */
public function storeHoliday(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'date' => 'required|date|unique:holidays,date',
        'type' => 'required|in:Regular Holiday,Special Non-working Holiday',
    ]);

    try {
        Holiday::create($validated);
        
        return redirect()->back()->with('success', 'Holiday created successfully!');
    } catch (\Exception $e) {
        \Log::error('Error creating holiday: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Failed to create holiday: ' . $e->getMessage()]);
    }
}

/**
 * Update the specified holiday
 */
public function updateHoliday(Request $request, Holiday $holiday)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'date' => 'required|date|unique:holidays,date,' . $holiday->id,
        'type' => 'required|in:Regular Holiday,Special Non-working Holiday',
    ]);

    try {
        $holiday->update($validated);
        
        return redirect()->back()->with('success', 'Holiday updated successfully!');
    } catch (\Exception $e) {
        \Log::error('Error updating holiday: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Failed to update holiday: ' . $e->getMessage()]);
    }
}

/**
 * Remove the specified holiday
 */
public function destroyHoliday(Holiday $holiday)
{
    try {
        $holiday->delete();
        
        return redirect()->back()->with('success', 'Holiday deleted successfully!');
    } catch (\Exception $e) {
        \Log::error('Error deleting holiday: ' . $e->getMessage());
        return redirect()->back()->withErrors(['error' => 'Failed to delete holiday: ' . $e->getMessage()]);
    }
}

/**
 * Get holiday dates for date picker
 */
public function getHolidayDates()
{
    $holidays = Holiday::select('date', 'type')->get();
    
    return response()->json($holidays);
}



public function rescheduleRequests(Request $request)
{
    $rescheduleRequests = LeaveRescheduleRequest::with([
            'employee.department',
            'employee.user',
            'originalLeaveRequest.leaveType'
        ])
        ->orderBy('submitted_at', 'desc')
        ->paginate(10)
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
            ];
        });

    return Inertia::render('HR/RescheduleRequests', [
        'rescheduleRequests' => $rescheduleRequests,
    ]);
}

/**
 * Approve a reschedule request (HR action)
 */
public function approveRescheduleRequest(Request $request, $id)
{
    $rescheduleRequest = LeaveRescheduleRequest::with(['employee', 'originalLeaveRequest'])->findOrFail($id);

    // Check if request is pending HR approval
    if ($rescheduleRequest->status !== 'pending_hr') {
        return back()->with('error', 'This reschedule request has already been processed.');
    }

    try {
        $user = $request->user();
        $employeeRole = $rescheduleRequest->employee->user->role;
        
        // FIXED LOGIC: Based on your requirements
        $isSimpleApproval = in_array($employeeRole, ['dept_head', 'admin']);
        $isTwoStepApproval = in_array($employeeRole, ['employee', 'hr']);

        if ($isTwoStepApproval) {
            // For employees and HR: HR approves and sends to Dept Head
            $rescheduleRequest->update([
                'status' => 'pending_dept_head',
                'hr_reviewed_by' => $user->id,
                'hr_reviewed_at' => now(),
                'hr_remarks' => 'Approved by HR - Forwarded to Department Head',
            ]);
        } elseif ($isSimpleApproval) {
            // For dept_head and admin: HR approval is final
            $rescheduleRequest->update([
                'status' => 'approved',
                'hr_reviewed_by' => $user->id,
                'hr_reviewed_at' => now(),
                'processed_by' => $user->id,
                'processed_at' => now(),
                'hr_remarks' => 'Approved by HR - Auto-approved for Department Head/Admin',
            ]);

            // Update the original leave request with new dates
            $this->updateLeaveRequestDates($rescheduleRequest);
        }

        // // 🔔 Send notifications
        // $this->notificationService->notifyRescheduleHRApproval($rescheduleRequest, $isTwoStepApproval);

        return back()->with('success', 
            $isTwoStepApproval 
                ? 'Reschedule request approved and forwarded to Department Head.' 
                : 'Reschedule request approved successfully.'
        );

    } catch (\Exception $e) {
        \Log::error('HR reschedule approval failed: ' . $e->getMessage());
        return back()->with('error', 'Failed to approve reschedule request.');
    }
}

/**
 * Reject a reschedule request (HR action)
 */
public function rejectRescheduleRequest(Request $request, $id)
{
    $rescheduleRequest = LeaveRescheduleRequest::with(['employee'])->findOrFail($id);

    // Check if request is pending HR approval
    if ($rescheduleRequest->status !== 'pending_hr') {
        return back()->with('error', 'This reschedule request has already been processed.');
    }

    $validated = $request->validate([
        'remarks' => ['required', 'string', 'max:1000'],
    ]);

    try {
        $user = $request->user();

        $rescheduleRequest->update([
            'status' => 'rejected',
            'hr_reviewed_by' => $user->id,
            'hr_reviewed_at' => now(),
            'processed_by' => $user->id,
            'processed_at' => now(),
            'hr_remarks' => $validated['remarks'],
        ]);

        // // 🔔 Send notifications
        // $this->notificationService->notifyRescheduleHRRejection($rescheduleRequest);

        return back()->with('success', 'Reschedule request rejected successfully.');

    } catch (\Exception $e) {
        \Log::error('HR reschedule rejection failed: ' . $e->getMessage());
        return back()->with('error', 'Failed to reject reschedule request.');
    }
}

/**
 * Update original leave request with new dates
 */
private function updateLeaveRequestDates($rescheduleRequest)
{
    try {
        $originalLeave = $rescheduleRequest->originalLeaveRequest;
        $dates = collect($rescheduleRequest->proposed_dates)->sort()->values();
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
                    'remarks' => $rescheduleRequest->hr_remarks
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
}


