<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for the logged-in employee
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            abort(400, 'Employee profile not found for user.');
        }

        $notifications = $this->notificationService->getNotifications($employeeId, 20);
        $unreadCount = $this->notificationService->getUnreadCount($employeeId);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $user = $request->user()->load('employee');
            
            if (!$user) {
                \Log::error('User not authenticated in markAsRead');
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }
            
            $employeeId = $user->employee?->employee_id;

            if (!$employeeId) {
                \Log::error('Employee profile not found for user', ['user_id' => $user->id]);
                return response()->json(['success' => false, 'error' => 'Employee profile not found for user.'], 400);
            }

            \Log::info('Marking notification as read', [
                'notification_id' => $id,
                'employee_id' => $employeeId,
                'user_id' => $user->id,
                'session_id' => session()->getId()
            ]);

            $success = $this->notificationService->markAsRead($id, $employeeId);

            if ($success) {
                $unreadCount = $this->notificationService->getUnreadCount($employeeId);
                \Log::info('Notification marked as read successfully', [
                    'notification_id' => $id,
                    'new_unread_count' => $unreadCount
                ]);
                return response()->json([
                    'success' => true,
                    'unread_count' => $unreadCount,
                ]);
            }

            \Log::error('Failed to mark notification as read', [
                'notification_id' => $id,
                'employee_id' => $employeeId
            ]);

            return response()->json(['success' => false, 'error' => 'Failed to mark notification as read'], 400);
        } catch (\Exception $e) {
            \Log::error('Error in markAsRead', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'notification_id' => $id,
                'user_id' => $request->user()?->id,
                'session_id' => session()->getId()
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => 'Internal server error',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user()->load('employee');
            
            if (!$user) {
                \Log::error('User not authenticated in markAllAsRead');
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }
            
            $employeeId = $user->employee?->employee_id;

            if (!$employeeId) {
                \Log::error('Employee profile not found for user', ['user_id' => $user->id]);
                return response()->json(['success' => false, 'error' => 'Employee profile not found for user.'], 400);
            }

            \Log::info('Marking all notifications as read', [
                'employee_id' => $employeeId,
                'user_id' => $user->id,
                'session_id' => session()->getId()
            ]);

            $this->notificationService->markAllAsRead($employeeId);

            return response()->json([
                'success' => true,
                'unread_count' => 0,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in markAllAsRead', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
                'session_id' => session()->getId()
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => 'Internal server error',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get unread count for the sidebar
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json(['unread_count' => 0]);
        }

        $unreadCount = $this->notificationService->getUnreadCount($employeeId);

        \Log::info('Getting unread count', [
            'employee_id' => $employeeId,
            'user_id' => $user->id,
            'unread_count' => $unreadCount
        ]);

        return response()->json(['unread_count' => $unreadCount]);
    }

    /**
     * Debug method to check notification state
     */
    public function debugNotifications(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json(['error' => 'Employee profile not found for user.']);
        }

        $allNotifications = $this->notificationService->getNotifications($employeeId, 50);
        $unreadCount = $this->notificationService->getUnreadCount($employeeId);
        $readCount = $allNotifications->where('is_read', true)->count();

        return response()->json([
            'employee_id' => $employeeId,
            'user_id' => $user->id,
            'total_notifications' => $allNotifications->count(),
            'unread_count' => $unreadCount,
            'read_count' => $readCount,
            'notifications' => $allNotifications->map(function($notif) {
                return [
                    'id' => $notif->id,
                    'type' => $notif->type,
                    'title' => $notif->title,
                    'is_read' => $notif->is_read,
                    'read_at' => $notif->read_at,
                    'created_at' => $notif->created_at,
                ];
            })
        ]);
    }
}
