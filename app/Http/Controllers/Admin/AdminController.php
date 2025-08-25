<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LeaveRequest;
use App\Models\LeaveApproval;
use Illuminate\Support\Facades\DB;
use App\Services\LeaveCreditService;
use App\Models\LeaveType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;

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
    \Log::info('👤 Admin approval attempt for leave request ID: ' . $id);

    try {
        $leaveRequest = LeaveRequest::with('leaveType')->findOrFail($id);
        \Log::info('📋 Found leave request with type: ' . $leaveRequest->leaveType->name);

        // Check if already approved by admin
        $existingAdminApproval = LeaveApproval::where('leave_id', $id)
            ->where('role', 'admin')
            ->first();

        if ($existingAdminApproval) {
            \Log::info('⚠️ Admin approval already exists for this request');
            return redirect()->back()->with('error', 'This leave request has already been processed.');
        }

        DB::transaction(function () use ($request, $id, $leaveRequest) {
            // Create admin approval record
            $approval = LeaveApproval::create([
                'leave_id' => $id,
                'approved_by' => $request->user()->id,
                'role' => 'admin',
                'status' => 'approved',
                'remarks' => $request->input('remarks', 'Approved by Admin'),
                'approved_at' => now()
            ]);

            \Log::info('✅ Created admin approval');

            // Check if all approvals are complete (HR, DeptHead, Admin)
            $isFullyApproved = $this->isFullyApproved($leaveRequest);

            \Log::info('🔍 Is fully approved: ' . ($isFullyApproved ? 'YES' : 'NO'));

            // Always set status to 'approved'
            $leaveRequest->status = 'approved';
            $leaveRequest->save();

            if ($isFullyApproved) {
                \Log::info('🎯 Leave fully approved by all parties - calling deduction service');

                // Process leave credit deduction for SL/VL types
                $leaveCreditService = new LeaveCreditService();
                $result = $leaveCreditService->deductLeaveCredits($leaveRequest);

                \Log::info('📊 Deduction service returned: ' . ($result ? 'SUCCESS' : 'NULL/SKIPPED'));
            } else {
                \Log::info('⏳ Admin approved, but waiting for other approvals - skipping deduction');
            }
        });

        \Log::info('✅ Transaction completed successfully');
        return redirect()->back()->with('success', 'Leave request approved successfully.');

    } catch (\Exception $e) {
        \Log::error('❌ Approval error: ' . $e->getMessage());
        \Log::error('📝 Stack trace: ' . $e->getTraceAsString());
        return redirect()->back()->with('error', 'Error approving leave: ' . $e->getMessage());
    }
}

    private function isFullyApproved(LeaveRequest $leaveRequest)
{
    $approvals = $leaveRequest->approvals()->get();

    \Log::info('All approvals for leave request ' . $leaveRequest->id . ':');
    foreach ($approvals as $approval) {
        \Log::info(" - Role: {$approval->role}, Status: {$approval->status}");
    }

    $hrApproved = $approvals->where('role', 'hr')->where('status', 'approved')->isNotEmpty();
    $deptHeadApproved = $approvals->where('role', 'dept_head')->where('status', 'approved')->isNotEmpty();
    $adminApproved = $approvals->where('role', 'admin')->where('status', 'approved')->isNotEmpty();

    \Log::info("HR approved: " . ($hrApproved ? 'YES' : 'NO'));
    \Log::info("Dept Head approved: " . ($deptHeadApproved ? 'YES' : 'NO'));
    \Log::info("Admin approved: " . ($adminApproved ? 'YES' : 'NO'));




    return $hrApproved && $deptHeadApproved && $adminApproved;
}

protected function deductLeaveCredits($leaveRequest)
{
    $employeeId = $leaveRequest->employee_id;
    $type = $leaveRequest->leave_type;

    // Calculate working days (excluding weekends)
    $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
    $workingDays = collect($period)->filter(function ($date) {
        return !$date->isWeekend();
    })->count();

    \Log::info('Working days to deduct: ' . $workingDays);

    // Get leave credit record
    $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

    if (!$leaveCredit) {
        \Log::error('No leave credits found for employee: ' . $employeeId);
        throw new \Exception('No leave credits found for this employee.');
    }

    \Log::info('Current leave credits - SL: ' . $leaveCredit->sl_balance . ', VL: ' . $leaveCredit->vl_balance);

    // Deduct based on type
    if ($type === 'SL') {
        $leaveCredit->sl_balance -= $workingDays;
    } elseif ($type === 'VL') {
        $leaveCredit->vl_balance -= $workingDays;
    }

    $leaveCredit->last_updated = now();
    $leaveCredit->save();

    \Log::info('Updated leave credits - SL: ' . $leaveCredit->sl_balance . ', VL: ' . $leaveCredit->vl_balance);

    // Log the deduction
    LeaveCreditLog::create([
        'employee_id' => $employeeId,
        'type' => $type,
        'month' => now()->month,
        'year' => now()->year,
        'dates_deducted' => $period->filter(fn($date) => !$date->isWeekend())->implode(', '),
        'points_deducted' => $workingDays,
        'remaining_balance' => $type === 'SL' ? $leaveCredit->sl_balance : $leaveCredit->vl_balance,
        'remarks' => 'Auto deducted after Admin approval of leave request ID #' . $leaveRequest->id,
    ]);

    \Log::info('Created leave credit log entry');
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
