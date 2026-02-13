## Project Summary
A full-stack web application for an installation service business (likely car/marine/truck audio and security). It includes product listings, booking management, technician dashboards, and admin panels.

## Tech Stack
- Framework: Next.js
- Language: TypeScript
- Database: Supabase (PostgreSQL)
- Payments: Stripe
- Styling: Tailwind CSS
- Auth: Better Auth (based on file structure)

## Architecture
- `src/app`: Next.js App Router for pages and API routes.
- `src/components`: React components organized by feature (home, ui, etc.).
- `src/lib`: Utility functions and database schema/clients.
- `public`: Static assets including product images.

## User Preferences
- Use Supabase for database, storage, and auth.
- Use Stripe for payments.

## Project Guidelines
- Follow existing code style and conventions.
- Use relative URLs for client-side API calls.
- Use `window.parent.postMessage` for external redirects.

## Common Patterns
- Seeding data via SQL files in the root.
- Admin and dashboard routes for different user roles.
- Map data is served via `/api/map-data` and rendered using Mapbox GL.
- Zip code search is implemented in the map to check for service area coverage.
- Map animations are designed to be fast with a skip option for better UX.
