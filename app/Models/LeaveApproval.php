<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveApproval extends Model
{
    use HasFactory;

    protected $fillable = ['leave_id', 'approved_by', 'role', 'status', 'remarks', 'approved_at', 'signature_image', 'comments'];

    public function leaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_id', 'id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by', 'id');
    }
}
