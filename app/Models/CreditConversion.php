<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditConversion extends Model
{
    use HasFactory;

    protected $primaryKey = 'conversion_id';
    
    protected $fillable = [
        'employee_id',
        'leave_type',
        'credits_requested',
        'equivalent_cash',
        'status',
        'submitted_at',
        'hr_approved_by',
        'hr_approved_at',
        'hr_remarks',
        'dept_head_approved_by',
        'dept_head_approved_at',
        'dept_head_remarks',
        'admin_approved_by',
        'admin_approved_at',
        'admin_remarks',
        'employee_remarks',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'hr_approved_at' => 'datetime',
        'dept_head_approved_at' => 'datetime',
        'admin_approved_at' => 'datetime',
        'credits_requested' => 'decimal:2',
        'equivalent_cash' => 'decimal:2',
    ];

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function hrApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_approved_by');
    }

    public function deptHeadApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dept_head_approved_by');
    }

    public function adminApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_approved_by');
    }

    // Status helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isHrApproved(): bool
    {
        return $this->status === 'hr_approved';
    }

    public function isDeptHeadApproved(): bool
    {
        return $this->status === 'dept_head_approved';
    }

    public function isFullyApproved(): bool
    {
        return $this->status === 'admin_approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function getCurrentApproverRole(): string
    {
        return match($this->status) {
            'pending' => 'hr',
            'hr_approved' => 'dept_head',
            'dept_head_approved' => 'admin',
            default => 'completed'
        };
    }

    public function getStatusDisplay(): string
    {
        return match($this->status) {
            'pending' => 'Pending HR Review',
            'hr_approved' => 'Approved by HR - Pending Dept Head',
            'dept_head_approved' => 'Approved by Dept Head - Pending Admin',
            'admin_approved' => 'Fully Approved - Ready for Processing',
            'rejected' => 'Rejected',
            default => $this->status
        };
    }

    // Scope methods
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeHrApproved($query)
    {
        return $query->where('status', 'hr_approved');
    }

    public function scopeDeptHeadApproved($query)
    {
        return $query->where('status', 'dept_head_approved');
    }

    public function scopeFullyApproved($query)
    {
        return $query->where('status', 'admin_approved');
    }

    public function scopeForYear($query, $year = null)
    {
        $year = $year ?? now()->year;
        return $query->whereYear('submitted_at', $year);
    }
}