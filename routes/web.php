<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HR\HRController;
use App\Models\User;
use App\Models\LeaveCredit;
use App\Http\Controllers\Employee\EmployeeController;
use App\Http\Controllers\DeptHead\DeptHeadController;

use App\Http\Controllers\Admin\AdminController;



/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('WelcomePage', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Apply employee.status middleware to ALL auth routes
Route::middleware(['auth', 'verified', 'employee.status'])->group(function () {

// Group all role-based dashboards under auth middleware
Route::prefix('admin')->middleware(['role:admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::post('/leave-requests/{id}/approve', [AdminController::class, 'approve'])->name('admin.leave-requests.approve');
    Route::post('/leave-requests/{id}/reject', [AdminController::class, 'reject'])->name('admin.leave-requests.reject');
    Route::get('/updated-requests', [AdminController::class, 'getUpdatedRequests'])->name('admin.updated-requests');
    
    Route::get('/delegation', [AdminController::class, 'delegationIndex'])->name('admin.delegation');
    Route::post('/delegate-approval', [AdminController::class, 'delegateApproval'])->name('admin.delegate-approval');
    Route::post('/end-delegation/{id}', [AdminController::class, 'endDelegation'])->name('admin.end-delegation');
    Route::post('/cancel-delegation/{id}', [AdminController::class, 'cancelDelegation'])->name('admin.cancel-delegation');
    Route::get('/leave-calendar', [AdminController::class, 'leaveCalendar'])->name('admin.leave-calendar');

    Route::post('/admin/leave-requests/{id}/recall', [AdminController::class, 'recallLeaveRequest'])->name('admin.recall-leave');

    Route::get('/leave-requests', [AdminController::class, 'leaveRequests'])
    ->name('admin.leave-requests.index');

    
});




    Route::middleware(['role:hr'])->group(function () {
    // HR Dashboard
    Route::get('/hr/dashboard', [HRController::class, 'dashboard'])->name('hr.dashboard');

    //employees side
    Route::get('/hr/employees', [HRController::class, 'employees'])->name('hr.employees');
    Route::post('/hr/employees', [HRController::class, 'storeEmployee'])->name('hr.employees.store');

    Route::get('/hr/employees/{employee}', [HRController::class, 'show'])->name('hr.employees.show');
    // Add this route to your web.php file
// Add these routes to your web.php file
Route::get('/hr/employees/{employee}/edit', [\App\Http\Controllers\HR\HRController::class, 'editEmployee'])->name('hr.employees.edit');
Route::put('/hr/employees/{employee}', [\App\Http\Controllers\HR\HRController::class, 'updateEmployee'])->name('hr.employees.update');

    // leave credits side
     Route::get('/hr/leave-credits', [HRController::class, 'leaveCredits'])->name('hr.leave-credits');
     // Add this route to your HR routes section
Route::get('/hr/leave-credits/{employee}', [HRController::class, 'showLeaveCredit'])->name('hr.leave-credits.show');

     Route::put('/leave-credits/{employee}', [HRController::class, 'update'])->name('hr.leave-credits.update');


     Route::post('/hr/leave-credits/add-monthly', [HRController::class, 'addMonthlyCredits'])->name('hr.leave-credits.monthly-add');


     //leave types side
     Route::get('/hr/leave-types', [HRController::class, 'leaveTypes'])->name('hr.leave-types');
    Route::post('/hr/leave-types', [HRController::class, 'storeLeaveType'])->name('hr.leave-types.store');
    Route::put('/hr/leave-types/{leaveType}', [HRController::class, 'updateLeaveType'])->name('hr.leave-types.update');
    Route::delete('/hr/leave-types/{leaveType}', [HRController::class, 'deleteLeaveType'])->name('hr.leave-types.delete');

    //calendar side
   // routes/web.php
    Route::get('/hr/leave-calendar', [HRController::class, 'leaveCalendar'])->name('hr.leave-calendar');





// Department Routes (HR)
Route::get('/hr/departments', [HRController::class, 'departments'])->name('hr.departments');
Route::post('/hr/departments', [HRController::class, 'storeDepartment'])->name('hr.departments.store');
Route::put('/hr/departments/{id}', [HRController::class, 'updateDepartment'])->name('hr.departments.update');
Route::delete('/hr/departments/{id}', [HRController::class, 'deleteDepartment'])->name('hr.departments.delete');

// Leave Request Approval Routes (HR)
Route::get('/hr/leave-requests', [HRController::class, 'leaveRequests'])->name('hr.leave-requests');
Route::get('/hr/leave-requests/{id}', [HRController::class, 'showLeaveRequest'])->name('hr.leave-requests.show');
Route::post('/hr/leave-requests/{id}/approve', [HRController::class, 'approveLeaveRequest'])->name('hr.leave-requests.approve');
Route::post('/hr/leave-requests/{id}/reject', [HRController::class, 'rejectLeaveRequest'])->name('hr.leave-requests.reject');
Route::post('/hr/leave-requests/bulk-action', [HRController::class, 'bulkAction'])->name('hr.leave-requests.bulk-action');

// Leave Recall Request Routes (HR)
// Route::get('/hr/recall-requests', [HRController::class, 'recallRequests'])->name('hr.recall-requests');
// Route::post('/hr/recall-requests/{id}/approve', [HRController::class, 'approveRecallRequest'])->name('hr.recall-requests.approve');
// Route::post('/hr/recall-requests/{id}/reject', [HRController::class, 'rejectRecallRequest'])->name('hr.recall-requests.reject');

// Leave Form Demo Route (for testing)
Route::get('/leave-form-demo', function() {
    return Inertia::render('LeaveFormDemo');
})->name('leave-form-demo');

// Credit Conversion Management Routes (HR)
Route::get('/hr/credit-conversions', [HRController::class, 'creditConversions'])->name('hr.credit-conversions');
Route::get('/hr/credit-conversions/{id}', [HRController::class, 'showCreditConversion'])->name('hr.credit-conversions.show');
Route::post('/hr/credit-conversions/{id}/approve', [HRController::class, 'approveCreditConversion'])->name('hr.credit-conversions.approve');
Route::post('/hr/credit-conversions/{id}/reject', [HRController::class, 'rejectCreditConversion'])->name('hr.credit-conversions.reject');


});






    // // Department Head Routes

    Route::middleware(['role:dept_head'])->group(function () {
        Route::get('/dept-head/dashboard', [DeptHeadController::class, 'dashboard'])->name('dept_head.dashboard');
        Route::post('/dept-head/leave-requests/{id}/approve', [DeptHeadController::class, 'approve'])->name('dept_head.approve');
        Route::post('/dept-head/leave-requests/{id}/reject', [DeptHeadController::class, 'reject'])->name('dept_head.reject');
        Route::get('/dept-head/updated-requests', [DeptHeadController::class, 'getUpdatedRequests']) ;
        Route::get('/dept-head/employees', [DeptHeadController::class, 'employees'])->name('dept_head.employees');
        Route::delete('/dept-head/employees/{employee}/remove', [DeptHeadController::class, 'removeFromDepartment'])->name('dept_head.employees.remove');
        Route::get('/dept-head/leave-calendar', [DeptHeadController::class, 'leaveCalendar'])->name('dept_head.leave-calendar');
        // Leave Recall Request Routes (Dept Head)
        // Route::get('/dept-head/recall-requests', [DeptHeadController::class, 'recallRequests'])->name('dept_head.recall-requests');
        // Route::post('/dept-head/recall-requests/{id}/approve', [DeptHeadController::class, 'approveRecallRequest'])->name('dept_head.recall-requests.approve');
        // Route::post('/dept-head/recall-requests/{id}/reject', [DeptHeadController::class, 'rejectRecallRequest'])->name('dept_head.recall-requests.reject');

        Route::get('/dept-head/leave-requests', [DeptHeadController::class, 'leaveRequests'])->name('dept_head.leave-requests');
        Route::get('/dept-head/leave-requests/{id}', [DeptHeadController::class, 'showLeaveRequest'])->name('dept_head.leave-requests.show');
        Route::post('/dept-head/leave-requests/{id}/approve', [DeptHeadController::class, 'approveLeaveRequest'])->name('dept_head.leave-requests.approve');
        Route::post('/dept-head/leave-requests/{id}/reject', [DeptHeadController::class, 'rejectLeaveRequest'])->name('dept_head.leave-requests.reject');
        
        // routes/web.php
    Route::get('/dept-head/chart-data', [DeptHeadController::class, 'getChartDataByYear'])->name('dept_head.chart-data');
        
    });
    //Route::middleware(['auth', 'role:dept_head'])->group(function () {
    //    Route::get('/dept-head/dashboard', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'dashboard']);
    //     Route::get('/dept-head/leave-requests', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'leaveRequests'])->name('dept_head.leave-requests');
    //     Route::get('/dept-head/leave-requests/{id}', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'showLeaveRequest'])->name('dept_head.leave-requests.show');
    //     Route::post('/dept-head/leave-requests/{id}/approve', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'approveLeaveRequest'])->name('dept_head.leave-requests.approve');
    //     Route::post('/dept-head/leave-requests/{id}/reject', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'rejectLeaveRequest'])->name('dept_head.leave-requests.reject');
    //     Route::post('/dept-head/leave-requests/bulk-action', [App\Http\Controllers\DeptHead\DeptHeadController::class, 'bulkAction'])->name('dept_head.leave-requests.bulk-action');
    // });




    // Employee Dashboard
    // routes/web.php



    Route::middleware(['role:employee,hr,dept_head,admin'])->group(function () {
        Route::get('/employee/dashboard', [EmployeeController::class, 'dashboard'])->name('employee.dashboard');

        Route::get('/employee/leave', [EmployeeController::class, 'showLeaveRequest'])->name('employee.leave.request');

        Route::post('/employee/leave', [EmployeeController::class, 'submitLeaveRequest'])->name('employee.leave.submit');

        Route::get('/employee/my-leave-requests', [EmployeeController::class, 'myLeaveRequests'])->name('employee.my-leave-requests');

        Route::get('/employee/leave-calendar', [EmployeeController::class, 'leaveCalendar'])->name('employee.leave-calendar');

        // Credit Conversion Routes
        Route::get('/employee/credit-conversion', [EmployeeController::class, 'showCreditConversion'])->name('employee.credit-conversion');
        Route::post('/employee/credit-conversion', [EmployeeController::class, 'submitCreditConversion'])->name('employee.credit-conversion.submit');
        Route::get('/employee/credit-conversions', [EmployeeController::class, 'myCreditConversions'])->name('employee.credit-conversions');
        
        // Notification Routes
        Route::get('/employee/notifications', [\App\Http\Controllers\Employee\NotificationController::class, 'index'])->name('employee.notifications');
        Route::post('/employee/notifications/{id}/read', [\App\Http\Controllers\Employee\NotificationController::class, 'markAsRead'])->name('employee.notifications.read');
        Route::post('/employee/notifications/read-all', [\App\Http\Controllers\Employee\NotificationController::class, 'markAllAsRead'])->name('employee.notifications.read-all');
        Route::get('/employee/notifications/unread-count', [\App\Http\Controllers\Employee\NotificationController::class, 'getUnreadCount'])->name('employee.notifications.unread-count');
        
        // Debug route (remove in production)
        Route::get('/employee/debug', [EmployeeController::class, 'debugUserEmployee'])->name('employee.debug');
        
        // Debug notifications route
        Route::get('/employee/debug-notifications', [\App\Http\Controllers\Employee\NotificationController::class, 'debugNotifications'])->name('employee.debug-notifications');
        
        // Test CSRF token route
        Route::get('/employee/test-csrf', function() {
            return response()->json([
                'csrf_token' => csrf_token(),
                'session_id' => session()->getId(),
                'user_id' => auth()->id(),
                'is_authenticated' => auth()->check()
            ]);
        })->name('employee.test-csrf');
        
        // Leave Recall Routes
        // Route::get('/employee/leave-recalls', [\App\Http\Controllers\Employee\LeaveRecallController::class, 'index'])->name('employee.leave-recalls');
        // Route::post('/employee/leave-recalls', [\App\Http\Controllers\Employee\LeaveRecallController::class, 'store'])->name('employee.leave-recalls.store');
        // Route::get('/employee/leave-recalls/{leaveRecall}', [\App\Http\Controllers\Employee\LeaveRecallController::class, 'show'])->name('employee.leave-recalls.show');


        // Leave Balances Routes
        Route::get('/employee/leave-balances', [EmployeeController::class, 'leaveBalances'])->name('employee.leave-balances');
    });
});

require __DIR__.'/auth.php';    
