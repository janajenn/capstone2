<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Employee;

class NotificationService
{
    /**
     * Create a notification for an employee
     */
    public function createNotification($employeeId, $type, $title, $message, $data = null)
    {
        return Notification::create([
            'employee_id' => $employeeId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    //LEAVE REQUEST NOTIFICATION
      public function createLeaveRequestNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo, $remarks = null)
    {
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
                
            case 'hr_rejected':
                return [
                    'title' => 'Leave Request Rejected by HR',
                    'message' => "Your {$leaveType} leave request from {$dateFromFormatted} to {$dateToFormatted} has been rejected by HR." . 
                                ($remarks ? " Remarks: {$remarks}" : "")
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
        return Notification::where('employee_id', $employeeId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get notifications for an employee
     */
    public function getNotifications($employeeId, $limit = 10)
    {
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
        \Log::info('Attempting to mark notification as read', [
            'notification_id' => $notificationId,
            'employee_id' => $employeeId
        ]);

        $notification = Notification::where('id', $notificationId)
            ->where('employee_id', $employeeId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            \Log::info('Notification marked as read successfully', [
                'notification_id' => $notificationId,
                'employee_id' => $employeeId,
                'was_read' => $notification->is_read
            ]);
            return true;
        }

        \Log::warning('Notification not found for marking as read', [
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
}
