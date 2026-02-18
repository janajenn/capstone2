<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Services\LeaveRecordingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddDailyLeaveCredits extends Command
{
    protected $signature = 'leave:daily-earn';
    protected $description = 'Add daily leave credits to all active employees';

    public function handle()
    {
        $this->info('🎯 Starting daily leave credit addition at: ' . now());
        Log::info('🎯 Daily leave credit addition started', ['time' => now()]);

        $dailyRate = 0.0416667;
        $today = Carbon::today();

        try {
            $employees = Employee::where('status', 'active')
                ->whereHas('user', function ($query) {
                    $query->whereIn('role', ['employee', 'admin', 'hr', 'dept_head']);
                })
                ->get();

            $this->info("📊 Processing {$employees->count()} active employees...");
            Log::info("Processing {$employees->count()} active employees");

            $updatedCount = 0;
            $skippedCount = 0;

            foreach ($employees as $employee) {
                DB::transaction(function () use ($employee, $dailyRate, $today, &$updatedCount, &$skippedCount) {
                    $leaveCredit = LeaveCredit::firstOrCreate(
                        ['employee_id' => $employee->employee_id],
                        [
                            'sl_balance' => 0,
                            'vl_balance' => 0,
                            'last_updated' => $today->copy()->subDay(),
                        ]
                    );

                    if ($leaveCredit->last_updated && $leaveCredit->last_updated->isToday()) {
                        $this->warn("⏭️ Employee {$employee->employee_id} already credited today. Skipping.");
                        $skippedCount++;
                        return;
                    }

                    $previousSlBalance = $leaveCredit->sl_balance;
                    $previousVlBalance = $leaveCredit->vl_balance;

                    $leaveCredit->sl_balance += $dailyRate;
                    $leaveCredit->vl_balance += $dailyRate;
                    $leaveCredit->last_updated = $today;
                    $leaveCredit->save();

                    $this->createCreditLog($employee->employee_id, 'SL', $today, $previousSlBalance, $leaveCredit->sl_balance, $dailyRate);
                    $this->createCreditLog($employee->employee_id, 'VL', $today, $previousVlBalance, $leaveCredit->vl_balance, $dailyRate);

                    // 🔥 Regenerate monthly recordings for this employee and current year
                    app(LeaveRecordingService::class)->generateForEmployeeYear($employee->employee_id, $today->year);

                    $updatedCount++;
                    $this->info("✅ Credits added for {$employee->firstname} {$employee->lastname}: SL={$dailyRate}, VL={$dailyRate}");
                    Log::info("Daily credits added for employee {$employee->employee_id}", [
                        'sl_added' => $dailyRate,
                        'vl_added' => $dailyRate,
                        'new_sl_balance' => $leaveCredit->sl_balance,
                        'new_vl_balance' => $leaveCredit->vl_balance
                    ]);
                });
            }

            $this->info("🎉 SUCCESS: Updated {$updatedCount} employees, Skipped {$skippedCount} employees");
            Log::info("Daily leave credit addition completed", [
                'updated' => $updatedCount,
                'skipped' => $skippedCount,
                'total' => $employees->count()
            ]);

        } catch (\Exception $e) {
            $this->error("❌ ERROR: " . $e->getMessage());
            Log::error("Daily leave credit addition failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    private function createCreditLog($employeeId, $type, $date, $balanceBefore, $balanceAfter, $pointsAdded)
    {
        LeaveCreditLog::create([
            'employee_id' => $employeeId,
            'type' => $type,
            'date' => $date,
            'year' => $date->year,
            'month' => $date->month,
            'points_deducted' => 0.000,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'remarks' => "Daily earned leave credit (+{$pointsAdded})",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}