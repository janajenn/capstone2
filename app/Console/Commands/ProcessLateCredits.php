<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LeaveCreditService;

class ProcessLateCredits extends Command
{
    protected $signature = 'late-credits:process {--date= : Specific date to process (Y-m-d)} {--all : Process all historical data}';
    protected $description = 'Process late credits from attendance logs';

    public function handle()
    {
        $service = new LeaveCreditService();
        
        if ($this->option('date')) {
            $result = $service->processLateCreditsForAllEmployees($this->option('date'));
        } elseif ($this->option('all')) {
            $result = $service->processLateCreditsForDateRange('2020-01-01', now()->format('Y-m-d'));
        } else {
            $result = $service->processLateCreditsForRecentImports();
        }

        if ($result['success']) {
            $this->info('✅ ' . $result['message']);
            $this->info("📊 Processed: {$result['processed_count']}, Failed: {$result['failed_count']}");
        } else {
            $this->error('❌ ' . $result['message']);
        }
    }
}