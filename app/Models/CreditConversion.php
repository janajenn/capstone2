<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

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
        'approved_at',
        'approved_by',
        'remarks'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'credits_requested' => 'decimal:2',
        'equivalent_cash' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type', 'code');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by', 'id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForYear($query, $year = null)
    {
        $year = $year ?? Carbon::now()->year;
        return $query->whereYear('submitted_at', $year);
    }
}
