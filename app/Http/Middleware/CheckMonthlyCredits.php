<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;
use App\Models\MonthlyCreditLog;

class CheckMonthlyCredits
{
    public function handle(Request $request, Closure $next): Response
    {
        // Only check for HR routes
        if ($request->is('hr/*') || $request->is('hr')) {
            $now = Carbon::now();
            $year = $now->year;
            $month = $now->month;
            
            // Check if it's the 30th and credits haven't been added
            if ($now->day >= 30) {
                $alreadyCredited = MonthlyCreditLog::where('year', $year)
                    ->where('month', $month)
                    ->exists();
                
                if (!$alreadyCredited) {
                    // Store in session to show modal
                    session()->flash('show_credit_warning', true);
                    session()->flash('warning_month', $now->format('F'));
                    session()->flash('warning_year', $year);
                }
            }
        }

        return $next($request);
    }
}