const TILE_SIZE = 48;
const spriteImages = new Map();

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

class Input {
  constructor(target = window, touchControls) {
    this.keys = new Set();
    this.touchDirections = new Set();
    target.addEventListener("keydown", (event) => this.keys.add(event.key.toLowerCase()));
    target.addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    touchControls?.querySelectorAll("[data-direction]").forEach((button) => {
      const direction = button.dataset.direction;
      const activate = (event) => { event.preventDefault(); this.touchDirections.add(direction); };
      const deactivate = (event) => { event.preventDefault(); this.touchDirections.delete(direction); };
      button.addEventListener("pointerdown", activate);
      button.addEventListener("pointerup", deactivate);
      button.addEventListener("pointercancel", deactivate);
      button.addEventListener("pointerleave", deactivate);
    });
  }

  direction() {
    return {
      x: Number(this.keys.has("d") || this.keys.has("arrowright") || this.touchDirections.has("right")) - Number(this.keys.has("a") || this.keys.has("arrowleft") || this.touchDirections.has("left")),
      y: Number(this.keys.has("s") || this.keys.has("arrowdown") || this.touchDirections.has("down")) - Number(this.keys.has("w") || this.keys.has("arrowup") || this.touchDirections.has("up"))
    };
  }
}

function resolveAxis(body, solids, axis, amount) {
  body[axis] += amount;
  for (const solid of solids) {
    if (!intersects(body, solid)) continue;
    if (axis === "x") body.x = amount > 0 ? solid.x - body.width : solid.x + solid.width;
    if (axis === "y") body.y = amount > 0 ? solid.y - body.height : solid.y + solid.height;
  }
}

function createCamera(canvas, player, world) {
  const x = Math.max(0, Math.min(player.x + player.width / 2 - canvas.width / 2, world.width - canvas.width));
  const y = Math.max(0, Math.min(player.y + player.height / 2 - canvas.height / 2, world.height - canvas.height));
  return { x, y };
}

function drawRoundedRect(context, x, y, width, height, radius, color) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function drawSprite(context, sprite) {
  if (!sprite.source) return;
  let image = spriteImages.get(sprite.source);
  if (!image) {
    image = new Image();
    image.src = sprite.source;
    spriteImages.set(sprite.source, image);
  }
  if (image.complete && image.naturalWidth > 0) context.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height);
}

async function loadJson(url, description) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${description}: ${response.status}`);
  return response.json();
}

export async function loadProject(projectUrl) {
  const manifestUrl = new URL(projectUrl, window.location.href);
  const project = await loadJson(manifestUrl, "project manifest");
  if (project.format !== "interverse.project/v0" && project.format !== "interverse.project/v1") throw new Error("Unsupported Interverse project format.");
  if (project.scene && typeof project.scene === "object") return { project, scene: project.scene };
  if (typeof project.entryScene !== "string" || project.entryScene.length === 0) throw new Error("Project manifest is missing an entry scene.");

  const scene = await loadJson(new URL(project.entryScene, manifestUrl), "entry scene");
  return { project, scene };
}

function drawWorld(context, scene, camera) {
  context.fillStyle = scene.palette.ground;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  context.strokeStyle = scene.palette.grid;
  context.lineWidth = 1;
  const startX = -camera.x % TILE_SIZE;
  const startY = -camera.y % TILE_SIZE;
  for (let x = startX; x < context.canvas.width; x += TILE_SIZE) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, context.canvas.height);
    context.stroke();
  }
  for (let y = startY; y < context.canvas.height; y += TILE_SIZE) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(context.canvas.width, y);
    context.stroke();
  }
}

function drawScene(context, scene, state) {
  const camera = createCamera(context.canvas, state.player, scene.world);
  drawWorld(context, scene, camera);
  context.save();
  context.translate(-camera.x, -camera.y);

  for (const sprite of scene.sprites || []) drawSprite(context, sprite);

  for (const solid of scene.solids) {
    drawRoundedRect(context, solid.x, solid.y, solid.width, solid.height, 8, scene.palette.wall);
    context.fillStyle = scene.palette.wallHighlight;
    context.fillRect(solid.x + 6, solid.y + 6, Math.max(0, solid.width - 12), 5);
  }

  for (const item of state.collectibles) {
    context.save();
    context.translate(item.x + item.width / 2, item.y + item.height / 2);
    context.rotate(Math.PI / 4);
    context.fillStyle = scene.palette.beacon;
    context.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
    context.restore();
  }

  if (state.complete) {
    drawRoundedRect(context, scene.goal.x, scene.goal.y, scene.goal.width, scene.goal.height, 12, scene.palette.goalComplete);
  } else {
    drawRoundedRect(context, scene.goal.x, scene.goal.y, scene.goal.width, scene.goal.height, 12, scene.palette.goal);
    context.fillStyle = "#ffffff99";
    context.fillRect(scene.goal.x + 10, scene.goal.y + 10, scene.goal.width - 20, 5);
  }

  drawRoundedRect(context, state.player.x, state.player.y, state.player.width, state.player.height, 10, scene.palette.player);
  context.fillStyle = "#ffffffcc";
  context.fillRect(state.player.x + 9, state.player.y + 9, 7, 7);
  context.restore();

  context.fillStyle = "#101827cc";
  context.fillRect(16, 16, 198, 56);
  context.fillStyle = "#f7fbff";
  context.font = "600 15px system-ui, sans-serif";
  context.fillText(`Beacons ${state.collected}/${scene.collectibles.length}`, 29, 40);
  context.fillStyle = "#b8c9dd";
  context.font = "13px system-ui, sans-serif";
  context.fillText(state.complete ? "Signal restored" : "Reach the signal gate", 29, 60);
}

export async function bootTopDownGame({ canvas, projectUrl, sceneUrl, scene: suppliedScene, touchControls, onStateChange = () => {} }) {
  if (!projectUrl && !sceneUrl && !suppliedScene) throw new Error("A project, scene URL, or scene object is required.");
  const scene = suppliedScene || (projectUrl
    ? (await loadProject(projectUrl)).scene
    : await loadJson(sceneUrl, "scene"));
  const context = canvas.getContext("2d");
  const input = new Input(window, touchControls);
  const state = {
    player: { ...scene.player },
    collectibles: scene.collectibles.map((item) => ({ ...item })),
    collected: 0,
    complete: false
  };
  let lastTime = performance.now();

  function frame(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const direction = input.direction();
    const magnitude = Math.hypot(direction.x, direction.y) || 1;
    const speed = scene.player.speed * delta / magnitude;
    resolveAxis(state.player, scene.solids, "x", direction.x * speed);
    resolveAxis(state.player, scene.solids, "y", direction.y * speed);

    state.collectibles = state.collectibles.filter((item) => {
      if (!intersects(state.player, item)) return true;
      state.collected += 1;
      onStateChange({ ...state });
      return false;
    });

    if (!state.complete && state.collectibles.length === 0 && intersects(state.player, scene.goal)) {
      state.complete = true;
      onStateChange({ ...state });
    }

    drawScene(context, scene, state);
    requestAnimationFrame(frame);
  }

  onStateChange({ ...state });
  requestAnimationFrame(frame);
}
