<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Employee;

class LeaveCredit extends Model
{
    use HasFactory;

     protected $fillable = [
        'employee_id',
        'sl_balance',
        'vl_balance',
        'last_updated',
        'remarks',
    ];
    protected $casts = [
        'last_updated' => 'datetime',
    ];



public function employee()
{
    return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
}


}
