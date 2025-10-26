<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    protected $table = 'holidays';

    // Fields that can be mass-assigned
    protected $fillable = [
        'name',
        'date',
        'type',
    ];

    // Optional: cast 'date' as Carbon instance
    protected $casts = [
        'date' => 'date',
    ];

    // Optional: define enum values as a helper
    public const TYPES = ['Regular Holiday', 'Special Non-working Holiday'];
}
