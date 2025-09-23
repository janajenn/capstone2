<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\LeaveRecall;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaveRecallController extends Controller
{
    /**
     * Display a listing of the employee's leave recalls
     */
    public function index()
    {
        $employee = Auth::user()->employee;
        
        if (!$employee) {
            return redirect()->back()->with('error', 'Employee record not found.');
        }

        $leaveRecalls = LeaveRecall::with([
            'leaveRequest.leaveType',
            'approvedByDeptHead',
            'approvedByHr'
        ])
        ->where('employee_id', $employee->employee_id)
        ->orderBy('created_at', 'desc')
        ->get();

        return Inertia::render('Employee/LeaveRecalls', [
            'leaveRecalls' => $leaveRecalls
        ]);
    }

    /**
     * Store a newly created leave recall request
     */
    public function store(Request $request)
    {
        $request->validate([
            'leave_request_id' => 'required|exists:leave_requests,id',
            'employee_id' => 'required|exists:employees,employee_id',
            'approved_leave_date' => 'required|date',
            'new_leave_date_from' => 'required|date|after_or_equal:today',
            'new_leave_date_to' => 'required|date|after_or_equal:new_leave_date_from',
            'reason_for_change' => 'required|string|max:1000'
        ]);

        $employee = Auth::user()->employee;
        
        if (!$employee || $employee->employee_id != $request->employee_id) {
            return redirect()->back()->with('error', 'Unauthorized access.');
        }

        // Check if the leave request is approved
        $leaveRequest = LeaveRequest::findOrFail($request->leave_request_id);
        
        if ($leaveRequest->status !== 'approved') {
            return redirect()->back()->with('error', 'Only approved leave requests can be recalled.');
        }

        // Check if there's already a pending recall for this leave request
        $existingRecall = LeaveRecall::where('leave_request_id', $request->leave_request_id)
            ->where('status', 'pending')
            ->first();

        if ($existingRecall) {
            return redirect()->back()->with('error', 'A recall request is already pending for this leave request.');
        }

        // Create the leave recall
        LeaveRecall::create([
            'leave_request_id' => $request->leave_request_id,
            'employee_id' => $request->employee_id,
            'approved_leave_date' => $request->approved_leave_date,
            'new_leave_date_from' => $request->new_leave_date_from,
            'new_leave_date_to' => $request->new_leave_date_to,
            'reason_for_change' => $request->reason_for_change,
            'status' => 'pending'
        ]);

        return redirect()->back()->with('success', 'Leave recall request submitted successfully.');
    }

    /**
     * Display the specified leave recall
     */
    public function show(LeaveRecall $leaveRecall)
    {
        $employee = Auth::user()->employee;
        
        if (!$employee || $leaveRecall->employee_id !== $employee->employee_id) {
            return redirect()->back()->with('error', 'Unauthorized access.');
        }

        $leaveRecall->load([
            'leaveRequest.leaveType',
            'approvedByDeptHead',
            'approvedByHr'
        ]);

        return Inertia::render('Employee/LeaveRecallDetails', [
            'leaveRecall' => $leaveRecall
        ]);
    }
}
