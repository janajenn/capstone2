<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AttendanceLog extends Model
{
    use HasFactory;

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
        'raw_row'
    ];

    protected $casts = [
        'work_date' => 'date',
        'schedule_start' => 'datetime:H:i:s',
        'schedule_end' => 'datetime:H:i:s',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'break_start' => 'datetime:H:i:s',
        'break_end' => 'datetime:H:i:s',
        'absent' => 'boolean',
        'raw_row' => 'array'
    ];

    /**
     * Get the employee that owns the attendance log.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    // ADD THESE ACCESSORS:

    public function leaveCreditLogs(): HasMany
    {
        return $this->hasMany(LeaveCreditLog::class, 'employee_id', 'employee_id')
            ->whereDate('date', $this->work_date)
            ->where('remarks', 'like', '%Late%');
    }

    /**
     * Alternative: More generic relationship to all leave credit logs for this employee
     */
    public function employeeLeaveCreditLogs(): HasMany
    {
        return $this->hasMany(LeaveCreditLog::class, 'employee_id', 'employee_id');
    }


    /**
     * Get formatted schedule start time
     */
    public function getScheduleStartFormattedAttribute()
    {
        return $this->schedule_start ? $this->schedule_start->format('g:i A') : null;
    }

    /**
     * Get formatted schedule end time
     */
    public function getScheduleEndFormattedAttribute()
    {
        return $this->schedule_end ? $this->schedule_end->format('g:i A') : null;
    }

    /**
     * Get formatted schedule range
     */
    public function getScheduleFormattedAttribute()
    {
        if (!$this->schedule_start || !$this->schedule_end) {
            return 'No schedule';
        }
        return "{$this->schedule_start_formatted} - {$this->schedule_end_formatted}";
    }

    /**
     * Get formatted time in
     */
    public function getTimeInFormattedAttribute()
    {
        return $this->time_in ? $this->time_in->format('g:i A') : null;
    }

    /**
     * Get formatted time out
     */
    public function getTimeOutFormattedAttribute()
    {
        return $this->time_out ? $this->time_out->format('g:i A') : null;
    }

    /**
     * Get formatted break start time
     */
    public function getBreakStartFormattedAttribute()
    {
        return $this->break_start ? $this->break_start->format('g:i A') : null;
    }

    /**
     * Get formatted break end time
     */
    public function getBreakEndFormattedAttribute()
    {
        return $this->break_end ? $this->break_end->format('g:i A') : null;
    }

    /**
     * Get formatted break range
     */
    public function getBreakFormattedAttribute()
    {
        if (!$this->break_start || !$this->break_end) {
            return 'No break';
        }
        return "{$this->break_start_formatted} - {$this->break_end_formatted}";
    }

    /**
     * Get formatted hours worked
     */
    public function getHrsWorkedFormattedAttribute()
    {
        if (!$this->hrs_worked_minutes) return '0:00';
        
        $hours = floor($this->hrs_worked_minutes / 60);
        $mins = $this->hrs_worked_minutes % 60;
        return "{$hours}:" . str_pad($mins, 2, '0', STR_PAD_LEFT);
    }

    /**
     * Get formatted late minutes
     */
    public function getLateFormattedAttribute()
    {
        return $this->late_minutes > 0 ? $this->late_minutes . ' mins' : 'On Time';
    }

    /**
     * Get attendance status
     */
    public function getStatusAttribute()
    {
        if ($this->absent) {
            return 'Absent';
        }
        
        if (!$this->time_in && !$this->time_out) {
            return 'No Time Records';
        }
        
        if ($this->late_minutes > 0) {
            return 'Late';
        }
        
        return 'Present';
    }

    /**
     * Calculate hours worked in decimal format
     */
    public function getHoursWorkedAttribute()
    {
        if (!$this->hrs_worked_minutes) {
            return 0;
        }
        return round($this->hrs_worked_minutes / 60, 2);
    }

    /**
     * Check if employee was late
     */
    public function getIsLateAttribute()
    {
        return $this->late_minutes > 0;
    }

    /**
     * Check if employee was absent
     */
    public function getIsAbsentAttribute()
    {
        return $this->absent || (!$this->time_in && !$this->time_out);
    }
}