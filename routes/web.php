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
use App\Http\Controllers\HR\AttendanceImportController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Employee\AttendanceCorrectionController;




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


Route::get('/debug-routes-check', function() {
    return response()->json([
        'status' => 'ok',
        'message' => 'Debug route is working',
        'timestamp' => now()->toDateTimeString()
    ]);
});



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
        
    // Leave Requests Management
        Route::get('/leave-requests', [AdminController::class, 'leaveRequests'])->name('admin.leave-requests.index');
        Route::get('/leave-requests/{id}', [AdminController::class, 'showLeaveRequest'])->name('admin.leave-requests.show');
        Route::post('/leave-requests/{id}/approve', [AdminController::class, 'approve'])->name('admin.leave-requests.approve');
        Route::post('/leave-requests/{id}/reject', [AdminController::class, 'reject'])->name('admin.leave-requests.reject');
        Route::post('/leave-requests/{id}/recall', [AdminController::class, 'recallLeaveRequest'])->name('admin.recall-leave');
        
        // Filtered Leave Requests (Clickable Cards)
        Route::get('/leave-requests/fully-approved', [AdminController::class, 'fullyApprovedRequests'])->name('admin.leave-requests.fully-approved');
        Route::get('/leave-requests/rejected', [AdminController::class, 'rejectedRequests'])->name('admin.leave-requests.rejected');
        
        // Employees Management (Clickable Cards)
        Route::get('/employees', [AdminController::class, 'employeesIndex'])->name('admin.employees.index');
        Route::get('/employees/active', [AdminController::class, 'activeEmployees'])->name('admin.employees.active');
        Route::get('/employees/inactive', [AdminController::class, 'inactiveEmployees'])->name('admin.employees.inactive');
        
        // Users Management (Clickable Cards)
        Route::get('/users', [AdminController::class, 'usersIndex'])->name('admin.users.index');
        Route::get('/users/hr', [AdminController::class, 'hrUsers'])->name('admin.users.hr');
        
        // Departments Management (Clickable Cards)
        Route::get('/departments', [AdminController::class, 'departmentsIndex'])->name('admin.departments.index');
        
        // Delegation Management
        Route::get('/delegation', [AdminController::class, 'delegationIndex'])->name('admin.delegation');
        Route::post('/delegate-approval', [AdminController::class, 'delegateApproval'])->name('admin.delegate-approval');
        Route::post('/end-delegation/{id}', [AdminController::class, 'endDelegation'])->name('admin.end-delegation');
        Route::post('/cancel-delegation/{id}', [AdminController::class, 'cancelDelegation'])->name('admin.cancel-delegation');
        
        // Calendar
        Route::get('/leave-calendar', [AdminController::class, 'leaveCalendar'])->name('admin.leave-calendar');
        
        // Real-time Updates
        Route::get('/updated-requests', [AdminController::class, 'getUpdatedRequests'])->name('admin.updated-requests');
        

        // ✅ PUT THIS BEFORE the generic /notifications route
Route::get('/notifications/{id}/click', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'handleClick'])->name('admin.notifications.click');

        // Notification Routes
        Route::get('/notifications', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'index'])->name('admin.notifications');
        Route::post('/notifications/{id}/mark-read', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'markAsRead'])->name('admin.notifications.mark-read');
        Route::post('/notifications/mark-all-read', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'markAllAsRead'])->name('admin.notifications.mark-all-read');
        Route::get('/notifications/unread-count', [\App\Http\Controllers\Admin\AdminNotificationController::class, 'getUnreadCount'])->name('admin.notifications.unread-count');
        // ✅ ADD THIS: Notification Click Route for Redirecting


        Route::get('/debug-routes', function() {
            $routes = collect(Route::getRoutes())->map(function ($route) {
                return [
                    'method' => implode('|', $route->methods()),
                    'uri' => $route->uri(),
                    'name' => $route->getName(),
                    'action' => $route->getActionName(),
                ];
            })->filter(function ($route) {
                return str_contains($route['uri'], 'admin');
            });
            
            return $routes;
        });


        // Admin Credit Conversion Routes
Route::get('/admin/credit-conversions', [AdminController::class, 'creditConversions'])->name('admin.credit-conversions');
Route::get('/admin/credit-conversions/{id}', [AdminController::class, 'showCreditConversion'])->name('admin.credit-conversions.show');
Route::post('/admin/credit-conversions/{id}/approve', [AdminController::class, 'approveCreditConversion'])->name('admin.credit-conversions.approve');
Route::post('/admin/credit-conversions/{id}/reject', [AdminController::class, 'rejectCreditConversion'])->name('admin.credit-conversions.reject');
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
Route::get('/hr/departments/{id}/employees', [HRController::class, 'showEmployees'])->name('hr.departments.employees');

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
// Add this route to your web.php
Route::get('/hr/credit-conversions/{id}/form', [HRController::class, 'showMonetizationForm'])->name('hr.credit-conversions.form');

    // Attendance Import Routes (HR)
    
    // Attendance Import Routes
    Route::prefix('hr/attendance')->group(function () {
        Route::get('/import', [AttendanceImportController::class, 'index'])->name('hr.attendance.import');
        Route::post('/visual-preview', [AttendanceImportController::class, 'visualPreview'])->name('hr.attendance.visual-preview');
        Route::post('/preview', [AttendanceImportController::class, 'preview'])->name('hr.attendance.preview');
        Route::post('/process-import', [AttendanceImportController::class, 'processImport'])->name('hr.attendance.process-import');
        Route::get('/template', [AttendanceImportController::class, 'downloadTemplate'])->name('hr.attendance.template');
        
        // Existing routes...
        Route::get('/logs', [AttendanceImportController::class, 'attendanceLogs'])->name('hr.attendance.logs');
        Route::get('/logs/api', [AttendanceImportController::class, 'getAttendanceLogs'])->name('hr.attendance.logs.api');
        Route::get('/logs/employee/{employeeId}', [AttendanceImportController::class, 'viewEmployeeLogs'])->name('hr.attendance.logs.employee');
        Route::delete('/logs/{id}', [AttendanceImportController::class, 'deleteLog'])->name('hr.attendance.logs.delete');
        Route::post('/logs/bulk-delete', [AttendanceImportController::class, 'bulkDelete'])->name('hr.attendance.logs.bulk-delete');


        Route::get('/attendance-corrections', [AttendanceImportController::class, 'correctionRequests'])->name('hr.attendance-corrections');
    Route::get('/attendance-corrections/{id}', [AttendanceImportController::class, 'showCorrection'])->name('hr.attendance-corrections.show');
    Route::post('/attendance-corrections/{id}/approve', [AttendanceImportController::class, 'approveCorrection'])->name('hr.attendance-corrections.approve');
    Route::post('/attendance-corrections/{id}/reject', [AttendanceImportController::class, 'rejectCorrection'])->name('hr.attendance-corrections.reject');
    Route::get('/attendance-corrections/{id}/view-proof', [AttendanceImportController::class, 'viewProofImage'])
    ->name('hr.attendance-corrections.view-proof');
    Route::post('/attendance/{id}/update-field', [AttendanceImportController::class, 'updateAttendanceField'])
    ->name('hr.attendance.update-field');
        
        // ✅ ADD THE COMPARE ROUTE INSIDE THE PREFIX GROUP
 Route::get('/logs/employee/{employeeId}/compare', 
[AttendanceImportController::class, 'compareWithRawLogs']
)->name('hr.attendance.logs.compare');








    });




//holidays

Route::get('/holidays', [HRController::class, 'holidays'])->name('hr.holidays');
Route::post('/holidays', [HRController::class, 'storeHoliday'])->name('hr.holidays.store');
Route::put('/holidays/{holiday}', [HRController::class, 'updateHoliday'])->name('hr.holidays.update');
Route::delete('/holidays/{holiday}', [HRController::class, 'destroyHoliday'])->name('hr.holidays.destroy');

// Public route for holiday dates (for date picker)
Route::get('/holiday-dates', [HRController::class, 'getHolidayDates'])->name('holiday.dates');


    // HR Notification Routes - FIXED
Route::get('/hr/notifications', [\App\Http\Controllers\HR\HRNotificationController::class, 'index'])->name('hr.notifications');
Route::post('/hr/notifications/{id}/mark-read', [\App\Http\Controllers\HR\HRNotificationController::class, 'markAsRead'])->name('hr.notifications.mark-read');
Route::post('/hr/notifications/mark-all-read', [\App\Http\Controllers\HR\HRNotificationController::class, 'markAllAsRead'])->name('hr.notifications.mark-all-read');
Route::get('/hr/notifications/unread-count', [\App\Http\Controllers\HR\HRNotificationController::class, 'getUnreadCount'])->name('hr.notifications.unread-count');
Route::get('/hr/notifications/{id}/click', [\App\Http\Controllers\HR\HRNotificationController::class, 'handleClick'])->name('hr.notifications.click'); // ADD /hr prefix





     // Leave Recordings Routes
Route::get('/hr/leave-recordings', [HRController::class, 'leaveRecordings'])->name('hr.leave-recordings');
Route::get('/hr/leave-recordings/{employee}', [HRController::class, 'showEmployeeRecordings'])->name('hr.leave-recordings.employee');
Route::put('/hr/leave-recordings/{id}/remarks', [HRController::class, 'updateRemarks'])->name('hr.leave-recordings.update-remarks');


Route::get('/hr/leave-recordings/export/department', [HRController::class, 'exportDepartmentRecordings'])
    ->name('hr.leave-recordings.export.department');
    
Route::get('/hr/leave-recordings/export/all', [HRController::class, 'exportAllRecordings'])
    ->name('hr.leave-recordings.export.all');

        Route::post('/leave-requests/generate-pdf', [HRController::class, 'generatePDF'])
        ->name('leave-requests.generate-pdf');




        Route::get('/hr/reschedule-requests', [HRController::class, 'rescheduleRequests'])->name('hr.reschedule-requests');
        Route::post('/hr/reschedule-requests/{id}/approve', [HRController::class, 'approveRescheduleRequest'])->name('hr.reschedule-requests.approve');
        Route::post('/hr/reschedule-requests/{id}/reject', [HRController::class, 'rejectRescheduleRequest'])->name('hr.reschedule-requests.reject');


Route::get('/debug/leave-deduction/{id}', [HRController::class, 'debugLeaveDeduction']);
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

    //notification routes

   // Department Head Notification Routes
Route::prefix('dept-head')->group(function () {
    Route::get('/notifications', [\App\Http\Controllers\DeptHead\DeptHeadNotificationController::class, 'index'])->name('dept-head.notifications');
    Route::post('/notifications/{id}/mark-read', [\App\Http\Controllers\DeptHead\DeptHeadNotificationController::class, 'markAsRead'])->name('dept-head.notifications.mark-read');
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\DeptHead\DeptHeadNotificationController::class, 'markAllAsRead'])->name('dept-head.notifications.mark-all-read');
    Route::get('/notifications/unread-count', [\App\Http\Controllers\DeptHead\DeptHeadNotificationController::class, 'getUnreadCount'])->name('dept-head.notifications.unread-count');
    Route::get('/notifications/{id}/click', [\App\Http\Controllers\DeptHead\DeptHeadNotificationController::class, 'handleClick'])->name('dept-head.notifications.click'); // ADD THIS LINE
});

   // Add these to your existing dept_head routes
Route::get('/dept-head/credit-conversions', [DeptHeadController::class, 'creditConversions'])->name('dept_head.credit-conversions');
Route::get('/dept-head/credit-conversions/{id}', [DeptHeadController::class, 'showCreditConversion'])->name('dept_head.credit-conversions.show');
Route::post('/dept-head/credit-conversions/{id}/approve', [DeptHeadController::class, 'approveCreditConversion'])->name('dept_head.credit-conversions.approve');
Route::post('/dept-head/credit-conversions/{id}/reject', [DeptHeadController::class, 'rejectCreditConversion'])->name('dept_head.credit-conversions.reject');
Route::get('/dept-head/credit-conversions-stats', [DeptHeadController::class, 'getCreditConversionStats'])->name('dept_head.credit-conversions.stats');

// Attendance Correction Routes for Department Head
Route::get('/dept-head/attendance-corrections', [DeptHeadController::class, 'attendanceCorrections'])->name('dept_head.attendance-corrections');
Route::get('/dept-head/attendance-corrections/{id}', [DeptHeadController::class, 'showAttendanceCorrection'])->name('dept_head.attendance-corrections.show');
Route::post('/dept-head/attendance-corrections/{id}/review', [DeptHeadController::class, 'reviewAttendanceCorrection'])->name('dept_head.attendance-corrections.review');
Route::post('/dept-head/attendance-corrections/{id}/reject', [DeptHeadController::class, 'rejectAttendanceCorrection'])->name('dept_head.attendance-corrections.reject');
Route::get('/dept-head/attendance-corrections-stats', [DeptHeadController::class, 'getAttendanceCorrectionStats'])->name('dept_head.attendance-corrections.stats');
// Department Head proof image viewing
Route::get('/dept-head/attendance-corrections/{id}/view-proof', [DeptHeadController::class, 'viewProofImage'])
    ->name('dept_head.attendance-corrections.view-proof');

     // Reschedule Requests
     Route::get('/dept-head/reschedule-requests', [DeptHeadController::class, 'rescheduleRequests'])->name('dept_head.reschedule-requests');
     Route::get('/dept-head/reschedule-requests/{id}', [DeptHeadController::class, 'showRescheduleRequest'])->name('dept_head.reschedule-requests.show');
     Route::post('/dept-head/reschedule-requests/{id}/approve', [DeptHeadController::class, 'approveRescheduleRequest'])->name('dept_head.reschedule-requests.approve');
     Route::post('/dept-head/reschedule-requests/{id}/reject', [DeptHeadController::class, 'rejectRescheduleRequest'])->name('dept_head.reschedule-requests.reject');

     Route::get('/dept-head/reschedule-requests/count', [DeptHeadController::class, 'getPendingRescheduleCount'])->name('dept_head.reschedule-requests.count');
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
// Notification Routes - FIXED VERSION
Route::get('/employee/notifications', [\App\Http\Controllers\Employee\NotificationController::class, 'index'])->name('employee.notifications');
Route::post('/employee/notifications/{id}/mark-read', [\App\Http\Controllers\Employee\NotificationController::class, 'markAsRead'])->name('employee.notifications.mark-read'); // CHANGED FROM 'read' TO 'mark-read'
Route::post('/employee/notifications/mark-all-read', [\App\Http\Controllers\Employee\NotificationController::class, 'markAllAsRead'])->name('employee.notifications.mark-all-read'); // CHANGED FROM 'read-all' TO 'mark-all-read'
Route::get('/employee/notifications/unread-count', [\App\Http\Controllers\Employee\NotificationController::class, 'getUnreadCount'])->name('employee.notifications.unread-count');
Route::get('/employee/notifications/{id}/click', [\App\Http\Controllers\Employee\NotificationController::class, 'handleClick'])->name('employee.notifications.click');
        
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

        Route::get('/leave-history', [EmployeeController::class, 'leaveHistory'])->name('employee.leave-history');
        // Leave Balances Routes
        Route::get('/employee/leave-balances', [EmployeeController::class, 'leaveBalances'])->name('employee.leave-balances');
        Route::get('/employee/check-donation-eligibility', [EmployeeController::class, 'checkDonationEligibility']);
    Route::get('/employee/eligible-recipients', [EmployeeController::class, 'getEligibleRecipients']);
    Route::post('/employee/donate-maternity-leave', [EmployeeController::class, 'donateMaternityLeave']);
    // routes/web.php - in the employee routes group

Route::post('/employee/leave-reschedule', [EmployeeController::class, 'submitRescheduleRequest'])->name('employee.leave-reschedule.submit');
        
        // Attendance Logs Routes
        Route::get('/employee/attendance-logs', [\App\Http\Controllers\Employee\AttendanceLogsController::class, 'index'])->name('employee.attendance-logs');
        // Add these to your existing employee routes group
Route::get('/employee/attendance-correction-request', [AttendanceCorrectionController::class, 'showCorrectionRequest'])->name('employee.correction-request');
Route::post('/employee/attendance-corrections', [AttendanceCorrectionController::class, 'submitCorrectionRequest'])->name('employee.corrections.submit');
Route::get('/employee/my-correction-requests', [AttendanceCorrectionController::class, 'myCorrectionRequests'])->name('employee.my-correction-requests');
Route::get('/employee/attendance-corrections/{id}/download-proof', [AttendanceCorrectionController::class, 'downloadProofImage'])->name('employee.corrections.download-proof');
// Replace the download route with this:
Route::get('/attendance-corrections/{id}/view-proof', [AttendanceCorrectionController::class, 'viewProofImage'])->name('attendance-corrections.view-proof');
        

Route::get('/employee/credits-log', [EmployeeController::class, 'creditsLog'])->name('employee.credits-log');
        // Debug route to check attendance logs
        Route::get('/employee/debug-attendance', function() {
            $user = auth()->user();
            $employee = \App\Models\Employee::where('employee_id', $user->employee_id)->first();
            
            if (!$employee) {
                return response()->json(['error' => 'Employee not found']);
            }
            
            $logs = \App\Models\AttendanceLog::where('employee_id', $employee->employee_id)->get();
            
            return response()->json([
                'employee_id' => $employee->employee_id,
                'total_logs' => $logs->count(),
                'logs' => $logs->take(5)->map(function($log) {
                    return [
                        'id' => $log->id,
                        'work_date' => $log->work_date,
                        'time_in' => $log->time_in,
                        'time_out' => $log->time_out,
                        'absent' => $log->absent
                    ];
                })
            ]);
        })->name('employee.debug-attendance');
    });
});

require __DIR__.'/auth.php';    
