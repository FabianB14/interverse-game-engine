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

function drawHazard(context, hazard, color) {
  context.fillStyle = color;
  context.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
  context.fillStyle = "#ffffff55";
  for (let x = hazard.x - hazard.height; x < hazard.x + hazard.width; x += 18) {
    context.beginPath();
    context.moveTo(x, hazard.y + hazard.height);
    context.lineTo(x + hazard.height, hazard.y);
    context.lineTo(x + hazard.height * 2, hazard.y + hazard.height);
    context.fill();
  }
}

function drawCheckpoint(context, checkpoint, active, palette) {
  drawRoundedRect(context, checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height, 6, active ? (palette.checkpointActive || "#255b87") : (palette.checkpoint || "#3d7fb5"));
  context.fillStyle = "#ffffffaa";
  context.fillRect(checkpoint.x + checkpoint.width / 2 - 2, checkpoint.y + 7, 4, checkpoint.height - 14);
  context.fillRect(checkpoint.x + checkpoint.width / 2 + 2, checkpoint.y + 8, checkpoint.width / 2 - 8, 10);
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

function drawScene(context, scene, state, paused) {
  const camera = createCamera(context.canvas, state.player, scene.world);
  drawWorld(context, scene, camera);
  context.save();
  context.translate(-camera.x, -camera.y);

  for (const sprite of scene.sprites || []) drawSprite(context, sprite);

  (scene.checkpoints || []).forEach((checkpoint, index) => drawCheckpoint(context, checkpoint, state.activeCheckpoint === index, scene.palette));

  for (const hazard of scene.hazards || []) drawHazard(context, hazard, scene.palette.hazard || "#d64d4d");

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
  context.fillRect(16, 16, 244, 76);
  context.fillStyle = "#f7fbff";
  context.font = "600 15px system-ui, sans-serif";
  context.fillText(`Beacons ${state.collected}/${scene.collectibles.length}`, 29, 40);
  context.fillStyle = "#b8c9dd";
  context.font = "13px system-ui, sans-serif";
  context.fillText(state.complete ? "Signal restored" : `Resets ${state.deaths} · ${Math.floor(state.elapsed)}s`, 29, 60);
  context.fillText(state.complete ? "Run complete" : "Reach the signal gate", 29, 80);

  if (paused) {
    context.fillStyle = "#101827b8";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = "#f7fbff";
    context.font = "700 30px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("Paused", context.canvas.width / 2, context.canvas.height / 2);
    context.textAlign = "start";
  }
}

function newState(scene, savedState) {
  const collectibles = Array.isArray(savedState?.collectibles) ? savedState.collectibles.map((item) => ({ ...item })) : scene.collectibles.map((item) => ({ ...item }));
  const spawn = savedState?.spawn && Number.isFinite(savedState.spawn.x) && Number.isFinite(savedState.spawn.y) ? { ...scene.player, ...savedState.spawn } : { ...scene.player };
  return {
    player: { ...scene.player, ...(savedState?.player || {}) },
    collectibles,
    collected: Number.isFinite(savedState?.collected) ? savedState.collected : scene.collectibles.length - collectibles.length,
    complete: Boolean(savedState?.complete),
    spawn,
    activeCheckpoint: Number.isInteger(savedState?.activeCheckpoint) ? savedState.activeCheckpoint : -1,
    deaths: Number.isFinite(savedState?.deaths) ? savedState.deaths : 0,
    elapsed: Number.isFinite(savedState?.elapsed) ? savedState.elapsed : 0
  };
}

export async function bootTopDownGame({ canvas, projectUrl, sceneUrl, scene: suppliedScene, touchControls, savedState, onStateChange = () => {}, onEvent = () => {} }) {
  if (!projectUrl && !sceneUrl && !suppliedScene) throw new Error("A project, scene URL, or scene object is required.");
  const scene = suppliedScene || (projectUrl
    ? (await loadProject(projectUrl)).scene
    : await loadJson(sceneUrl, "scene"));
  const context = canvas.getContext("2d");
  const input = new Input(window, touchControls);
  const state = newState(scene, savedState);
  let paused = false;
  let animationFrame;
  let lastTime = performance.now();
  let reportedSecond = Math.floor(state.elapsed);

  function snapshot() {
    return { player: { ...state.player }, collectibles: state.collectibles.map((item) => ({ ...item })), collected: state.collected, complete: state.complete, spawn: { ...state.spawn }, activeCheckpoint: state.activeCheckpoint, deaths: state.deaths, elapsed: state.elapsed };
  }

  function notify() { onStateChange({ ...snapshot(), paused }); }

  function emit(type) { onEvent({ type, state: snapshot() }); }

  function restart() {
    const reset = newState(scene);
    state.player = reset.player;
    state.collectibles = reset.collectibles;
    state.collected = reset.collected;
    state.complete = reset.complete;
    state.spawn = reset.spawn;
    state.activeCheckpoint = reset.activeCheckpoint;
    state.deaths = reset.deaths;
    state.elapsed = reset.elapsed;
    paused = false;
    lastTime = performance.now();
    reportedSecond = 0;
    emit("restart");
    notify();
  }

  function pause() {
    if (paused) return;
    paused = true;
    emit("pause");
    notify();
  }

  function resume() {
    if (!paused) return;
    paused = false;
    lastTime = performance.now();
    emit("resume");
    notify();
  }

  function frame(now) {
    if (!paused) {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      state.elapsed += delta;
      const direction = input.direction();
      const magnitude = Math.hypot(direction.x, direction.y) || 1;
      const speed = scene.player.speed * delta / magnitude;
      resolveAxis(state.player, scene.solids, "x", direction.x * speed);
      resolveAxis(state.player, scene.solids, "y", direction.y * speed);

      const checkpointIndex = (scene.checkpoints || []).findIndex((checkpoint) => intersects(state.player, checkpoint));
      if (checkpointIndex >= 0 && checkpointIndex !== state.activeCheckpoint) {
        const checkpoint = scene.checkpoints[checkpointIndex];
        state.activeCheckpoint = checkpointIndex;
        state.spawn = { ...scene.player, x: checkpoint.x + (checkpoint.width - scene.player.width) / 2, y: checkpoint.y + (checkpoint.height - scene.player.height) / 2 };
        emit("checkpoint");
        notify();
      }

      if ((scene.hazards || []).some((hazard) => intersects(state.player, hazard))) {
        state.deaths += 1;
        state.player = { ...state.spawn };
        emit("respawn");
        notify();
      } else {
        state.collectibles = state.collectibles.filter((item) => {
          if (!intersects(state.player, item)) return true;
          state.collected += 1;
          emit("pickup");
          notify();
          return false;
        });

        if (!state.complete && state.collectibles.length === 0 && intersects(state.player, scene.goal)) {
          state.complete = true;
          emit("complete");
          notify();
        }
      }

      const elapsedSecond = Math.floor(state.elapsed);
      if (elapsedSecond !== reportedSecond) { reportedSecond = elapsedSecond; notify(); }
    }

    drawScene(context, scene, state, paused);
    animationFrame = requestAnimationFrame(frame);
  }

  notify();
  animationFrame = requestAnimationFrame(frame);
  return { getState: snapshot, isPaused: () => paused, pause, restart, resume, dispose: () => cancelAnimationFrame(animationFrame) };
}
