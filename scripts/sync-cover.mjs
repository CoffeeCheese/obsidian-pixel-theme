import { copyFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

// Keep the registry's stable cover path identical to the README cover.
await copyFile(
  new URL("src/assets/screenshots/pixel-store-preview.png", root),
  new URL("screenshot.png", root),
);
console.log("Synced screenshot.png from pixel-store-preview.png");
