<?php

namespace App\Models;
use App\Models\LeaveCredit;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
     protected $fillable = ['name', 'email', 'password', 'role', 'employee_id', 'is_primary'];


     public function canLogIn()
     {
         // If user doesn't have an employee record, allow login (for non-employee users)
         if (!$this->employee) {
             return true;
         }
 
         // Check if the linked employee is active
         return $this->employee->status === 'active';
     }
 


    public function employee()
{
    return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
}


    public function approvals()
    {
        return $this->hasMany(LeaveApproval::class, 'approved_by', 'id');
    }


    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

   

    public function deptHeadApprovals()
    {
        return $this->hasMany(LeaveRecall::class, 'approved_by_depthead');
    }

    public function hrApprovals()
    {
        return $this->hasMany(LeaveRecall::class, 'approved_by_hr');
    }

    public function leaveCredit()
    {
        return $this->hasOneThrough(LeaveCredit::class, Employee::class, 'employee_id', 'employee_id', 'employee_id', 'employee_id');
    }

    // App\Models\User.php




    public static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if ($user->is_primary && $user->role === 'admin') {
                // Remove primary status from other admins
                self::where('is_primary', true)->where('role', 'admin')->update(['is_primary' => false]);
            }
        });

        static::updating(function ($user) {
            if ($user->is_primary && $user->role === 'admin' && $user->isDirty('is_primary')) {
                // Remove primary status from other admins
                self::where('is_primary', true)
                    ->where('role', 'admin')
                    ->where('id', '!=', $user->id)
                    ->update(['is_primary' => false]);
            }
            
            // If role is changed from admin to something else, remove primary status
            if ($user->isDirty('role') && $user->role !== 'admin' && $user->is_primary) {
                $user->is_primary = false;
            }
        });
    }

    // Make this method STATIC
    public static function getCurrentApprover()
    {
        // Check for currently active delegation (started and not ended)
        $activeDelegation = \App\Models\DelegatedApprover::active()->first();
        
        if ($activeDelegation) {
            return $activeDelegation->toAdmin;
        }
    
        // If no active delegation, check primary admin
        $primaryAdmin = self::where('role', 'admin')->where('is_primary', true)->first();
        return $primaryAdmin;
    }

    // Instance method to check if this user is the current active approver
    public function isActiveApprover()
    {
        $currentApprover = self::getCurrentApprover();
        return $currentApprover && $currentApprover->id === $this->id;
    }

    // Check if this user can delegate approval
    public function canDelegateApproval()
    {
        return $this->isActiveApprover() && $this->role === 'admin';
    }

    // Get active delegation from this user (if any)
    public function activeDelegationFrom()
    {
        return $this->hasOne(DelegatedApprover::class, 'from_admin_id')
            ->active()
            ->with('toAdmin');
    }

    // Get active delegation to this user (if any)
    public function activeDelegationTo()
    {
        return $this->hasOne(DelegatedApprover::class, 'to_admin_id')
            ->active()
            ->with('fromAdmin');
    }

    // Get all admins except this user
    public function getOtherAdmins()
    {
        return self::where('role', 'admin')
            ->where('id', '!=', $this->id)
            ->get();
    }

    // Get primary admin (static method)
    public static function getPrimaryAdmin()
    {
        return self::where('role', 'admin')->where('is_primary', true)->first();
    }




    use Notifiable;

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_primary' => 'boolean',
    ];
}
