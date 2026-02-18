<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\LeaveCreditLog;
use App\Observers\LeaveCreditLogObserver;
use App\Models\LeaveType;
use App\Observers\LeaveTypeObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model observers
        LeaveCreditLog::observe(LeaveCreditLogObserver::class);
        LeaveType::observe(LeaveTypeObserver::class);
    }
}
