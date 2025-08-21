<?php

namespace App\Http\Controllers\DeptHead;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveRequest;
use App\Models\LeaveApproval;
use Illuminate\Support\Facades\DB;

class DeptHeadController extends Controller
{
    public function dashboard(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;

    if (!$departmentId) {
       return Inertia::render('DeptHead/Dashboard', [
    'initialLeaveRequests' => $leaveRequests ?? [], // Ensure array
    'departmentName' => $user->employee->department->name ?? 'Department'
]);
    }

    // Get HR-approved requests that don't have DeptHead approval yet
    $leaveRequests = LeaveRequest::with([
            'employee.user',
            'leaveType:id,name',
            'employee.department:id,name',
            'approvals' => function($q) {
                $q->where('role', 'hr'); // Load only HR approvals
            }
        ])
        ->whereHas('employee', fn($q) => $q->where('department_id', $departmentId))
        ->where('status', 'approved') // HR-approved
        ->whereDoesntHave('approvals', function($q) {
            $q->where('role', 'dept_head');
        })
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($request) {
            // Find the HR approval (if exists)
            $hrApproval = $request->approvals->firstWhere('role', 'hr');

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
                'hr_approval' => $hrApproval ? [
                    'status' => $hrApproval->status,
                    'approved_at' => $hrApproval->approved_at,
                    'approved_by' => $hrApproval->approved_by
                ] : null
            ];
        });

    return Inertia::render('DeptHead/Dashboard', [
        'leaveRequests' => $leaveRequests,
        'departmentName' => $user->employee->department->name ?? 'Department'
    ]);
}
    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500'
        ]);

        DB::transaction(function () use ($request, $id, $validated) {
            // Create approval record
            LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $request->user()->id,
                'role' => 'dept_head',
                'status' => 'approved',
                'remarks' => $validated['remarks'] ?? null,
                'approved_at' => now()
            ]);

            // Update leave request status if needed (optional)
            // LeaveRequest::where('id', $id)->update(['status' => 'approved']);
        });

        return redirect()->back()->with('success', 'Leave request approved successfully.');
    }

    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        DB::transaction(function () use ($request, $id, $validated) {
            // Create approval record
            LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $request->user()->id,
                'role' => 'dept_head',
                'status' => 'rejected',
                'remarks' => $validated['remarks'],
                'approved_at' => now()
            ]);

            // Optionally update the main status if you want
            // LeaveRequest::where('id', $id)->update(['status' => 'rejected']);
        });

        return redirect()->back()->with('success', 'Leave request rejected successfully.');
    }


    public function getUpdatedRequests(Request $request)
{
    $user = $request->user();
    $departmentId = $user->employee->department_id ?? null;
    $lastUpdate = $request->input('lastUpdate');

    if (!$departmentId) {
        return response()->json(['newRequests' => []]);
    }

    $query = LeaveRequest::with([
            'employee.user',
            'leaveType:id,name',
            'employee.department:id,name',
            'approvals' => function($q) {
                $q->where('role', 'hr');
            }
        ])
        ->whereHas('employee', fn($q) => $q->where('department_id', $departmentId))
        ->where('status', 'approved')
        ->whereDoesntHave('approvals', function($q) {
            $q->where('role', 'dept_head');
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
                'hr_approval' => $request->approvals->firstWhere('role', 'hr')
            ];
        });

    return response()->json([
        'newRequests' => $newRequests,
        'lastUpdate' => now()->toDateTimeString()
    ]);
}
}
