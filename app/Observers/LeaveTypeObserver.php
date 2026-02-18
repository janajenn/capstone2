<?php

namespace App\Observers;
use App\Models\LeaveType;
use App\Models\LeaveBalance;
use App\Models\Employee;


class LeaveTypeObserver
{
    /**
     * Handle the LeaveType "created" event.
     */
    public function created(LeaveType $leaveType): void
    {
        // Exclude SL and VL
        if (in_array(strtoupper($leaveType->code), ['SL', 'VL'])) {
            return;
        }

        $year = now()->year;
        $employees = Employee::all();

        foreach ($employees as $employee) {
            LeaveBalance::updateOrCreate(
                [
                    'employee_id'   => $employee->employee_id,
                    'leave_type_id' => $leaveType->id,
                    'year'          => $year,
                ],
                [
                    'total_earned' => $leaveType->default_days ?? 0,
                    'total_used'   => 0,
                    'balance'      => $leaveType->default_days ?? 0,
                ]
            );
        }

    }


    /**
     * Handle the LeaveType "updated" event.
     */
    public function updated(LeaveType $leaveType): void
{
    // Exclude SL and VL
    if (in_array(strtoupper($leaveType->code), ['SL', 'VL'])) {
        return;
    }

    $year = now()->year;

    // Update all balances for this leave type in current year
    LeaveBalance::where('leave_type_id', $leaveType->id)
        ->where('year', $year)
        ->update([
            'total_earned' => $leaveType->default_days ?? 0,
            'balance'      => \DB::raw("GREATEST(0, {$leaveType->default_days} - total_used)")
        ]);
}   
    /**
     * Handle the LeaveType "deleted" event.
     */
    public function deleted(LeaveType $leaveType): void
    {
        //
    }

    /**
     * Handle the LeaveType "restored" event.
     */
    public function restored(LeaveType $leaveType): void
    {
        //
    }

    /**
     * Handle the LeaveType "force deleted" event.
     */
    public function forceDeleted(LeaveType $leaveType): void
    {
        //
    }
}
