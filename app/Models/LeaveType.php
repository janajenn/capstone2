<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'earnable', 'deductible', 'document_required'];


    public function leaveBalances()
    {
        return $this->hasMany(LeaveBalance::class, 'leave_type', 'code');
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'leave_type_id', 'id');
    }

    public function creditConversions()
    {
        return $this->hasMany(CreditConversion::class, 'leave_type', 'code');
    }
}
