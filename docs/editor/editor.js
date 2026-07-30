const projectStorageKey = "interverse-studio-projects";
const sceneStoragePrefix = "interverse-editor-scene-v0:";
const previewKey = "interverse-preview-scene";
const previewContextKey = "interverse-preview-context";
const gridSize = 32;
const projectId = new URLSearchParams(window.location.search).get("project");
const canvas = document.querySelector("#scene-canvas");
const context = canvas.getContext("2d");
const propertyForm = document.querySelector("#object-properties");
const emptyInspector = document.querySelector("#empty-inspector");
const propertyInputs = {
  x: document.querySelector("#property-x"),
  y: document.querySelector("#property-y"),
  width: document.querySelector("#property-width"),
  height: document.querySelector("#property-height")
};
const propertyNameInput = document.querySelector("#property-name");
const hierarchy = document.querySelector("#scene-hierarchy");
const validationPanel = document.querySelector("#scene-validation");
const undoButton = document.querySelector("#undo-scene");
const redoButton = document.querySelector("#redo-scene");
const spriteAssetSelect = document.querySelector("#sprite-asset");
const spriteImages = new Map();

function readProjects() { try { return JSON.parse(localStorage.getItem(projectStorageKey)) || []; } catch { return []; } }
function saveProjects(projects) { localStorage.setItem(projectStorageKey, JSON.stringify(projects)); }
function activeProject() { return readProjects().find((project) => project.id === projectId) || { id: null, name: "Signal Garden", templateId: "top-down" }; }
function activeSceneKey() { return projectId ? `${sceneStoragePrefix}${projectId}` : "interverse-editor-scene-v0"; }
let project = activeProject();

const defaultScene = {
  world: { width: 960, height: 640 },
  palette: { ground: "#e8f1f8", grid: "#d4e1ec", wall: "#28547e", wallHighlight: "#5d91bd", player: "#e45b50", beacon: "#f2b94b", goal: "#3baf89", goalComplete: "#194d42" },
  player: { x: 96, y: 160, width: 30, height: 30, speed: 240 },
  goal: { x: 800, y: 448, width: 96, height: 96 },
  collectibles: [{ x: 208, y: 205, width: 22, height: 22 }, { x: 590, y: 270, width: 22, height: 22 }],
  sprites: [],
  solids: [{ x: 0, y: 0, width: 960, height: 56 }, { x: 0, y: 584, width: 960, height: 56 }, { x: 0, y: 0, width: 56, height: 640 }, { x: 904, y: 0, width: 56, height: 640 }, { x: 320, y: 104, width: 64, height: 288 }, { x: 544, y: 320, width: 256, height: 64 }]
};

let scene = loadScene();
let tool = "select";
let selected = null;
const history = [];
let historyIndex = -1;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadScene() { try { return JSON.parse(localStorage.getItem(activeSceneKey())) || clone(defaultScene); } catch { return clone(defaultScene); } }
function saveScene(message = "Saved in this browser") { localStorage.setItem(activeSceneKey(), JSON.stringify(scene)); document.querySelector("#save-status").textContent = message; }
function objectLabel(type, index, object) {
  if (object?.name) return object.name;
  const label = ({ player: "Player", goal: "Goal", solid: "Wall", collectible: "Beacon", sprite: "Sprite" })[type];
  return index === undefined ? label : `${label} ${index + 1}`;
}
function recordHistory() {
  const snapshot = clone(scene);
  if (historyIndex >= 0 && JSON.stringify(history[historyIndex]) === JSON.stringify(snapshot)) return;
  history.splice(historyIndex + 1);
  history.push(snapshot);
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateHistoryControls();
}
function updateHistoryControls() { undoButton.disabled = historyIndex <= 0; redoButton.disabled = historyIndex >= history.length - 1; }
function refreshEditor() { refreshInspector(); refreshHierarchy(); showValidation(validateScene()); draw(); }
function applySceneChange(message) { recordHistory(); saveScene(message); refreshEditor(); }
function restoreHistory(index) {
  if (index < 0 || index >= history.length) return;
  historyIndex = index;
  scene = clone(history[historyIndex]);
  selected = null;
  saveScene(index < history.length - 1 ? "Undo applied" : "Redo applied");
  updateHistoryControls();
  refreshEditor();
}
function undo() { restoreHistory(historyIndex - 1); }
function redo() { restoreHistory(historyIndex + 1); }
function fileName(name) { return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "interverse-project"; }
function downloadProject() {
  const packageData = { format: "interverse.project/v1", name: project.name, template: project.templateId || "top-down", entryScene: "scenes/main.scene.json", scene };
  const downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${fileName(project.name)}.interverse.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  document.querySelector("#save-status").textContent = "Project exported";
}

function importProject(packageData) {
  if (packageData.format !== "interverse.project/v1" || !packageData.scene || typeof packageData.name !== "string") {
    throw new Error("Choose an Interverse project export with its scene included.");
  }
  const newProject = { id: crypto.randomUUID(), name: packageData.name.trim() || "Imported project", template: "Top-down Adventure", templateId: packageData.template || "top-down", createdAt: Date.now() };
  saveProjects([newProject, ...readProjects()]);
  localStorage.setItem(`${sceneStoragePrefix}${newProject.id}`, JSON.stringify(packageData.scene));
  window.location.assign(`?project=${encodeURIComponent(newProject.id)}`);
}
function snap(value) { return Math.max(0, Math.min(Math.round(value / gridSize) * gridSize, 928)); }
function rectangleContains(rectangle, point) { return point.x >= rectangle.x && point.x <= rectangle.x + rectangle.width && point.y >= rectangle.y && point.y <= rectangle.y + rectangle.height; }
function selectedObject() { if (!selected) return null; if (selected.type === "player") return scene.player; if (selected.type === "goal") return scene.goal; return scene[`${selected.type}s`][selected.index]; }

function drawRoundedRect(x, y, width, height, radius, color) { context.beginPath(); context.roundRect(x, y, width, height, radius); context.fillStyle = color; context.fill(); }
function drawDiamond(item) { context.save(); context.translate(item.x + item.width / 2, item.y + item.height / 2); context.rotate(Math.PI / 4); context.fillStyle = scene.palette.beacon; context.fillRect(-item.width / 2, -item.height / 2, item.width, item.height); context.restore(); }
function drawSprite(sprite) {
  if (!sprite.source) return;
  let image = spriteImages.get(sprite.source);
  if (!image) {
    image = new Image();
    image.addEventListener("load", draw);
    image.src = sprite.source;
    spriteImages.set(sprite.source, image);
  }
  if (image.complete && image.naturalWidth > 0) context.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height);
  else { context.fillStyle = "#b5c7d9"; context.fillRect(sprite.x, sprite.y, sprite.width, sprite.height); }
}
function drawSelection(object) { if (!object) return; context.strokeStyle = "#0e68d8"; context.lineWidth = 3; context.setLineDash([6, 4]); context.strokeRect(object.x - 4, object.y - 4, object.width + 8, object.height + 8); context.setLineDash([]); }

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = scene.palette.ground;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = scene.palette.grid;
  for (let x = 0; x <= canvas.width; x += gridSize) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
  for (let y = 0; y <= canvas.height; y += gridSize) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
  (scene.sprites || []).forEach(drawSprite);
  scene.solids.forEach((solid) => { drawRoundedRect(solid.x, solid.y, solid.width, solid.height, 7, scene.palette.wall); context.fillStyle = scene.palette.wallHighlight; context.fillRect(solid.x + 5, solid.y + 5, Math.max(0, solid.width - 10), 4); });
  scene.collectibles.forEach(drawDiamond);
  drawRoundedRect(scene.goal.x, scene.goal.y, scene.goal.width, scene.goal.height, 10, scene.palette.goal);
  drawRoundedRect(scene.player.x, scene.player.y, scene.player.width, scene.player.height, 9, scene.palette.player);
  context.fillStyle = "#ffffffcc"; context.fillRect(scene.player.x + 9, scene.player.y + 9, 7, 7);
  drawSelection(selectedObject());
}

function refreshInspector() {
  const object = selectedObject();
  propertyForm.hidden = !object;
  emptyInspector.hidden = Boolean(object);
  if (!object) return;
  document.querySelector("#object-type").textContent = selected.type === "solid" ? "Wall" : selected.type[0].toUpperCase() + selected.type.slice(1);
  propertyNameInput.value = object.name || "";
  Object.entries(propertyInputs).forEach(([key, input]) => { input.value = object[key]; });
  document.querySelector("#delete-object").hidden = selected.type === "player" || selected.type === "goal";
  document.querySelector("#duplicate-object").hidden = selected.type === "player" || selected.type === "goal";
}

function refreshHierarchy() {
  hierarchy.replaceChildren();
  const entries = [
    { type: "player", object: scene.player },
    { type: "goal", object: scene.goal },
    ...(scene.sprites || []).map((object, index) => ({ type: "sprite", index, object })),
    ...scene.collectibles.map((object, index) => ({ type: "collectible", index, object })),
    ...scene.solids.map((object, index) => ({ type: "solid", index, object }))
  ];
  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hierarchy-item";
    button.textContent = objectLabel(entry.type, entry.index, entry.object);
    button.classList.toggle("active", selected?.type === entry.type && selected?.index === entry.index);
    button.addEventListener("click", () => { selected = { type: entry.type, index: entry.index }; refreshEditor(); });
    hierarchy.append(button);
  });
}

function validateScene() {
  const issues = [];
  if (!scene.world || !Number.isFinite(scene.world.width) || !Number.isFinite(scene.world.height)) issues.push("Scene needs valid world dimensions.");
  if (!scene.player) issues.push("Scene needs a player.");
  if (!scene.goal) issues.push("Scene needs a goal.");
  const objects = [scene.player, scene.goal, ...(scene.sprites || []), ...scene.collectibles, ...scene.solids].filter(Boolean);
  if (objects.some((object) => !Number.isFinite(object.x) || !Number.isFinite(object.y) || !Number.isFinite(object.width) || !Number.isFinite(object.height) || object.width <= 0 || object.height <= 0)) issues.push("Every object needs a positive position and size.");
  return issues;
}

function showValidation(issues) {
  validationPanel.hidden = issues.length === 0;
  validationPanel.textContent = issues.join(" ");
}

function selectAt(point) {
  const candidates = [
    { type: "player", object: scene.player },
    { type: "goal", object: scene.goal },
    ...(scene.sprites || []).map((object, index) => ({ type: "sprite", index, object })),
    ...scene.collectibles.map((object, index) => ({ type: "collectible", index, object })),
    ...scene.solids.map((object, index) => ({ type: "solid", index, object }))
  ];
  const match = candidates.reverse().find((candidate) => rectangleContains(candidate.object, point));
  selected = match ? { type: match.type, index: match.index } : null;
}

function addObject(point) {
  const x = snap(point.x);
  const y = snap(point.y);
  if (tool === "wall") { scene.solids.push({ x, y, width: 64, height: 64 }); selected = { type: "solid", index: scene.solids.length - 1 }; }
  if (tool === "beacon") { scene.collectibles.push({ x: x + 5, y: y + 5, width: 22, height: 22 }); selected = { type: "collectible", index: scene.collectibles.length - 1 }; }
  if (tool === "goal") { scene.goal = { ...scene.goal, x, y }; selected = { type: "goal" }; }
  if (tool === "sprite") {
    const asset = window.InterverseAssets.list().find((item) => item.id === spriteAssetSelect.value);
    if (!asset) { document.querySelector("#save-status").textContent = "Choose a sprite image first"; return; }
    scene.sprites ||= [];
    scene.sprites.push({ x, y, width: 64, height: 64, assetId: asset.id, source: asset.source });
    selected = { type: "sprite", index: scene.sprites.length - 1 };
  }
}

function refreshSpriteAssets() {
  const currentValue = spriteAssetSelect.value;
  spriteAssetSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose an image";
  spriteAssetSelect.append(placeholder);
  window.InterverseAssets.list().forEach((asset) => {
    const option = document.createElement("option");
    option.value = asset.id;
    option.textContent = asset.name;
    spriteAssetSelect.append(option);
  });
  spriteAssetSelect.value = currentValue;
}

canvas.addEventListener("click", (event) => {
  const bounds = canvas.getBoundingClientRect();
  const point = { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  if (tool === "select") { selectAt(point); refreshEditor(); }
  else if (addObject(point) !== false) applySceneChange();
});

document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => {
  setTool(button.dataset.tool);
}));

function setTool(nextTool) {
  tool = nextTool;
  document.querySelectorAll("[data-tool]").forEach((item) => item.classList.toggle("active", item.dataset.tool === tool));
}

function updateSelectedProperties() {
  const object = selectedObject();
  if (!object) return;
  Object.entries(propertyInputs).forEach(([key, field]) => { object[key] = Number(field.value); });
  object.name = propertyNameInput.value.trim();
  refreshHierarchy();
  draw();
}

[propertyNameInput, ...Object.values(propertyInputs)].forEach((input) => {
  input.addEventListener("input", updateSelectedProperties);
  input.addEventListener("change", () => { if (selectedObject()) applySceneChange(); });
});

function deleteSelected() {
  if (!selected || selected.type === "player" || selected.type === "goal") return;
  scene[`${selected.type}s`].splice(selected.index, 1);
  selected = null;
  applySceneChange();
}

function duplicateSelected() {
  const object = selectedObject();
  if (!object || selected.type === "player" || selected.type === "goal") return;
  const duplicate = { ...clone(object), x: snap(object.x + gridSize), y: snap(object.y + gridSize), name: `${objectLabel(selected.type, selected.index, object)} Copy` };
  const objects = scene[`${selected.type}s`];
  objects.push(duplicate);
  selected = { type: selected.type, index: objects.length - 1 };
  applySceneChange("Duplicated object");
}

document.querySelector("#delete-object").addEventListener("click", deleteSelected);
document.querySelector("#duplicate-object").addEventListener("click", duplicateSelected);

document.querySelector("#reset-scene").addEventListener("click", () => {
  scene = clone(defaultScene); selected = null; applySceneChange("Scene reset");
});

document.querySelector("#preview-scene").addEventListener("click", () => {
  const issues = validateScene();
  showValidation(issues);
  if (issues.length) { document.querySelector("#save-status").textContent = "Fix scene issues before previewing"; return; }
  sessionStorage.setItem(previewKey, JSON.stringify(scene));
  sessionStorage.setItem(previewContextKey, JSON.stringify({ projectId, returnUrl: window.location.href }));
  window.location.assign("../play/");
});

document.querySelector("#export-scene").addEventListener("click", downloadProject);
undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);
document.querySelector("#import-scene").addEventListener("click", () => document.querySelector("#scene-import").click());
document.querySelector("#scene-import").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;
  try {
    importProject(JSON.parse(await file.text()));
  } catch (error) {
    window.alert(error.message);
  }
});

async function importSpriteImages(files) {
  if (!files.length) return;
  try {
    const [asset] = await window.InterverseAssets.importImages(files);
    refreshSpriteAssets();
    spriteAssetSelect.value = asset.id;
    setTool("sprite");
    document.querySelector("#save-status").textContent = `${asset.name} ready to place`;
  } catch (error) {
    window.alert(error.message);
  }
}

document.querySelector("#add-sprite-asset").addEventListener("click", () => document.querySelector("#sprite-image-import").click());
document.querySelector("#sprite-image-import").addEventListener("change", async (event) => {
  const files = Array.from(event.target.files);
  event.target.value = "";
  await importSpriteImages(files);
});
const spriteDropZone = document.querySelector("#sprite-drop-zone");
spriteDropZone.addEventListener("dragenter", (event) => { event.preventDefault(); spriteDropZone.classList.add("is-dragging"); });
spriteDropZone.addEventListener("dragover", (event) => event.preventDefault());
spriteDropZone.addEventListener("dragleave", () => spriteDropZone.classList.remove("is-dragging"));
spriteDropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  spriteDropZone.classList.remove("is-dragging");
  await importSpriteImages(Array.from(event.dataTransfer.files));
});

window.addEventListener("keydown", (event) => {
  const editable = event.target.matches("input, select, textarea");
  if (editable) return;
  const command = event.ctrlKey || event.metaKey;
  if (command && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
  if (command && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
  if (command && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelected(); return; }
  if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); deleteSelected(); return; }
  if (event.key === "Escape") { selected = null; setTool("select"); refreshEditor(); }
});

document.querySelector("#project-name").textContent = project.name;
refreshSpriteAssets();
recordHistory();
refreshEditor();
