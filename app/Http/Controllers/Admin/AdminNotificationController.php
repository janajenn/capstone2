<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminNotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get notifications for Admin mode
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

        $notifications = $this->notificationService->getNotificationsByMode($employeeId, 'admin', 20);
        
        // Transform notifications to include redirect URLs
        $transformedNotifications = $notifications->map(function ($notification) {
            return $this->transformNotification($notification);
        });

        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'admin');

        return response()->json([
            'notifications' => $transformedNotifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Transform notification to include redirect URL
     */
    private function transformNotification($notification)
    {
        $data = $notification->data ?? [];
        
        // If redirect_url is already in data, use it
        if (isset($data['redirect_url'])) {
            $redirectUrl = $data['redirect_url'];
        } else {
            // Generate redirect URL based on type and data
            $redirectUrl = $this->notificationService->generateRedirectUrl(
                $notification->type, 
                $data, 
                'admin'
            );
        }

        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $data,
            'is_read' => $notification->is_read,
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
            'redirect_url' => $redirectUrl,
        ];
    }
    public function handleClick(Request $request, $id)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return redirect()->back()->with('error', 'Employee profile not found.');
        }

        // Mark notification as read
        $this->notificationService->markAsRead($id, $employeeId);

        // Get notification to extract redirect URL
        $notification = \App\Models\Notification::where('id', $id)
            ->where('employee_id', $employeeId)
            ->first();

        if (!$notification) {
            return redirect()->back()->with('error', 'Notification not found.');
        }

        $data = $notification->data ?? [];
        
        // Determine redirect URL
        if (isset($data['redirect_url'])) {
            $redirectUrl = $data['redirect_url'];
        } else {
            $redirectUrl = $this->notificationService->generateRedirectUrl(
                $notification->type, 
                $data, 
                'admin'
            );
        }

        // Use Inertia redirect
        return Inertia::location($redirectUrl);
    }

    /**
     * Mark Admin notification as read
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
                // Get updated unread count for admin mode
                $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'admin');
                return response()->json([
                    'success' => true,
                    'unread_count' => $unreadCount,
                ]);
            }

            return response()->json(['success' => false, 'error' => 'Failed to mark notification as read'], 400);
        } catch (\Exception $e) {
            \Log::error('Error in Admin markAsRead', [
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
     * Mark all Admin notifications as read
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
            \Log::error('Error in Admin markAllAsRead', [
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
     * Get unread count for Admin sidebar
     */
    public function getUnreadCount(Request $request)
    {
        $user = $request->user()->load('employee');
        $employeeId = $user->employee?->employee_id;

        if (!$employeeId) {
            return response()->json(['unread_count' => 0]);
        }

        // Use 'admin' mode filtering
        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'admin');

        return response()->json(['unread_count' => $unreadCount]);
    }
}