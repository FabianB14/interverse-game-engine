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
  Web Preview
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

