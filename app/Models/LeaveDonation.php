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
        'donated_at'
    ];

    protected $casts = [
        'donated_at' => 'datetime',
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

    
}