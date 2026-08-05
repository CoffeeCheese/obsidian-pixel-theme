import { execFile } from "node:child_process";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);

export function assertInteractiveReview({ input = process.stdin } = {}) {
  if (!input.isTTY) {
    throw new Error(
      "H5 review requires an interactive terminal; rerun npm run visual:h5 from a TTY",
    );
  }
}

export async function readSourceProvenance({ root }) {
  const options = { cwd: root, encoding: "utf8" };
  const [commitResult, statusResult, authorResult] = await Promise.all([
    execFileAsync("git", ["rev-parse", "HEAD"], options),
    execFileAsync("git", ["status", "--porcelain"], options),
    execFileAsync("git", ["show", "-s", "--format=%an", "HEAD"], options),
  ]);
  return {
    commit: commitResult.stdout.trim(),
    dirty: statusResult.stdout.trim() !== "",
    author: authorResult.stdout.trim(),
  };
}

async function defaultOpenFile(url) {
  const command =
    process.platform === "darwin"
      ? ["open", [url.href]]
      : process.platform === "win32"
        ? ["cmd.exe", ["/c", "start", "", url.href]]
        : ["xdg-open", [url.href]];
  await execFileAsync(command[0], command[1]);
}

async function defaultWaitForConfirmation(prompt, { input, output, signal }) {
  assertInteractiveReview({ input });
  const readline = createInterface({ input, output });
  try {
    await readline.question(prompt, signal ? { signal } : undefined);
  } finally {
    readline.close();
  }
}

export async function openReviewSession({
  benchPath,
  signal,
  input = process.stdin,
  output = process.stdout,
  openFile = defaultOpenFile,
  waitForConfirmation = (prompt) =>
    defaultWaitForConfirmation(prompt, { input, output, signal }),
}) {
  const benchUrl = pathToFileURL(benchPath);
  output.write(`Review bench ready: ${benchUrl.href}\n`);
  await openFile(benchUrl);
  await waitForConfirmation(
    "Press Enter after completing or copying the review notes; the temporary page and images will then be removed. ",
  );
}
