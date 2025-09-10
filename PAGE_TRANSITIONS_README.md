# Page Transition System for Laravel + React Inertia App

This document explains how to use the new page transition system that provides smooth, consistent animations across all pages in your HR and Employee portals.

## 🚀 Features

- **10+ Animation Types**: Fade, slide, scale, zoom, bounce, rotate, and flip effects
- **Customizable Timing**: Adjustable duration and delay for all transitions
- **Global & Local Control**: Set app-wide defaults or override per component
- **Performance Optimized**: Efficient animations with proper cleanup
- **Accessibility**: Respects user preferences for reduced motion
- **Responsive**: Works seamlessly across all device sizes

## 📁 File Structure

```
resources/js/Components/
├── PageTransition.jsx          # Core transition component
├── AdvancedPageTransition.jsx  # Advanced transition with page change detection
├── TransitionManager.jsx       # Advanced transition manager
├── TransitionDemo.jsx          # Demo component for testing
├── TransitionExamples.jsx      # Practical examples
└── usePageTransition.js        # Custom hook for transition state

resources/css/
└── transitions.css             # Custom CSS animations

resources/js/Layouts/
├── HRLayout.jsx               # Updated with transitions
├── EmployeeLayout.jsx         # Updated with transitions
├── AdminLayout.jsx            # Updated with transitions
├── DeptHeadLayout.jsx         # Updated with transitions
└── AuthenticatedLayout.jsx    # Updated with transitions
```

## 🎯 Quick Start

### 1. Basic Usage

The system is already integrated into your app. All pages will automatically have smooth fade-in with slide-up animations.

### 2. Use in Layouts

In any layout file, wrap your content with the PageTransition component:

```jsx
import PageTransition from '@/Components/PageTransition';

<PageTransition 
    animation="fade-slide-up"
    duration={400}
    delay={100}
    className="p-6"
>
    {children}
</PageTransition>
```

### 3. Advanced Transitions

For more sophisticated transitions that detect page changes:

```jsx
import AdvancedPageTransition from '@/Components/AdvancedPageTransition';

<AdvancedPageTransition 
    animation="fade-scale"
    duration={300}
    delay={100}
    className="p-6"
>
    {children}
</AdvancedPageTransition>
```

## 🎨 Available Animations

### Basic Transitions
- `fade-slide-up` - Fade in with upward slide (default)
- `fade-slide-down` - Fade in with downward slide
- `fade-slide-left` - Fade in with leftward slide
- `fade-slide-right` - Fade in with rightward slide

### Advanced Effects
- `fade-scale` - Fade in with scale effect
- `fade-zoom` - Fade in with zoom effect
- `slide-up-bounce` - Slide up with bounce
- `slide-down-bounce` - Slide down with bounce
- `fade-rotate` - Fade in with rotation
- `fade-flip` - Fade in with 3D flip

## ⚙️ Configuration Options

### Duration
- **Range**: 150ms - 1000ms
- **Default**: 500ms
- **Recommended**: 300ms - 700ms for smooth feel

### Delay
- **Range**: 0ms - 300ms
- **Default**: 150ms
- **Use Case**: Add delay for staggered effects

### Stagger
- **Range**: 0ms - 500ms
- **Use Case**: Animate child elements sequentially

## 🔧 Advanced Usage

### 1. Using TransitionManager Directly

For more complex animations, use the TransitionManager component:

```jsx
import TransitionManager from '@/Components/TransitionManager';

<TransitionManager
    animation="fade-flip"
    duration={700}
    delay={200}
    stagger={100}
>
    <div>Your content here</div>
</TransitionManager>
```

### 2. Page Change Detection

For transitions that respond to page navigation:

```jsx
import AdvancedPageTransition from '@/Components/AdvancedPageTransition';

<AdvancedPageTransition
    animation="fade-scale"
    duration={500}
    delay={150}
>
    {children}
</AdvancedPageTransition>
```

### 2. Staggered Animations

Create sequential animations for lists or grids:

```jsx
<div className="stagger-children">
    <div className="card">Card 1</div>
    <div className="card">Card 2</div>
    <div className="card">Card 3</div>
</div>
```

### 3. Custom CSS Animations

Add your own animations in `resources/css/transitions.css`:

```css
@keyframes customAnimation {
    from {
        opacity: 0;
        transform: translateY(50px) rotate(45deg);
    }
    to {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
    }
}
```

## 🎭 Layout-Specific Transitions

### HR Portal
- **Animation**: `fade-slide-up`
- **Duration**: 400ms
- **Delay**: 100ms
- **Effect**: Professional, smooth transitions

### Employee Portal
- **Animation**: `fade-slide-up`
- **Duration**: 400ms
- **Delay**: 100ms
- **Effect**: Consistent with HR portal

### Admin Portal
- **Animation**: `fade-slide-up`
- **Duration**: 400ms
- **Delay**: 100ms
- **Effect**: Clean, efficient transitions

### Department Head Portal
- **Animation**: `fade-slide-up`
- **Duration**: 400ms
- **Delay**: 100ms
- **Effect**: Smooth, professional feel

## 🧪 Testing & Demo

### 1. Transition Demo Page

Use the `TransitionDemo` component to test all animations:

```jsx
import TransitionDemo from '@/Components/TransitionDemo';

// In any page
<TransitionDemo />
```

### 2. Browser DevTools

- Open DevTools → Performance tab
- Record page transitions
- Check for smooth 60fps animations

### 3. Accessibility Testing

- Test with reduced motion preferences
- Verify keyboard navigation works
- Check screen reader compatibility

## 🚨 Troubleshooting

### Common Issues

#### 1. Animations Not Working
- Check if `PageTransition` component is properly imported in layouts
- Verify CSS is properly imported
- Check browser console for errors

#### 2. Performance Issues
- Reduce animation duration
- Use simpler animations for mobile
- Check for heavy DOM operations

#### 3. Layout Breaking
- Ensure proper CSS classes
- Check for conflicting transitions
- Verify responsive breakpoints

### Debug Mode

Enable debug logging in the console:

```jsx
// In PageTransition component
console.log('Transition state:', { isVisible, currentComponent });
```

## 📱 Mobile Optimization

### Best Practices
- Use shorter durations (200ms - 400ms)
- Avoid complex animations on low-end devices
- Test on various mobile devices
- Consider reduced motion preferences

### Performance Tips
- Use `transform` and `opacity` properties
- Avoid animating `height`, `width`, or `margin`
- Use `will-change` CSS property sparingly
- Implement proper cleanup in useEffect

## 🔮 Future Enhancements

### Planned Features
- [ ] Route-based animation mapping
- [ ] Gesture-based transitions
- [ ] Advanced easing functions
- [ ] Animation presets for different content types
- [ ] Performance monitoring dashboard

### Customization Ideas
- [ ] Brand-specific animations
- [ ] Seasonal transition themes
- [ ] User preference storage
- [ ] A/B testing for different animations

## 📚 Resources

### Documentation
- [Tailwind CSS Transitions](https://tailwindcss.com/docs/transition-property)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [React Transition Group](https://reactcommunity.org/react-transition-group/)

### Performance
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Performance](https://developers.google.com/web/fundamentals/design-and-ux/animations)

## 🤝 Contributing

### Adding New Animations
1. Add animation to `animations` object in `TransitionManager.jsx`
2. Create corresponding CSS keyframes in `transitions.css`
3. Test across different browsers and devices
4. Update documentation

### Reporting Issues
1. Check browser console for errors
2. Verify component hierarchy
3. Test with different animation types
4. Provide reproduction steps

---

**Note**: This transition system is designed to enhance user experience without compromising performance. Always test thoroughly and consider user preferences for reduced motion.
