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
        'new_leave_date_from',
        'new_leave_date_to',
        'reason_for_change',
        'status',
        'approved_by_depthead',
        'approved_by_hr'
    ];

    protected $casts = [
        'approved_leave_date' => 'date',
        'new_leave_date_from' => 'date',
        'new_leave_date_to' => 'date',
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
     * Get the department head who approved/rejected the recall
     */
    public function approvedByDeptHead()
    {
        return $this->belongsTo(User::class, 'approved_by_depthead');
    }

    /**
     * Get the HR who approved/rejected the recall
     */
    public function approvedByHr()
    {
        return $this->belongsTo(User::class, 'approved_by_hr');
    }

    /**
     * Scope to get pending recalls
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved recalls
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get rejected recalls
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Check if the recall is pending
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the recall is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the recall is rejected
     */
    public function isRejected()
    {
        return $this->status === 'rejected';
    }
}
