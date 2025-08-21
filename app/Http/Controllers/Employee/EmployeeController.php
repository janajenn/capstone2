<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\LeaveCredit;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

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
            'details' => ['required', 'string'], // Changed to string since we're sending JSON
            'attachment' => ['nullable', 'file', 'max:10240'],
        ]);

        // Check for overlapping leave requests
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

        $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
        $code = strtoupper($leaveType->code);

        $requiredByType = [
            'SL' => ['sick_type'],
            'SLBW' => ['slbw_condition'],
            'STL' => ['study_purpose'],
            'VL' => ['vacation_location'],
            'MAT' => ['expected_delivery_date', 'physician_name'],
        ];

        $additionalRequired = $requiredByType[$code] ?? [];
        if (!empty($additionalRequired)) {
            // Handle details as JSON string or array
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

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employeeId,
            'leave_type_id' => $validated['leave_type_id'],
            'date_from' => $validated['date_from'],
            'date_to' => $validated['date_to'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'attachment_path' => $attachmentPath,
        ]);

        // Handle details as JSON string or array
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
public function myLeaveRequests(Request $request)
{
    $user = $request->user()->load('employee');
    $employeeId = $user->employee?->employee_id;

    if (!$employeeId) {
        abort(400, 'Employee profile not found for user.');
    }

    $leaveRequests = LeaveRequest::with(['leaveType', 'details', 'approvals'])
        ->where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->get();

    return Inertia::render('Employee/MyLeaveRequests', [
        'leaveRequests' => $leaveRequests,
    ]);
}
}

