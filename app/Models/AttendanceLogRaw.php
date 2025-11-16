<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceLogRaw extends Model
{
    use HasFactory;

    protected $table = 'attendance_logs_raw';

    protected $primaryKey = 'id';

    protected $fillable = [
        'employee_id',
        'work_date',
        'schedule_start',
        'schedule_end',
        'time_in',
        'time_out',
        'break_start',
        'break_end',
        'hrs_worked_minutes',
        'late_minutes',
        'remarks',
        'absent',
        'raw_row',
        'import_batch'
    ];

    protected $casts = [
        'work_date' => 'date',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'absent' => 'boolean',
        'raw_row' => 'array',
    ];

    /**
     * Relationship with Employee
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    /**
     * Scope for specific import batch
     */
    public function scopeByBatch($query, $batchId)
    {
        return $query->where('import_batch', $batchId);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('work_date', [$startDate, $endDate]);
    }
}