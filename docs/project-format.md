# Interverse Project Format v0

An Interverse project begins with one portable JSON manifest. The manifest identifies the project, records its initial template, and points to its playable entry scene.

```json
{
  "format": "interverse.project/v0",
  "name": "Signal Garden",
  "template": "top-down",
  "entryScene": "scene.json"
}
```

## Required Fields

| Field | Purpose |
| --- | --- |
| `format` | Exact project format identifier. This lets future engine versions recognize and migrate a project safely. |
| `name` | Creator-facing project name. |
| `template` | The template that created the project. |
| `entryScene` | Relative path to the first scene the runtime should load. |

The manifest stays intentionally small. Scene contents, imported assets, builds, and editor preferences are separate concerns and should not be mixed into the project identity file.

## Current Workflow

Interverse Studio creates a local project card and can export its manifest. The web reference runtime loads this manifest before loading the entry scene. This creates one shared boundary between creator-facing project setup and runtime execution.
