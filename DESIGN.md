---
name: Schedule
description: Visual identity for the Schedule app — neutral interface, one accent, strong hierarchy.
colors:
  primary: "#18181B"
  secondary: "#71717A"
  accent: "#047857"
  on-accent: "#FFFFFF"
  surface: "#FFFFFF"
  surface-muted: "#F4F4F5"
  border: "#E4E4E7"
  danger: "#B91C1C"
  on-primary: "#FAFAFA"
typography:
  display:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: "600"
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: "600"
    lineHeight: 1.25
  body:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: 1.5
  label:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: "600"
    lineHeight: 1.25
    letterSpacing: 0.04em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  button-primary-hover:
    backgroundColor: "#065F46"
  button-secondary:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  nav-item-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  text-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 0px
  badge-error:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  hairline:
    backgroundColor: "{colors.border}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 1px
    padding: 0px
---

## Overview

The product reads as calm, credible scheduling software: plenty of whitespace, restrained color, and a single emerald accent for primary actions so focus stays on time and commitments.

## Colors

Ink neutrals anchor the chrome; emerald `#047857` is the sole accent for primary actions—dark enough for white label text at WCAG AA.

## Typography

Geist (or nearest project font) establishes a single family for UI: tight display for hero moments, semibold headlines, regular body copy, tracked caps-style labels where needed.

## Layout & Spacing

An 8px rhythm drives spacing. Page shells use generous horizontal padding (`{spacing.md}`–`{spacing.lg}`) and predictable vertical stacking between scheduling blocks.

## Elevation & Depth

Prefer borders and tint (`{colors.border}`, `{colors.surface-muted}`) over heavy shadows. One soft shadow tier is acceptable for overlays and dialogs only.

## Shapes

Corners stay modestly rounded (`{rounded.sm}`–`{rounded.lg}`) for a pragmatic tool feel—not pill-everywhere.

## Components

Primary actions use `{components.button-primary}`; secondary and quiet actions use `{components.button-secondary}`. Content groups use `{components.card}` with internal spacing from `{spacing.md}`.

## Do's and Don'ts

- Do use emerald `#047857` with white label text only on primary actions.
- Do keep body text on `{colors.primary}` or `{colors.secondary}` for de-emphasis.
- Don't introduce extra brand colors or purple-forward “AI” gradients in this system.
