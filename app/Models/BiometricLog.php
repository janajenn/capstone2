<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BiometricLog extends Model
{
    use HasFactory;
     protected $fillable = ['biometric_id', 'date', 'time_in', 'time_out', 'late_minutes', 'import_batch'];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'biometric_id', 'biometric_id');
    }
}
