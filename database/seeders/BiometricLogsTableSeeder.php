<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BiometricLogsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */


public function run(): void
{
    DB::table('biometric_logs')->insert([
        [
            'log_id' => 1,
            'biometric_id' => 1001,
            'date' => now()->toDateString(),
            'time_in' => '08:05:00',
            'time_out' => '17:10:00',
            'late_minutes' => 5,
            'import_batch' => 'BATCH001',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);
}

}
