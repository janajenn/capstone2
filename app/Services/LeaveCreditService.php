<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\AttendanceLog;
use App\Services\NotificationService;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveCreditService
{
    public function deductLeaveCredits(LeaveRequest $leaveRequest)
    {
        Log::info('🚀 LEAVE CREDIT SERVICE STARTED for leave request ID: ' . $leaveRequest->id);

        try {
            return DB::transaction(function () use ($leaveRequest) {
                Log::info('📦 Transaction started');

                // Get leave type CODE from relationship (not the name)
                $leaveTypeCode = $leaveRequest->leaveType->code;
                Log::info('📋 Leave Type Code: ' . $leaveTypeCode);

                // Only process SL and VL leave types (checking the CODE now)
                if (!in_array($leaveTypeCode, ['SL', 'VL'])) {
                    Log::info("⏭️ Skipping deduction for non-SL/VL leave type code: {$leaveTypeCode}");
                    return null;
                }

                // Calculate working days (excluding weekends)
                $period = CarbonPeriod::create($leaveRequest->date_from, $leaveRequest->date_to);
                $workingDays = collect($period)->filter(function ($date) {
                    return !$date->isWeekend();
                })->count();

                Log::info("📅 Working days to deduct: {$workingDays}");

                // Get leave credit record
                $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();

                if (!$leaveCredit) {
                    Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
                    throw new \Exception('No leave credits found for this employee.');
                }

                Log::info("💳 Current balances - SL: {$leaveCredit->sl_balance}, VL: {$leaveCredit->vl_balance}");

                // Check sufficient balance
                $balanceField = $this->getBalanceField($leaveTypeCode);
                $currentBalance = $leaveCredit->{$balanceField};

                if ($currentBalance < $workingDays) {
                    Log::warning("⚠️ Insufficient {$leaveTypeCode} balance: {$currentBalance} available, {$workingDays} required - returning insufficient balance result");
                    return [
                        'success' => false,
                        'message' => "Insufficient {$leaveTypeCode} balance",
                        'available_balance' => $currentBalance,
                        'required_days' => $workingDays
                    ];
                }

                // Deduct from balance
                $leaveCredit->{$balanceField} -= $workingDays;
                $leaveCredit->last_updated = now();
                $leaveCredit->save();

                Log::info("✅ Deducted {$workingDays} days. New {$balanceField}: {$leaveCredit->{$balanceField}}");

                // Log the deduction
                $this->createCreditLog($leaveRequest, $leaveTypeCode, $workingDays, $leaveCredit->{$balanceField});

                Log::info('🎉 LEAVE CREDIT SERVICE COMPLETED SUCCESSFULLY');
                return [
                    'success' => true,
                    'message' => "Successfully deducted {$workingDays} days from {$leaveTypeCode} balance",
                    'days_deducted' => $workingDays,
                    'new_balance' => $leaveCredit->{$balanceField}
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 Exception in LeaveCreditService: ' . $e->getMessage());
            Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    private function getBalanceField($leaveTypeCode)
    {
        return match($leaveTypeCode) {
            'SL' => 'sl_balance',
            'VL' => 'vl_balance',
            default => null
        };
    }

    private function createCreditLog(LeaveRequest $leaveRequest, $typeCode, $daysDeducted, $newBalance)
    {
        Log::info('📝 Creating credit log entry...');
    
        try {
            // Get the current leave credit record to retrieve balance_before
            $leaveCredit = LeaveCredit::where('employee_id', $leaveRequest->employee_id)->first();
            
            if (!$leaveCredit) {
                Log::error("❌ No leave credits found for employee: {$leaveRequest->employee_id}");
                throw new \Exception('No leave credits found for this employee.');
            }
    
            // Calculate balance_before (current balance + points deducted)
            $balanceBefore = $newBalance + $daysDeducted;
    
            // ✅ FIXED: Use leave request dates instead of current date
            $leaveStartDate = $leaveRequest->date_from;
            $leaveYear = date('Y', strtotime($leaveStartDate));
            $leaveMonth = date('n', strtotime($leaveStartDate));
    
            Log::info("📅 Using leave request dates for log:", [
                'leave_start_date' => $leaveStartDate,
                'leave_year' => $leaveYear,
                'leave_month' => $leaveMonth,
                'current_date' => now()->format('Y-m-d'),
                'current_year' => now()->year,
                'current_month' => now()->month
            ]);
    
            $log = LeaveCreditLog::create([
                'employee_id' => $leaveRequest->employee_id,
                'type' => $typeCode,
                'date' => $leaveStartDate, // ✅ FIXED: Use leave start date
                'year' => $leaveYear, // ✅ FIXED: Use leave year
                'month' => $leaveMonth, // ✅ FIXED: Use leave month
                'points_deducted' => $daysDeducted,
                'balance_before' => $balanceBefore,
                'balance_after' => $newBalance,
                'remarks' => "Auto deducted after Admin approval of leave request ID #{$leaveRequest->id}",
            ]);
    
            Log::info("✅ Credit log created with ID: {$log->id}");
            Log::info("   - Balance before: {$balanceBefore}");
            Log::info("   - Balance after: {$newBalance}");
            Log::info("   - Date: {$leaveStartDate}");
            Log::info("   - Year: {$leaveYear}, Month: {$leaveMonth}");
            
            return $log;
        } catch (\Exception $e) {
            Log::error('❌ Failed to create credit log: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Deduct VL credits for late minutes
     */
    public function deductLateCredits($employeeId, $lateMinutes)
    {
        Log::info("🔍 DEBUG: deductLateCredits called", [
            'employee_id' => $employeeId,
            'late_minutes' => $lateMinutes
        ]);

        if ($lateMinutes <= 0) {
            Log::info("🔍 DEBUG: No late minutes to process", [
                'employee_id' => $employeeId,
                'late_minutes' => $lateMinutes
            ]);
            return [
                'success' => false,
                'message' => 'No late minutes to process'
            ];
        }

        try {
            return DB::transaction(function () use ($employeeId, $lateMinutes) {
                Log::info("🔍 DEBUG: Starting transaction for late credit deduction", [
                    'employee_id' => $employeeId,
                    'late_minutes' => $lateMinutes
                ]);

                Log::info("🕐 Processing late credit deduction", [
                    'employee_id' => $employeeId,
                    'late_minutes' => $lateMinutes
                ]);

                // Conversion table: minutes to day fraction
                $conversionTable = [
                    1 => 0.002, 2 => 0.004, 3 => 0.006, 4 => 0.008, 5 => 0.010,
                    6 => 0.012, 7 => 0.015, 8 => 0.017, 9 => 0.019, 10 => 0.021,
                    11 => 0.023, 12 => 0.025, 13 => 0.027, 14 => 0.029, 15 => 0.031,
                    16 => 0.033, 17 => 0.035, 18 => 0.037, 19 => 0.040, 20 => 0.042,
                    21 => 0.044, 22 => 0.046, 23 => 0.048, 24 => 0.050, 25 => 0.052,
                    26 => 0.054, 27 => 0.056, 28 => 0.058, 29 => 0.060, 30 => 0.062,
                    31 => 0.065, 32 => 0.067, 33 => 0.069, 34 => 0.071, 35 => 0.073,
                    36 => 0.075, 37 => 0.077, 38 => 0.079, 39 => 0.081, 40 => 0.083,
                    41 => 0.085, 42 => 0.087, 43 => 0.090, 44 => 0.092, 45 => 0.094,
                    46 => 0.096, 47 => 0.098, 48 => 0.100, 49 => 0.102, 50 => 0.104,
                    51 => 0.106, 52 => 0.108, 53 => 0.110, 54 => 0.112, 55 => 0.115,
                    56 => 0.117, 57 => 0.119, 58 => 0.121, 59 => 0.123, 60 => 0.125,
                ];

                // Get the day fraction to deduct (cap at 60 minutes)
                $minutesToConvert = min($lateMinutes, 60);
                $dayFraction = $conversionTable[$minutesToConvert] ?? 0.125; // Default to max if over 60

                Log::info("🔍 DEBUG: Late minutes conversion details", [
                    'original_late_minutes' => $lateMinutes,
                    'minutes_to_convert' => $minutesToConvert,
                    'day_fraction' => $dayFraction,
                    'conversion_table_has_key' => isset($conversionTable[$minutesToConvert]),
                    'conversion_table_value' => $conversionTable[$minutesToConvert] ?? 'not_found'
                ]);

                Log::info("📊 Late minutes conversion", [
                    'minutes' => $minutesToConvert,
                    'day_fraction' => $dayFraction
                ]);

                // Get leave credit record
                $leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();

                Log::info("🔍 DEBUG: Leave credit lookup", [
                    'employee_id' => $employeeId,
                    'leave_credit_found' => $leaveCredit ? 'yes' : 'no',
                    'leave_credit_id' => $leaveCredit ? $leaveCredit->id : null
                ]);

                if (!$leaveCredit) {
                    Log::error("❌ No leave credits found for employee: {$employeeId}");
                    return [
                        'success' => false,
                        'message' => 'No leave credits found for this employee'
                    ];
                }

                Log::info("🔍 DEBUG: Leave credit details", [
                    'employee_id' => $employeeId,
                    'vl_balance_before' => $leaveCredit->vl_balance,
                    'sl_balance_before' => $leaveCredit->sl_balance
                ]);

                // Check if VL balance is sufficient
                Log::info("🔍 DEBUG: Balance check", [
                    'employee_id' => $employeeId,
                    'current_vl_balance' => $leaveCredit->vl_balance,
                    'required_deduction' => $dayFraction,
                    'sufficient_balance' => $leaveCredit->vl_balance >= $dayFraction
                ]);

                if ($leaveCredit->vl_balance < $dayFraction) {
                    Log::warning("⚠️ Insufficient VL balance for late deduction", [
                        'employee_id' => $employeeId,
                        'current_vl_balance' => $leaveCredit->vl_balance,
                        'required_deduction' => $dayFraction
                    ]);
                    
                    return [
                        'success' => false,
                        'message' => 'Insufficient VL balance for late deduction',
                        'available_balance' => $leaveCredit->vl_balance,
                        'required_deduction' => $dayFraction
                    ];
                }

                // Store balance before deduction
                $balanceBefore = $leaveCredit->vl_balance;

                Log::info("🔍 DEBUG: About to deduct VL credits", [
                    'employee_id' => $employeeId,
                    'balance_before' => $balanceBefore,
                    'day_fraction_to_deduct' => $dayFraction,
                    'balance_after_will_be' => $balanceBefore - $dayFraction
                ]);

                // Deduct from VL balance
                $leaveCredit->vl_balance -= $dayFraction;

                Log::info("🔍 DEBUG: VL credits deducted successfully", [
                    'employee_id' => $employeeId,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $leaveCredit->vl_balance,
                    'deducted_amount' => $dayFraction
                ]);
                $leaveCredit->last_updated = now();
                $leaveCredit->save();

                Log::info("✅ VL credits deducted for late arrival", [
                    'employee_id' => $employeeId,
                    'deducted_amount' => $dayFraction,
                    'new_vl_balance' => $leaveCredit->vl_balance
                ]);

                // Create log entry
                $this->createLateCreditLog($employeeId, 'VL', $dayFraction, $balanceBefore, $lateMinutes);

                // Send notification to employee
                $this->sendLateDeductionNotification($employeeId, $dayFraction, $lateMinutes);

                return [
                    'success' => true,
                    'message' => "Successfully deducted {$dayFraction} VL credits for {$lateMinutes} minutes late",
                    'deducted_amount' => $dayFraction,
                    'new_balance' => $leaveCredit->vl_balance
                ];
            });
        } catch (\Exception $e) {
            Log::error('💥 Exception in deductLateCredits: ' . $e->getMessage());
            Log::error('📝 Stack trace: ' . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Error processing late credit deduction: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create credit log for late deduction
     */
    private function createLateCreditLog($employeeId, $type, $pointsDeducted, $balanceBefore, $lateMinutes)
    {
        try {
            $balanceAfter = $balanceBefore - $pointsDeducted;
            $today = now();
    
            LeaveCreditLog::create([
                'employee_id'     => $employeeId,
                'type'            => $type,
                'date'            => $today->toDateString(),   // 📅 exact deduction date
                'year'            => $today->year,             // 🗓️ store year
                'month'           => $today->month,            // 🗓️ store month
                'points_deducted' => $pointsDeducted,
                'balance_before'  => $balanceBefore,
                'balance_after'   => $balanceAfter,
                'remarks'         => "Late",
                'created_at'      => $today,
                'updated_at'      => $today,
            ]);
    
            Log::info("📝 Late credit log created", [
                'employee_id'    => $employeeId,
                'type'           => $type,
                'points_deducted'=> $pointsDeducted,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Failed to create late credit log: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send notification to employee about late deduction
     */
    private function sendLateDeductionNotification($employeeId, $dayFraction, $lateMinutes)
    {
        try {
            $notificationService = new NotificationService();
            $today = now()->format('F j, Y');

            $notificationService->createLeaveRequestNotification(
                $employeeId,
                'late_deduction',
                null, // No leave request ID for late deductions
                'VL (Late Deduction)',
                $today,
                $today,
                "You have been deducted {$dayFraction} VL credits on {$today} due to a late arrival of {$lateMinutes} minutes."
            );

            Log::info("📧 Late deduction notification sent", [
                'employee_id' => $employeeId,
                'day_fraction' => $dayFraction,
                'late_minutes' => $lateMinutes
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Failed to send late deduction notification: ' . $e->getMessage());
            // Don't throw exception here as the main deduction was successful
        }
    }

    /**
     * Process late credits for all employees with late minutes
     * This method should be called after attendance import
     */
    public function processLateCreditsForAllEmployees($date = null)
    {
        try {
            Log::info("🔄 Processing late credits for all employees", ['date' => $date]);

            // First, let's debug what's in the attendance_logs table
            $totalRecords = AttendanceLog::count();
            $recordsWithLateMinutes = AttendanceLog::where('late_minutes', '>', 0)->count();
            $recordsWithSchedule = AttendanceLog::whereNotNull('schedule_start')->where('schedule_start', '!=', '')->count();
            $recordsWithTimeIn = AttendanceLog::whereNotNull('time_in')->where('time_in', '!=', '')->count();
            
            Log::info("🔍 DEBUG: Attendance logs analysis", [
                'total_records' => $totalRecords,
                'records_with_late_minutes' => $recordsWithLateMinutes,
                'records_with_schedule' => $recordsWithSchedule,
                'records_with_time_in' => $recordsWithTimeIn
            ]);

            // Get some sample records to debug
            $sampleRecords = AttendanceLog::limit(5)->get(['id', 'employee_id', 'work_date', 'schedule_start', 'time_in', 'late_minutes']);
            Log::info("🔍 DEBUG: Sample attendance records", [
                'sample_records' => $sampleRecords->toArray()
            ]);

            // Get all employees with late minutes (if no specific date, get all recent records)
            if ($date) {
                $lateAttendanceLogs = AttendanceLog::whereDate('work_date', $date)
                    ->where('late_minutes', '>', 0)
                    ->with('employee')
                    ->get();
            } else {
                // Get all late attendance logs from the last 30 days to catch recent imports
                $lateAttendanceLogs = AttendanceLog::where('late_minutes', '>', 0)
                    ->where('work_date', '>=', now()->subDays(30))
                    ->with('employee')
                    ->get();
            }

            Log::info("📊 Found late attendance logs", [
                'count' => $lateAttendanceLogs->count(),
                'date' => $date,
                'date_range' => $date ? $date : 'last 30 days'
            ]);

            // If no late logs found, let's check for records that SHOULD be late
            if ($lateAttendanceLogs->count() === 0) {
                Log::info("🔍 DEBUG: No late logs found, checking for records that should be late");
                
                // Get records with both schedule and time_in
                $potentialLateRecords = AttendanceLog::whereNotNull('schedule_start')
                    ->where('schedule_start', '!=', '')
                    ->whereNotNull('time_in')
                    ->where('time_in', '!=', '')
                    ->where('work_date', '>=', now()->subDays(30))
                    ->limit(10)
                    ->get();
                
                Log::info("🔍 DEBUG: Records with schedule and time_in", [
                    'count' => $potentialLateRecords->count(),
                    'records' => $potentialLateRecords->map(function($record) {
                        return [
                            'id' => $record->id,
                            'employee_id' => $record->employee_id,
                            'work_date' => $record->work_date,
                            'schedule_start' => $record->schedule_start,
                            'time_in' => $record->time_in,
                            'late_minutes' => $record->late_minutes
                        ];
                    })->toArray()
                ]);
                
                // Manually check if any should be late
                foreach ($potentialLateRecords as $record) {
                    try {
                        $scheduleTime = \Carbon\Carbon::parse($record->schedule_start);
                        $actualTime = \Carbon\Carbon::parse($record->time_in);
                        
                        if ($actualTime->greaterThan($scheduleTime)) {
                            $calculatedLate = $actualTime->diffInMinutes($scheduleTime);
                            Log::info("🔍 DEBUG: Record {$record->id} should be late", [
                                'employee_id' => $record->employee_id,
                                'work_date' => $record->work_date,
                                'schedule_start' => $record->schedule_start,
                                'time_in' => $record->time_in,
                                'calculated_late_minutes' => $calculatedLate,
                                'stored_late_minutes' => $record->late_minutes
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error("🔍 DEBUG: Error checking record {$record->id}", [
                            'error' => $e->getMessage(),
                            'schedule_start' => $record->schedule_start,
                            'time_in' => $record->time_in
                        ]);
                    }
                }
            }

            $processedCount = 0;
            $failedCount = 0;

            foreach ($lateAttendanceLogs as $attendanceLog) {
                Log::info("🕐 Processing late attendance log", [
                    'employee_id' => $attendanceLog->employee_id,
                    'work_date' => $attendanceLog->work_date,
                    'late_minutes' => $attendanceLog->late_minutes
                ]);

                $result = $this->deductLateCredits(
                    $attendanceLog->employee_id, 
                    $attendanceLog->late_minutes
                );

                if ($result['success']) {
                    $processedCount++;
                    Log::info("✅ Processed late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'deducted_amount' => $result['deducted_amount']
                    ]);
                } else {
                    $failedCount++;
                    Log::warning("⚠️ Failed to process late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'error' => $result['message']
                    ]);
                }
            }

            Log::info("🎉 Late credits processing completed", [
                'date' => $date,
                'date_range' => $date ? $date : 'last 30 days',
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ]);

            return [
                'success' => true,
                'message' => "Processed late credits for {$processedCount} employees from " . ($date ? $date : 'last 30 days'),
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ];
        } catch (\Exception $e) {
            Log::error('💥 Exception in processLateCreditsForAllEmployees: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error processing late credits: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process late credits for a specific date range
     * Useful for processing historical data
     */
    public function processLateCreditsForDateRange($startDate, $endDate)
    {
        try {
            Log::info("🔄 Processing late credits for date range", [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            // Get all employees with late minutes in the date range
            $lateAttendanceLogs = AttendanceLog::whereBetween('work_date', [$startDate, $endDate])
                ->where('late_minutes', '>', 0)
                ->with('employee')
                ->get();

            Log::info("📊 Found late attendance logs in date range", [
                'count' => $lateAttendanceLogs->count(),
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            $processedCount = 0;
            $failedCount = 0;

            foreach ($lateAttendanceLogs as $attendanceLog) {
                Log::info("🕐 Processing late attendance log", [
                    'employee_id' => $attendanceLog->employee_id,
                    'work_date' => $attendanceLog->work_date,
                    'late_minutes' => $attendanceLog->late_minutes
                ]);

                $result = $this->deductLateCredits(
                    $attendanceLog->employee_id, 
                    $attendanceLog->late_minutes
                );

                if ($result['success']) {
                    $processedCount++;
                    Log::info("✅ Processed late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'deducted_amount' => $result['deducted_amount']
                    ]);
                } else {
                    $failedCount++;
                    Log::warning("⚠️ Failed to process late credits for employee", [
                        'employee_id' => $attendanceLog->employee_id,
                        'work_date' => $attendanceLog->work_date,
                        'late_minutes' => $attendanceLog->late_minutes,
                        'error' => $result['message']
                    ]);
                }
            }

            Log::info("🎉 Late credits processing completed for date range", [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ]);

            return [
                'success' => true,
                'message' => "Processed late credits for {$processedCount} employees from {$startDate} to {$endDate}",
                'processed_count' => $processedCount,
                'failed_count' => $failedCount,
                'total_late_logs' => $lateAttendanceLogs->count()
            ];
        } catch (\Exception $e) {
            Log::error('💥 Exception in processLateCreditsForDateRange: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error processing late credits for date range: ' . $e->getMessage()
            ];
        }
    }
}
