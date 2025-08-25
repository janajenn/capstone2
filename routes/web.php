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


    // leave credits side
     Route::get('/hr/leave-credits', [HRController::class, 'leaveCredits'])->name('hr.leave-credits');

     Route::put('/leave-credits/{employee}', [HRController::class, 'update'])->name('hr.leave-credits.update');


     Route::post('/hr/leave-credits/add-monthly', [HRController::class, 'addMonthlyCredits'])->name('hr.leave-credits.monthly-add');


     //leave types side
     Route::get('/hr/leave-types', [HRController::class, 'leaveTypes'])->name('hr.leave-types');
    Route::post('/hr/leave-types', [HRController::class, 'storeLeaveType'])->name('hr.leave-types.store');
    Route::put('/hr/leave-types/{leaveType}', [HRController::class, 'updateLeaveType'])->name('hr.leave-types.update');
    Route::delete('/hr/leave-types/{leaveType}', [HRController::class, 'deleteLeaveType'])->name('hr.leave-types.delete');





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
    });

require __DIR__.'/auth.php';
