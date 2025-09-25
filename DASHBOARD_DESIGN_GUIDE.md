# PlaySquad Dashboard Design Guide

**Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** Design Standard for All Pages

This document establishes the design standards and patterns used in the PlaySquad dashboard that should be consistently applied across all pages in the application.

## 🎨 Design Philosophy

PlaySquad follows a **modern, sports-focused design** with:
- **Professional orange accents** as the primary brand color
- **Glass morphism effects** for modern, layered UI
- **Mobile-first responsive design**
- **Clean, minimal aesthetic** with excellent readability
- **Consistent spacing and typography**

## 🖼️ Visual Layout Structure

### Global Background
```scss
background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%);
```
- **Medium gray gradient** providing good contrast
- **Ensures text readability** across all content
- **Professional appearance** without being too dark or too light

### Main Container
```scss
.main-content {
  max-width: 1200px;
  margin: auto;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
```
- **Centered white container** creating clear content boundaries
- **Rounded corners** for modern appearance
- **Subtle shadow** for depth and visual separation
- **Responsive margins** for mobile adaptability

## 🧭 Navigation Header

**⚠️ CRITICAL REQUIREMENT: The navigation header (toolbar) must be included on EVERY page in the application. No exceptions.**

### Structure
```html
<header class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <div class="brand-logo">
        <img src="assets/playsquad-logo.png" alt="PlaySquad Logo">
      </div>
      <span class="brand-text">PlaySquad</span>
    </div>
    <div class="nav-actions">
      <!-- Wallet, Admin, User Profile -->
    </div>
  </div>
</header>
```

### Universal Navigation Requirements
- **MANDATORY on all pages**: Login, dashboard, clubs, events, profile, admin, etc.
- **Consistent positioning**: Always sticky at the top (`position: sticky; top: 0`)
- **High z-index**: `z-index: 1000` to stay above all other content
- **Complete functionality**: All navigation actions must work from any page

### Styling Standards
```scss
.navbar {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(251, 146, 60, 0.3); // Orange accent
}
```

### Brand Elements
- **Official Logo**: 40x40px with proper aspect ratio
- **Brand Text**: Orange gradient (`#fb923c` to `#f59e0b`)
- **Height**: 72px on desktop, 64px on mobile

### Navigation Actions
1. **Coin Wallet Button**
   - Green gradient background
   - Shows coin balance (hidden label on mobile)
   - Links to `/wallet`

2. **Admin Button** (if applicable)
   - Orange gradient background
   - Only visible for admin users
   - Links to `/admin/coin-requests`

3. **User Profile**
   - Avatar: 36px circle with user initial
   - User name and role (hidden on mobile)
   - Orange logout button

## 🦸 Hero Section

### Layout
```scss
.hero-section {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(34, 197, 94, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(251, 146, 60, 0.3);
  padding: 2rem;
  border-radius: 16px;
  backdrop-filter: blur(20px);
}
```

### Content Structure
1. **User Avatar**: Large 80-96px avatar with status indicator
2. **Welcome Message**: 
   - "Welcome back, [Name]!" with orange highlight on name
   - Achievement text + motivational subtitle
3. **Action Buttons**: 
   - Primary: "Find Clubs" (blue gradient)
   - Secondary: "Browse Events" (outlined)
   - **Always in one row** (including mobile)

## 📊 Statistics Cards

### Grid Layout
```scss
.stats-grid {
  grid-template-columns: repeat(2, 1fr); // 2 cards per row on mobile
  gap: 0.75rem; // Compact mobile spacing
  
  @include lg {
    grid-template-columns: repeat(4, 1fr); // 4 cards on desktop
  }
}
```

### Card Styling
```scss
.stat-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 1.5rem;
  min-height: 120px;
}
```

### Color Themes
1. **Clubs**: Green gradient (`#22c55e` to `#16a34a`)
2. **Games**: Orange gradient (`#fb923c` to `#f59e0b`)
3. **Skill**: Orange gradient (`#f97316` to `#ea580c`)
4. **Win Rate**: Orange gradient (`#fb923c` to `#f59e0b`)

### Typography
- **Numbers**: Dark text (`#1e293b`) for maximum contrast
- **Labels**: Medium gray (`#475569`) for hierarchy

## 🃏 Content Cards

### Structure
```scss
.content-card {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%);
  border: 1px solid rgba(251, 146, 60, 0.2);
  backdrop-filter: blur(20px);
}
```

### Header Design
- **Titles**: Black text (`#000000`) for maximum readability
- **Badges**: Count indicators with primary styling
- **Actions**: "View All" links with arrow icons

### List Items
```scss
.list-item {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  border: 1px solid rgba(251, 146, 60, 0.3);
  
  &:hover {
    border-color: rgba(251, 146, 60, 0.8);
    box-shadow: 0 8px 25px rgba(251, 146, 60, 0.2);
  }
}
```

## 📱 Responsive Breakpoints

### Mobile (< 640px)
- **Navigation**: Compact spacing, hidden text labels
- **Stats**: 2 cards per row with reduced gap
- **Hero**: Centered content, maintained button row
- **Cards**: Single column layout

### Tablet (640px - 1024px)
- **Stats**: 2 cards per row
- **Content**: 2 cards per row
- **Increased padding and spacing**

### Desktop (> 1024px)
- **Stats**: 4 cards per row
- **Content**: 3 cards per row
- **Full spacing and typography scale**

## 🎨 Color Palette

### Primary Orange Theme
```scss
$orange-primary: #fb923c;
$orange-secondary: #f59e0b;
$orange-light: rgba(251, 146, 60, 0.1);
$orange-border: rgba(251, 146, 60, 0.3);
```

### Supporting Colors
```scss
$green-accent: #22c55e;
$blue-accent: #3b82f6;
$text-primary: #1e293b;
$text-secondary: #475569;
```

### Glass Morphism Effects
```scss
$glass-background: rgba(255, 255, 255, 0.2);
$glass-border: rgba(255, 255, 255, 0.3);
$backdrop-blur: blur(20px);
```

## 🔤 Typography Standards

### Headings
- **H1**: Hero titles with orange highlights
- **H2**: Card titles in black (`#000000`)
- **H3**: Section headers
- **Font Family**: Poppins for headings, Inter for body text

### Body Text
- **Primary**: Dark gray (`#1e293b`)
- **Secondary**: Medium gray (`#475569`)
- **Metadata**: Lighter gray for supplementary info

## 🎯 Interactive Elements

### Buttons
1. **Primary**: Orange gradient with white text
2. **Secondary**: Outlined with hover effects
3. **Ghost**: Transparent with subtle hover
4. **Icon Buttons**: Circular with orange accents

### Hover States
- **Cards**: Lift effect with enhanced shadow
- **Buttons**: Color intensification and elevation
- **Links**: Orange color transition

### Focus States
- **Orange outline** for accessibility compliance
- **Clear visual feedback** for keyboard navigation

## ♿ Accessibility Standards

### Color Contrast
- **Text on white**: Minimum 4.5:1 ratio
- **Important text**: Black (`#000000`) for maximum contrast
- **Secondary text**: Dark gray (`#475569`) maintaining readability

### Interactive Elements
- **Focus indicators**: Always visible and consistent
- **Touch targets**: Minimum 44px for mobile interaction
- **Alt text**: All images include descriptive alt attributes

## 📐 Spacing System

### Scale (based on 8px grid)
```scss
$space-1: 0.25rem; // 4px
$space-2: 0.5rem;  // 8px
$space-3: 0.75rem; // 12px
$space-4: 1rem;    // 16px
$space-6: 1.5rem;  // 24px
$space-8: 2rem;    // 32px
```

### Application
- **Card padding**: `$space-6` (24px)
- **Grid gaps**: `$space-4` desktop, `$space-3` mobile
- **Section margins**: `$space-8` (32px)

## 🛠️ Implementation Guidelines

### CSS Architecture
1. **Use SCSS variables** from `_variables.scss`
2. **Apply mixins** from `_mixins.scss` for consistency
3. **Follow BEM methodology** for class naming
4. **Mobile-first responsive design**

### Component Structure
```
component.ts
├── Template (HTML)
├── Styles (SCSS)
└── Logic (TypeScript)
```

### Glass Morphism Implementation
```scss
.glass-element {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}
```

## 🔄 Consistency Checklist

When implementing new pages, ensure:

- [ ] **Navigation header included** (MANDATORY - no exceptions)
- [ ] Orange accent color used appropriately
- [ ] Glass morphism effects applied to cards
- [ ] White main container with centered layout
- [ ] Consistent navigation header structure and functionality
- [ ] Mobile-responsive grid layouts
- [ ] Proper typography hierarchy
- [ ] Accessibility standards met
- [ ] Hover and focus states implemented
- [ ] Consistent spacing using design system
- [ ] Logo and branding elements included

## 📋 Design Patterns to Follow

### Navigation
- **ALWAYS include the complete navigation header on every page**
- Always include the official PlaySquad logo
- Maintain orange branding throughout
- Show coin balance on all authenticated pages
- Orange logout button for consistency
- Ensure all navigation functionality works from any page context

### Content Layout
- Hero section with user context when applicable
- Statistics or key metrics in grid format
- Main content in cards with orange accents
- Action buttons following established hierarchy

### Cards and Components
- Glass morphism background effects
- Orange border accents
- Consistent padding and spacing
- Hover effects with elevation and color enhancement

### Mobile Optimization
- Touch-friendly interface elements
- Appropriate information density
- Maintained visual hierarchy
- Accessible interaction patterns

---

**Note**: This design guide should be referenced for all new pages and components in the PlaySquad application to maintain visual consistency and user experience quality across the platform.