---
name: seo_web_vitals
description: SEO best practices and performance optimization rules
---

# SEO & Web Vitals Guidelines

## Meta Data
- Ensure every public page has proper `<title>` and `<meta name="description">`.
- Use dynamic Open Graph (OG) tags for Rooms and Tours so social sharing looks incredible (show the cover photo, price, and name).

## Performance (Core Web Vitals)
- Optimize all images using webp/avif formats (Supabase Storage transformations if available).
- Lazy load images below the fold.
- Maintain strict Semantic HTML (one H1 per page, proper H2/H3 hierarchies).
- Ensure fast Largest Contentful Paint (LCP) by prioritizing hero images.

## Accessibility
- Add descriptive `alt` tags to all structural images.
- Ensure all interactive elements (buttons, links) are easily clickable (minimum touch target size).
