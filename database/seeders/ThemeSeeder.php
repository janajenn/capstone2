<?php
// database/seeders/ThemeSeeder.php
namespace Database\Seeders;

use App\Models\Theme;
use Illuminate\Database\Seeder;

class ThemeSeeder extends Seeder
{
    public function run()
    {
        $themes = [
            [
                'name' => 'Default',
                'slug' => 'default',
                'description' => 'Clean professional theme',
                'config' => [
                    'backgroundColor' => '#ffffff',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Streamline your leave requests, approvals, and tracking with our intuitive system.',
                    'buttonText' => 'Get Started Now',
                    'buttonColor' => '#000000',
                    'imageUrl' => '',
                    'textColor' => '#000000',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Valentines',
                'slug' => 'valentines',
                'description' => 'Love-themed design for February',
                'config' => [
                    'backgroundColor' => '#fee2e2',
                    'headline' => 'Spread Love & Efficiency',
                    'subtext' => 'Happy Valentines Day! Work with love in your heart',
                    'buttonText' => 'Join with Love',
                    'buttonColor' => '#dc2626',
                    'imageUrl' => '',
                    'textColor' => '#7f1d1d',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'Summer',
                'slug' => 'summer',
                'description' => 'Bright and sunny summer theme',
                'config' => [
                    'backgroundColor' => '#fef3c7',
                    'headline' => 'Summer Vibes Are Here!',
                    'subtext' => 'Make this summer your most productive yet',
                    'buttonText' => 'Start Summer Journey',
                    'buttonColor' => '#f59e0b',
                    'imageUrl' => '',
                    'textColor' => '#92400e',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'Fiesta',
                'slug' => 'fiesta',
                'description' => 'Festive Philippine fiesta theme',
                'config' => [
                    'backgroundColor' => '#fef3c7',
                    'headline' => 'Happy Fiesta Opolanons!',
                    'subtext' => 'Celebrating community and productivity',
                    'buttonText' => 'Join the Celebration',
                    'buttonColor' => '#dc2626',
                    'imageUrl' => '',
                    'textColor' => '#7f1d1d',
                ],
                'is_active' => false,
            ],
            // NEW THEMES ADDED BELOW
            [
                'name' => 'Halloween',
                'slug' => 'halloween',
                'description' => 'Spooky Halloween theme with ghosts and pumpkins',
                'config' => [
                    'backgroundColor' => '#1a1a2e',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Boo! Managing leaves shouldn\'t be scary',
                    'buttonText' => 'Get Started',
                    'buttonColor' => '#f97316',
                    'imageUrl' => '',
                    'textColor' => '#f97316',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'Christmas',
                'slug' => 'christmas',
                'description' => 'Festive Christmas theme with snow and ornaments',
                'config' => [
                    'backgroundColor' => '#0c4a6e',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Season\'s Greetings! May your holidays be filled with joy',
                    'buttonText' => 'Get Started',
                    'buttonColor' => '#dc2626',
                    'imageUrl' => '',
                    'textColor' => '#dc2626',
                ],
                'is_active' => false,
            ],
            [
                'name' => 'New Year',
                'slug' => 'new-year',
                'description' => 'Celebratory New Year theme with fireworks',
                'config' => [
                    'backgroundColor' => '#0f172a',
                    'headline' => 'INTEGRATED LEAVE MANAGEMENT SYSTEM',
                    'subtext' => 'Cheers to new beginnings! Start the year right',
                    'buttonText' => 'Start New Year Right',
                    'buttonColor' => '#fbbf24',
                    'imageUrl' => '',
                    'textColor' => '#fbbf24',
                ],
                'is_active' => false,
            ],
        ];

        // Check if themes already exist to avoid duplicates
        foreach ($themes as $themeData) {
            // Check by slug first
            $existingTheme = Theme::where('slug', $themeData['slug'])->first();
            
            if (!$existingTheme) {
                // Check by name as backup
                $existingTheme = Theme::where('name', $themeData['name'])->first();
            }
            
            if (!$existingTheme) {
                Theme::create($themeData);
                $this->command->info("Theme '{$themeData['name']}' created.");
            } else {
                // Update existing theme with new data
                $existingTheme->update($themeData);
                $this->command->info("Theme '{$themeData['name']}' updated.");
            }
        }
    }
}