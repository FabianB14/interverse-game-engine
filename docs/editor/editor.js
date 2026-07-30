const sceneKey = "interverse-editor-scene-v0";
const previewKey = "interverse-preview-scene";
const gridSize = 32;
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

const defaultScene = {
  world: { width: 960, height: 640 },
  palette: { ground: "#e8f1f8", grid: "#d4e1ec", wall: "#28547e", wallHighlight: "#5d91bd", player: "#e45b50", beacon: "#f2b94b", goal: "#3baf89", goalComplete: "#194d42" },
  player: { x: 96, y: 160, width: 30, height: 30, speed: 240 },
  goal: { x: 800, y: 448, width: 96, height: 96 },
  collectibles: [{ x: 208, y: 205, width: 22, height: 22 }, { x: 590, y: 270, width: 22, height: 22 }],
  solids: [{ x: 0, y: 0, width: 960, height: 56 }, { x: 0, y: 584, width: 960, height: 56 }, { x: 0, y: 0, width: 56, height: 640 }, { x: 904, y: 0, width: 56, height: 640 }, { x: 320, y: 104, width: 64, height: 288 }, { x: 544, y: 320, width: 256, height: 64 }]
};

let scene = loadScene();
let tool = "select";
let selected = null;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadScene() { try { return JSON.parse(localStorage.getItem(sceneKey)) || clone(defaultScene); } catch { return clone(defaultScene); } }
function saveScene() { localStorage.setItem(sceneKey, JSON.stringify(scene)); document.querySelector("#save-status").textContent = "Saved locally"; }
function snap(value) { return Math.max(0, Math.min(Math.round(value / gridSize) * gridSize, 928)); }
function rectangleContains(rectangle, point) { return point.x >= rectangle.x && point.x <= rectangle.x + rectangle.width && point.y >= rectangle.y && point.y <= rectangle.y + rectangle.height; }
function selectedObject() { if (!selected) return null; if (selected.type === "player") return scene.player; if (selected.type === "goal") return scene.goal; return scene[`${selected.type}s`][selected.index]; }

function drawRoundedRect(x, y, width, height, radius, color) { context.beginPath(); context.roundRect(x, y, width, height, radius); context.fillStyle = color; context.fill(); }
function drawDiamond(item) { context.save(); context.translate(item.x + item.width / 2, item.y + item.height / 2); context.rotate(Math.PI / 4); context.fillStyle = scene.palette.beacon; context.fillRect(-item.width / 2, -item.height / 2, item.width, item.height); context.restore(); }
function drawSelection(object) { if (!object) return; context.strokeStyle = "#0e68d8"; context.lineWidth = 3; context.setLineDash([6, 4]); context.strokeRect(object.x - 4, object.y - 4, object.width + 8, object.height + 8); context.setLineDash([]); }

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = scene.palette.ground;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = scene.palette.grid;
  for (let x = 0; x <= canvas.width; x += gridSize) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
  for (let y = 0; y <= canvas.height; y += gridSize) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
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
  Object.entries(propertyInputs).forEach(([key, input]) => { input.value = object[key]; });
  document.querySelector("#delete-object").hidden = selected.type === "player" || selected.type === "goal";
}

function selectAt(point) {
  const candidates = [
    { type: "player", object: scene.player },
    { type: "goal", object: scene.goal },
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
}

canvas.addEventListener("click", (event) => {
  const bounds = canvas.getBoundingClientRect();
  const point = { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  if (tool === "select") selectAt(point); else addObject(point);
  saveScene(); refreshInspector(); draw();
});

document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => {
  tool = button.dataset.tool;
  document.querySelectorAll("[data-tool]").forEach((item) => item.classList.toggle("active", item === button));
}));

Object.values(propertyInputs).forEach((input) => input.addEventListener("input", () => {
  const object = selectedObject();
  if (!object) return;
  Object.entries(propertyInputs).forEach(([key, field]) => { object[key] = Number(field.value); });
  saveScene(); draw();
}));

document.querySelector("#delete-object").addEventListener("click", () => {
  if (!selected || selected.type === "player" || selected.type === "goal") return;
  scene[`${selected.type}s`].splice(selected.index, 1);
  selected = null;
  saveScene(); refreshInspector(); draw();
});

document.querySelector("#reset-scene").addEventListener("click", () => {
  scene = clone(defaultScene); selected = null; saveScene(); refreshInspector(); draw();
});

document.querySelector("#preview-scene").addEventListener("click", () => {
  sessionStorage.setItem(previewKey, JSON.stringify(scene));
  window.location.assign("../play/");
});

refreshInspector();
draw();
