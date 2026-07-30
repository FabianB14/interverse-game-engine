const assetStorageKey = "interverse-studio-assets-v1";

function readAssets() {
  try { return JSON.parse(localStorage.getItem(assetStorageKey)) || []; } catch { return []; }
}

function saveAssets(assets) { localStorage.setItem(assetStorageKey, JSON.stringify(assets)); }

function dataUrlFor(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

async function importImages(files) {
  const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (images.length === 0) throw new Error("Choose at least one image file.");
  const imported = await Promise.all(images.map(async (file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type,
    source: await dataUrlFor(file),
    createdAt: Date.now()
  })));
  saveAssets([...imported, ...readAssets()]);
  return imported;
}

function removeAsset(id) { saveAssets(readAssets().filter((asset) => asset.id !== id)); }

window.InterverseAssets = { importImages, list: readAssets, remove: removeAsset };
