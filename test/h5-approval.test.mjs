import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  H5_APPROVAL_GATE_IDS,
  H5_APPROVAL_OBJECTIVE_CHECKS,
  H5_APPROVAL_CONTRACT,
  createApprovedH5Record,
  verifyApprovalFile,
  verifyApprovalRecord,
} from "../h5/approval.mjs";

const binding = {
  themeCssSha256: "a".repeat(64),
  fixtureVersion: "1.0.0",
  rubricVersion: "1.0.0",
  requiredObsidianVersion: "1.12.7",
};

function approvedReview(overrides = {}) {
  return {
    reviewer: "Visual Owner",
    source: {
      commit: "c".repeat(40),
      dirty: false,
      author: "Theme Implementer",
    },
    package: { themeCssSha256: binding.themeCssSha256 },
    environment: { obsidianVersion: binding.requiredObsidianVersion },
    fixtureVersion: binding.fixtureVersion,
    rubricVersion: binding.rubricVersion,
    objectiveResults: H5_APPROVAL_OBJECTIVE_CHECKS.map((check) => ({
      check,
      result: "Pass",
    })),
    gates: H5_APPROVAL_GATE_IDS.map((gate) => ({
      gate,
      decision: "Pass",
      findings: [],
    })),
    identity: {
      decision: "Approved",
      rationale: "The complete matrix retains the approved H5 identity.",
    },
    ...overrides,
  };
}

function approvedRecord(overrides = {}) {
  return {
    ...createApprovedH5Record(approvedReview(), {
      reviewedAt: "2026-08-05T08:00:00.000Z",
    }),
    ...overrides,
  };
}

test("named visual owner can export one exact-artifact Approved record", () => {
  const record = approvedRecord();

  assert.equal(record.kind, "pixel-h5-exact-artifact-approval");
  assert.equal(record.claim, "Approved");
  assert.equal(record.artifact.themeCssSha256, binding.themeCssSha256);
  assert.equal(record.source.reviewedCommit, "c".repeat(40));
  assert.equal(record.environment.fixtureVersion, binding.fixtureVersion);
  assert.equal(record.environment.rubricVersion, binding.rubricVersion);
  assert.equal(
    record.environment.requiredObsidianVersion,
    binding.requiredObsidianVersion,
  );
  assert.equal(record.reviewer.name, "Visual Owner");
  assert.equal(record.signature.signedBy, "Visual Owner");
  assert.equal(record.signature.signedAt, record.reviewedAt);
  assert.deepEqual(
    record.gates.map(({ gate, decision }) => ({ gate, decision })),
    H5_APPROVAL_GATE_IDS.map((gate) => ({ gate, decision: "Pass" })),
  );
  assert.equal(record.h5Identity.decision, "Approved");
  assert.doesNotMatch(JSON.stringify(record), /data:image|\.png|\.webp|\.jpe?g/i);
  assert.deepEqual(verifyApprovalRecord(record, binding), {
    status: "valid",
    reviewer: "Visual Owner",
    reviewedAt: "2026-08-05T08:00:00.000Z",
  });
});

test("approval export fails closed for objective vetoes and human non-approval", () => {
  const objectiveFailure = approvedReview();
  objectiveFailure.objectiveResults[1].result = "Fail";
  assert.throws(
    () => createApprovedH5Record(objectiveFailure),
    /objective check package-identity must be Pass/,
  );

  const gateRevision = approvedReview();
  gateRevision.gates[2].decision = "Revise";
  assert.throws(
    () => createApprovedH5Record(gateRevision),
    /gate semantic-color must be Pass/,
  );

  const rejectedIdentity = approvedReview({
    identity: { decision: "Rejected", rationale: "Generic pixel styling." },
  });
  assert.throws(
    () => createApprovedH5Record(rejectedIdentity),
    /H5 Identity must be Approved/,
  );
});

test("automation, implementer placeholders, and source author cannot sign approval", () => {
  for (const reviewer of ["Automation", "Implementer", "Codex", "Theme Implementer"]) {
    assert.throws(
      () => createApprovedH5Record(approvedReview({ reviewer })),
      /authorized named visual owner/,
    );
  }
});

test("artifact and environment changes expire approval but commit-only changes do not", () => {
  const record = approvedRecord();
  assert.equal(
    verifyApprovalRecord(record, { ...binding, currentCommit: "d".repeat(40) })
      .status,
    "valid",
  );

  for (const [field, value] of [
    ["themeCssSha256", "b".repeat(64)],
    ["fixtureVersion", "1.1.0"],
    ["rubricVersion", "2.0.0"],
    ["requiredObsidianVersion", "1.13.0"],
  ]) {
    assert.throws(
      () => verifyApprovalRecord(record, { ...binding, [field]: value }),
      new RegExp(`${field}.*stale`, "i"),
    );
  }
});

test("desktop-free file verification distinguishes optional absence from release requirement", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "pixel-h5-approval-test-"));
  const approvalPath = path.join(directory, "approval.json");
  try {
    assert.deepEqual(
      await verifyApprovalFile({ approvalPath, binding, requireApproval: false }),
      { status: "absent" },
    );
    await assert.rejects(
      verifyApprovalFile({ approvalPath, binding, requireApproval: true }),
      /approval record is required/,
    );

    await writeFile(approvalPath, "{not-json}\n");
    await assert.rejects(
      verifyApprovalFile({ approvalPath, binding }),
      /malformed H5 approval record/,
    );

    await writeFile(approvalPath, `${JSON.stringify(approvedRecord(), null, 2)}\n`);
    assert.equal(
      (await verifyApprovalFile({ approvalPath, binding })).status,
      "valid",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("present records cannot claim validity when unsigned, non-Pass, or rejected", () => {
  const unsigned = approvedRecord();
  delete unsigned.signature;
  assert.throws(() => verifyApprovalRecord(unsigned, binding), /signature/);

  const nonPass = approvedRecord();
  nonPass.gates[0].decision = "Fail";
  assert.throws(
    () => verifyApprovalRecord(nonPass, binding),
    /gate workspace-composition must be Pass/,
  );

  const rejected = approvedRecord();
  rejected.h5Identity.decision = "Rejected";
  assert.throws(
    () => verifyApprovalRecord(rejected, binding),
    /H5 Identity must be Approved/,
  );
});

test("repository ships a strict image-free canonical approval schema", async () => {
  const schema = JSON.parse(
    await readFile(new URL("../h5/approval.schema.json", import.meta.url), "utf8"),
  );

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.claim, { const: "Approved" });
  assert.deepEqual(
    schema.properties.objectiveResults.prefixItems.map(
      (item) => item.properties.check.const,
    ),
    H5_APPROVAL_OBJECTIVE_CHECKS,
  );
  assert.deepEqual(
    schema.properties.gates.prefixItems.map((item) => item.properties.gate.const),
    H5_APPROVAL_GATE_IDS,
  );
  assert.equal(schema.properties.gates.maxItems, 6);
  assert.equal(schema.properties.h5Identity.properties.decision.const, "Approved");
  assert.equal(
    schema.properties.signature.properties.type.const,
    "named-visual-owner",
  );
  assert.equal(
    schema.properties.signature.properties.statement.const,
    H5_APPROVAL_CONTRACT.approvalStatement,
  );
  assert.doesNotMatch(JSON.stringify(schema), /image|screenshot|overlay/i);
});
