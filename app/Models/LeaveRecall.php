<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRecall extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_request_id',
        'employee_id',
        'approved_leave_date',
        'status',
        'approved_by_admin',
        'reason'
    ];

    protected $casts = [
        'approved_leave_date' => 'date',
    ];

    /**
     * Get the leave request that this recall is for
     */
    public function leaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id');
    }

    /**
     * Get the employee who requested the recall
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * Get the admin who approved the recall
     */
    public function approvedByAdmin()
    {
        return $this->belongsTo(User::class, 'approved_by_admin');
    }

    /**
     * Scope to get approved recalls
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Check if the recall is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }
}