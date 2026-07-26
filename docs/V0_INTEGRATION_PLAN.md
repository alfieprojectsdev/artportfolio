# v0 Integration Plan

## Overview

This document outlines the plan to integrate the UI and functionality improvements from the `v0_reco` directory into the current Astro project. The `v0_reco` directory contains a Next.js project with a rich set of UI components, while the current project is built with Astro. The integration will focus on leveraging Astro's ability to use React components.

## Component Mapping

The following table maps the components from `v0_reco` to the existing components in the Astro project or new components that need to be created.

| v0_reco Component | Existing/New Component | Notes |
| --- | --- | --- |
| `v0_reco/components/ui/` | `src/components/ui/` (new directory) | These are shadcn/ui components. We will copy them over and adjust them to work within the Astro project. |
| `v0_reco/components/header.tsx` | `src/components/Header.astro` (new) | A new header component will be created to incorporate the design from `v0_reco`. |
| `v0_reco/components/sidebar.tsx` | `src/components/Sidebar.astro` (new) | A new sidebar component will be created for the admin dashboard. |
| `v0_reco/components/tabs/analytics.tsx` | `src/components/admin/Analytics.tsx` (new) | To be used in the admin dashboard. |
| `v0_reco/components/tabs/commissions.tsx` | `src/components/admin/Commissions.tsx` (new) | To replace the existing commission management UI. |
| `v0_reco/components/tabs/portfolio.tsx` | `src/components/admin/Portfolio.tsx` (new) | To replace the existing gallery management UI. |
| `v0_reco/components/tabs/settings.tsx` | `src/components/admin/Settings.tsx` (new) | To replace the existing settings UI. |
| `v0_reco/app/page.tsx` | `src/pages/index.astro` | The homepage will be updated to use the new UI components. |
| `v0_reco/app/layout.tsx` | `src/layouts/Layout.astro` | The main layout will be updated to incorporate the new design. |

## Styling and Theming

The `v0_reco` project uses `globals.css` for styling. We will merge the styles from `v0_reco/styles/globals.css` and `v0_reco/app/globals.css` into the existing CSS files of the Astro project. We will also need to configure Tailwind CSS to match the `v0_reco` configuration.

The `theme-provider.tsx` from `v0_reco/components` will be integrated to provide theme switching functionality.

## Hooks and Libs

The hooks `use-mobile.ts` and `use-toast.ts` from `v0_reco/hooks` will be copied to a new `src/hooks` directory. The utility functions from `v0_reco/lib/utils.ts` will be copied to `src/lib/utils.ts`.

## Phased Integration

The integration will be done in the following phases:

1.  **Phase 1: UI Components:**
    *   Copy the UI components from `v0_reco/components/ui` to `src/components/ui`.
    *   Install and configure Tailwind CSS and other dependencies.
    *   Integrate the `theme-provider.tsx`.

2.  **Phase 2: Core Layout:**
    *   Create the new `Header` and `Sidebar` components.
    *   Update the main layout (`src/layouts/Layout.astro`) to use the new layout.

3.  **Phase 3: Admin Dashboard:**
    *   Integrate the new admin dashboard components: `Analytics`, `Commissions`, `Portfolio`, and `Settings`.
    *   Replace the existing admin UI with the new components.

4.  **Phase 4: Homepage:**
    *   Update the homepage (`src/pages/index.astro`) with the new design and components.

5.  **Phase 5: Refinement and Testing:**
    *   Thoroughly test the integrated application.
    *   Refine the UI and functionality as needed.
