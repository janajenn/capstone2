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


class HRController extends Controller
{

    //EMPLOYEE MANAGEMENT
    public function employees()
    {
        return Inertia::render('HR/Employees', [
            'employees' => Employee::with('department')->latest()->get(),
            'departments' => Department::all(),
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
        'biometric_id' => 'required|integer|unique:employees,biometric_id',
        'monthly_salary' => 'required|numeric|min:0',
        'daily_rate' => 'required|numeric|min:0',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:6',
        'role' => 'required|in:employee,hr,admin,dept_head',
    ]);

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
        'biometric_id' => $validated['biometric_id'],
        'monthly_salary' => $validated['monthly_salary'],
        'daily_rate' => $validated['daily_rate'],
    ]);

    // 2. Create the user and link to employee
    User::create([
        'name' => $validated['firstname'] . ' ' . $validated['lastname'],
        'email' => $validated['email'],
        'password' => bcrypt($validated['password']),
        'role' => $validated['role'],
        'employee_id' => $employee->id,
    ]);

    return redirect()->back()->with('success', 'Employee and user created successfully!');
}



//LEAVE CREDITS

public function leaveCredits()
{
    $employees = User::with('leaveCredit')->get();

    return Inertia::render('HR/LeaveCredits', [
        'employees' => $employees,
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
        return redirect()->back()->with('error', 'Leave credits already added this month.');
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

        MonthlyCreditLog::create([
            'employee_id' => $employee->id,
            'year' => $year,
            'month' => $month,
        ]);
    }

    return redirect()->back()->with('success', 'Monthly leave credits added successfully.');
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
    ]);

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
    ]);

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
public function departments()
{
    return Inertia::render('HR/Departments', [
        'departments' => Department::all(),
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

    return Inertia::render('HR/Dashboard', [
        'pendingCount' => $pendingCount,
        'recentRequests' => $recentRequests,
        'requestsByStatus' => $requestsByStatus,
    ]);
}

public function leaveRequests(Request $request)
{
    $query = LeaveRequest::with([
            'leaveType',
            'employee.department',
            'details',
            'approvals' // Add this to load approvals
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

    $leaveRequests = $query->paginate(15);

    return Inertia::render('HR/LeaveRequests', [
        'leaveRequests' => $leaveRequests,
        'filters' => $request->only(['status', 'date_from', 'date_to', 'search']),
    ]);
}
public function showLeaveRequest($id)
{
    $leaveRequest = LeaveRequest::with(['leaveType', 'employee.department', 'details'])
        ->findOrFail($id);

    return Inertia::render('HR/ShowLeaveRequest', [
        'leaveRequest' => $leaveRequest,
    ]);
}

public function approveLeaveRequest(Request $request, $id)
{
    $leaveRequest = LeaveRequest::findOrFail($id);

    // Validate that the request is pending
    if ($leaveRequest->status !== 'pending') {
        return back()->withErrors(['message' => 'This request has already been processed.']);
    }

    // Update the leave request status
    $leaveRequest->update(['status' => 'approved']);

    // Create approval record
    \App\Models\LeaveApproval::create([
        'leave_id' => $leaveRequest->id,
        'approved_by' => $request->user()->id,
        'role' => 'hr',
        'status' => 'approved',
        'remarks' => $request->remarks,
        'approved_at' => now(),
    ]);

    return redirect()->route('hr.leave-requests')
        ->with('success', 'Leave request approved successfully.');
}

public function rejectLeaveRequest(Request $request, $id)
{
    $leaveRequest = LeaveRequest::findOrFail($id);

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

    return redirect()->route('hr.leave-requests')
        ->with('success', 'Leave request rejected successfully.');
}

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
        ->get();

    foreach ($leaveRequests as $leaveRequest) {
        // Update the leave request status
        $leaveRequest->update([
            'status' => $request->action === 'approve' ? 'approved' : 'rejected',
        ]);

        // Create approval record
        \App\Models\LeaveApproval::create([
            'leave_id' => $leaveRequest->id,
            'approved_by' => $request->user()->id,
            'role' => 'hr',
            'status' => $request->action === 'approve' ? 'approved' : 'rejected',
            'remarks' => $request->remarks,
            'approved_at' => now(),
        ]);
    }

    $action = $request->action === 'approve' ? 'approved' : 'rejected';
    return redirect()->route('hr.leave-requests')
        ->with('success', count($leaveRequests) . " leave requests {$action} successfully.");
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

}
