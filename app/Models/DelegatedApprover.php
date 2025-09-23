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
        'start_date' => 'date',
        'end_date' => 'date',
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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where(function($q) {
            $q->where('status', 'ended')
              ->orWhere('end_date', '<', now());
        });
    }

    public function scopeFuture($query)
    {
        return $query->where('status', 'active')
                    ->where('start_date', '>', now());
    }

    // Attributes
    public function getIsActiveAttribute()
    {
        return $this->status === 'active' && 
               $this->start_date <= now() && 
               $this->end_date >= now();
    }

    public function getIsEndedAttribute()
    {
        return $this->status === 'ended' || $this->end_date < now();
    }

    public function getIsFutureAttribute()
    {
        return $this->status === 'active' && $this->start_date > now();
    }

    public function getStatusLabelAttribute()
    {
        if ($this->is_active) return 'Active';
        if ($this->is_future) return 'Scheduled';
        if ($this->is_ended) return 'Ended';
        return ucfirst($this->status);
    }

    // Methods
    public function canBeCancelledBy(User $user)
    {
        // Only the from_admin (who created the delegation) or primary admin can cancel
        return $this->from_admin_id === $user->id || 
               ($user->is_primary && $user->role === 'admin');
    }

    public function cancel()
    {
        $this->update([
            'status' => 'ended',
            'end_date' => now()
        ]);
    }
}