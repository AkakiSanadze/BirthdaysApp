# BdaysApp Brand Guidelines

## Introduction

BdaysApp is a birthday reminder application that focuses on providing users with a clean, intuitive interface to manage important dates. Our brand identity reflects simplicity, reliability, and friendliness.

## Logo

Our primary logo is the cake icon (🎂) followed by "BdaysApp". The favicon (fevicon.png) serves as our app icon and should be used for all application instances.

### Logo Usage
- Always maintain the original proportions of the logo
- Ensure adequate spacing around the logo (minimum clearance equal to the height of the "B" in BdaysApp)
- Do not distort, recolor, or add effects to the logo

## Color Palette

### Primary Colors

| Name | Light Theme | Dark Theme | Usage |
|------|------------|------------|-------|
| Primary | #787878 | #707070 | Primary UI elements, buttons |
| Primary Light | #989898 | #919191 | Hover states, secondary elements |
| Primary Dark | #585858 | #555555 | Active states, text on light backgrounds |
| Secondary | #949494 | #4a4a4a | Secondary UI elements |
| Accent | #7986cb | #7986cb | Highlights, important actions |

### Functional Colors

| Name | Value | Light Value | Usage |
|------|-------|------------|-------|
| Success | #629063 | #7da883 | Positive actions, confirmations |
| Danger | #a85151 | #bf6c6c | Destructive actions, errors |
| Info | #5c6bc0 | #8e99f3 | Informational elements |
| Warning | #ad9c71 | #c9b88d | Cautionary elements |

### Background Colors

| Name | Light Theme | Dark Theme | Usage |
|------|------------|------------|-------|
| Background | #f8fafc | #121212 | Main application background |
| Surface | #ffffff | #1e1e1e | Cards, dialogs, surfaces |
| Card Background | #ffffff | #2d2d2d | List items, cards |
| Hover | #f1f5f9 | #383838 | Hover state backgrounds |

### Text Colors

| Name | Light Theme | Dark Theme | Usage |
|------|------------|------------|-------|
| Text | #1e293b | #e2e8f0 | Primary text |
| Secondary Text | #475569 | #a0aec0 | Secondary, less important text |
| On Primary | #ffffff | #ffffff | Text on primary colored backgrounds |

## Typography

BdaysApp uses a system font stack to ensure optimal performance and native feel:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title (h1) | 1.75rem | 700 | 1.2 |
| Section Title (h2) | 1.5rem | 600 | 1.3 |
| Subsection Title (h3) | 1.25rem | 600 | 1.4 |
| Body Text | 1rem | 400 | 1.6 |
| Small Text | 0.875rem | 400 | 1.5 |

## UI Components

### Buttons

Buttons use a consistent style with variations for different actions:

#### Primary Button
- Background: var(--primary-color)
- Text: var(--text-on-primary)
- Border: none
- Border Radius: 8px
- Padding: 0.5rem 1rem
- Hover State: var(--primary-light)

#### Secondary Button
- Background: var(--button-bg)
- Text: var(--text-color)
- Border: 1px solid var(--border-color)
- Border Radius: 8px
- Padding: 0.5rem 1rem
- Hover State: var(--button-hover-bg)

#### Danger Button
- Background: var(--danger-color)
- Text: var(--text-on-danger)
- Border: none
- Border Radius: 8px
- Padding: 0.5rem 1rem
- Hover State: var(--danger-light)

### Cards & List Items

- Background: var(--card-bg)
- Border Radius: 8px
- Box Shadow: 0 2px 10px rgba(0, 0, 0, 0.2)
- Padding: 1rem
- Margin Bottom: 0.5rem
- Hover State: var(--hover-color)

### Form Elements

#### Input Fields
- Background: var(--input-bg)
- Border: 1px solid var(--border-color)
- Border Radius: 8px
- Padding: 0.5rem 0.75rem
- Focus State: Border color var(--accent-color)

### Icons & Visual Elements

- Use simple, recognizable emoji for visual indicators
- Maintain consistent sizing (1-1.25em for inline icons)
- Ensure adequate contrast with backgrounds

## Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 600px
  - Tablet: 600px - 768px
  - Desktop: > 768px

## Animation & Transitions

- Standard transition time: 0.3s
- Ease timing function for natural movement
- Subtle animations for state changes (hover, active)
- Avoid excessive motion that may distract users

## Voice & Tone

### Core Values
- Friendly and approachable
- Clear and concise
- Helpful without being intrusive

### Writing Guidelines
- Use simple, direct language
- Focus on user benefits
- Be concise - avoid unnecessary words
- Use second person ("you") when addressing the user

## Accessibility

- Maintain WCAG 2.1 AA compliance standards
- Ensure color contrast meets minimum requirements
- Provide alternative text for all meaningful images
- Support keyboard navigation

## Application

This brand guide should be applied consistently across all aspects of the BdaysApp product, including the web application, marketing materials, and documentation. 