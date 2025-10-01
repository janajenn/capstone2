<?php

/**
 * Test script for Leave Credit Balance Automation
 * 
 * This script demonstrates how the automatic balance calculation works.
 * Run this from the Laravel tinker or as a standalone test.
 */

require_once 'vendor/autoload.php';

use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;
use App\Models\Employee;

// Example usage - this would typically be run in Laravel tinker
// or as part of your application logic

echo "=== Leave Credit Balance Automation Test ===\n\n";

// Example 1: Using the static method (Recommended approach)
echo "1. Testing static method approach:\n";

try {
    // Assuming employee ID 1 exists
    $employeeId = 1;
    
    // Create a leave credit log with automatic balance calculation
    $log = LeaveCreditLog::createWithBalanceCalculation(
        employeeId: $employeeId,
        type: 'SL',
        pointsDeducted: 2.5,
        remarks: 'Test deduction using static method',
        date: now()
    );
    
    echo "✅ Log created successfully!\n";
    echo "   - Employee ID: {$log->employee_id}\n";
    echo "   - Type: {$log->type}\n";
    echo "   - Points Deducted: {$log->points_deducted}\n";
    echo "   - Balance Before: {$log->balance_before}\n";
    echo "   - Balance After: {$log->balance_after}\n";
    echo "   - Remarks: {$log->remarks}\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
}

// Example 2: Using the observer (Automatic approach)
echo "2. Testing observer approach:\n";

try {
    // Create a log entry - balances will be auto-populated by observer
    $log = LeaveCreditLog::create([
        'employee_id' => $employeeId,
        'type' => 'VL',
        'date' => now(),
        'year' => now()->year,
        'month' => now()->month,
        'points_deducted' => 1.0,
        'remarks' => 'Test deduction using observer'
    ]);
    
    echo "✅ Log created successfully!\n";
    echo "   - Employee ID: {$log->employee_id}\n";
    echo "   - Type: {$log->type}\n";
    echo "   - Points Deducted: {$log->points_deducted}\n";
    echo "   - Balance Before: {$log->balance_before}\n";
    echo "   - Balance After: {$log->balance_after}\n";
    echo "   - Remarks: {$log->remarks}\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
}

// Example 3: Testing insufficient balance scenario
echo "3. Testing insufficient balance scenario:\n";

try {
    // Try to deduct more than available
    $log = LeaveCreditLog::createWithBalanceCalculation(
        employeeId: $employeeId,
        type: 'SL',
        pointsDeducted: 999.0, // Way more than available
        remarks: 'This should fail'
    );
    
    echo "❌ This should not have succeeded!\n\n";
    
} catch (Exception $e) {
    echo "✅ Expected error caught: " . $e->getMessage() . "\n\n";
}

// Example 4: Check current balances
echo "4. Current leave credit balances:\n";

$leaveCredit = LeaveCredit::where('employee_id', $employeeId)->first();
if ($leaveCredit) {
    echo "   - SL Balance: {$leaveCredit->sl_balance}\n";
    echo "   - VL Balance: {$leaveCredit->vl_balance}\n";
    echo "   - Last Updated: {$leaveCredit->last_updated}\n\n";
} else {
    echo "   - No leave credit record found for employee {$employeeId}\n\n";
}

// Example 5: List recent logs
echo "5. Recent leave credit logs:\n";

$recentLogs = LeaveCreditLog::where('employee_id', $employeeId)
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

foreach ($recentLogs as $log) {
    echo "   - {$log->created_at->format('Y-m-d H:i:s')} | {$log->type} | {$log->points_deducted} | Before: {$log->balance_before} | After: {$log->balance_after}\n";
}

echo "\n=== Test Complete ===\n";

/**
 * To run this test:
 * 
 * 1. In Laravel tinker:
 *    php artisan tinker
 *    include 'test_leave_credit_balance.php';
 * 
 * 2. Or create a test route:
 *    Route::get('/test-leave-credits', function() {
 *        include 'test_leave_credit_balance.php';
 *        return 'Test completed - check the output above';
 *    });
 * 
 * 3. Or run as a console command:
 *    php artisan make:command TestLeaveCredits
 *    // Then copy this code into the command
 */
































