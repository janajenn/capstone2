<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CreditConversion;
use App\Models\LeaveCredit;
use App\Services\CreditConversionService;

echo "Testing Credit Conversion Submission...\n";

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

// Test eligibility
echo "\n=== Testing Eligibility ===\n";
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
            'Test submission'
        );
        echo "✅ Submission successful! Conversion ID: {$conversion->conversion_id}\n";
        
        // Check if it was saved in database
        $savedConversion = CreditConversion::find($conversion->conversion_id);
        if ($savedConversion) {
            echo "✅ Record found in database\n";
            echo "Status: {$savedConversion->status}\n";
            echo "Credits Requested: {$savedConversion->credits_requested}\n";
        } else {
            echo "❌ Record not found in database\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Submission failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n❌ SL not eligible: {$slEligibility['reason']}\n";
}

if ($vlEligibility['eligible']) {
    echo "\n=== Testing VL Submission ===\n";
    try {
        $conversion = $service->requestConversion(
            $leaveCredit->employee_id,
            'VL',
            2.0,
            'Test submission'
        );
        echo "✅ Submission successful! Conversion ID: {$conversion->conversion_id}\n";
        
        // Check if it was saved in database
        $savedConversion = CreditConversion::find($conversion->conversion_id);
        if ($savedConversion) {
            echo "✅ Record found in database\n";
            echo "Status: {$savedConversion->status}\n";
            echo "Credits Requested: {$savedConversion->credits_requested}\n";
        } else {
            echo "❌ Record not found in database\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Submission failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "\n❌ VL not eligible: {$vlEligibility['reason']}\n";
}

echo "\n=== Current Credit Conversions in Database ===\n";
$conversions = CreditConversion::where('employee_id', $leaveCredit->employee_id)->get();
echo "Total conversions: " . $conversions->count() . "\n";
foreach ($conversions as $conv) {
    echo "ID: {$conv->conversion_id}, Type: {$conv->leave_type}, Status: {$conv->status}, Credits: {$conv->credits_requested}\n";
}
