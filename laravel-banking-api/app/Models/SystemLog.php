<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'action', 'entity_type', 'entity_id', 'changes', 'ip_address', 'user_agent', 'status', 'description'])]
class SystemLog extends Model
{
    use HasFactory;

    protected $table = 'system_logs';

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'changes',
        'ip_address',
        'user_agent',
        'status',
        'description',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    /**
     * Create a system log entry.
     */
    public static function record($user, string $action, string $status = 'success', ?string $description = null, ?string $entityType = null, $entityId = null, array $changes = []): self
    {
        $userId = $user instanceof User ? $user->id : $user;

        return self::create([
            'user_id' => $userId,
            'action' => strtoupper($action),
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'changes' => $changes,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'status' => $status,
            'description' => $description,
        ]);
    }

    /**
     * Get the user associated with the log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
