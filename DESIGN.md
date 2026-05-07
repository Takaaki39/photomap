---
name: Photo Mapping System
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e8'
  on-surface: '#181c20'
  on-surface-variant: '#424753'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f7'
  outline: '#727785'
  outline-variant: '#c2c6d5'
  surface-tint: '#005ac1'
  primary: '#0058bd'
  on-primary: '#ffffff'
  primary-container: '#2771df'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006e2c'
  on-secondary: '#ffffff'
  secondary-container: '#86f898'
  on-secondary-container: '#00722f'
  tertiary: '#b51b15'
  on-tertiary: '#ffffff'
  tertiary-container: '#d9372b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#89fa9b'
  secondary-fixed-dim: '#6ddd81'
  on-secondary-fixed: '#002108'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930004'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#dfe3e8'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  margin-desktop: 24px
  gutter: 16px
---

## Brand & Style

The design system is rooted in the **Corporate/Modern** aesthetic with heavy influences from **Minimalism**. It prioritizes utility, clarity, and the spatial relationship between geographical data and visual memories. The brand personality is professional yet inviting—acting as a high-performance tool that recedes into the background to let user-generated photography take center stage.

The goal is to evoke a sense of organized exploration. By utilizing generous whitespace and a restricted color palette, the UI reduces cognitive load, allowing the vibrant colors of the photographs to provide the primary visual stimulus. It is designed to feel native across Web, Android, and iOS, adhering to familiar platform conventions while maintaining a distinct, cohesive identity.

## Colors

The palette is anchored by **Map Blue (#4285F4)**, used for primary actions, navigation states, and core branding. To facilitate visual storytelling, a vibrant **Action Green (#34A853)** is designated for 'Upload' and 'Creation' flows, providing a high-contrast signal for growth and addition.

The neutral palette utilizes cool grays to define UI surfaces without competing with the map's natural colors.
- **Light Mode:** Uses high-luminance backgrounds (#FFFFFF) with soft gray surfaces (#F8F9FA) to define boundaries.
- **Dark Mode:** Employs a deep charcoal base (#121212) with elevated surfaces using tonal shifts rather than pure black, ensuring depth and readability under low-light conditions.

## Typography

This design system utilizes **Inter** for its exceptional legibility and neutral, systematic character. The type scale is optimized for high readability at varying zoom levels on the map and within dense information sheets.

Headlines use a tighter letter-spacing and heavier weights to establish a clear hierarchy, while body text maintains a generous line height (1.5–1.6x) to ensure long-form captions and location descriptions are easily digestible. Small labels use increased letter-spacing and medium weights to remain legible even when rendered over complex map backgrounds.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model for the primary map view, allowing the map to occupy the full viewport. Overlaid UI elements—such as search bars, FABs, and bottom sheets—follow a contextual placement logic based on a strict **8px spacing rhythm**.

On mobile, a single-column layout prevails with persistent safe-area margins (16px). On tablet and desktop, the design system transitions to a split-view or multi-column layout where the map remains fluid, but gallery views and spot details are constrained to side panels or modular cards to prevent line-lengths from becoming excessive.

## Elevation & Depth

This design system uses **Ambient Shadows** and **Tonal Layers** to communicate hierarchy. Unlike flat systems, depth here is functional:
- **Level 0 (Map):** The base canvas.
- **Level 1 (Cards/In-line UI):** Low-opacity, diffused shadows (0px 2px 4px, 5% opacity) to separate content from the map background.
- **Level 2 (Bottom Sheets/Floating Panels):** Medium shadows (0px 4px 12px, 10% opacity) to indicate they are interactive overlays.
- **Level 3 (FABs/Modals):** High-diffusion shadows (0px 8px 24px, 15% opacity) for high-priority action triggers.

In Dark Mode, elevation is further reinforced by slightly lightening the surface color of higher-level elements, reducing the reliance on shadows which are less visible on dark backgrounds.

## Shapes

The shape language is consistently **Rounded (8px–24px)**. This softening of the UI helps the interface feel approachable and organic, mirroring the informal and personal nature of photography.

- **Standard Elements:** Buttons, input fields, and small cards use a **0.5rem (8px)** radius.
- **Prominent Elements:** Bottom sheets and gallery cards use a **1rem (16px)** radius on top corners to create a "container" feel.
- **Floating Action Buttons:** Use a full **Pill (100px)** radius to maximize their "hit area" and visual distinction from rectangular map elements.

## Components

### Map Pins & Markers
Pins consist of a circular thumbnail (32-48px) with a high-contrast white border (2px) and a subtle drop shadow. When zoomed out, these cluster into numbered circles using the Primary Map Blue.

### Floating Action Button (FAB)
The primary "Upload" trigger is a large, circular FAB positioned in the bottom-right corner. It uses the vibrant Action Green with a white icon to ensure it is the most prominent element on the screen.

### Bottom Sheets
On mobile, detail views emerge as elegant bottom sheets with a "grab handle" indicator. They support three states: collapsed (peeking), half-expanded (info summary), and fully expanded (full gallery and details).

### Cards
Gallery cards feature a 16:9 aspect ratio for photos. Metadata (date, location name) is placed on a semi-transparent gradient overlay at the bottom of the image or on a clean white surface immediately below the image to maintain a minimalist look.

### Buttons & Inputs
Buttons feature 8px rounded corners, utilizing solid fills for primary actions and subtle outlines for secondary actions. Input fields use a light gray fill (#F1F3F4) with no border in their resting state, shifting to a Blue border on focus.