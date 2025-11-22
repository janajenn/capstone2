<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\Models\AttendanceCorrection;
use App\Models\LeaveRescheduleRequest; // Add this import


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
     * Create leave request notification with role-specific messages
     */
    // public function createLeaveRequestNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null, $targetRole = null)
    // {
    //     // Validate employee_id
    //     if (!$employeeId) {
    //         Log::error('Leave request notification failed: employee_id is null', [
    //             'status' => $status,
    //             'request_id' => $requestId,
    //             'leave_type' => $leaveType
    //         ]);
    //         return null;
    //     }

    //     // Map status to proper notification type and message based on target role
    //     $notificationData = $this->getLeaveRequestNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks, $targetRole);
        
    //     $data = [
    //         'request_id' => $requestId,
    //         'status' => $status,
    //         'leave_type' => $leaveType,
    //         'date_from' => $dateFrom,
    //         'date_to' => $dateTo,
    //         'remarks' => $remarks,
    //         'notification_for' => $targetRole,
    //     ];

    //     return $this->createNotificationWithRedirect(
    //         $employeeId, 
    //         'leave_request', 
    //         $notificationData['title'], 
    //         $notificationData['message'], 
    //         $data,
    //         $currentMode
    //     );
    // }

    /**
     * Get notification data based on status AND target role
     */
    private function getLeaveRequestNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks = null, $targetRole = null)
    {
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');
        
        // Handle different status types properly with role-specific messages
        switch ($status) {
            case 'hr_approved_pending_dept_head':
                if ($targetRole === 'dept_head') {
                    return [
                        'title' => 'Leave Request Requires Your Approval',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending your department head approval."
                    ];
                } elseif ($targetRole === 'employee') {
                    return [
                        'title' => 'Leave Request Approved by HR',
                        'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Department Head approval."
                    ];
                } else {
                    // For admin or others, show generic message
                    return [
                        'title' => 'Leave Request Progress Update',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Department Head approval."
                    ];
                }

            case 'hr_approved_pending_admin':
                if ($targetRole === 'admin') {
                    return [
                        'title' => 'Department Head Leave Request Requires Approval',
                        'message' => "A Department Head has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} that requires your admin approval."
                    ];
                } elseif ($targetRole === 'employee') {
                    return [
                        'title' => 'Leave Request Approved by HR',
                        'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by HR and is pending Admin approval."
                    ];
                } else {
                    return [
                        'title' => 'Leave Request Progress Update',
                        'message' => "A Department Head's {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} is pending Admin approval."
                    ];
                }

            case 'dept_head_approved':
                if ($targetRole === 'admin') {
                    return [
                        'title' => 'Leave Request Requires Final Approval',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by Department Head and requires your final approval."
                    ];
                } elseif ($targetRole === 'employee') {
                    return [
                        'title' => 'Leave Request Approved by Department Head',
                        'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by your Department Head and is pending Admin approval."
                    ];
                } else {
                    return [
                        'title' => 'Leave Request Progress Update',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been approved by Department Head."
                    ];
                }

            case 'approved':
                if ($targetRole === 'employee') {
                    return [
                        'title' => 'Leave Request Fully Approved',
                        'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been fully approved."
                    ];
                } else {
                    return [
                        'title' => 'Leave Request Approved',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been fully approved."
                    ];
                }
                
            case 'rejected':
                if ($targetRole === 'employee') {
                    $message = "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected',
                        'message' => $message
                    ];
                } else {
                    $message = "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected',
                        'message' => $message
                    ];
                }

            case 'dept_head_rejected':
                if ($targetRole === 'employee') {
                    $message = "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by your Department Head.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected by Department Head',
                        'message' => $message
                    ];
                } else {
                    $message = "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by Department Head.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected by Department Head',
                        'message' => $message
                    ];
                }

            case 'hr_rejected':
                if ($targetRole === 'employee') {
                    $message = "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by HR.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected by HR',
                        'message' => $message
                    ];
                } else {
                    $message = "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by HR.";
                    if ($remarks) {
                        $message .= " Reason: {$remarks}";
                    }
                    return [
                        'title' => 'Leave Request Rejected by HR',
                        'message' => $message
                    ];
                }

            case 'admin_pending':
                if ($targetRole === 'admin') {
                    return [
                        'title' => 'Department Head Leave Request Pending',
                        'message' => "A {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} by a Department Head requires your approval."
                    ];
                } else {
                    return [
                        'title' => 'Leave Request Submitted',
                        'message' => "A Department Head has submitted a {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted}."
                    ];
                }

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
     * Update HR approval to send role-specific notifications
     */
    public function notifyHRApproval($leaveRequest, $approverUserId, $remarks = null)
    {
        try {
            $leaveRequest->load(['employee', 'leaveType', 'employee.user']);
            
            $employee = $leaveRequest->employee;
            $isDeptHeadRequest = $employee->user->role === 'dept_head';

            if ($isDeptHeadRequest) {
                // Dept head request goes to admin after HR approval
                $status = 'hr_approved_pending_admin';
                
                // Notify Admin
                $adminUsers = User::where('role', 'admin')->get();
                foreach ($adminUsers as $admin) {
                    $adminEmployeeId = $this->getEmployeeIdFromUserId($admin->id);
                    if ($adminEmployeeId) {
                        $this->createLeaveRequestNotification(
                            $adminEmployeeId,
                            $status,
                            $leaveRequest->id,
                            $leaveRequest->leaveType->name,
                            $leaveRequest->date_from,
                            $leaveRequest->date_to,
                            $remarks,
                            'admin' // Target role
                        );
                    }
                }
                
                // Notify Employee (the dept head)
                $this->createLeaveRequestNotification(
                    $employee->employee_id,
                    $status,
                    $leaveRequest->id,
                    $leaveRequest->leaveType->name,
                    $leaveRequest->date_from,
                    $leaveRequest->date_to,
                    $remarks,
                    'employee' // Target role
                );
                
            } else {
                // Regular employee request goes to department head after HR approval
                $status = 'hr_approved_pending_dept_head';
                
                // Notify Department Head
                $deptHeadUser = User::where('role', 'dept_head')
                    ->whereHas('employee', function($query) use ($employee) {
                        $query->where('department_id', $employee->department_id);
                    })->first();
                    
                if ($deptHeadUser) {
                    $deptHeadEmployeeId = $this->getEmployeeIdFromUserId($deptHeadUser->id);
                    if ($deptHeadEmployeeId) {
                        $this->createLeaveRequestNotification(
                            $deptHeadEmployeeId,
                            $status,
                            $leaveRequest->id,
                            $leaveRequest->leaveType->name,
                            $leaveRequest->date_from,
                            $leaveRequest->date_to,
                            $remarks,
                            'dept_head' // Target role
                        );
                    }
                }
                
                // Notify Employee
                $this->createLeaveRequestNotification(
                    $employee->employee_id,
                    $status,
                    $leaveRequest->id,
                    $leaveRequest->leaveType->name,
                    $leaveRequest->date_from,
                    $leaveRequest->date_to,
                    $remarks,
                    'employee' // Target role
                );
            }

            Log::info("HR approval notifications sent", [
                'request_id' => $leaveRequest->id,
                'employee_id' => $employee->employee_id,
                'is_dept_head' => $isDeptHeadRequest,
                'status' => $status
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error creating HR approval notifications: ' . $e->getMessage(), [
                'leave_request_id' => $leaveRequest->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Notify Department Head approval
     */
    public function notifyDeptHeadApproval($leaveRequest, $approverUserId, $remarks = null)
    {
        try {
            $leaveRequest->load(['employee', 'leaveType', 'employee.user']);
            
            $employee = $leaveRequest->employee;
            $isDeptHeadRequest = $employee->user->role === 'dept_head';

            if ($isDeptHeadRequest) {
                // Dept head requests should not go through dept head approval
                Log::warning('Department head tried to approve their own request', [
                    'request_id' => $leaveRequest->id,
                    'approver_id' => $approverUserId
                ]);
                return false;
            }

            $status = 'dept_head_approved';
            
            // Notify Admin for final approval
            $adminUsers = User::where('role', 'admin')->get();
            foreach ($adminUsers as $admin) {
                $adminEmployeeId = $this->getEmployeeIdFromUserId($admin->id);
                if ($adminEmployeeId) {
                    $this->createLeaveRequestNotification(
                        $adminEmployeeId,
                        $status,
                        $leaveRequest->id,
                        $leaveRequest->leaveType->name,
                        $leaveRequest->date_from,
                        $leaveRequest->date_to,
                        $remarks,
                        'admin' // Target role
                    );
                }
            }
            
            // Notify Employee
            $this->createLeaveRequestNotification(
                $employee->employee_id,
                $status,
                $leaveRequest->id,
                $leaveRequest->leaveType->name,
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $remarks,
                'employee' // Target role
            );

            Log::info("Department Head approval notifications sent", [
                'request_id' => $leaveRequest->id,
                'employee_id' => $employee->employee_id,
                'approver_id' => $approverUserId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error creating Department Head approval notifications: ' . $e->getMessage(), [
                'leave_request_id' => $leaveRequest->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Notify Admin approval (final approval)
     */
    public function notifyAdminApproval($leaveRequest, $approverUserId, $remarks = null)
    {
        try {
            $leaveRequest->load(['employee', 'leaveType']);
            
            $employee = $leaveRequest->employee;
            $status = 'approved';
            
            // Notify Employee
            $this->createLeaveRequestNotification(
                $employee->employee_id,
                $status,
                $leaveRequest->id,
                $leaveRequest->leaveType->name,
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $remarks,
                'employee' // Target role
            );

            Log::info("Admin approval notifications sent", [
                'request_id' => $leaveRequest->id,
                'employee_id' => $employee->employee_id,
                'approver_id' => $approverUserId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error creating Admin approval notifications: ' . $e->getMessage(), [
                'leave_request_id' => $leaveRequest->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Notify rejection with role-specific messages
     */
    public function notifyRejection($leaveRequest, $rejecterRole, $approverUserId, $remarks = null)
    {
        try {
            $leaveRequest->load(['employee', 'leaveType']);
            
            $employee = $leaveRequest->employee;
            $status = 'rejected';
            
            if ($rejecterRole === 'hr') {
                $status = 'hr_rejected';
            } elseif ($rejecterRole === 'dept_head') {
                $status = 'dept_head_rejected';
            }
            
            // Notify Employee
            $this->createLeaveRequestNotification(
                $employee->employee_id,
                $status,
                $leaveRequest->id,
                $leaveRequest->leaveType->name,
                $leaveRequest->date_from,
                $leaveRequest->date_to,
                $remarks,
                'employee' // Target role
            );

            Log::info("Rejection notifications sent", [
                'request_id' => $leaveRequest->id,
                'employee_id' => $employee->employee_id,
                'rejecter_role' => $rejecterRole,
                'rejecter_id' => $approverUserId
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error creating rejection notifications: ' . $e->getMessage(), [
                'leave_request_id' => $leaveRequest->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Create credit conversion notification with role-specific messages
     */
    // public function createCreditConversionNotification($employeeId, $status, $conversionId, $leaveType, $creditsRequested, $cashEquivalent = null, $targetRole = null)
    // {
    //     if (!$employeeId) {
    //         Log::error('Credit conversion notification failed: employee_id is null');
    //         return null;
    //     }

    //     $notificationData = $this->getCreditConversionNotificationData($status, $leaveType, $creditsRequested, $cashEquivalent, $targetRole);
        
    //     $data = [
    //         'conversion_id' => $conversionId,
    //         'status' => $status,
    //         'leave_type' => $leaveType,
    //         'credits_requested' => $creditsRequested,
    //         'cash_equivalent' => $cashEquivalent,
    //         'notification_for' => $targetRole,
    //     ];

    //     return $this->createNotification(
    //         $employeeId, 
    //         'credit_conversion', 
    //         $notificationData['title'], 
    //         $notificationData['message'], 
    //         $data
    //     );
    // }

    /**
     * Get credit conversion notification data based on status and target role
     */
    private function getCreditConversionNotificationData($status, $leaveType, $creditsRequested, $cashEquivalent = null, $targetRole = null)
    {
        switch ($status) {
            case 'forwarded_to_accounting':
                if ($targetRole === 'employee') {
                    return [
                        'title' => 'VL Conversion Forwarded to Accounting',
                        'message' => "Your request to convert {$creditsRequested} {$leaveType} credits has been approved by HR and forwarded to the Accounting/Budget Office for processing and cash release. Your VL credits have been deducted and the cash equivalent will be processed by Accounting."
                    ];
                } else {
                    return [
                        'title' => 'VL Conversion Forwarded to Accounting',
                        'message' => "A request to convert {$creditsRequested} {$leaveType} credits has been approved by HR and forwarded to Accounting for processing."
                    ];
                }
            
            case 'approved':
                if ($targetRole === 'employee') {
                    return [
                        'title' => 'VL Conversion Fully Processed',
                        'message' => "Your request to convert {$creditsRequested} {$leaveType} credits has been fully processed. The cash equivalent has been released by the Accounting Office."
                    ];
                } else {
                    return [
                        'title' => 'VL Conversion Completed',
                        'message' => "A request to convert {$creditsRequested} {$leaveType} credits has been fully processed and cash released."
                    ];
                }
            
            case 'rejected':
                $reason = $cashEquivalent ? " Reason: {$cashEquivalent}" : "";
                if ($targetRole === 'employee') {
                    return [
                        'title' => 'VL Conversion Rejected',
                        'message' => "Your request to convert {$creditsRequested} {$leaveType} credits has been rejected.{$reason}"
                    ];
                } else {
                    return [
                        'title' => 'VL Conversion Rejected',
                        'message' => "A request to convert {$creditsRequested} {$leaveType} credits has been rejected.{$reason}"
                    ];
                }

            case 'pending':
                if ($targetRole === 'hr') {
                    return [
                        'title' => 'New VL Credit Conversion Request',
                        'message' => "A new request to convert {$creditsRequested} {$leaveType} credits has been submitted and requires HR approval."
                    ];
                } elseif ($targetRole === 'employee') {
                    return [
                        'title' => 'VL Conversion Submitted',
                        'message' => "Your request to convert {$creditsRequested} {$leaveType} credits has been submitted and is pending HR approval."
                    ];
                } else {
                    return [
                        'title' => 'VL Conversion Request Submitted',
                        'message' => "A request to convert {$creditsRequested} {$leaveType} credits has been submitted."
                    ];
                }
                
            default:
                return [
                    'title' => 'Credit Conversion Update',
                    'message' => "Your {$leaveType} credit conversion request has been updated. Status: {$status}"
                ];
        }
    }

    public function notifyCreditConversionStatus($creditConversion, $targetRole = null)
    {
        try {
            // Load relationships
            $creditConversion->load(['employee', 'approver']);
            
            $employee = $creditConversion->employee;
            $employeeName = $employee->firstname . ' ' . $employee->lastname;
            $creditsRequested = $creditConversion->credits_requested;
            $leaveType = $creditConversion->leave_type;

            // Create notification for employee
            $employeeNotification = $this->createCreditConversionNotification(
                $employee->employee_id,
                $creditConversion->status,
                $creditConversion->conversion_id,
                $leaveType,
                $creditsRequested,
                $creditConversion->equivalent_cash,
                'employee' // Target role for employee
            );

            // If approved, also notify HR about forwarding to accounting
            if ($creditConversion->status === 'approved') {
                $hrUsers = User::where('role', 'hr')->get();
                foreach ($hrUsers as $hrUser) {
                    $hrEmployeeId = $this->getEmployeeIdFromUserId($hrUser->id);
                    if ($hrEmployeeId) {
                        $this->createCreditConversionNotification(
                            $hrEmployeeId,
                            'forwarded_to_accounting',
                            $creditConversion->conversion_id,
                            $leaveType,
                            $creditsRequested,
                            $creditConversion->equivalent_cash,
                            'hr' // Target role for HR
                        );
                    }
                }
            }

            Log::info("Credit conversion status notification created", [
                'conversion_id' => $creditConversion->conversion_id,
                'employee_id' => $employee->employee_id,
                'status' => $creditConversion->status,
                'notification_id' => $employeeNotification ? $employeeNotification->id : null
            ]);

            return $employeeNotification;

        } catch (\Exception $e) {
            Log::error('Error creating credit conversion status notification: ' . $e->getMessage(), [
                'conversion_id' => $creditConversion->conversion_id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
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
    public function createLeaveRecallNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null, $targetRole = null)
    {
        if (!$employeeId) {
            Log::error('Leave recall notification failed: employee_id is null');
            return null;
        }

        $notificationData = $this->getLeaveRecallNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks, $targetRole);

        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'remarks' => $remarks,
            'notification_for' => $targetRole,
        ];

        return $this->createNotification($employeeId, 'leave_recall', $notificationData['title'], $notificationData['message'], $data);
    }

    /**
     * Get leave recall notification data based on status and target role
     */
    private function getLeaveRecallNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks = null, $targetRole = null)
    {
        $dateFromFormatted = \Carbon\Carbon::parse($dateFrom)->format('M d, Y');
        $dateToFormatted = \Carbon\Carbon::parse($dateTo)->format('M d, Y');

        if ($status === 'approved') {
            if ($targetRole === 'employee') {
                return [
                    'title' => 'Leave Recall Request Approved',
                    'message' => "Your {$leaveType} leave recall request has been approved. Your new leave dates are from {$dateFromFormatted} to {$dateToFormatted}."
                ];
            } else {
                return [
                    'title' => 'Leave Recall Request Approved',
                    'message' => "A {$leaveType} leave recall request has been approved with new dates from {$dateFromFormatted} to {$dateToFormatted}."
                ];
            }
        } elseif ($status === 'dept_head_approved') {
            if ($targetRole === 'hr') {
                return [
                    'title' => 'Leave Recall Request Requires HR Approval',
                    'message' => "A {$leaveType} leave recall request has been approved by Department Head and requires your HR approval."
                ];
            } elseif ($targetRole === 'employee') {
                return [
                    'title' => 'Leave Recall Approved by Department Head',
                    'message' => "Your {$leaveType} leave recall request has been approved by your department head and forwarded to HR for final approval."
                ];
            } else {
                return [
                    'title' => 'Leave Recall Progress Update',
                    'message' => "A {$leaveType} leave recall request has been approved by Department Head."
                ];
            }
        } else {
            // Rejected
            if ($targetRole === 'employee') {
                $message = "Your {$leaveType} leave recall request has been rejected.";
                if ($remarks) {
                    $message .= " Reason: {$remarks}";
                }
                return [
                    'title' => 'Leave Recall Request Rejected',
                    'message' => $message
                ];
            } else {
                $message = "A {$leaveType} leave recall request has been rejected.";
                if ($remarks) {
                    $message .= " Reason: {$remarks}";
                }
                return [
                    'title' => 'Leave Recall Request Rejected',
                    'message' => $message
                ];
            }
        }
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

   
   public function createCreditConversionSubmissionNotification($hrEmployeeId, $conversionId, $employeeName, $employeeId, $creditsRequested, $cashEquivalent, $submittedAt)
   {
       $title = 'New VL Credit Conversion Request';
       $message = "{$employeeName} has submitted a request to convert {$creditsRequested} VL credits (₱" . number_format($cashEquivalent, 2) . ").";
       
       $data = [
           'conversion_id' => $conversionId,
           'employee_name' => $employeeName,
           'employee_id' => $employeeId,
           'credits_requested' => $creditsRequested,
           'cash_equivalent' => $cashEquivalent,
           'submitted_at' => $submittedAt,
           'notification_for' => 'hr',
       ];
   
       return $this->createNotification(
           $hrEmployeeId,
           'credit_conversion_submission',
           $title,
           $message,
           $data
       );
   }

   // Add this method to your NotificationService
private function preventDuplicateNotification($employeeId, $type, $data)
{
    $recentTime = now()->subMinutes(5); // Check last 5 minutes
    
    return Notification::where('employee_id', $employeeId)
        ->where('type', $type)
        ->where('created_at', '>=', $recentTime)
        ->where('data', json_encode($data))
        ->exists();
}


    // Now this will work without the full namespace
    public function notifyAttendanceCorrectionSubmission(AttendanceCorrection $correction)
    {
        try {
            // Load relationships if needed
            $correction->load(['employee', 'department.headUser']);
            
            // Notify Department Head
            $departmentHead = $correction->department->headUser;
            if ($departmentHead && $departmentHead->employee) {
                $this->createEmployeeNotification(
                    $departmentHead->employee->employee_id,
                    'attendance_correction_pending_review',
                    'Attendance Correction Request Pending Review',
                    "A new attendance correction request from {$correction->employee->firstname} {$correction->employee->lastname} for {$correction->attendance_date} requires your review.",
                    [
                        'correction_id' => $correction->id,
                        'employee_name' => "{$correction->employee->firstname} {$correction->employee->lastname}",
                        'attendance_date' => $correction->attendance_date,
                    ]
                );
            }

            // Notify HR
            $hrUsers = User::where('role', 'hr')->get();
            foreach ($hrUsers as $hrUser) {
                if ($hrUser->employee) {
                    $this->createEmployeeNotification(
                        $hrUser->employee->employee_id,
                        'attendance_correction_submitted',
                        'New Attendance Correction Request',
                        "{$correction->employee->firstname} {$correction->employee->lastname} submitted an attendance correction request for {$correction->attendance_date}.",
                        [
                            'correction_id' => $correction->id,
                            'employee_name' => "{$correction->employee->firstname} {$correction->employee->lastname}",
                            'attendance_date' => $correction->attendance_date,
                        ]
                    );
                }
            }

            Log::info("Attendance correction notifications sent", [
                'correction_id' => $correction->id,
                'employee_id' => $correction->employee_id,
                'attendance_date' => $correction->attendance_date
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send attendance correction notifications: ' . $e->getMessage(), [
                'correction_id' => $correction->id ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
 * Notify about attendance correction review by department head
 */
public function notifyAttendanceCorrectionReview(\App\Models\AttendanceCorrection $correction, $reviewerId, $remarks = null)
{
    try {
        // Load relationships
        $correction->load(['employee', 'department']);
        
        // Notify HR about the reviewed correction
        $hrUsers = User::where('role', 'hr')->get();
        foreach ($hrUsers as $hrUser) {
            if ($hrUser->employee) {
                $this->createHRNotification(
                    $hrUser->employee->employee_id,
                    'attendance_correction_reviewed',
                    'Attendance Correction Reviewed by Department Head',
                    "Department Head has reviewed the attendance correction request from {$correction->employee->firstname} {$correction->employee->lastname} for {$correction->attendance_date}.",
                    [
                        'correction_id' => $correction->id,
                        'employee_name' => "{$correction->employee->firstname} {$correction->employee->lastname}",
                        'attendance_date' => $correction->attendance_date,
                        'reviewer_id' => $reviewerId,
                        'remarks' => $remarks,
                        'status' => 'Reviewed'
                    ]
                );
            }
        }

        // Notify the employee about the review
        $this->createEmployeeNotification(
            $correction->employee_id,
            'attendance_correction_reviewed',
            'Attendance Correction Under Review',
            "Your attendance correction request for {$correction->attendance_date} has been reviewed by your Department Head and forwarded to HR for final approval.",
            [
                'correction_id' => $correction->id,
                'attendance_date' => $correction->attendance_date,
                'status' => 'Reviewed'
            ]
        );

        Log::info("Attendance correction review notifications sent", [
            'correction_id' => $correction->id,
            'reviewer_id' => $reviewerId,
            'status' => 'Reviewed'
        ]);

    } catch (\Exception $e) {
        Log::error('Failed to send attendance correction review notifications: ' . $e->getMessage(), [
            'correction_id' => $correction->id ?? 'unknown',
            'trace' => $e->getTraceAsString()
        ]);
    }
}

public function generateRedirectUrl($type, $data, $currentMode = 'admin')
{
    // Set base URL based on current mode
    $baseUrl = match($currentMode) {
        'admin' => '/admin',
        'hr' => '/hr', 
        'dept_head' => '/dept-head',
        'employee' => '/employee',
        default => '/employee'
    };
    
    switch ($type) {
        case 'leave_request':
        case 'leave_request_submission':
        case 'leave_recall':
            if (isset($data['request_id'])) {
                // ✅ FIXED: Use correct admin leave requests route
                return "{$baseUrl}/leave-requests?highlight={$data['request_id']}";
            }
            return "{$baseUrl}/leave-requests";

        case 'credit_conversion':
        case 'credit_conversion_submission':
            if (isset($data['conversion_id'])) {
                // ✅ FIXED: Use correct admin credit conversions route  
                return "{$baseUrl}/credit-conversions?highlight={$data['conversion_id']}";
            }
            return "{$baseUrl}/credit-conversions";

        case 'attendance_correction_pending_review':
        case 'attendance_correction_submitted':
        case 'attendance_correction_reviewed':
            // You might need to add this route if it doesn't exist
            return "{$baseUrl}/attendance-logs"; // or appropriate admin route

        default:
            return "{$baseUrl}/dashboard";
    }
}
    /**
     * Create notification with redirect URL
     */
    public function createNotificationWithRedirect($employeeId, $type, $title, $message, $data = null, $currentMode = 'admin')
    {
        $redirectUrl = $this->generateRedirectUrl($type, $data ?? [], $currentMode);
        
        if ($data && is_array($data)) {
            $data['redirect_url'] = $redirectUrl;
        } else {
            $data = ['redirect_url' => $redirectUrl];
        }

        return $this->createNotification($employeeId, $type, $title, $message, $data);
    }

    /**
     * Update leave request notification to include redirect URL
     */
    public function createLeaveRequestNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null, $targetRole = null, $currentMode = 'admin')
    {
        $notificationData = $this->getLeaveRequestNotificationData($status, $leaveType, $dateFrom, $dateTo, $remarks, $targetRole);
        
        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'remarks' => $remarks,
            'notification_for' => $targetRole,
        ];

        return $this->createNotificationWithRedirect(
            $employeeId, 
            'leave_request', 
            $notificationData['title'], 
            $notificationData['message'], 
            $data,
            $currentMode
        );
    }

    /**
     * Update credit conversion notification to include redirect URL
     */
    public function createCreditConversionNotification($employeeId, $status, $conversionId, $leaveType, $creditsRequested, $cashEquivalent = null, $targetRole = null, $currentMode = 'admin')
    {
        $notificationData = $this->getCreditConversionNotificationData($status, $leaveType, $creditsRequested, $cashEquivalent, $targetRole);
        
        $data = [
            'conversion_id' => $conversionId,
            'status' => $status,
            'leave_type' => $leaveType,
            'credits_requested' => $creditsRequested,
            'cash_equivalent' => $cashEquivalent,
            'notification_for' => $targetRole,
        ];

        return $this->createNotificationWithRedirect(
            $employeeId, 
            'credit_conversion', 
            $notificationData['title'], 
            $notificationData['message'], 
            $data,
            $currentMode
        );
    }



    public function notifyRescheduleAutoApproval(LeaveRescheduleRequest $rescheduleRequest)
    {
        $adminUsers = User::where('role', 'admin')->get();
        
        foreach ($adminUsers as $adminUser) {
            $this->createNotification(
                $adminUser->id,
                'reschedule_auto_approved',
                'Reschedule Auto-Approved',
                "A reschedule request from {$rescheduleRequest->employee->firstname} {$rescheduleRequest->employee->lastname} has been auto-approved (Department Head/Admin).",
                [
                    'reschedule_id' => $rescheduleRequest->id,
                    'employee_id' => $rescheduleRequest->employee_id,
                    'type' => 'reschedule'
                ]
            );
        }
    }

    public function notifyRescheduleRequestSubmission(LeaveRescheduleRequest $rescheduleRequest)
    {
        $hrUsers = User::where('role', 'hr')->get();
        
        foreach ($hrUsers as $hrUser) {
            $this->createNotification(
                $hrUser->id,
                'reschedule_request_submitted',
                'New Reschedule Request',
                "A new leave reschedule request has been submitted by {$rescheduleRequest->employee->firstname} {$rescheduleRequest->employee->lastname}.",
                [
                    'reschedule_id' => $rescheduleRequest->id,
                    'employee_id' => $rescheduleRequest->employee_id,
                    'type' => 'reschedule'
                ]
            );
        }
    }
}


