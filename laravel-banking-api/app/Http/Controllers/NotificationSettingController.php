<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationSettingController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function show(Request $request)
    {
        $settings = $this->notificationService->getOrCreateSettings($request->user());
        return response()->json(['data' => $this->format($settings)]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate(['transaction_notifications' => ['nullable', 'boolean'], 'login_notifications' => ['nullable', 'boolean'], 'security_notifications' => ['nullable', 'boolean']]);
        $settings = $this->notificationService->getOrCreateSettings($request->user());
        $settings->update([
            'email_transactions' => $validated['transaction_notifications'] ?? $settings->email_transactions,
            'email_security_alerts' => $validated['security_notifications'] ?? $settings->email_security_alerts,
            'sms_transactions' => $validated['transaction_notifications'] ?? $settings->sms_transactions,
            'sms_security_alerts' => $validated['security_notifications'] ?? $settings->sms_security_alerts,
            'in_app_notifications' => $validated['transaction_notifications'] ?? $settings->in_app_notifications,
        ]);
        return response()->json(['message' => 'Notification settings updated', 'data' => $this->format($settings->fresh(), $validated['login_notifications'] ?? true)]);
    }

    private function format(object $settings, bool $loginNotifications = true): array
    {
        return ['transaction_notifications' => (bool) $settings->email_transactions || (bool) $settings->sms_transactions || (bool) $settings->in_app_notifications, 'login_notifications' => $loginNotifications, 'security_notifications' => (bool) $settings->email_security_alerts || (bool) $settings->sms_security_alerts || (bool) $settings->in_app_notifications];
    }
}
