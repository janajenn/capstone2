<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function markAsRead()
    {
        \Log::info('Marking notification as read in model', [
            'notification_id' => $this->id,
            'employee_id' => $this->employee_id,
            'was_read' => $this->is_read
        ]);

        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        \Log::info('Notification marked as read in model - after update', [
            'notification_id' => $this->id,
            'employee_id' => $this->employee_id,
            'is_read' => $this->is_read
        ]);
    }

    public function getFormattedCreatedAtAttribute()
    {
        return $this->created_at->diffForHumans();
    }
}
