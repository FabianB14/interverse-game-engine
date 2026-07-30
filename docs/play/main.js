import { bootTopDownGame } from "./runtime.js";

const canvas = document.querySelector("canvas");
const status = document.querySelector("#game-status");

bootTopDownGame({
  canvas,
  projectUrl: "./project.interverse.json",
  onStateChange(state) {
    status.textContent = state.complete
      ? "Signal restored"
      : `${state.collected} beacon${state.collected === 1 ? "" : "s"} recovered`;
  }
}).catch((error) => {
  status.textContent = "The engine demo could not start.";
  console.error(error);
});
