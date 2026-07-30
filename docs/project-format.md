# Interverse Project Format v1

An Interverse project is one portable JSON file. It identifies the project, records its initial template, and includes the playable entry scene so a creator can move a project between browsers without a server account.

```json
{
  "format": "interverse.project/v1",
  "name": "Signal Garden",
  "template": "top-down",
  "entryScene": "scenes/main.scene.json",
  "scene": {
    "world": { "width": 960, "height": 640 },
    "player": { "x": 96, "y": 160, "width": 30, "height": 30, "speed": 240 }
  }
}
```

## Required Fields

| Field | Purpose |
| --- | --- |
| `format` | Exact project format identifier. This lets future engine versions recognize and migrate a project safely. |
| `name` | Creator-facing project name. |
| `template` | The template that created the project. |
| `entryScene` | Relative path to the first scene the runtime should load. |
| `scene` | The complete editable scene data used by the current web editor and preview runtime. |

### Scene Sprites

A scene can include a `sprites` array. Each sprite stores its transform and image source directly, allowing a portable project export to keep rendering without depending on the browser's asset library.

```json
{
  "sprites": [
    { "x": 128, "y": 96, "width": 64, "height": 64, "source": "data:image/png;base64,..." }
  ]
}
```

The portable browser export keeps one scene inside the project file. The browser asset library stores local image copies for reuse while editing; placed sprites keep their own source in the scene so exports are self-contained. Build output and editor preferences remain separate concerns. A future native project can use the same fields while storing larger scenes and assets as files beside its manifest.

### Gameplay Zones

Scenes can include `hazards` and `checkpoints` arrays. Both use ordinary rectangle data, so they can be placed, selected, named, duplicated, and resized in the scene editor.

```json
{
  "checkpoints": [{ "x": 448, "y": 320, "width": 40, "height": 56 }],
  "hazards": [{ "x": 576, "y": 512, "width": 96, "height": 32 }]
}
```

Touching a checkpoint changes the respawn location. Touching a hazard returns the player to the latest checkpoint and increments the run's reset count. Older scenes that omit these fields continue to work.

## Current Workflow

Interverse Studio creates a local project card and opens it in the scene editor. The editor saves the working scene locally, can export the full project, and can import that same file into a new local project. This is the first end-to-end project workflow without requiring a backend.
