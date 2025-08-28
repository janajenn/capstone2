<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function employees()
    {
        return $this->hasMany(Employee::class, 'department_id', 'id');
    }

    /**
     * Get the department head user (user with role 'dept_head' in this department)
     */
    public function head()
    {
        return $this->hasOneThrough(
            User::class,
            Employee::class,
            'department_id', // Foreign key on employees table
            'employee_id',   // Foreign key on users table
            'id',            // Local key on departments table
            'employee_id'    // Local key on employees table
        )->where('users.role', 'dept_head');
    }
}
