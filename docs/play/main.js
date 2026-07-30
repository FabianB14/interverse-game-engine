import { bootTopDownGame } from "./runtime.js";
import { createAudioFeedback } from "./audio-feedback.js";

const canvas = document.querySelector("canvas");
const status = document.querySelector("#game-status");
const touchControls = document.querySelector("#touch-controls");
const pauseButton = document.querySelector("#pause-game");
const restartButton = document.querySelector("#restart-game");
const exitPreview = document.querySelector("#exit-preview");
const previewContextKey = "interverse-preview-context";
let previewScene;
let previewContext = {};
let game;

try {
  previewScene = JSON.parse(sessionStorage.getItem("interverse-preview-scene"));
} catch {
  previewScene = undefined;
}

sessionStorage.removeItem("interverse-preview-scene");
try {
  previewContext = JSON.parse(sessionStorage.getItem(previewContextKey)) || {};
} catch {
  previewContext = {};
}
sessionStorage.removeItem(previewContextKey);

const progressKey = `interverse-playtest-progress:${previewContext.projectId || "demo"}`;
const audioFeedback = createAudioFeedback();
exitPreview.href = previewContext.returnUrl || "../";
exitPreview.textContent = previewContext.returnUrl ? "Exit preview" : "Exit";

function readSavedState() {
  try { return JSON.parse(localStorage.getItem(progressKey)); } catch { return undefined; }
}

function updateStatus(state) {
  if (state.paused) status.textContent = "Paused";
  else if (state.complete) status.textContent = "Signal restored";
  else status.textContent = `${state.collected} beacon${state.collected === 1 ? "" : "s"} · ${state.deaths} resets · ${Math.floor(state.elapsed)}s`;
}

async function start() {
  game = await bootTopDownGame({
    canvas,
    projectUrl: previewScene ? undefined : "./project.interverse.json",
    scene: previewScene,
    touchControls,
    savedState: readSavedState(),
    onStateChange(state) {
      localStorage.setItem(progressKey, JSON.stringify(state));
      updateStatus(state);
      pauseButton.textContent = state.paused ? "Resume" : "Pause";
    },
    onEvent(event) { audioFeedback.play(event); }
  });
}

pauseButton.addEventListener("click", () => { if (game?.isPaused()) game.resume(); else game?.pause(); });
restartButton.addEventListener("click", () => { localStorage.removeItem(progressKey); game?.restart(); });

start().catch((error) => {
  status.textContent = "The engine demo could not start.";
  console.error(error);
});
