<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    DB::table('departments')->insert([
        ['name' => 'Human Resources', 'created_at' => now(), 'updated_at' => now()],
        ['name' => 'IT Department', 'created_at' => now(), 'updated_at' => now()],
        ['name' => 'Finance', 'created_at' => now(), 'updated_at' => now()],
    ]);
}
}
