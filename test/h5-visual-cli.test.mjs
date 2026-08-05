import assert from "node:assert/strict";
import test from "node:test";

import { parseVisualH5Arguments } from "../h5/visual-h5.mjs";

test("visual H5 CLI accepts focused reruns and explicit temporary retention", () => {
  assert.deepEqual(
    parseVisualH5Arguments([
      "--case=canonical-mixed-tabs",
      "--theme=dark",
      "--keep-temp",
      "--adapter=./local-adapter.mjs",
    ]),
    {
      caseFilter: "canonical-mixed-tabs",
      themeFilter: "dark",
      keepTemp: true,
      adapterPath: "./local-adapter.mjs",
      verifyApproval: false,
      requireApproval: false,
      approvalPath: undefined,
      help: false,
    },
  );
});

test("visual H5 CLI exposes desktop-free optional and release approval verification", () => {
  assert.deepEqual(
    parseVisualH5Arguments([
      "--verify-approval",
      "--require-approval",
      "--approval=./candidate-approval.json",
    ]),
    {
      caseFilter: undefined,
      themeFilter: undefined,
      keepTemp: false,
      adapterPath: undefined,
      verifyApproval: true,
      requireApproval: true,
      approvalPath: "./candidate-approval.json",
      help: false,
    },
  );
});

test("visual H5 CLI rejects invalid and unknown options", () => {
  assert.throws(
    () => parseVisualH5Arguments(["--theme=sepia"]),
    /--theme must be light or dark/,
  );
  assert.throws(
    () => parseVisualH5Arguments(["--approve"]),
    /unknown option --approve/,
  );
  assert.throws(
    () => parseVisualH5Arguments(["--require-approval"]),
    /--require-approval requires --verify-approval/,
  );
  assert.throws(
    () => parseVisualH5Arguments(["--verify-approval", "--theme=light"]),
    /capture options cannot be used with --verify-approval/,
  );
});
