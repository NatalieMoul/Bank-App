<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'email_transactions', 'email_security_alerts', 'email_promotions', 'sms_transactions', 'sms_security_alerts', 'in_app_notifications'])]
class NotificationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_transactions',
        'email_security_alerts',
        'email_promotions',
        'sms_transactions',
        'sms_security_alerts',
        'in_app_notifications',
    ];

    protected $casts = [
        'email_transactions' => 'boolean',
        'email_security_alerts' => 'boolean',
        'email_promotions' => 'boolean',
        'sms_transactions' => 'boolean',
        'sms_security_alerts' => 'boolean',
        'in_app_notifications' => 'boolean',
    ];

    /**
     * Get the user that owns the settings.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
