<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveCreditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'type',
        'date',
        'year',
        'month',
        'points_deducted',
        'balance_after',
        'remarks',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
