<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;   

class Theme extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'config',
        'is_active',
        'is_default'
    ];

    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean'
    ];

    protected static function booted()
    {
        static::creating(function ($theme) {
            $theme->slug = Str::slug($theme->slug ?: $theme->name);
        });

        static::created(function ($theme) {
            if (self::count() === 1) {
                $theme->update(['is_default' => true, 'is_active' => true]);
            }
        });

        static::updating(function ($theme) {
            if ($theme->isDirty('is_active') && $theme->is_active) {
                self::where('id', '!=', $theme->id)->update(['is_active' => false]);
            }
        });
    }

    public function activate()
    {
        $this->update(['is_active' => true]);
    }

    public function deactivate()
    {
        // Don't deactivate Default theme
        if (strtolower($this->name) === 'default') {
            return false;
        }

        $this->update(['is_active' => false]);
        
        // Check if any theme is active
        $activeTheme = self::where('is_active', true)->first();
        
        // If no theme is active, activate Default
        if (!$activeTheme) {
            $defaultTheme = self::where('name', 'Default')->first();
            if ($defaultTheme) {
                $defaultTheme->update(['is_active' => true]);
            }
        }
        
        Cache::forget('active_theme');
        
        return true;
    }

    // Get active theme - always returns a theme
    public static function getActiveTheme()
    {
        return Cache::remember('active_theme', 3600, function () {
            // First try to get active theme
            $activeTheme = self::where('is_active', true)->first();
            
            // If no active theme, get Default theme
            if (!$activeTheme) {
                $activeTheme = self::where('name', 'Default')->first();
                
                // If Default exists but isn't active, activate it
                if ($activeTheme && !$activeTheme->is_active) {
                    $activeTheme->update(['is_active' => true]);
                }
            }
            
            // If still no theme, get the first theme and make it default
            if (!$activeTheme) {
                $activeTheme = self::first();
                if ($activeTheme) {
                    $activeTheme->update([
                        'is_active' => true,
                        'name' => 'Default'
                    ]);
                }
            }
            
            return $activeTheme;
        });
    }
}