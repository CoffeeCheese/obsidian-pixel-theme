import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runObjectiveContractChecks({
  root,
  execute = execFileAsync,
}) {
  try {
    await execute(
      process.execPath,
      ["--test", "--test-concurrency=1"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      },
    );
  } catch (error) {
    const detail = [error.stderr, error.stdout, error.message]
      .find((value) => typeof value === "string" && value.trim() !== "")
      ?.trim();
    throw new Error(
      `H5 objective contracts failed${detail ? `: ${detail}` : ""}`,
      { cause: error },
    );
  }
  return [{ check: "repository-contracts", result: "Pass" }];
}
