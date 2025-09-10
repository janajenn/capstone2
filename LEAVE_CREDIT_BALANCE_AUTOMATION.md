# Leave Credit Balance Automation

This document explains how the automatic population of `balance_before` and `balance_after` works in the leave credit logs system.

## Overview

The system automatically populates `balance_before` and `balance_after` fields in the `leave_credit_logs` table whenever leave credits are deducted. This ensures accurate tracking of leave credit balances over time.

## How It Works

### 1. Model Observer (Automatic)
The `LeaveCreditLogObserver` automatically handles balance calculation when creating leave credit logs:

- **Before Creation**: Calculates `balance_before` from current leave credits
- **After Creation**: Updates the `leave_credits` table with the new balance
- **Automatic**: Works for any `LeaveCreditLog::create()` call

### 2. Static Method (Manual)
The `LeaveCreditLog::createWithBalanceCalculation()` method provides a one-step solution:

- Validates sufficient balance
- Deducts from `leave_credits` table
- Creates log with both balances populated
- Atomic operation (all or nothing)

### 3. Enhanced Service
The `LeaveCreditService` has been updated to use the new balance calculation logic.

## Usage Examples

### Method 1: Using the Static Method (Recommended)

```php
use App\Models\LeaveCreditLog;

// Deduct 2.5 days of SL leave for employee 123
$log = LeaveCreditLog::createWithBalanceCalculation(
    employeeId: 123,
    type: 'SL',
    pointsDeducted: 2.5,
    remarks: 'Leave request #456 approved',
    date: now()
);

// The log will have:
// - balance_before: 10.0 (current SL balance)
// - balance_after: 7.5 (10.0 - 2.5)
// - leave_credits table updated automatically
```

### Method 2: Using Model Observer (Automatic)

```php
use App\Models\LeaveCreditLog;

// Create a log entry - balances will be auto-populated
$log = LeaveCreditLog::create([
    'employee_id' => 123,
    'type' => 'VL',
    'date' => now(),
    'year' => now()->year,
    'month' => now()->month,
    'points_deducted' => 1.0,
    'remarks' => 'Vacation leave approved'
]);

// balance_before and balance_after will be automatically calculated
// leave_credits table will be updated automatically
```

### Method 3: Manual Balance Calculation

```php
use App\Models\LeaveCredit;
use App\Models\LeaveCreditLog;

// Get current balance
$leaveCredit = LeaveCredit::getOrCreateForEmployee(123);
$balanceBefore = $leaveCredit->getBalanceForType('SL');

// Calculate new balance
$pointsDeducted = 2.0;
$balanceAfter = $balanceBefore - $pointsDeducted;

// Create log with manual values
$log = LeaveCreditLog::create([
    'employee_id' => 123,
    'type' => 'SL',
    'date' => now(),
    'year' => now()->year,
    'month' => now()->month,
    'points_deducted' => $pointsDeducted,
    'balance_before' => $balanceBefore,
    'balance_after' => $balanceAfter,
    'remarks' => 'Manual deduction'
]);

// Update leave credits table
$leaveCredit->deductBalance('SL', $pointsDeducted);
```

## Database Schema

### leave_credit_logs table
```sql
- id (primary key)
- employee_id (foreign key to employees)
- type ('SL' or 'VL')
- date (date of deduction)
- year (year of deduction)
- month (month of deduction)
- points_deducted (decimal 5,2)
- balance_before (decimal 5,2) -- NEW
- balance_after (decimal 5,2)
- remarks (text, nullable)
- created_at, updated_at
```

### leave_credits table
```sql
- id (primary key)
- employee_id (unique, foreign key to employees)
- sl_balance (decimal 5,2)
- vl_balance (decimal 5,2)
- last_updated (timestamp)
- remarks (text, nullable)
- created_at, updated_at
```

## Key Features

### 1. Automatic Balance Calculation
- `balance_before`: Retrieved from `leave_credits` table before deduction
- `balance_after`: Calculated as `balance_before - points_deducted`

### 2. Real-time Updates
- `leave_credits` table is updated immediately after log creation
- Ensures data consistency between logs and current balances

### 3. Validation
- Checks for sufficient balance before allowing deduction
- Throws exceptions for insufficient funds

### 4. Error Handling
- Comprehensive logging for debugging
- Graceful error handling to prevent data corruption

### 5. Flexibility
- Multiple ways to create logs (automatic, manual, static method)
- Backward compatible with existing code

## Error Scenarios

### Insufficient Balance
```php
try {
    $log = LeaveCreditLog::createWithBalanceCalculation(
        employeeId: 123,
        type: 'SL',
        pointsDeducted: 15.0, // More than available
        remarks: 'Leave request'
    );
} catch (\Exception $e) {
    // Will throw: "Insufficient SL balance. Available: 10.0, Required: 15.0"
}
```

### Missing Leave Credit Record
```php
// The system will automatically create a leave credit record
// with 0 balance if one doesn't exist
$log = LeaveCreditLog::createWithBalanceCalculation(
    employeeId: 999, // New employee without leave credits
    type: 'SL',
    pointsDeducted: 1.0,
    remarks: 'First leave'
);
```

## Best Practices

1. **Use the static method** for new implementations
2. **Let the observer handle** existing code automatically
3. **Always validate** sufficient balance before deduction
4. **Use transactions** for complex operations
5. **Monitor logs** for any balance calculation errors

## Testing

To test the implementation:

```php
// Test automatic balance calculation
$log = LeaveCreditLog::createWithBalanceCalculation(
    employeeId: 1,
    type: 'SL',
    pointsDeducted: 1.0,
    remarks: 'Test deduction'
);

// Verify balances are populated
assert($log->balance_before > 0);
assert($log->balance_after === $log->balance_before - 1.0);

// Verify leave_credits table is updated
$leaveCredit = LeaveCredit::where('employee_id', 1)->first();
assert($leaveCredit->sl_balance === $log->balance_after);
```

## Migration Notes

The system is backward compatible. Existing code will continue to work, and the observer will automatically populate missing balance fields for new entries.




