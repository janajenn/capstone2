<?php
// app/Models/LeaveRescheduleRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRescheduleRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_leave_request_id',
        'employee_id',
        'proposed_dates',
        'reason',
        'status',
        'hr_remarks',
        'dept_head_remarks', // Department Head remarks
        'hr_reviewed_by',
        'dept_head_reviewed_by', // Department Head who reviewed
        'processed_by',
        'hr_reviewed_at',
        'dept_head_reviewed_at',
        'processed_at'
    ];

    protected $casts = [
        'proposed_dates' => 'array',
        'submitted_at' => 'datetime',
        'hr_reviewed_at' => 'datetime',
        'dept_head_reviewed_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function originalLeaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'original_leave_request_id');
    }

    
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function hrReviewedBy()
    {
        return $this->belongsTo(User::class, 'hr_reviewed_by');
    }

    public function deptHeadReviewedBy()
    {
        return $this->belongsTo(User::class, 'dept_head_reviewed_by');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Check if requester is dept head or admin (bypass approvals)
    public function isRequesterDeptHeadOrAdmin()
    {
        $user = $this->employee->user;
        return $user && in_array($user->role, ['dept_head', 'admin']);
    }

    // Check if reschedule is pending HR
    public function isPendingHr()
    {
        return $this->status === 'pending_hr';
    }

    // Check if reschedule is pending Department Head
    public function isPendingDeptHead()
    {
        return $this->status === 'pending_dept_head';
    }

    // Check if reschedule is approved
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    // Get status badge color
    public function getStatusColor()
    {
        return match($this->status) {
            'approved' => 'success',
            'rejected' => 'danger',
            'pending_hr' => 'warning',
            'pending_dept_head' => 'orange',
            default => 'secondary'
        };
    }

    // Get status text for display
    public function getStatusText()
    {
        return match($this->status) {
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'pending_hr' => 'Pending HR',
            'pending_dept_head' => 'Pending Department Head',
            default => $this->status
        };
    }
}