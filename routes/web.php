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



// Group all role-based dashboards under auth middleware
Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::post('/leave-requests/{id}/approve', [AdminController::class, 'approve'])->name('admin.leave-requests.approve');
    Route::post('/leave-requests/{id}/reject', [AdminController::class, 'reject'])->name('admin.leave-requests.reject');
    Route::get('/updated-requests', [AdminController::class, 'getUpdatedRequests'])->name('admin.updated-requests');
});




    Route::middleware(['auth'])->group(function () {
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

    Route::middleware(['auth', 'role:dept_head'])->group(function () {
    Route::get('/dept-head/dashboard', [DeptHeadController::class, 'dashboard'])->name('dept_head.dashboard');
    Route::post('/dept-head/leave-requests/{id}/approve', [DeptHeadController::class, 'approve'])->name('dept_head.approve');
    Route::post('/dept-head/leave-requests/{id}/reject', [DeptHeadController::class, 'reject'])->name('dept_head.reject');
    Route::get('/dept-head/updated-requests', [DeptHeadController::class, 'getUpdatedRequests']);
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



    Route::middleware(['auth', 'role:employee'])->group(function () {
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
    });

require __DIR__.'/auth.php';
