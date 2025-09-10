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

    /**
     * Create leave request notification
     */
    public function createLeaveRequestNotification($employeeId, $status, $requestId, $leaveType, $dateFrom, $dateTo)
    {
        $statusText = ucfirst($status);
        $title = "Leave Request {$statusText}";
        
        if ($status === 'approved') {
            $message = "Your {$leaveType} leave request from {$dateFrom} to {$dateTo} has been approved.";
        } else {
            $message = "Your {$leaveType} leave request from {$dateFrom} to {$dateTo} has been rejected.";
        }

        $data = [
            'request_id' => $requestId,
            'status' => $status,
            'leave_type' => $leaveType,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        return $this->createNotification($employeeId, 'leave_request', $title, $message, $data);
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
}
