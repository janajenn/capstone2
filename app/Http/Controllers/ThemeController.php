<?php

// app/Http/Controllers/ThemeController.php
namespace App\Http\Controllers;

use App\Models\Theme;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ThemeController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

   
    public function create()
    {
        // Check if user is HR or Admin
        if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
            abort(403, 'Unauthorized access. HR and Admin only.');
        }

        return Inertia::render('Themes/Create');
    }

    public function store(Request $request)
    {
        // Check if user is HR or Admin
        if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
            abort(403, 'Unauthorized access. HR and Admin only.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'config' => 'nullable|array',
        ]);

        Theme::create([
            'name' => $request->name,
            'description' => $request->description,
            'config' => $request->config,
            'is_active' => $request->is_active ?? false
        ]);

        return redirect()->route('themes.index')
            ->with('success', 'Theme created successfully.');
    }

    public function edit(Theme $theme)
    {
        // Check if user is HR or Admin
        if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
            abort(403, 'Unauthorized access. HR and Admin only.');
        }

        return Inertia::render('Themes/Edit', [
            'theme' => $theme
        ]);
    }

    public function update(Request $request, Theme $theme)
    {
        // Check if user is HR or Admin
        if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
            abort(403, 'Unauthorized access. HR and Admin only.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'config' => 'nullable|array',
        ]);

        $theme->update([
            'name' => $request->name,
            'description' => $request->description,
            'config' => $request->config,
            'is_active' => $request->is_active ?? $theme->is_active
        ]);

        return redirect()->route('themes.index')
            ->with('success', 'Theme updated successfully.');
    }

    
        public function index()
        {
            if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
                abort(403, 'Unauthorized access. HR and Admin only.');
            }
    
            $themes = Theme::latest()->get();
            
            return Inertia::render('Themes/Index', [
                'themes' => $themes,
                'activeTheme' => Theme::getActiveTheme()
            ]);
        }
    
        public function activate(Theme $theme)
        {
            if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
                abort(403, 'Unauthorized access. HR and Admin only.');
            }
    
            // Deactivate all themes first (including default)
            Theme::where('is_active', true)->update(['is_active' => false]);
            
            // Activate the selected theme
            $theme->update(['is_active' => true]);
            
            // Clear cache to ensure fresh theme loading
            Cache::forget('active_theme');
    
            return back()->with('success', "Theme '{$theme->name}' activated successfully!");
        }
    
        public function deactivate(Theme $theme)
        {
            if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
                abort(403, 'Unauthorized access. HR and Admin only.');
            }
    
            // Prevent deactivating Default theme
            if (strtolower($theme->name) === 'default') {
                return back()->with('error', 'Cannot deactivate Default theme. It is the system fallback.');
            }
    
            $theme->update(['is_active' => false]);
            
            // Activate Default theme automatically
            $defaultTheme = Theme::where('name', 'Default')->first();
            if ($defaultTheme) {
                $defaultTheme->update(['is_active' => true]);
            }
            
            // Clear cache
            Cache::forget('active_theme');
    
            return back()->with('success', "Theme '{$theme->name}' deactivated. Default theme is now active.");
        }
    
        public function destroy(Theme $theme)
        {
            if (!in_array(auth()->user()->role, ['hr', 'admin'])) {
                abort(403, 'Unauthorized access. HR and Admin only.');
            }
    
            // Prevent deleting Default theme
            if (strtolower($theme->name) === 'default') {
                return back()->with('error', 'Cannot delete Default theme. It is the system fallback.');
            }
    
            if ($theme->is_active) {
                return back()->with('error', 'Cannot delete active theme. Please deactivate it first.');
            }
    
            $theme->delete();
            Cache::forget('active_theme');
    
            return redirect()->route('themes.index')
                ->with('success', 'Theme deleted successfully.');
        }
    
       
    
}