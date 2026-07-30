# Web Reference Runtime

This is the first runnable Interverse runtime slice. It is intentionally small and uses browser-native JavaScript so the foundational game loop can be tested without a build system or a native editor.

It currently provides:

- JSON scene loading.
- Keyboard movement through a shared input layer.
- Touch-direction input for browser and PWA previews.
- A canvas renderer with a camera.
- Sprite components backed by portable image sources.
- Axis-aligned solid collision.
- Collectible and goal triggers.

The runtime is a behavioral reference, not the final platform strategy. The same scene and gameplay boundaries can later be implemented by the native runtime for Windows and mobile exports.

## Run the Example

Serve the repository root with a static web server, then open `examples/first-game/`. For example, with Python installed:

```powershell
py -m http.server 4175
```

Then visit `http://localhost:4175/examples/first-game/` and move with WASD or the arrow keys.
