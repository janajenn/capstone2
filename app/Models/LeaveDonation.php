<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveDonation extends Model
{
    use HasFactory;

    protected $fillable = [
        'donor_employee_id',
        'recipient_employee_id',
        'days_donated',
        'status',
        'remarks',
        'hr_remarks',
        'hr_approved_by',
        'hr_approved_at',
        'donated_at'
    ];

    protected $casts = [
        'donated_at' => 'datetime',
        'hr_approved_at' => 'datetime',
        'days_donated' => 'integer',
    ];

    public function donor()
    {
        return $this->belongsTo(Employee::class, 'donor_employee_id', 'employee_id');
    }

    public function recipient()
    {
        return $this->belongsTo(Employee::class, 'recipient_employee_id', 'employee_id');
    }

    public function hrApprover()
    {
        return $this->belongsTo(User::class, 'hr_approved_by');
    }

    // Add status helper methods
    public function isPendingHr()
    {
        return $this->status === 'pending_hr';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isCancelled()
    {
        return $this->status === 'cancelled';
    }
}