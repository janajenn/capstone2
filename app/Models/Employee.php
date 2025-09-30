<?php

namespace App\Models;
use App\Models\LeaveCredits;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

     protected $fillable = [
        'employee_id', 'firstname', 'middlename', 'lastname', 'gender',
        'date_of_birth', 'position', 'department_id', 'status',
        'contact_number', 'address', 'civil_status', 'biometric_id',
        'monthly_salary', 'daily_rate'
    ];

    protected $primaryKey = 'employee_id';
protected $keyType = 'int';
public $incrementing = true;

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }



    public function leaveCredit() // ← SINGULAR
{
    return $this->hasOne(LeaveCredit::class, 'employee_id', 'employee_id');
}

// Keep this as plural if you want to track historical leave credits
public function leaveCredits()
{
    return $this->hasMany(LeaveCredit::class, 'employee_id', 'employee_id');
}

    public function leaveBalances()
    {
        return $this->hasMany(LeaveBalance::class, 'employee_id', 'employee_id');
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id', 'employee_id');
    }

    public function creditConversions()
    {
        return $this->hasMany(CreditConversion::class, 'employee_id', 'employee_id');
    }

   public function user()
{
    return $this->hasOne(User::class, 'employee_id', 'employee_id');
}


    public function credentials()
    {
        return $this->hasOne(EmployeeCredential::class, 'employee_id', 'employee_id');
    }

    public function monthlyCreditLogs()
    {
        return $this->hasMany(MonthlyCreditLog::class, 'employee_id', 'employee_id');
    }

    public function biometricLogs()
    {
        return $this->hasMany(BiometricLog::class, 'biometric_id', 'biometric_id');
    }

    public function leaveCreditLogs()
{
    return $this->hasMany(LeaveCreditLog::class);
}

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'employee_id', 'employee_id');
    }

    public function unreadNotifications()
    {
        return $this->notifications()->unread();
    }

    public function leaveRecalls()
    {
        return $this->hasMany(LeaveRecall::class, 'employee_id', 'employee_id');
    }
}
