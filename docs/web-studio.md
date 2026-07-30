# Interverse Studio Web App

Interverse Studio is the browser-based companion to the Interverse Game Engine. It is designed to install as a Progressive Web App (PWA) on Windows and iOS, giving creators a fast place to start projects, choose templates, read guided learning material, and eventually run web previews.

## What It Supports Now

- Project setup stored locally in the browser.
- Three focused 2D project templates.
- Local image upload and drag-and-drop import for the asset library.
- Sprite placement and rendering in the scene editor and web preview.
- Touch controls for the playable web preview on phones and tablets.
- Pause, restart, exit-preview controls, and local playtest progress recovery.
- An install prompt on supported Windows browsers.
- iOS installation guidance for Safari's **Add to Home Screen** workflow.
- Offline access to the Studio app shell after its first visit.
- A browser build of the engine reference runtime at `/play/`.

## Platform Promise

| Platform | Browser Studio | Native editor and build tools |
| --- | --- | --- |
| Windows | Install from a Chromium browser as a desktop-like app. | Planned full editor and Windows game export. |
| iPhone and iPad | Add from Safari to the Home Screen. | Browser Studio and web previews only. Native editor is not a realistic iOS browser workload. |
| Android | Install from a supported browser. | Planned game export target. |

The PWA is intentionally a companion workspace, not a claim that an entire native engine can run inside iOS Safari. This keeps expectations clear while still making the product available anywhere from day one.

## Publishing It

GitHub Pages can publish this directory without a backend:

1. In the repository's **Settings**, open **Pages**.
2. Select **Deploy from a branch**.
3. Choose `fabian-branch` while the Studio is being developed, then choose `main` for stable releases.
4. Select the `/docs` folder and save.

The site will be available at the Pages address shown by GitHub. A PWA requires HTTPS, which GitHub Pages provides. When the public site outgrows this static app, Vercel can host the same files with preview deployments and a custom domain.

## Data and Backend Boundary

Projects created in the current Studio are stored only in the user's browser. This means no account, Render service, or database is needed yet.

Add a backend only when users need to sign in, sync projects between devices, collaborate, upload assets, buy marketplace items, or use remote builds. At that point, Render plus PostgreSQL and object storage is a reasonable first production stack.
