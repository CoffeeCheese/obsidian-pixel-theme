import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  assertInteractiveReview,
  openReviewSession,
  readSourceProvenance,
} from "../h5/review-session.mjs";

const execFileAsync = promisify(execFile);

test("review command rejects a non-interactive terminal before lifecycle work", () => {
  assert.throws(
    () => assertInteractiveReview({ input: { isTTY: false } }),
    /requires an interactive terminal/,
  );
  assert.doesNotThrow(() =>
    assertInteractiveReview({ input: { isTTY: true } }),
  );
});

test("source provenance records the exact commit, worktree state, and implementer", async () => {
  const repository = await mkdtemp(path.join(tmpdir(), "pixel-h5-source-test-"));
  try {
    await execFileAsync("git", ["init", "--quiet"], { cwd: repository });
    await execFileAsync("git", ["config", "user.name", "Theme Implementer"], {
      cwd: repository,
    });
    await execFileAsync("git", ["config", "user.email", "theme@example.com"], {
      cwd: repository,
    });
    const sourcePath = path.join(repository, "theme.css");
    await writeFile(sourcePath, "/* Pixel */\n");
    await execFileAsync("git", ["add", "theme.css"], { cwd: repository });
    await execFileAsync("git", ["commit", "--quiet", "-m", "test source"], {
      cwd: repository,
    });
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    });

    assert.deepEqual(await readSourceProvenance({ root: repository }), {
      commit: stdout.trim(),
      dirty: false,
      author: "Theme Implementer",
    });

    await writeFile(sourcePath, "/* Pixel changed */\n");
    assert.equal(
      (await readSourceProvenance({ root: repository })).dirty,
      true,
    );
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
});

test("review session opens the temporary page and waits for explicit completion", async () => {
  const events = [];
  const output = { write(value) { events.push(`output:${value}`); } };
  await openReviewSession({
    benchPath: "/tmp/pixel-h5/review.html",
    output,
    async openFile(url) {
      events.push(`open:${url.href}`);
    },
    async waitForConfirmation(prompt) {
      events.push(`wait:${prompt}`);
    },
  });

  assert.match(events[0], /^output:Review bench ready:/);
  assert.equal(events[1], "open:file:///tmp/pixel-h5/review.html");
  assert.match(events[2], /^wait:Press Enter after completing or copying/);
});
