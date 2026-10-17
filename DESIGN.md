---
name: HBay Water Design System
description: Hawke’s Bay cellar-door long lunch translated into a unified, responsive water brand site.
colors:
  navy-ink: "#0E2233"
  hbay-brand-blue: "#1E95D4"
  link-blue: "#0D6FA3"
  linen-ground: "#F7F8F6"
  white-surface: "#FFFFFF"
  soft-ink: "#4A5B69"
  hairline-rule: "#C9D1D6"
typography:
  display:
    fontFamily: 'Bodoni Moda, Didot, "Bodoni 72", serif'
    fontSize: "clamp(42px, 5.2vw, 72px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-.02em"
  headline:
    fontFamily: 'Bodoni Moda, Didot, "Bodoni 72", serif'
    fontSize: "clamp(36px, 4.4vw, 60px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-.02em"
  title:
    fontFamily: 'Bodoni Moda, Didot, "Bodoni 72", serif'
    fontSize: "clamp(23px, 2.5vw, 31px)"
    fontWeight: 400
    lineHeight: 1.08
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  navigation:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  square: "0px"
  credit: "2px"
spacing:
  gutter: "clamp(20px, 5vw, 64px)"
  section: "clamp(68px, 8vw, 104px)"
  section-wide: "clamp(72px, 9vw, 124px)"
  row: "18px"
  column: "24px"
components:
  button-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.linen-ground}"
    rounded: "{rounded.square}"
    padding: "0 24px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.link-blue}"
    textColor: "{colors.white-surface}"
  button-inverse:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
    padding: "0 24px"
    height: "50px"
  nav-link:
    textColor: "{colors.navy-ink}"
    typography: "{typography.navigation}"
    rounded: "{rounded.square}"
    padding: "8px 0"
  field:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
    padding: "13px 14px"
    height: "50px"
  choice-chip:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
    padding: "8px 12px"
  tasting-row:
    backgroundColor: "{colors.linen-ground}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
    padding: "18px 0"
---

# Design System: HBay Water

## Overview

**Creative North Star: “Hawke’s Bay Cellar-Door Long Lunch”**

The site carries the welcome of a Hawke’s Bay cellar door into an everyday water brand. Its visual language pairs cool linen-like white with deep navy, the HBay blue mark, restrained rules, and the warmth of place-led photography. Bodoni Moda gives headlines the character of an estate label; Hanken Grotesk keeps navigation, facts, and forms direct and readable.

The homepage invites shoppers to a set table among the vines, then moves through source and tasting notes, everyday settings, the range, and places to buy. The other seven routes use the same masthead, footer, type, and palette, with their own editorial pace. Lifestyle images are labelled as AI concepts, and the homepage hero flags the package appearance as awaiting confirmation.

**Key Characteristics:**
- Region-led hospitality, expressed through a water brand.
- Printed tasting-sheet cues: hairline rules, aligned values, and open space.
- Clear contrast between the navy-and-linen foundation and small blue actions.
- One responsive navigation and footer system across eight pages.

## Colors

The palette is cool and quiet: linen and white carry the page, navy anchors text and dark fields, and two blues distinguish the brand mark from interactive text.

### Primary
- **Deep Hawke’s Bay Ink** (`{colors.navy-ink}`): Main text, navigation, buttons, dark feature bands, and the photo-overlay base.

### Secondary
- **HBay Brand Blue** (`{colors.hbay-brand-blue}`): The supplied logo and brand-identification accent.
- **Deep Link Blue** (`{colors.link-blue}`): Text links, interaction states, and keyboard-focus outlines.

### Neutral
- **Cool Linen** (`{colors.linen-ground}`): Main page ground and inverse button text.
- **White Surface** (`{colors.white-surface}`): Alternate sections, form controls, and image grounds.
- **Soft Ink** (`{colors.soft-ink}`): Supporting copy on light surfaces.
- **Tasting-Sheet Rule** (`{colors.hairline-rule}`): Fine dividers and restrained outlines.

**The Ink-and-Linen Rule.** Keep the page calm and legible with navy type over linen or white. Reserve the brighter brand blue for brand recognition; use the deeper blue for text interactions.

## Typography

**Display Font:** Bodoni Moda (with Didot, Bodoni 72, and a generic serif fallback)

**Body Font:** Hanken Grotesk (with system sans-serif fallback)
**Label/Mono Font:** Hanken Grotesk; no separate mono face is used.

**Character:** Bodoni Moda lends the large headlines a wine-label, regional-hosting character. Hanken Grotesk handles practical information with a clean, modern counterpoint.

### Hierarchy
- **Display** (400, `clamp(42px, 5.2vw, 72px)`, line-height 1.08): Homepage and route-page hero headlines.
- **Headline** (400, `clamp(36px, 4.4vw, 60px)`, line-height 1.08): Main section headings.
- **Title** (400, `clamp(23px, 2.5vw, 31px)`, line-height 1.08): Supporting editorial headings and tasting-list values.
- **Body** (400, 17px, line-height 1.65): Paragraphs and long-form copy; the base size reduces to 16px on narrow screens.
- **Label** (500, 13px, line-height 1.4): Compact interface notes and demo chrome. Field labels use a 14px Hanken Grotesk treatment.

**The Two-Voice Rule.** Use Bodoni Moda for expressive headings and selected values; use Hanken Grotesk for every interface label, paragraph, navigation item, and control.

## Layout

The site uses a centered content width of 1200px and a fluid side gutter of `clamp(20px, 5vw, 64px)`. Long-form content is arranged as editorial columns or aligned label/value rows, with fine horizontal rules doing the work that a stack of boxed cards would otherwise do. White and linen sections alternate; dark navy bands create pauses and emphasis.

The Our Water page closes with a full-width where-to-buy band; its heading and action align to the same responsive content gutter as the sections above it.

At 900px, several paired editorial and form layouts collapse or tighten. At 720px, navigation changes to a menu button and dropdown, two-column heroes and forms stack, and content lists become single-column. The homepage also has a 960px intermediate adjustment. Touch targets and text remain in the same visual system across desktop and phone layouts.

**The Tasting-Sheet Rule.** For origin, quality, format, and other concise facts, align labels and values against a rule instead of placing each fact in a separate card.

## Elevation & Depth

The active pages are flat at rest: shared cards have no shadow, and field focus uses a clear outline rather than a glow. Depth comes from alternating linen, white, and navy fields, hairline borders, and a soft navy veil at the bottom of photography so overlaid copy remains readable. Motion is restrained to short link, button, and disclosure state transitions; reduced-motion preferences remove or shorten them.

## Shapes

The form language is mostly square: buttons, navigation controls, fields, dividers, and tasting rows use straight edges. A small 2px corner appears on photo-credit labels. Image crops provide the main organic shape; interface containers do not use rounded-card silhouettes.

## Components

### Buttons
- **Shape:** Square corners (`0px`) with a one-pixel navy border.
- **Primary:** Navy fill with linen text, 50px minimum height, and 24px horizontal padding.
- **Hover / Focus:** Hover shifts to deep link blue with white text; keyboard focus gets a two-pixel deep-blue outline offset by four pixels.
- **Hero inverse:** White fill with navy text, used over the darkened homepage photograph.

### Chips
- **Style:** White background, hairline border, square corners, and compact 8px by 12px padding.
- **State:** Selected choices switch to navy fill and white text; focused choices receive a visible outline.

### Inputs / Fields
- **Style:** White fill, one-pixel muted gray border, square corners, and at least 50px height.
- **Focus:** Deep-blue two-pixel outline with a two-pixel offset; no glow shadow.
- **Error / Disabled:** Error copy uses a restrained red; no additional disabled visual treatment is defined in the shared surface.

### Navigation
- **Style:** Sticky, linen navigation with a hairline bottom rule and 15px medium-weight Hanken Grotesk links. The active or hovered link is underlined in navy.
- **Mobile:** At 720px and below, the links collapse behind a square-edged menu button and open as a full-width linen dropdown with ruled rows.

### Tasting-Sheet Rows
Use an open two-column label/value row, with compact uppercase sans-serif labels and larger serif values. A mobile layout stacks the label above its value. The sample-data note sits outside the rows so it remains clear that measurements describe one sample.

### Photo Credits
Place small white credit text on a translucent navy ground over the image, using a modest 2px corner and enough padding to separate it from the photograph.

## Do's and Don'ts

### Do:
- **Do** keep the exact brand slogan, “More Natural Better Living,” wherever the current site displays it.
- **Do** preserve the source and imagery caveats: generated lifestyle scenes are concepts, and the homepage pack appearance needs client confirmation.
- **Do** use darker blue for text links and keyboard focus, while keeping the brighter blue tied to the logo and brand mark.
- **Do** keep editorial facts in ruled rows and preserve the generous, responsive page gutters.

### Don't:
- **Don't** put text into photographs; keep words as live page content.
- **Don't** default to blue splash or snowy-mountain category imagery; the chosen visual story belongs to Hawke’s Bay and its long-lunch setting.
- **Don't** turn every content group into a rounded card or add decorative kicker labels and numbered sequence markers.
- **Don't** present the single-sample mineral results as fixed specifications or the concept bottle as confirmed package photography.

**Detector record.** One detector pass reported 29 findings: 5 low-contrast, 18 cramped-padding, 3 tight-leading, and 3 layout-transition. Only a category summary was retained, not the item-by-item raw output. After that run, the first-screen supporting copy, reports-download hover text, homepage source aside, and link hover text on dark capability bands were manually adjusted for contrast. No second detector pass was run; this record does not claim the other findings were cleared.

**Independent visual review.** The final desktop (1440px) and mobile (390px) screenshots for all eight routes were reviewed. The verdict was ship, with no blocking visual findings. Follow-up ideas: consider a wider factory entrance crop if a suitable real photo is available, reduce the repeated Port of Napier mention on Trade & Export, and add the confirmed product family photo when the client approves it. The report detail views for geology and aquifer references remain worth checking during launch preparation.
