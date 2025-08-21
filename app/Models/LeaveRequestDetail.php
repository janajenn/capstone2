<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequestDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_request_id',
        'field_name',
        'field_value',
    ];

    public function leaveRequest()
    {
        return $this->belongsTo(LeaveRequest::class, 'leave_request_id', 'id');
    }
}
