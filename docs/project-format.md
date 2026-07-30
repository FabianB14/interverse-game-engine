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

The portable browser export keeps one scene inside the project file. Imported assets, build output, and editor preferences remain separate concerns. A future native project can use the same fields while storing larger scenes and assets as files beside its manifest.

## Current Workflow

Interverse Studio creates a local project card and opens it in the scene editor. The editor saves the working scene locally, can export the full project, and can import that same file into a new local project. This is the first end-to-end project workflow without requiring a backend.
