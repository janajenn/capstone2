
<?php 

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            $table->decimal('points_deducted', 6, 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('leave_credit_logs', function (Blueprint $table) {
            $table->decimal('points_deducted', 5, 2)->change();
        });
    }
};
