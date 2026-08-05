import assert from "node:assert/strict";
import test from "node:test";

import { runObjectiveContractChecks } from "../h5/objective-checks.mjs";

test("review-time objective contracts report Pass only after the real test command succeeds", async () => {
  const calls = [];
  const results = await runObjectiveContractChecks({
    root: "/pixel-repository",
    async execute(command, argumentsList, options) {
      calls.push({ command, argumentsList, options });
      return { stdout: "tests passed", stderr: "" };
    },
  });

  assert.deepEqual(results, [
    { check: "repository-contracts", result: "Pass" },
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, process.execPath);
  assert.deepEqual(calls[0].argumentsList, [
    "--test",
    "--test-concurrency=1",
  ]);
  assert.equal(calls[0].options.cwd, "/pixel-repository");
});

test("a failing objective contract command vetoes review instead of fabricating Pass", async () => {
  await assert.rejects(
    runObjectiveContractChecks({
      root: "/pixel-repository",
      async execute() {
        const error = new Error("test command failed");
        error.stderr = "contrast contract failed";
        throw error;
      },
    }),
    /objective contracts failed.*contrast contract failed/,
  );
});
