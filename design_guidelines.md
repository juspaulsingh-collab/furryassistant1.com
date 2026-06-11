# 🐾 Furry Assistant 1 - Design Guidelines

## Design Approach

**Hybrid Strategy**: Drawing from health tracking apps (MyFitnessPal, Apple Health) for data-dense interfaces combined with playful, warm pet care aesthetics (Rover, BringFido). The design balances professional functionality with approachable, pet-friendly warmth.

**Core Principles**:
- Clarity first: Health and medication data must be immediately scannable
- Emotional connection: Playful touches that celebrate pet ownership
- Mobile-optimized: Touch-friendly targets, thumb-zone considerations
- Dual interface: Consistent design language across mobile app and admin portal

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) - clean, readable for data and forms
- Accent: Poppins (Google Fonts) - friendly, rounded for headers and CTAs

**Hierarchy**:
- H1: Poppins Bold, 28px (mobile) / 36px (desktop) - Screen titles
- H2: Poppins SemiBold, 22px / 28px - Section headers
- H3: Poppins Medium, 18px / 22px - Card titles, subsections
- Body: Inter Regular, 16px / 18px - Primary content
- Small: Inter Regular, 14px - Metadata, captions
- Micro: Inter Medium, 12px - Labels, timestamps

## Layout System

**Spacing Units**: Tailwind units of **2, 3, 4, 6, 8, 12, 16**
- Common patterns: p-4, gap-6, mb-8, space-y-4
- Card padding: p-6
- Section spacing: py-12 (mobile), py-16 (desktop)
- Container max-width: max-w-7xl with px-4 gutters

**Grid Structure**:
- Mobile: Single column, full-width cards
- Tablet: 2-column for cards, statistics
- Desktop: 3-4 column grids for dashboards, activity cards
- Admin portal: Sidebar navigation (240px) + main content area

## Component Library

### Navigation
**Mobile Bottom Tab Bar**: 5 primary tabs with icons
- Home (dashboard icon)
- Pets (paw icon)
- Activities (location pin icon)
- Health (medical cross icon)
- More (menu icon)

**Admin Web Navigation**: Fixed left sidebar with sections for Users, Analytics, Feature Usage, Access Management

### Core UI Elements

**Cards**: Rounded corners (rounded-2xl), subtle shadows, white backgrounds with hover lift effect
- Pet Profile Cards: Large circular pet photo (96px), name, breed, quick stats
- Health Record Cards: Date badge, title, 4-photo grid preview, expandable details
- Activity Cards: Icon + metric + trend indicator

**Buttons**:
- Primary: Rounded-xl, bold text, full-width on mobile
- Secondary: Outlined variant
- Icon buttons: Circular (rounded-full) for actions
- Floating Action Button: Fixed bottom-right for quick add actions

**Photo Upload Zones**: 4-slot grid layout (2x2) with dashed borders, camera icon placeholders, tap to upload

**Forms**:
- Floating labels for inputs
- Rounded-lg input fields
- Inline validation with icons
- Grouped sections with subtle dividers

### Dashboard Components

**Stat Cards**: Grid of key metrics (2x2 mobile, 4 columns desktop)
- Large number display
- Label + trend indicator
- Icon in branded accent area

**Reminder List**: Card-based timeline with priority indicators (red dot for urgent, yellow for upcoming)

**Activity Feed**: Chronological cards with timestamps, icons, and expandable details

### Data Displays

**Charts**: For admin analytics and pet activity tracking
- Line charts for trends (weight, activity over time)
- Donut charts for expense categories
- Bar charts for feature usage analytics

**Tables**: For admin portal user lists
- Sortable columns, search filter, pagination
- Badge indicators for user tier (Free/Premium)
- Action menu dropdown per row

### Map Integration

**Local Services View**: 
- Full-screen map with category filter chips at top
- Location markers with category icons
- Bottom sheet with service details, contact buttons
- List/Map toggle

### Overlays

**Modals**: Centered on desktop, slide-up on mobile, rounded-t-3xl, with drag handle
**Photo Viewer**: Full-screen overlay with swipe navigation, close button
**Share Sheet**: Native-style bottom sheet with sharing options

## Images

**Pet Photos**: Critical throughout app
- Profile photos: Circular crops, 96px standard, 160px large view
- Health record attachments: Square thumbnails in 2x2 grid, tap to expand full-screen
- Medication photos: Same 2x2 grid treatment
- Gallery views: Masonry layout for multiple pet photos

**Icons**: Use Heroicons for UI elements (medical, location, activity) and custom paw illustrations for pet-specific actions

**Empty States**: Friendly illustrations of pets with encouraging messages ("Add your first furry friend!", "No medications yet - keeping healthy!")

**Admin Portal**: Charts, graphs, and data visualizations - no decorative imagery needed

**Hero/Marketing** (if creating landing page): Large hero image of happy pet owner with pet, lifestyle photography showing app in use

---

**Overall Aesthetic**: Clean, modern interface with playful accents. Rounded corners throughout, generous whitespace, soft shadows. Pet-themed color accents used sparingly (icons, badges, CTAs) while keeping data areas neutral and professional. The design should feel trustworthy for health tracking while maintaining warmth and joy of pet ownership.