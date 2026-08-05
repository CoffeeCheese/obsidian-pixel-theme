import assert from "node:assert/strict";
import test from "node:test";

import { createObsidianCliAdapter } from "../h5/obsidian-cli-adapter.mjs";

test("built-in adapter reads both Obsidian error buffers before approval", async () => {
  const commands = [];
  const adapter = await createObsidianCliAdapter({
    root: new URL("../", import.meta.url).pathname,
    async executeCommand(argumentsList) {
      commands.push(argumentsList);
      return argumentsList.includes("dev:errors")
        ? "No errors captured.\n"
        : "No console messages captured.\n";
    },
  });

  assert.deepEqual(await adapter.verifyObjectiveVetoes({}), [
    { check: "error-buffers", result: "Pass" },
  ]);
  assert.ok(commands.some((command) => command.includes("dev:errors")));
  assert.ok(
    commands.some(
      (command) =>
        command.includes("dev:console") && command.includes("level=error"),
    ),
  );
});

test("built-in adapter rejects a non-empty Obsidian error buffer", async () => {
  const adapter = await createObsidianCliAdapter({
    root: new URL("../", import.meta.url).pathname,
    async executeCommand(argumentsList) {
      return argumentsList.includes("dev:errors")
        ? "Uncaught TypeError: theme runtime failed\n"
        : "No console messages captured.\n";
    },
  });

  await assert.rejects(
    adapter.verifyObjectiveVetoes({}),
    /captured errors vetoed H5 approval.*TypeError/,
  );
});
