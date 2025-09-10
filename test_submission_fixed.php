<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\LeaveCredit;
use App\Services\CreditConversionService;

echo "Testing Credit Conversion Submission with Updated Logic...\n";

// Get the first employee with leave credits
$leaveCredit = LeaveCredit::first();

if (!$leaveCredit) {
    echo "No leave credit records found!\n";
    exit;
}

echo "Found leave credit record for employee ID: {$leaveCredit->employee_id}\n";
echo "SL Balance: {$leaveCredit->sl_balance}\n";
echo "VL Balance: {$leaveCredit->vl_balance}\n";

$service = new CreditConversionService();

// Test eligibility with updated logic (more than 15 days individually)
echo "\n=== Testing Eligibility (Updated Logic) ===\n";
$slEligibility = $service->checkEligibility($leaveCredit->employee_id, 'SL');
print_r($slEligibility);

$vlEligibility = $service->checkEligibility($leaveCredit->employee_id, 'VL');
print_r($vlEligibility);

// Since the user doesn't have enough credits, let's add some to test
echo "\n=== Adding Credits for Testing ===\n";
$leaveCredit->sl_balance = 20.0; // More than 15
$leaveCredit->vl_balance = 25.0; // More than 15
$leaveCredit->save();

echo "Updated SL Balance: {$leaveCredit->sl_balance}\n";
echo "Updated VL Balance: {$leaveCredit->vl_balance}\n";

// Test eligibility again
echo "\n=== Testing Eligibility After Adding Credits ===\n";
$slEligibility = $service->checkEligibility($leaveCredit->employee_id, 'SL');
print_r($slEligibility);

$vlEligibility = $service->checkEligibility($leaveCredit->employee_id, 'VL');
print_r($vlEligibility);

// Test submission if eligible
if ($slEligibility['eligible']) {
    echo "\n=== Testing SL Submission ===\n";
    try {
        $conversion = $service->requestConversion(
            $leaveCredit->employee_id,
            'SL',
            2.0,
            'Test submission with updated logic'
        );
        echo "✅ Submission successful! Conversion ID: {$conversion->conversion_id}\n";
        echo "Status: {$conversion->status}\n";
        echo "Credits Requested: {$conversion->credits_requested}\n";
        echo "Equivalent Cash: {$conversion->equivalent_cash}\n";
        
    } catch (Exception $e) {
        echo "❌ Submission failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n❌ SL not eligible: {$slEligibility['reason']}\n";
}

// Reset the credits back to original values
echo "\n=== Resetting Credits to Original Values ===\n";
$leaveCredit->sl_balance = 9.25;
$leaveCredit->vl_balance = 12.50;
$leaveCredit->save();

echo "Reset SL Balance: {$leaveCredit->sl_balance}\n";
echo "Reset VL Balance: {$leaveCredit->vl_balance}\n";
