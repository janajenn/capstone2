<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */



public function run(): void
{
    DB::table('users')->insert([
        [
            'name' => 'HR Jane',
            'email' => 'hr@example.com',
            'password' => Hash::make('password123'),
            'role' => 'hr',
            'employee_id' => 1, // Assuming employee with ID 1 exists
            'created_at' => now(),
            'updated_at' => now(),
        ],

    ]);
}

}
