<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 
        'leave_type_id', 
        'date_from', 
        'date_to',
        'selected_dates',
        'total_days', // ADDED
        'reason', 
        'status', 
        'attachment_path', 
        'days_with_pay', 
        'days_without_pay',
        'is_dept_head_request', // ADD THIS
        'rescheduled_at',
        'reschedule_history'
    ];

    protected $casts = [
        'selected_dates' => 'array',
        'reschedule_history' => 'array',
        'rescheduled_at' => 'datetime'
    ];



    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }

    public function approvals()
    {
        return $this->hasMany(LeaveApproval::class, 'leave_id');
    }

    public function details()
    {
        return $this->hasMany(LeaveRequestDetail::class, 'leave_request_id');
    }

    public function recalls()
    {
        return $this->hasMany(LeaveRecall::class, 'leave_request_id');
    }


// app/Models/LeaveRequest.php - Add these methods

// In LeaveRequest model
public function rescheduleRequests()
{
    return $this->hasMany(LeaveRescheduleRequest::class, 'original_leave_request_id');
}


public function latestReschedule()
{
    return $this->hasOne(LeaveRescheduleRequest::class, 'original_leave_request_id')->latest();
}

public function hasRescheduleHistory()
{
    return $this->rescheduleRequests()->exists();
}

public function isRescheduled()
{
    return $this->rescheduleRequests()->where('status', 'approved')->exists();
}

public function getRescheduleHistoryAttribute()
{
    return $this->rescheduleRequests()->orderBy('created_at', 'desc')->get();
}


    /**
     * Check if leave request is rescheduled
     */
    public function getIsRescheduledAttribute()
    {
        return $this->status === 'rescheduled' || 
               !empty($this->reschedule_history) ||
               $this->rescheduleRequests()->where('status', 'approved')->exists();
    }

    /**
     * Get the most recent rescheduled dates
     */
    public function getRescheduledDatesAttribute()
    {
        if ($this->is_rescheduled) {
            // First check reschedule history
            if (!empty($this->reschedule_history)) {
                $history = $this->reschedule_history;
                $latestReschedule = end($history);
                return $latestReschedule['new_dates'] ?? null;
            }
            
            // Fallback to approved reschedule request
            $latestReschedule = $this->rescheduleRequests()
                ->where('status', 'approved')
                ->orderBy('processed_at', 'desc')
                ->first();
            
            if ($latestReschedule) {
                return [
                    'date_from' => $latestReschedule->proposed_dates[0] ?? null,
                    'date_to' => $latestReschedule->proposed_dates[count($latestReschedule->proposed_dates) - 1] ?? null,
                    'total_days' => count($latestReschedule->proposed_dates)
                ];
            }
        }
        
        return null;
    }

    /**
     * Get original dates before any rescheduling
     */
    public function getOriginalDatesAttribute()
    {
        if ($this->is_rescheduled && !empty($this->reschedule_history)) {
            $history = $this->reschedule_history;
            $firstReschedule = $history[0];
            return $firstReschedule['original_dates'] ?? null;
        }
        
        return [
            'date_from' => $this->date_from,
            'date_to' => $this->date_to,
            'total_days' => $this->total_days
        ];
    }

    /**
     * Get display dates - shows rescheduled dates if available, otherwise current dates
     */
    public function getDisplayDatesAttribute()
    {
        if ($this->is_rescheduled) {
            $rescheduled = $this->rescheduled_dates;
            if ($rescheduled) {
                return $rescheduled;
            }
        }
        
        return [
            'date_from' => $this->date_from,
            'date_to' => $this->date_to,
            'total_days' => $this->total_days
        ];
    }
    /**
     * Get reschedule history in readable format
     */
    public function getReadableRescheduleHistoryAttribute()
    {
        if (empty($this->reschedule_history)) {
            return [];
        }

        return collect($this->reschedule_history)->map(function ($entry) {
            return [
                'reschedule_id' => $entry['reschedule_id'] ?? null,
                'original_dates' => $entry['original_dates']['date_from'] . ' to ' . $entry['original_dates']['date_to'],
                'new_dates' => $entry['new_dates']['date_from'] . ' to ' . $entry['new_dates']['date_to'],
                'reason' => $entry['reason'] ?? 'No reason provided',
                'rescheduled_at' => \Carbon\Carbon::parse($entry['rescheduled_at'])->format('M d, Y g:i A'),
                'approver_role' => $entry['approver_role'] ?? 'Unknown',
                'remarks' => $entry['remarks'] ?? 'No remarks'
            ];
        })->toArray();
    }

    

}
