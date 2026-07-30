import { bootTopDownGame } from "./runtime.js";

const canvas = document.querySelector("canvas");
const status = document.querySelector("#game-status");
const touchControls = document.querySelector("#touch-controls");
let previewScene;

try {
  previewScene = JSON.parse(sessionStorage.getItem("interverse-preview-scene"));
} catch {
  previewScene = undefined;
}

sessionStorage.removeItem("interverse-preview-scene");

bootTopDownGame({
  canvas,
  projectUrl: previewScene ? undefined : "./project.interverse.json",
  scene: previewScene,
  touchControls,
  onStateChange(state) {
    status.textContent = state.complete
      ? "Signal restored"
      : `${state.collected} beacon${state.collected === 1 ? "" : "s"} recovered`;
  }
}).catch((error) => {
  status.textContent = "The engine demo could not start.";
  console.error(error);
});
