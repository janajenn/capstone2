<?php

namespace App\Http\Controllers\DeptHead;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class DeptHeadNotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for Department Head mode
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

        // Use 'dept_head' mode filtering
        $notifications = $this->notificationService->getNotificationsByMode($employeeId, 'dept_head', 20);
        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'dept_head');

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark Department Head notification as read
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
                // Get updated unread count for dept_head mode
                $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'dept_head');
                return response()->json([
                    'success' => true,
                    'unread_count' => $unreadCount,
                ]);
            }

            return response()->json(['success' => false, 'error' => 'Failed to mark notification as read'], 400);
        } catch (\Exception $e) {
            \Log::error('Error in DeptHead markAsRead', [
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
     * Mark all Department Head notifications as read
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
            \Log::error('Error in DeptHead markAllAsRead', [
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
     * Get unread count for Department Head sidebar
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json(['unread_count' => 0]);
        }

        // Use 'dept_head' mode filtering
        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'dept_head');

        return response()->json(['unread_count' => $unreadCount]);
    }
}