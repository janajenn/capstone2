<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'head_employee_id', 'status'];

    protected $attributes = [
        'status' => 'active',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class, 'department_id', 'id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'department_id', 'id');
    }

    /**
     * Get the department head (employee)
     */
    public function head()
    {
        return $this->belongsTo(Employee::class, 'head_employee_id', 'employee_id');
    }

    /**
     * Get the department head user
     */
    public function headUser()
    {
        return $this->hasOneThrough(
            User::class,
            Employee::class,
            'department_id',
            'employee_id',
            'id',
            'employee_id'
        )->where('users.role', 'dept_head');
    }

    /**
     * Scope active departments
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope inactive departments
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }
}