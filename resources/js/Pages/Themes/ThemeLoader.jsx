import React from 'react';

// Import all theme components
import DefaultTheme from './Default';
import ValentinesTheme from './Valentines';
import SummerTheme from './Summer';
import FiestaTheme from './Fiesta';
import HalloweenTheme from './Halloween';
import ChristmasTheme from './Christmas';
import NewYearTheme from './NewYear';

export default function ThemeLoader({ themeName }) {
    const getThemeComponent = () => {
        const themeMap = {
            'valentines': ValentinesTheme,
            'summer': SummerTheme,
            'fiesta': FiestaTheme,
            'halloween': HalloweenTheme,
            'christmas': ChristmasTheme,
            'newyear': NewYearTheme,
            'new year': NewYearTheme, // Alternative name
            'default': DefaultTheme,
        };

        const normalizedName = themeName?.toLowerCase() || 'default';
        return themeMap[normalizedName] || DefaultTheme;
    };

    const ThemeComponent = getThemeComponent();

    return <ThemeComponent />;
}