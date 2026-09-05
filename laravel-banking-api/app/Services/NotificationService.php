<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\User;

class NotificationService
{
    /**
     * Send a notification to a user.
     */
    public function notify(User $user, string $type, string $title, string $message, array $data = null): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Get unread notifications for a user.
     */
    public function getUnreadNotifications(User $user)
    {
        return $user->notifications()
            ->where('is_read', false)
            ->latest()
            ->get();
    }

    /**
     * Get all notifications for a user.
     */
    public function getNotifications(User $user, int $limit = 50)
    {
        return $user->notifications()
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): int
    {
        return $user->notifications()
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(Notification $notification): bool
    {
        return $notification->delete();
    }

    /**
     * Get or create notification settings for a user.
     */
    public function getOrCreateSettings(User $user): NotificationSetting
    {
        return $user->notificationSettings()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'email_transactions' => true,
                'email_security_alerts' => true,
                'email_promotions' => false,
                'sms_transactions' => false,
                'sms_security_alerts' => true,
                'in_app_notifications' => true,
            ]
        );
    }

    /**
     * Update notification settings.
     */
    public function updateSettings(User $user, array $settings): NotificationSetting
    {
        $notificationSettings = $this->getOrCreateSettings($user);
        $notificationSettings->update($settings);
        return $notificationSettings;
    }

    /**
     * Determine if a user should receive transaction notifications.
     */
    public function shouldNotifyTransaction(User $user): bool
    {
        $settings = $this->getOrCreateSettings($user);
        return $settings->email_transactions || $settings->sms_transactions || $settings->in_app_notifications;
    }

    /**
     * Determine if a user should receive security alert notifications.
     */
    public function shouldNotifySecurityAlert(User $user): bool
    {
        $settings = $this->getOrCreateSettings($user);
        return $settings->email_security_alerts || $settings->sms_security_alerts || $settings->in_app_notifications;
    }
}
