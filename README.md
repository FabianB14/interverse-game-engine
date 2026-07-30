# Interverse Game Engine

Interverse Game Engine is a planned creator-friendly engine for making and shipping 2D games first, with a path toward mobile, PC, and later 3D support.

The early goal is not to copy every feature from larger engines. The goal is to make the first playable game fast to create, easy to understand, and simple to export.

## Branch Strategy

- `main`: released and stable branch.
- `fabian-branch`: active development branch for early planning and implementation.

## First Release Goal

The first public release should let a developer build a complete 2D game for Windows and Android.

Target game types:

- Platformers
- Puzzle games
- Visual novels
- Top-down RPG prototypes
- Endless runners
- Mobile idle games

## Initial Project Structure

```text
engine/
  core/          Shared engine foundation: math, events, ECS, serialization.
  runtime/       Game-facing systems: rendering, input, audio, UI, animation, physics.
  platform/      Platform adapters for Windows, Android, web, and future targets.
editor/
  app/           Editor shell and workspace experience.
  panels/        Scene, hierarchy, inspector, asset browser, profiler.
examples/
  first-game/    Small reference game used to validate the engine workflow.
tools/
  asset-pipeline/ Import, convert, and cache game assets.
docs/
  index.html       Installable Interverse Studio web companion.
  project-format.md Project manifest reference.
  web-studio.md    Browser, iOS, and Windows installation notes.
  roadmap.md
  architecture.md
  deployment.md
```

## Product Principles

- One obvious workflow for common tasks.
- The editor should guide the user instead of hiding basics in documentation.
- Keep the core small and move optional services into plugins.
- Prioritize time to first playable game over visual spectacle.
- Treat exports, packaging, and publishing as core user journeys.

## Current Status

This repository now includes an installable browser-based Interverse Studio in `docs/`. It provides a simple project workspace that can be published on GitHub Pages and installed on supported Windows browsers and iOS Safari.

It also includes the first runnable 2D web reference runtime at `engine/runtime/web/` and a playable scene at `examples/first-game/`. The example validates the project manifest, engine loop, scene loading, keyboard input, drawing, collision, collectible triggers, and goal completion.
