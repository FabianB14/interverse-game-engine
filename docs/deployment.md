# Deployment and Hosting

This document explains the likely hosting needs for Interverse Game Engine.

## GitHub Pages

GitHub Pages is enough for:

- A public project website.
- Documentation.
- Download links.
- Roadmaps and release notes.
- Static demos that run fully in the browser.

GitHub Pages does not run backend code. It only serves static files.

The current Studio PWA keeps project setup data in the browser, so it does not need an account system, Render, or a database. It is installable on supported Windows browsers and via Safari's **Add to Home Screen** action on iPhone and iPad.

Recommended early use:

- Host the documentation site.
- Host the installable Interverse Studio PWA from the `/docs` folder.
- Publish the project roadmap.
- Add simple demos later if the engine supports browser exports.

## Vercel

Vercel is a good next step if the website needs:

- A more polished docs or marketing site.
- Preview deployments for pull requests.
- Serverless functions for small backend tasks.
- Easy custom domain setup.

Vercel can replace GitHub Pages for the public site, but it does not replace a full backend for heavier engine services.

## Render Backend

A backend is not required for the engine's first local prototype.

Use Render later if Interverse needs server-side features such as:

- User accounts.
- Project cloud sync.
- Asset marketplace.
- License management.
- Build queues.
- Crash reporting.
- Multiplayer services.
- Collaboration features.

For the first release, avoid adding a backend unless a feature clearly requires server-side state or private credentials.

## Database

A database is not required at the beginning.

Use a database only when the product needs persistent shared data, such as:

- User profiles.
- Uploaded assets.
- Marketplace listings.
- Cloud projects.
- Teams and permissions.
- Build history.
- Telemetry or crash reports.

Likely future options:

- PostgreSQL for most production backend data.
- Object storage for uploaded assets and build artifacts.
- Redis only if caching, queues, or real-time coordination become necessary.

## Recommended Path

1. Start with GitHub Pages for docs and public project information.
2. Move to Vercel if the site needs richer previews, routing, or serverless helpers.
3. Add Render only when Interverse has a real backend feature.
4. Add PostgreSQL only when there is shared product data to store.
