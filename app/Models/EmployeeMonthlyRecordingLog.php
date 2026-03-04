<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeMonthlyRecordingLog extends Model
{
    protected $fillable = [
        'recording_id',
        'field',
        'old_value',
        'new_value',
        'user_id',
    ];

    protected $casts = [
        'old_value' => 'float',
        'new_value' => 'float',
    ];

    public function recording(): BelongsTo
    {
        return $this->belongsTo(EmployeeMonthlyRecording::class, 'recording_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}