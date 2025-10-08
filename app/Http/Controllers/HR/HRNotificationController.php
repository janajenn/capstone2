<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class HRNotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for HR mode
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
            ]);
        }

        // Use 'hr' mode filtering
        $notifications = $this->notificationService->getNotificationsByMode($employeeId, 'hr', 20);
        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'hr');

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark HR notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user()->load('employee');
            $employeeId = $user->employee?->employee_id;

            if (!$employeeId) {
                return response()->json(['success' => false, 'error' => 'Employee profile not found for user.'], 400);
            }

            $success = $this->notificationService->markAsRead($id, $employeeId);

            if ($success) {
                // Get updated unread count for HR mode
                $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'hr');
                return response()->json([
                    'success' => true,
                    'unread_count' => $unreadCount,
                ]);
            }

            return response()->json(['success' => false, 'error' => 'Failed to mark notification as read'], 400);
        } catch (\Exception $e) {
            \Log::error('Error in HR markAsRead', [
                'error' => $e->getMessage(),
                'notification_id' => $id,
                'user_id' => $request->user()?->id,
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Mark all HR notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user()->load('employee');
            $employeeId = $user->employee?->employee_id;

            if (!$employeeId) {
                return response()->json(['success' => false, 'error' => 'Employee profile not found for user.'], 400);
            }

            $this->notificationService->markAllAsRead($employeeId);

            return response()->json([
                'success' => true,
                'unread_count' => 0,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in HR markAllAsRead', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get unread count for HR sidebar
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json(['unread_count' => 0]);
        }

        // Use 'hr' mode filtering
        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'hr');

        return response()->json(['unread_count' => $unreadCount]);
    }
}