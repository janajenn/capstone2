<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        
        // Transform notifications to include redirect URLs (NEW)
        $transformedNotifications = $notifications->map(function ($notification) {
            return $this->transformNotification($notification);
        });

        $unreadCount = $this->notificationService->getUnreadCountByMode($employeeId, 'hr');

        return response()->json([
            'notifications' => $transformedNotifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Transform notification to include redirect URL (NEW)
     */
    private function transformNotification($notification)
    {
        $data = $notification->data ?? [];
        
        // If redirect_url is already in data, use it
        if (isset($data['redirect_url'])) {
            $redirectUrl = $data['redirect_url'];
        } else {
            // Generate redirect URL based on type and data for HR mode
            $redirectUrl = $this->notificationService->generateRedirectUrl(
                $notification->type, 
                $data, 
                'hr' // Use HR mode
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
            'redirect_url' => $redirectUrl, // ADD THIS
        ];
    }

    /**
     * Handle notification click and redirect (NEW)
     */
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
        
        // Determine redirect URL for HR mode
        if (isset($data['redirect_url'])) {
            $redirectUrl = $data['redirect_url'];
        } else {
            $redirectUrl = $this->notificationService->generateRedirectUrl(
                $notification->type, 
                $data, 
                'hr' // Use HR mode
            );
        }

        // Use Inertia redirect
        return Inertia::location($redirectUrl);
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
                return response()->json([
                    'success' => false, 
                    'error' => 'Employee profile not found for user.'
                ], 400);
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

            return response()->json([
                'success' => false, 
                'error' => 'Failed to mark notification as read'
            ], 400);
            
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
                return response()->json([
                    'success' => false, 
                    'error' => 'Employee profile not found for user.'
                ], 400);
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
                'error' => 'Failed to mark all notifications as read.'
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