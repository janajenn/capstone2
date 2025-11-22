<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // FOR TESTING - Run every minute
        $schedule->command('leave:daily-earn')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->appendOutputTo(storage_path('logs/leave-credits.log'));

        // //FOR PRODUCTION - Run daily at midnight
        // $schedule->command('leave:daily-earn')
        //          ->dailyAt('00:00')
        //          ->timezone('Asia/Manila')
        //          ->withoutOverlapping()
        //          ->appendOutputTo(storage_path('logs/leave-credits.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}