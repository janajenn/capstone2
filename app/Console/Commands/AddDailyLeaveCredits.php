<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employee;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AddDailyLeaveCredits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leave:daily-earn';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add daily leave credits to all active employees';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🎯 Starting daily leave credit addition at: ' . now());
        Log::info('🎯 Daily leave credit addition started', ['time' => now()]);

        // Daily rate: 1.250 / 30 = 0.0416667
        $dailyRate = 0.0416667;
        $today = Carbon::today();

        try {
            // Get all active employees
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
                    // Find or create leave credit record
                    $leaveCredit = LeaveCredit::firstOrCreate(
                        ['employee_id' => $employee->employee_id],
                        [
                            'sl_balance' => 0,
                            'vl_balance' => 0,
                            'last_updated' => $today->copy()->subDay(),
                        ]
                    );

                    // Check if already credited today
                    if ($leaveCredit->last_updated && $leaveCredit->last_updated->isToday()) {
                        $this->warn("⏭️ Employee {$employee->employee_id} already credited today. Skipping.");
                        $skippedCount++;
                        return;
                    }

                    // Store balances before update for logging
                    $previousSlBalance = $leaveCredit->sl_balance;
                    $previousVlBalance = $leaveCredit->vl_balance;

                    // Update balances
                    $leaveCredit->sl_balance += $dailyRate;
                    $leaveCredit->vl_balance += $dailyRate;
                    $leaveCredit->last_updated = $today;
                    $leaveCredit->save();

                    // Create log entries for both SL and VL
                    $this->createCreditLog($employee->employee_id, 'SL', $today, $previousSlBalance, $leaveCredit->sl_balance, $dailyRate);
                    $this->createCreditLog($employee->employee_id, 'VL', $today, $previousVlBalance, $leaveCredit->vl_balance, $dailyRate);

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

    /**
     * Create leave credit log entry - now with proper decimal(6,3) precision
     */
    private function createCreditLog($employeeId, $type, $date, $balanceBefore, $balanceAfter, $pointsAdded)
    {
        LeaveCreditLog::create([
            'employee_id' => $employeeId,
            'type' => $type,
            'date' => $date,
            'year' => $date->year,
            'month' => $date->month,
            'points_deducted' => 0.000, // Use 0.000 for additions (fits decimal(6,3))
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'remarks' => "Daily earned leave credit (+{$pointsAdded})",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}