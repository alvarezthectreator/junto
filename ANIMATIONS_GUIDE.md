# Modern Animation System - Complete Guide

## 🎨 Overview

Your app now has a comprehensive, performance-optimized animation system with:
- **25+ CSS keyframe animations** for smooth transitions
- **15+ Framer Motion variants** for complex interactive animations
- **Reusable animated components** (Button, Skeleton, Toast)
- **Scroll-triggered animations** for engaging content reveals
- **Mobile-friendly animations** with reduced-motion support
- **Premium feel with optimized performance**

---

## 📋 CSS Animation Utilities

All CSS animations are defined in `src/index.css` and configured in `tailwind.config.js`.

### Available CSS Classes

#### **Fade Animations**
```html
<!-- Fade in from transparent -->
<div class="animate-fadeIn">Content</div>

<!-- Fade in and slide up -->
<div class="animate-fadeInUp">Content</div>

<!-- Fade in and slide down -->
<div class="animate-fadeInDown">Content</div>
```

#### **Slide Animations**
```html
<!-- Slide up with fade -->
<div class="animate-slideUp">Content</div>

<!-- Slide in from left with fade -->
<div class="animate-slideIn">Content</div>

<!-- Slide in from right with fade -->
<div class="animate-slideInRight">Content</div>
```

#### **Scale Animations**
```html
<!-- Scale in with fade -->
<div class="animate-scaleIn">Content</div>
```

#### **Loading & Spinner**
```html
<!-- Spinning loader -->
<div class="spinner">⚙️</div>

<!-- Pulse effect -->
<div class="animate-pulseGlow">Loading...</div>

<!-- Shimmer skeleton -->
<div class="skeleton">Content</div>
```

#### **Hover Effects**
```html
<!-- Card lifts on hover -->
<div class="hover-lift">Hover me</div>

<!-- Scale up on hover -->
<div class="hover-scale">Hover me</div>

<!-- Glow effect on hover -->
<div class="hover-glow">Hover me</div>
```

#### **Interactive Effects**
```html
<!-- Button ripple on click -->
<button class="btn-ripple">Click me</button>

<!-- Button press effect -->
<button class="btn-press">Click me</button>

<!-- Link with animated underline -->
<a class="link-hover">Link</a>
```

---

## 🎬 Framer Motion Variants

Pre-configured animation variants in `src/utils/animations.ts` for use with Framer Motion.

### Basic Usage

```typescript
import { fadeInUp, slideIn, scaleIn } from '../utils/animations';
import { motion } from 'framer-motion';

// Using a predefined variant
<motion.div {...fadeInUp}>
  Content
</motion.div>

// Or destructure the properties
<motion.div
  initial={fadeInUp.initial}
  animate={fadeInUp.animate}
  transition={fadeInUp.transition}
>
  Content
</motion.div>
```

### Available Variants

| Variant | Description |
|---------|-------------|
| `fadeIn` | Simple opacity fade (0.6s) |
| `fadeInUp` | Fade in while sliding up |
| `fadeInDown` | Fade in while sliding down |
| `slideUp` | Slide up with fade |
| `slideIn` | Slide in from left |
| `slideInRight` | Slide in from right |
| `scaleIn` | Scale in with fade |
| `scaleInBig` | Larger scale in with spring |
| `hoverLift` | Card lifts on hover |
| `hoverScale` | Item scales on hover |
| `hoverGlow` | Golden glow on hover |
| `tapScale` | Item scales on click |
| `tapPress` | Pressed effect on click |

### Stagger Animations (Multiple Items)

```typescript
import { staggerContainer, staggerItem, cardContainer, cardItem } from '../utils/animations';

<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {items.map((item, index) => (
    <motion.div key={index} variants={staggerItem}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Scroll Animations (Viewport)

```typescript
import { scrollFadeIn, scrollSlideIn, scrollScaleIn } from '../utils/animations';

// Content fades in when it scrolls into view
<motion.section {...scrollFadeIn}>
  <h2>Section Title</h2>
  <p>This fades in when you scroll to it!</p>
</motion.section>

// Using utility function with custom delay
import { getScrollAnimation } from '../utils/animations';

<motion.div {...getScrollAnimation(0.2)}>
  Slides in with 0.2s delay
</motion.div>
```

### Modal & Dropdown Animations

```typescript
import { modalBackdrop, modalContent, dropdownMenu } from '../utils/animations';
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div {...modalBackdrop} className="fixed inset-0 bg-black/50" />
      
      {/* Modal content */}
      <motion.div {...modalContent} className="modal-box">
        Modal content here
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## 🧩 Animated Components

Pre-built animated components ready to use:

### AnimatedButton

```typescript
import { AnimatedButton } from '../components/AnimatedButton';

// Primary button (default)
<AnimatedButton>Create account</AnimatedButton>

// Different variants
<AnimatedButton variant="secondary">Secondary</AnimatedButton>
<AnimatedButton variant="outline">Outline</AnimatedButton>
<AnimatedButton variant="ghost">Ghost</AnimatedButton>

// Different sizes
<AnimatedButton size="sm">Small</AnimatedButton>
<AnimatedButton size="md">Medium</AnimatedButton>
<AnimatedButton size="lg">Large</AnimatedButton>

// Loading state
<AnimatedButton isLoading>Loading...</AnimatedButton>
```

### Skeleton Loading

```typescript
import { Skeleton, CardSkeleton, ListSkeleton } from '../components/Skeleton';

// Individual skeletons
<Skeleton variant="card" />
<Skeleton variant="avatar" />
<Skeleton variant="text" width="70%" />
<Skeleton variant="image" count={3} />

// Pre-built layouts
<CardSkeleton />
<ListSkeleton />
```

### Toast Notifications

```typescript
import { useToast, ToastProvider } from '../components/Toast';

// Wrap your app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// Use toast anywhere in your app
function MyComponent() {
  const { addToast } = useToast();

  return (
    <>
      <button onClick={() => addToast('Success!', 'success')}>
        Show Success
      </button>
      <button onClick={() => addToast('Error occurred', 'error')}>
        Show Error
      </button>
      <button onClick={() => addToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => addToast('Warning!', 'warning')}>
        Show Warning
      </button>
    </>
  );
}
```

---

## 🎯 Animation Patterns & Best Practices

### 1. Page Transitions

```typescript
import { motion } from 'framer-motion';

export function Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      Page content
    </motion.div>
  );
}
```

### 2. Card Grid with Stagger

```typescript
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }}
>
  {cards.map((card, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="hover-lift"
    >
      {card.content}
    </motion.div>
  ))}
</motion.div>
```

### 3. Scroll-Triggered Animations

```typescript
import { scrollFadeIn } from '../utils/animations';

<motion.section {...scrollFadeIn}>
  <h2>Appears when scrolled into view</h2>
</motion.section>
```

### 4. Hover Button Effects

```typescript
<motion.button
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="hover-lift"
>
  Interactive Button
</motion.button>
```

### 5. Image Zoom on Hover

```typescript
<motion.img
  whileHover={{ scale: 1.08 }}
  transition={{ duration: 0.4 }}
  className="img-zoom"
  src="image.jpg"
  alt="Zoomable"
/>
```

---

## ⚡ Performance Optimization

All animations are optimized for performance:

1. **GPU Acceleration**: Transforms and opacity are GPU-accelerated
2. **Will-change**: Strategic use of `will-change` property
3. **Reduced Motion**: Respects `prefers-reduced-motion` system setting
4. **Memoization**: Use React.memo for animated components
5. **Lazy Loading**: Load heavy animations only when visible

### Check Reduced Motion Support

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Use simpler animations if user prefers reduced motion
<motion.div
  animate={{ opacity: 1 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.6
  }}
>
  Content
</motion.div>
```

---

## 🎨 CSS Classes Quick Reference

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-fadeIn` | Fade in | 0.6s |
| `animate-fadeInUp` | Fade + slide up | 0.6s |
| `animate-slideUp` | Slide up | 0.6s |
| `animate-scaleIn` | Scale + fade | 0.4s |
| `hover-lift` | Lift on hover | 0.3s |
| `hover-scale` | Scale on hover | 0.3s |
| `hover-glow` | Glow on hover | 0.3s |
| `btn-ripple` | Ripple effect | 0.6s |
| `btn-press` | Press effect | 0.15s |
| `link-hover` | Underline animation | 0.3s |
| `spinner` | Spinning loader | 1s (infinite) |
| `animate-pulseGlow` | Pulse effect | 2s (infinite) |
| `skeleton` | Shimmer loading | 2s (infinite) |

---

## 🚀 Advanced Techniques

### Dynamic Stagger Delays

```typescript
import { getStaggeredAnimation } from '../utils/animations';

{items.map((item, index) => (
  <motion.div key={index} {...getStaggeredAnimation(index, 0.1)}>
    {item.name}
  </motion.div>
))}
```

### Conditional Animations

```typescript
<motion.div
  animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Conditional content
</motion.div>
```

### Gesture Animations

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.3)' }}
>
  Gesture Button
</motion.button>
```

---

## 📱 Mobile Considerations

All animations are mobile-friendly:
- ✅ Touch-optimized interactions
- ✅ Smooth 60fps on mobile devices
- ✅ No jank or stuttering
- ✅ Accessible animations
- ✅ Respects system motion preferences

---

## 🔧 Customization

### Create Custom Variant

```typescript
// In src/utils/animations.ts
export const customVariant = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: {
    type: 'spring',
    stiffness: 260,
    damping: 20
  }
};

// Use it
<motion.div {...customVariant}>Content</motion.div>
```

### Adjust Animation Speed

```typescript
// Increase duration for slower animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1 }} // Default is 0.6
>
  Slower animation
</motion.div>
```

---

## ✨ Summary

Your animation system provides:
- **Smooth, modern feel** with 60fps performance
- **Reusable components** for consistency
- **Mobile-optimized** interactions
- **Accessibility support** for motion preferences
- **Easy to implement** across your entire app
- **Professional polish** without complexity

Happy animating! 🚀
