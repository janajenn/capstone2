<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveRequest;
use App\Models\LeaveApproval;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {

        $leaveRequests = LeaveRequest::with([
                'employee.user',
                'leaveType:id,name',
                'employee.department:id,name',
                'approvals' => function($q) {
                    $q->whereIn('role', ['hr', 'dept_head']); // load HR and DeptHead approvals
                }
            ])
            ->where('status', 'approved') // HR-approved
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

        return Inertia::render('Admin/Dashboard', [
            'leaveRequests' => $leaveRequests,
        ]);
    }

    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500'
        ]);

        DB::transaction(function () use ($request, $id, $validated) {
            LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $request->user()->id,
                'role' => 'admin',
                'status' => 'approved',
                'remarks' => $validated['remarks'] ?? null,
                'approved_at' => now()
            ]);
        });

        return redirect()->back()->with('success', 'Leave request approved successfully.');
    }

    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:500'
        ]);

        DB::transaction(function () use ($request, $id, $validated) {
            LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $request->user()->id,
                'role' => 'admin',
                'status' => 'rejected',
                'remarks' => $validated['remarks'],
                'approved_at' => now()
            ]);
        });

        return redirect()->back()->with('success', 'Leave request rejected successfully.');
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
}
