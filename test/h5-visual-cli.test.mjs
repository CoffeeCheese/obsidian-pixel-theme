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
});
