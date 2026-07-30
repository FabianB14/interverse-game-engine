# Architecture

Interverse should start as a modular 2D-first engine. Each major system should be testable without requiring the full editor to run.

## Proposed Modules

```text
Core
  Math
  ECS
  Events
  Assets
  Serialization

Runtime
  2D Renderer
  Input
  Audio
  UI
  Animation
  Collision and Physics
  Save System

Editor
  Project Manager
  Scene View
  Hierarchy
  Inspector
  Asset Browser
  Build and Export Panel

Platform
  Windows
  Android
  Web Studio and Preview
  Future: macOS, Linux, iOS
```

## Early Technical Direction

The first prototype should optimize for fast iteration and clear structure. A practical starting point is:

- A desktop editor with a live scene preview.
- A small runtime that can load a scene, render sprites, process input, play audio, and save data.
- A sample game that proves the full workflow from project creation to export.

The implementation stack can still be decided. Good candidates include:

- C++ with CMake for a native engine path.
- TypeScript plus a native runtime bridge for a faster editor-first prototype.
- C# for a balanced runtime/editor ecosystem.

The repository should avoid committing to advanced 3D rendering, multiplayer, or marketplace systems until the 2D game workflow is complete.

## Web Reference Runtime

The first implementation is a browser-native runtime in `engine/runtime/web/`. It is not a replacement for the future native engine; it is a fast feedback environment for proving scene structure and gameplay behavior.

Its initial contract is intentionally narrow:

- A scene is data loaded from JSON.
- A project manifest owns the project identity and entry-scene reference.
- The runtime updates game state from input each frame.
- The renderer draws the current state without owning gameplay rules.
- Collision and triggers are shared runtime behavior rather than scene-specific code.

`examples/first-game/` is the integration test for that contract. It should remain small enough to run and understand without a full editor.

## Web Studio Boundary

`docs/` contains Interverse Studio, an installable Progressive Web App that introduces the product from any browser. It owns project setup, templates, learning material, and future web previews.

The native engine remains responsible for performance-sensitive editing, local asset import, desktop game builds, and platform packaging. This is especially important for iOS: browser installation is supported, but a full native editor does not belong inside a mobile Safari tab.

## Plugin Boundary

Optional integrations should be plugins rather than core systems:

- Ads
- Analytics
- Cloud saves
- In-app purchases
- AI tooling
- Extra importers
- Online services

This keeps the base engine easier to learn and easier to maintain.
