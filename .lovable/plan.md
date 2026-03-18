
# Plan: Terms of Service Page

## Overview

Create a new `/terms` page that mirrors the design and structure of the existing Privacy Policy page — same sticky nav, video hero, sticky TOC sidebar, and section content rendering — but with the full Terms of Service text from the Google Doc.

## Content Structure

The Terms document contains these main sections (TOC items):
1. Introduction
2. Customer Terms
3. Definitions (1)
4. Services (2)
5. Data Rights, Privacy & Security (3)
6. Payment & Taxes (4)
7. Term & Termination (5)
8. Nondisclosure (6)
9. Warranties (7)
10. Intellectual Property (8)
11. Data Processing Addendum (9-10)
12. General Provisions (11)
13. Security Measures (Schedule 1)

## Files to Create/Edit

1. **Create `src/pages/TermsOfService.tsx`** — clone of `PrivacyPolicy.tsx` structure with:
   - Same sticky header, video hero, TOC sidebar, section renderer
   - Hero title: "Terms of Service" — same Shield badge, last updated "May 30, 2025"
   - Sections data array with all 13 sections from the doc, using `paragraph`, `list` content types
   - Contact card pointing to `legal@intentsly.com` instead of privacy
   - "Back to registration" link pointing to `/register`

2. **Edit `src/App.tsx`** — add route: `<Route path="/terms" element={<TermsOfService />} />`

3. **Edit `src/pages/Register.tsx`** — add "Terms of Service" link next to the existing Privacy Policy link in the footer/bottom of the form

## Design

Exact same design as Privacy Policy:
- Sticky nav with logo + "Get started free" CTA
- Video hero background (`/videos/hero-gradient.webm`) with `FileText` icon badge instead of `Shield`
- Two-column layout: sticky TOC sidebar (hidden on mobile) + scrollable content
- IntersectionObserver for active TOC highlighting
- `goji-coral` accent dots on lists
- Divider lines between sections
- Contact card for `legal@intentsly.com`

## Technical Notes

- The ToS content is long (DPA addendums, security schedules). Dense legal sections like 9-11 (DPA) will be grouped as single sections to keep the TOC manageable (not 30+ entries)
- Sections with numbered sub-items (2.1, 2.2, etc.) will be rendered as paragraphs inside the parent section
- The "PAID SUBSCRIPTION PLANS..." all-caps notice will be rendered as a styled callout block (distinct background, slightly smaller font)
