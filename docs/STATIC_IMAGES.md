# Static Images Documentation

This document provides a comprehensive overview of all static images used in the FeedMagix application.

## Image Inventory

### Logo and Branding

#### `public/logo.png` ⭐ **ACTIVE**

- **Purpose**: Main application logo for FeedMagix brand
- **Usage**:
  - Landing page hero section (80x80px)
  - Footer branding (40x40px)
  - Navigation elements
- **Dimensions**: Scalable, optimized for web use
- **Format**: PNG with transparency support
- **Location**:
  - `src/app/page.tsx` (landing page hero and footer)
  - Future: Navigation components, email templates
- **Source**: User-provided logo from `/Users/ashtehrani/Desktop/testdev/logo.png`

## Default Next.js Assets

### File Icon

- **File**: `public/file.svg`
- **Format**: SVG
- **Usage**: File upload interfaces, document representations
- **Description**: Generic file icon for upload areas

### Globe Icon

- **File**: `public/globe.svg`
- **Format**: SVG
- **Usage**: Language selection, international features
- **Description**: Globe icon for global/international features

### Next.js Logo

- **File**: `public/next.svg`
- **Format**: SVG
- **Usage**: Development/about pages (if needed)
- **Description**: Official Next.js framework logo

### Vercel Logo

- **File**: `public/vercel.svg`
- **Format**: SVG
- **Usage**: Deployment attribution (if needed)
- **Description**: Vercel platform logo

### Window Icon

- **File**: `public/window.svg`
- **Format**: SVG
- **Usage**: UI elements, modal representations
- **Description**: Window/modal icon for interface elements

## Fonts Directory

- **Location**: `public/fonts/`
- **Contents**: Custom Persian/Farsi fonts for RTL support
- **Usage**: Typography throughout the application
- **Description**: Contains Shabnam and other Persian fonts for proper RTL text rendering

## Usage Guidelines

### Logo Usage

1. **Size Requirements**:
   - Minimum size: 32x32px
   - Maximum size: 512x512px
   - Recommended sizes: 64px, 128px, 256px

2. **Placement Rules**:
   - Always maintain aspect ratio
   - Provide adequate white space around logo
   - Use on contrasting backgrounds for visibility

3. **Color Variations**:
   - Primary: Full color on light backgrounds
   - Monochrome: For dark backgrounds or single-color applications

### Icon Usage

1. **SVG Icons**:
   - Scalable for all screen sizes
   - Can be styled with CSS
   - Preferred for UI elements

2. **PNG Images**:
   - Use for complex graphics
   - Provide multiple resolutions if needed
   - Optimize for web delivery

## File Naming Convention

- Use lowercase with hyphens: `logo-dark.png`
- Include size in filename if multiple versions: `logo-256.png`
- Use descriptive names: `pet-food-icon.svg`

## Optimization Guidelines

- Compress PNG files without quality loss
- Optimize SVG files by removing unnecessary metadata
- Use WebP format for modern browsers when possible
- Implement lazy loading for non-critical images

## Future Additions

When adding new static images:

1. Update this documentation
2. Follow naming conventions
3. Optimize for web delivery
4. Test on various screen sizes
5. Ensure accessibility compliance
