<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get all notifications for authenticated user.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $notifications = $this->notificationService->getNotifications(
            $request->user(),
            $validated['limit'] ?? 50
        );

        return response()->json([
            'data' => $notifications->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'is_read' => (bool) $notification->is_read,
                    'created_at' => $notification->created_at?->toISOString(),
                ];
            })->values(),
            'count' => $notifications->count(),
        ]);
    }

    /**
     * Get a specific notification.
     */
    public function show(Request $request, int $notificationId)
    {
        $notification = $request->user()->notifications()->where('id', $notificationId)->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        return response()->json([
            'data' => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'data' => $notification->data,
                'is_read' => (bool) $notification->is_read,
                'created_at' => $notification->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get unread notifications.
     */
    public function unread(Request $request)
    {
        $notifications = $this->notificationService->getUnreadNotifications($request->user());

        return response()->json([
            'notifications' => $notifications,
            'count' => $notifications->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return response()->json([
            'message' => 'All notifications marked as read',
            'count' => $count,
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, int $notificationId)
    {
        $notification = $request->user()->notifications()
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'data' => $notification->data,
                'is_read' => true,
            ],
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, int $notificationId)
    {
        $notification = $request->user()->notifications()
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        $this->notificationService->deleteNotification($notification);

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }

}
