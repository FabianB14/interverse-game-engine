const templates = [
  { id: "platformer", name: "2D Platformer", description: "Movement, jumping, collectibles, and a finish line.", mark: "P" },
  { id: "top-down", name: "Top-down Adventure", description: "A map, player movement, interaction, and dialogue.", mark: "T" },
  { id: "puzzle", name: "Puzzle Room", description: "A compact scene for rules, logic, and progression.", mark: "R" }
];

const storageKey = "interverse-studio-projects";
const sceneStoragePrefix = "interverse-editor-scene-v0:";
const projectGrid = document.querySelector("#project-grid");
const projectCount = document.querySelector("#project-count");
const emptyState = document.querySelector("#empty-state");
const projectCardTemplate = document.querySelector("#project-card-template");
const projectDialog = document.querySelector("#project-dialog");
const projectForm = document.querySelector("#project-form");
const installBanner = document.querySelector("#install-banner");
const installButton = document.querySelector("#install-button");
const installCopy = document.querySelector("#install-copy");
let deferredInstallPrompt;

function readProjects() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
}

function saveProjects(projects) { localStorage.setItem(storageKey, JSON.stringify(projects)); }

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function openProject(project) { window.location.assign(`editor/?project=${encodeURIComponent(project.id)}`); }

function importProject(packageData) {
  if (packageData.format !== "interverse.project/v1" || !packageData.scene || typeof packageData.name !== "string") {
    throw new Error("Choose an Interverse project export with its scene included.");
  }
  const template = templates.find((item) => item.id === packageData.template) || templates[0];
  const project = { id: crypto.randomUUID(), name: packageData.name.trim() || "Imported project", template: template.name, templateId: template.id, createdAt: Date.now() };
  localStorage.setItem(`${sceneStoragePrefix}${project.id}`, JSON.stringify(packageData.scene));
  saveProjects([project, ...readProjects()]);
  return project;
}

function renderProjects(query = "") {
  const projects = readProjects().filter((project) => project.name.toLowerCase().includes(query.toLowerCase()));
  projectGrid.replaceChildren();
  projectCount.textContent = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
  emptyState.hidden = projects.length !== 0 || query.length !== 0;
  projects.forEach((project) => {
    const card = projectCardTemplate.content.cloneNode(true);
    card.querySelector(".project-template").textContent = project.template;
    card.querySelector("h2").textContent = project.name;
    card.querySelector(".project-date").textContent = `Created ${formatDate(project.createdAt)}`;
    card.querySelector(".open-project").addEventListener("click", () => openProject(project));
    card.querySelector(".delete-project").addEventListener("click", () => {
      saveProjects(readProjects().filter((item) => item.id !== project.id));
      renderProjects(document.querySelector("#project-search").value);
    });
    projectGrid.append(card);
  });
}

function renderTemplates() {
  const templateGrid = document.querySelector("#template-grid");
  const optionGrid = document.querySelector("#template-options");
  templates.forEach((template, index) => {
    const card = document.createElement("article");
    card.className = "template-card";
    card.innerHTML = `<div class="template-icon">${template.mark}</div><h3>${template.name}</h3><p>${template.description}</p><button class="text-button" type="button">Use template</button>`;
    card.querySelector("button").addEventListener("click", () => openProjectDialog(template.id));
    templateGrid.append(card);
    const option = document.createElement("label");
    option.className = "template-option";
    option.innerHTML = `<input type="radio" name="template" value="${template.id}" ${index === 0 ? "checked" : ""} /><span><strong>${template.name}</strong><small>${template.description}</small></span>`;
    optionGrid.append(option);
  });
}

function renderAssets() {
  const assets = window.InterverseAssets.list();
  const assetGrid = document.querySelector("#asset-grid");
  assetGrid.replaceChildren();
  document.querySelector("#asset-count").textContent = `${assets.length} ${assets.length === 1 ? "image" : "images"}`;
  document.querySelector("#asset-empty-state").hidden = assets.length !== 0;
  assets.forEach((asset) => {
    const card = document.createElement("article");
    card.className = "asset-card";
    const image = document.createElement("img");
    image.src = asset.source;
    image.alt = asset.name;
    const content = document.createElement("div");
    content.className = "asset-card-content";
    const name = document.createElement("h3");
    name.textContent = asset.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => { window.InterverseAssets.remove(asset.id); renderAssets(); });
    content.append(name, remove);
    card.append(image, content);
    assetGrid.append(card);
  });
}

function openProjectDialog(templateId = "platformer") {
  projectForm.reset();
  const option = document.querySelector(`input[name="template"][value="${templateId}"]`);
  if (option) option.checked = true;
  projectDialog.showModal();
  document.querySelector("#project-name").focus();
}

function showView(view) {
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll("[data-view-content]").forEach((section) => {
    const active = section.dataset.viewContent === view;
    section.hidden = !active;
    section.classList.toggle("active", active);
  });
  document.querySelector("#view-title").textContent = ({ projects: "Your projects", templates: "Templates", assets: "Asset library", learn: "Learn" })[view];
}

function setupInstallPrompt() {
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isStandalone || sessionStorage.getItem("interverse-install-dismissed")) return;
  if (isIos) {
    installCopy.textContent = "In Safari, use Share and then choose Add to Home Screen.";
    installButton.hidden = true;
    installBanner.hidden = false;
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBanner.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = undefined;
    installBanner.hidden = true;
  });
  document.querySelector("#dismiss-install").addEventListener("click", () => {
    sessionStorage.setItem("interverse-install-dismissed", "true");
    installBanner.hidden = true;
  });
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
document.querySelector("#new-project-button").addEventListener("click", () => openProjectDialog());
document.querySelectorAll("[data-open-project-dialog]").forEach((button) => button.addEventListener("click", () => openProjectDialog()));
document.querySelector("#close-dialog").addEventListener("click", () => projectDialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => projectDialog.close());
document.querySelector("#project-search").addEventListener("input", (event) => renderProjects(event.target.value));
projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(projectForm);
  const template = templates.find((item) => item.id === formData.get("template"));
  const project = { id: crypto.randomUUID(), name: formData.get("project-name").trim(), template: template.name, templateId: template.id, createdAt: Date.now() };
  saveProjects([project, ...readProjects()]);
  projectDialog.close();
  openProject(project);
});

document.querySelector("#import-project-button").addEventListener("click", () => document.querySelector("#project-import").click());
document.querySelector("#project-import").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (!file) return;
  try {
    const project = importProject(JSON.parse(await file.text()));
    openProject(project);
  } catch (error) {
    window.alert(error.message);
  }
});

async function importAssetFiles(files) {
  if (!files.length) return;
  try {
    await window.InterverseAssets.importImages(files);
    renderAssets();
    showView("assets");
  } catch (error) {
    window.alert(error.message);
  }
}

async function handleAssetImport(event) {
  const files = Array.from(event.target.files);
  event.target.value = "";
  await importAssetFiles(files);
}

document.querySelector("#import-assets-button").addEventListener("click", () => document.querySelector("#asset-import").click());
document.querySelectorAll("[data-import-assets]").forEach((button) => button.addEventListener("click", () => document.querySelector("#asset-import").click()));
document.querySelector("#asset-import").addEventListener("change", handleAssetImport);
const assetDropZone = document.querySelector("#asset-drop-zone");
assetDropZone.addEventListener("click", () => document.querySelector("#asset-import").click());
assetDropZone.addEventListener("dragenter", (event) => { event.preventDefault(); assetDropZone.classList.add("is-dragging"); });
assetDropZone.addEventListener("dragover", (event) => event.preventDefault());
assetDropZone.addEventListener("dragleave", () => assetDropZone.classList.remove("is-dragging"));
assetDropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  assetDropZone.classList.remove("is-dragging");
  await importAssetFiles(Array.from(event.dataTransfer.files));
});

renderTemplates();
renderProjects();
renderAssets();
setupInstallPrompt();
const requestedView = new URLSearchParams(window.location.search).get("view");
if (["projects", "templates", "assets", "learn"].includes(requestedView)) showView(requestedView);
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
