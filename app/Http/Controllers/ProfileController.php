<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Employee;

class ProfileController extends Controller
{
    /**
     * Display the user's profile (view-only).
     */
    public function show(Request $request)
    {
        $user = auth()->user();
        
        // Load employee with department and department head
        $employee = Employee::with([
            'department', 
            'department.head' => function($query) {
                $query->select('employee_id', 'firstname', 'lastname');
            }
        ])->find($user->employee_id);
        
        // If employee doesn't exist, create a minimal response
        if (!$employee) {
            $employee = (object)[
                'employee_id' => null,
                'firstname' => $user->name,
                'middlename' => null,
                'lastname' => '',
                'gender' => null,
                'date_of_birth' => null,
                'civil_status' => null,
                'contact_number' => null,
                'address' => null,
                'position' => null,
                'status' => 'active',
                'monthly_salary' => null,
                'daily_rate' => null,
                'department' => null,
            ];
        }
        
        return Inertia::render('Profile/Show', [
            'auth' => [
                'user' => $user,
                'role' => $user->role,
            ],
            'user' => $user,
            'employee' => $employee,
        ]);
    }
}