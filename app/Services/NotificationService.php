<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification for an employee
     */
    public function createNotification($employeeId, $type, $title, $message, $data = null)
    {
        // Validate employee_id exists
        if (!$employeeId) {
            Log::error('Notification creation failed: employee_id is null', [
                'type' => $type,
                'title' => $title,
                'message' => $message
            ]);
            return null;
        }

        // Verify employee exists
        $employee = Employee::where('employee_id', $employeeId)->first();
        if (!$employee) {
            Log::error('Notification creation failed: employee not found', [
                'employee_id' => $employeeId,
                'type' => $type,
                'title' => $title
            ]);
            return null;
        }

        try {
            return Notification::create([
                'employee_id' => $employeeId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data ? json_encode($data) : null,
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Notification creation failed: ' . $e->getMessage(), [
                'employee_id' => $employeeId,
                'type' => $type,
                'title' => $title
            ]);
            return null;
        }
    }

    /**
     * Create leave request notification with proper employee_id handling
     */
    public function createLeaveRequestNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null)
    {
        // Validate employee_id
        if (!$employeeId) {
            Log::error('Leave request notification failed: employee_id is null', [
                'status' => $status,
                'request_id' => $requestId,
                'leave_type' => $leaveType
            ]);
            return null;
        }

        // Map status to proper notification type and message
        $notificationData = $this->getLeaveRequestNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks);
        
        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'remarks' => $remarks,
        ];

        return $this->createNotification(
            $employeeId, 
            'leave_request', 
            $notificationData['title'], 
            $notificationData['message'], 
            $data
        );
    }

    /**
     * Get notification data based on status
     */
    private function getLeaveRequestNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks = null)
    {
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');
        
        // Handle different status types properly
        switch ($status) {
            case 'dept_head_approved':
                return [
                    'title' => 'Leave Request Approved by Department Head',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by your Department Head."
                ];
                
            case 'dept_head_rejected':
                return [
                    'title' => 'Leave Request Rejected by Department Head',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by your Department Head." . 
                                ($remarks ? " Remarks: {$remarks}" : "")
                ];
                
            case 'approved':
                return [
                    'title' => 'Leave Request Fully Approved',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been fully approved by Admin."
                ];
                
            case 'rejected':
                return [
                    'title' => 'Leave Request Rejected',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected." . 
                                ($remarks ? " Remarks: {$remarks}" : "")
                ];
                
            case 'hr_approved':
                return [
                    'title' => 'Leave Request Approved by HR',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Department Head approval."
                ];
                
            case 'hr_approved_pending_admin':
                return [
                    'title' => 'Leave Request Approved by HR',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Admin approval."
                ];

            case 'hr_approved_pending_dept_head':
                return [
                    'title' => 'Leave Request Approved by HR',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Department Head approval."
                ];
                
            case 'hr_rejected':
                return [
                    'title' => 'Leave Request Rejected by HR',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by HR." . 
                                ($remarks ? " Remarks: {$remarks}" : "")
                ];

            case 'admin_pending':
                return [
                    'title' => 'Department Head Leave Request Pending',
                    'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} by a Department Head requires your approval."
                ];

            case 'late_deduction':
                return [
                    'title' => 'VL Credits Deducted for Late Arrival',
                    'message' => $remarks ?: "Your VL credits have been deducted due to late arrival."
                ];
                
            default:
                // For any unknown status, use a generic message
                return [
                    'title' => 'Leave Request Update',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been updated. Status: {$status}"
                ];
        }
    }

    /**
     * Create credit conversion notification
     */
    public function createCreditConversionNotification($employeeId, $status, $conversionId, $leaveType, $creditsRequested, $cashEquivalent)
    {
        if (!$employeeId) {
            Log::error('Credit conversion notification failed: employee_id is null');
            return null;
        }

        $statusText = ucfirst($status);
        $title = "Credit Conversion {$statusText}";
        
        if ($status === 'approved') {
            $message = "Your request to convert {$creditsRequested} {$leaveType} credits to ₱{$cashEquivalent} has been approved.";
        } else {
            $message = "Your request to convert {$creditsRequested} {$leaveType} credits to ₱{$cashEquivalent} has been rejected.";
        }

        $data = [
            'conversion_id' => $conversionId,
            'status' => $status,
            'leave_type' => $leaveType,
            'credits_requested' => $creditsRequested,
            'cash_equivalent' => $cashEquivalent,
        ];

        return $this->createNotification($employeeId, 'credit_conversion', $title, $message, $data);
    }

    /**
     * Get unread notifications count for an employee
     */
    public function getUnreadCount($employeeId)
    {
        if (!$employeeId) {
            return 0;
        }

        return Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get notifications for an employee
     */
    public function getNotifications($employeeId, $limit = 10)
    {
        if (!$employeeId) {
            return collect();
        }

        return Notification::where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $employeeId)
    {
        if (!$employeeId) {
            Log::error('Mark as read failed: employee_id is null');
            return false;
        }

        Log::info('Attempting to mark notification as read', [
            'notification_id' => $notificationId,
            'employee_id' => $employeeId
        ]);

        $notification = Notification::where('id', $notificationId)
            ->where('employee_id', $employeeId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            Log::info('Notification marked as read successfully', [
                'notification_id' => $notificationId,
                'employee_id' => $employeeId,
                'was_read' => $notification->is_read
            ]);
            return true;
        }

        Log::warning('Notification not found for marking as read', [
            'notification_id' => $notificationId,
            'employee_id' => $employeeId
        ]);

        return false;
    }

    /**
     * Mark all notifications as read for an employee
     */
    public function markAllAsRead($employeeId)
    {
        if (!$employeeId) {
            return 0;
        }

        return Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Create leave recall notification
     */
    public function createLeaveRecallNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null)
    {
        if (!$employeeId) {
            Log::error('Leave recall notification failed: employee_id is null');
            return null;
        }

        $statusText = ucfirst($status);
        $title = "Leave Recall Request {$statusText}";
        
        if ($status === 'approved') {
            $message = "Your {$leaveType} leave recall request has been approved. Your new leave dates are from {$dateFrom} to {$dateTo}.";
        } elseif ($status === 'dept_head_approved') {
            $message = "Your {$leaveType} leave recall request has been approved by your department head and forwarded to HR for final approval.";
        } else {
            $message = "Your {$leaveType} leave recall request has been rejected.";
            if ($remarks) {
                $message .= " Reason: {$remarks}";
            }
        }

        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'remarks' => $remarks,
        ];

        return $this->createNotification($employeeId, 'leave_recall', $title, $message, $data);
    }

    /**
     * Get employee_id from user_id
     */
    public function getEmployeeIdFromUserId($userId)
    {
        // Get the user first
        $user = User::find($userId);
        
        if (!$user) {
            Log::error('User not found for notification', ['user_id' => $userId]);
            return null;
        }

        // The employee_id is stored in the users table
        return $user->employee_id;
    }

    /**
     * Get user_id from employee_id - FIXED VERSION
     */
    public function getUserIdFromEmployeeId($employeeId)
    {
        // Find user by employee_id
        $user = User::where('employee_id', $employeeId)->first();
        
        if (!$user) {
            Log::error('User not found for employee', ['employee_id' => $employeeId]);
            return null;
        }

        return $user->id;
    }

    /**
     * Create notification for admin about department head requests - RENAMED to avoid conflict
     */
    public function createAdminDepartmentHeadNotification($adminUserId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $employeeName, $remarks = null)
    {
        // Get employee_id from user_id for admin - using the fixed method
        $adminEmployeeId = $this->getEmployeeIdFromUserId($adminUserId);
        
        if (!$adminEmployeeId) {
            Log::error('Admin notification failed: admin employee not found', [
                'user_id' => $adminUserId,
                'request_id' => $requestId
            ]);
            return null;
        }

        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');

        $title = "Department Head Leave Request";
        $message = "{$employeeName} has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} that requires your approval.";

        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'employee_name' => $employeeName,
            'remarks' => $remarks,
        ];

        return $this->createAdminNotification( // Use the role-specific method
            $adminEmployeeId, 
            'leave_request', 
            $title, 
            $message, 
            $data
        );
    }

    /**
     * Get notifications filtered by current mode
     */
    public function getNotificationsByMode($employeeId, $currentMode, $limit = 20)
    {
        if (!$employeeId) {
            return collect();
        }

        return Notification::where('employee_id', $employeeId)
            ->where(function($query) use ($currentMode) {
                // Include notifications for current mode AND general employee notifications
                if ($currentMode === 'employee') {
                    // In employee mode: show only employee-specific notifications
                    $query->where('type', 'like', '%employee%')
                          ->orWhere('type', 'leave_request') // General leave notifications
                          ->orWhere('type', 'credit_conversion') // General credit notifications
                          ->orWhereNull('data->notification_for'); // Notifications without specific target
                } else {
                    // In role mode (hr, dept_head, admin): show role-specific + general notifications
                    $query->where('data->notification_for', $currentMode)
                          ->orWhere('type', 'like', "%{$currentMode}%")
                          ->orWhereNull('data->notification_for'); // General notifications
                }
            })
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get unread count filtered by current mode
     */
    public function getUnreadCountByMode($employeeId, $currentMode)
    {
        if (!$employeeId) {
            return 0;
        }

        return Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->where(function($query) use ($currentMode) {
                if ($currentMode === 'employee') {
                    $query->where('type', 'like', '%employee%')
                          ->orWhere('type', 'leave_request')
                          ->orWhere('type', 'credit_conversion')
                          ->orWhereNull('data->notification_for');
                } else {
                    $query->where('data->notification_for', $currentMode)
                          ->orWhere('type', 'like', "%{$currentMode}%")
                          ->orWhereNull('data->notification_for');
                }
            })
            ->count();
    }

    /**
     * Create employee-specific notifications
     */
    public function createEmployeeNotification($employeeId, $type, $title, $message, $data = null)
    {
        // Ensure notification is marked for employee
        if ($data && is_array($data)) {
            $data['notification_for'] = 'employee';
        } else {
            $data = ['notification_for' => 'employee'];
        }

        return $this->createNotification($employeeId, $type, $title, $message, $data);
    }

    /**
     * Create HR-specific notifications
     */
    public function createHRNotification($employeeId, $type, $title, $message, $data = null)
    {
        if ($data && is_array($data)) {
            $data['notification_for'] = 'hr';
        } else {
            $data = ['notification_for' => 'hr'];
        }

        return $this->createNotification($employeeId, $type, $title, $message, $data);
    }

    /**
     * Create Department Head-specific notifications
     */
    public function createDeptHeadNotification($employeeId, $type, $title, $message, $data = null)
    {
        if ($data && is_array($data)) {
            $data['notification_for'] = 'dept_head';
        } else {
            $data = ['notification_for' => 'dept_head'];
        }

        return $this->createNotification($employeeId, $type, $title, $message, $data);
    }

    /**
     * Create Admin-specific notifications
     */
    public function createAdminNotification($employeeId, $type, $title, $message, $data = null)
    {
        if ($data && is_array($data)) {
            $data['notification_for'] = 'admin';
        } else {
            $data = ['notification_for' => 'admin'];
        }

        return $this->createNotification($employeeId, $type, $title, $message, $data);
    }

    /**
     * Create notification for HR when employee submits leave request
     */
    public function createHRLeaveSubmissionNotification($employeeId, $requestId, $leaveType, $dateFrom, $dateTo, $employeeName)
    {
        $hrUsers = User::where('role', 'hr')->get();
        
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');
        
        $title = 'New Leave Request Submitted';
        $message = "{$employeeName} has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} that requires HR approval.";

        $data = [
            'request_id' => $requestId,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'employee_name' => $employeeName,
            'employee_id' => $employeeId,
        ];

        $createdCount = 0;
        foreach ($hrUsers as $hrUser) {
            $hrEmployeeId = $this->getEmployeeIdFromUserId($hrUser->id);
            if ($hrEmployeeId) {
                $this->createHRNotification( // Use HR-specific method
                    $hrEmployeeId,
                    'leave_request_submission',
                    $title,
                    $message,
                    $data
                );
                $createdCount++;
            }
        }

        Log::info("Created {$createdCount} HR notifications for leave request ID: {$requestId}");
        return $createdCount;
    }

    /**
     * Create notification for Department Head when employee submits leave request
     */
    public function createDeptHeadLeaveSubmissionNotification($employeeId, $requestId, $leaveType, $dateFrom, $dateTo, $employeeName, $departmentId)
    {
        // Get department head for the employee's department
        $deptHead = User::where('role', 'dept_head')
            ->whereHas('employee', function($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->first();

        if (!$deptHead) {
            Log::warning("No department head found for department ID: {$departmentId}");
            return null;
        }

        $deptHeadEmployeeId = $this->getEmployeeIdFromUserId($deptHead->id);
        if (!$deptHeadEmployeeId) {
            Log::error("Department head employee ID not found for user ID: {$deptHead->id}");
            return null;
        }

        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');
        
        $title = 'New Leave Request in Your Department';
        $message = "{$employeeName} from your department has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} that requires your approval.";

        $data = [
            'request_id' => $requestId,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'employee_name' => $employeeName,
            'employee_id' => $employeeId,
            'department_id' => $departmentId,
        ];

        $notification = $this->createDeptHeadNotification( // Use Dept Head-specific method
            $deptHeadEmployeeId,
            'leave_request_submission',
            $title,
            $message,
            $data
        );

        Log::info("Created department head notification for leave request ID: {$requestId}");
        return $notification;
    }

    /**
     * Create notification for Admin when department head submits leave request
     */
    public function createAdminDeptHeadLeaveSubmissionNotification($employeeId, $requestId, $leaveType, $dateFrom, $dateTo, $employeeName)
    {
        $adminUsers = User::where('role', 'admin')->get();
        
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');
        
        $title = 'Department Head Leave Request Submitted';
        $message = "{$employeeName} (Department Head) has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} that requires Admin approval.";

        $data = [
            'request_id' => $requestId,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'employee_name' => $employeeName,
            'employee_id' => $employeeId,
            'is_dept_head_request' => true,
        ];

        $createdCount = 0;
        foreach ($adminUsers as $adminUser) {
            $adminEmployeeId = $this->getEmployeeIdFromUserId($adminUser->id);
            if ($adminEmployeeId) {
                $this->createAdminNotification( // Use Admin-specific method
                    $adminEmployeeId,
                    'leave_request_submission',
                    $title,
                    $message,
                    $data
                );
                $createdCount++;
            }
        }

        Log::info("Created {$createdCount} Admin notifications for department head leave request ID: {$requestId}");
        return $createdCount;
    }

    /**
     * Create comprehensive notifications for all parties when leave request is submitted
     */
    public function notifyLeaveRequestSubmission($leaveRequest)
    {
        try {
            // Load relationships
            $leaveRequest->load(['employee.department', 'employee.user', 'leaveType']);
            
            $employee = $leaveRequest->employee;
            $employeeName = $employee->firstname . ' ' . $employee->lastname;
            $leaveTypeName = $leaveRequest->leaveType->name;
            $isDeptHead = $employee->user->role === 'dept_head';

            $results = [];

            if ($isDeptHead) {
                // Department head submitting leave - notify Admin only
                $results['admin'] = $this->createAdminDeptHeadLeaveSubmissionNotification(
                    $employee->employee_id,
                    $leaveRequest->id,
                    $leaveTypeName,
                    $leaveRequest->date_from,
                    $leaveRequest->date_to,
                    $employeeName
                );
            } else {
                // Regular employee submitting leave - notify HR and Department Head
                $results['hr'] = $this->createHRLeaveSubmissionNotification(
                    $employee->employee_id,
                    $leaveRequest->id,
                    $leaveTypeName,
                    $leaveRequest->date_from,
                    $leaveRequest->date_to,
                    $employeeName
                );

                if ($employee->department_id) {
                    $results['dept_head'] = $this->createDeptHeadLeaveSubmissionNotification(
                        $employee->employee_id,
                        $leaveRequest->id,
                        $leaveTypeName,
                        $leaveRequest->date_from,
                        $leaveRequest->date_to,
                        $employeeName,
                        $employee->department_id
                    );
                }
            }

            Log::info("Leave request submission notifications created", [
                'request_id' => $leaveRequest->id,
                'employee_id' => $employee->employee_id,
                'is_dept_head' => $isDeptHead,
                'results' => $results
            ]);

            return $results;

        } catch (\Exception $e) {
            Log::error('Error creating leave request submission notifications: ' . $e->getMessage(), [
                'leave_request_id' => $leaveRequest->id,
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }
}