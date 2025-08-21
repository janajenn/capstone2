<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */


public function run(): void
{
    DB::table('employees')->insert([
        [
            'employee_id' => 1,
            'firstname' => 'Jane',
            'middlename' => 'D.',
            'lastname' => 'Doe',
            'gender' => 'female',
            'date_of_birth' => '1990-01-01',
            'position' => 'HR Officer',
            'department_id' => 1,
            'status' => 'active',
            'contact_number' => '09123456789',
            'address' => 'Opol, Misamis Oriental',
            'civil_status' => 'single',
            'biometric_id' => 1001,
            'monthly_salary' => 30000.00,
            'daily_rate' => 1363.64,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
}

}
