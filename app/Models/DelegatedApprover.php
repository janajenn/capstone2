<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DelegatedApprover extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_admin_id',
        'to_admin_id',
        'start_date',
        'end_date',
        'status',
        'reason'
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    // Relationships
    public function fromAdmin()
    {
        return $this->belongsTo(User::class, 'from_admin_id');
    }

    public function toAdmin()
    {
        return $this->belongsTo(User::class, 'to_admin_id');
    }

    // Scopes - FIXED
    public function scopeActive($query)
    {
        $today = Carbon::today()->format('Y-m-d');
        return $query->where('status', 'active')
                    ->whereDate('start_date', '<=', $today)  // FIXED: <= instead of <
                    ->whereDate('end_date', '>=', $today);   // FIXED: >= instead of >
    }

    public function scopePast($query)
    {
        $today = Carbon::today()->format('Y-m-d');
        return $query->where(function($q) use ($today) {
            $q->where('status', 'ended')
              ->orWhereDate('end_date', '<', $today);
        });
    }

    public function scopeFuture($query)
    {
        $today = Carbon::today()->format('Y-m-d');
        return $query->where('status', 'active')
                    ->whereDate('start_date', '>', $today);
    }

    // Attributes - FIXED
    public function getIsActiveAttribute()
    {
        $today = Carbon::today()->format('Y-m-d');
        $startDate = $this->start_date->format('Y-m-d');
        $endDate = $this->end_date->format('Y-m-d');
        
        // A delegation is active if today is between start_date and end_date (inclusive)
        return $this->status === 'active' && 
               $today >= $startDate &&  // FIXED: >= instead of >
               $today <= $endDate;      // FIXED: <= instead of <
    }

    public function getIsEndedAttribute()
    {
        $today = Carbon::today()->format('Y-m-d');
        $endDate = $this->end_date->format('Y-m-d');
        
        return $this->status === 'ended' || $today > $endDate;
    }

    public function getIsFutureAttribute()
    {
        $today = Carbon::today()->format('Y-m-d');
        $startDate = $this->start_date->format('Y-m-d');
        
        // A delegation is future if start_date is after today
        return $this->status === 'active' && $today < $startDate; // FIXED: < instead of <=
    }

    public function getStatusLabelAttribute()
    {
        if ($this->is_active) return 'Active';
        if ($this->is_future) return 'Scheduled';
        if ($this->is_ended) return 'Ended';
        return ucfirst($this->status);
    }

    // NEW: Debug method to see what's happening
    public function getDebugInfoAttribute()
    {
        $today = Carbon::today()->format('Y-m-d');
        $startDate = $this->start_date->format('Y-m-d');
        $endDate = $this->end_date->format('Y-m-d');
        
        return [
            'today' => $today,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $this->status,
            'is_active_calculation' => $today . ' >= ' . $startDate . ' && ' . $today . ' <= ' . $endDate,
            'is_active_result' => $today >= $startDate && $today <= $endDate,
            'is_future_calculation' => $today . ' < ' . $startDate,
            'is_future_result' => $today < $startDate,
        ];
    }

    // Methods
    public function canBeCancelledBy(User $user)
    {
        // The from_admin (creator) can cancel
        if ($this->from_admin_id === $user->id) return true;
        
        // The to_admin (delegatee) can cancel if they don't want responsibility
        if ($this->to_admin_id === $user->id) return true;
        
        // Primary admin can cancel any delegation
        if ($user->is_primary && $user->role === 'admin') return true;
        
        return false;
    }

    public function cancel()
    {
        $this->update([
            'status' => 'ended',
            'end_date' => Carbon::today() // End today, not now() to avoid time issues
        ]);
    }
}