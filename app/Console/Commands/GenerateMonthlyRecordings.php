<?php

namespace App\Console\Commands;

use App\Services\LeaveRecordingService;
use Illuminate\Console\Command;

class GenerateMonthlyRecordings extends Command
{
    protected $signature = 'recordings:generate {year? : The year to generate (default current)}';
    protected $description = 'Generate monthly leave recordings for all employees for a given year';

    protected $leaveRecordingService;

    public function __construct(LeaveRecordingService $leaveRecordingService)
    {
        parent::__construct();
        $this->leaveRecordingService = $leaveRecordingService;
    }

    public function handle()
    {
        $year = $this->argument('year') ?? now()->year;
        $this->info("Generating monthly recordings for year {$year}...");

        $this->leaveRecordingService->generateForAllEmployees($year);

        $this->info('Done!');
    }
}