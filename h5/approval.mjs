import { readFile } from "node:fs/promises";

export const H5_APPROVAL_GATE_IDS = Object.freeze([
  "workspace-composition",
  "material-depth",
  "semantic-color",
  "typography-geometry",
  "hardware-identity",
  "four-state-continuity",
]);

export const H5_APPROVAL_OBJECTIVE_CHECKS = Object.freeze([
  "package-identity",
  "runtime-environment",
  "fixture-matrix",
  "topology-observations",
  "transition-observations",
]);

const approvalStatement =
  "I am the authorized visual owner and approve this exact Pixel H5 artifact.";
const sha256Pattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const semverPattern = /^\d+\.\d+\.\d+$/;

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertExactKeys(value, keys, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new TypeError(`${label} must contain exactly ${expected.join(", ")}`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function assertPattern(value, pattern, label) {
  assertNonEmptyString(value, label);
  if (!pattern.test(value)) throw new TypeError(`${label} has an invalid format`);
}

function assertIsoTimestamp(value, label) {
  assertNonEmptyString(value, label);
  let normalized;
  try {
    normalized = new Date(value).toISOString();
  } catch {
    throw new TypeError(`${label} must be an ISO-8601 timestamp`);
  }
  if (normalized !== value) {
    throw new TypeError(`${label} must be a normalized ISO-8601 timestamp`);
  }
}

function normalizedIdentity(value) {
  return value.trim().toLocaleLowerCase();
}

function assertAuthorizedReviewer(reviewerName, sourceAuthor) {
  assertNonEmptyString(reviewerName, "reviewer name");
  const normalizedReviewer = normalizedIdentity(reviewerName);
  const disallowed = new Set(
    ["automation", "implementer", "codex", sourceAuthor]
      .filter(Boolean)
      .map(normalizedIdentity),
  );
  if (disallowed.has(normalizedReviewer)) {
    throw new Error("approval requires an authorized named visual owner");
  }
}

function assertExactResultSet(actual, expectedIds, label, idKey) {
  if (!Array.isArray(actual) || actual.length !== expectedIds.length) {
    throw new TypeError(`${label} must contain the exact required result set`);
  }
  actual.forEach((result, index) => {
    if (result[idKey] !== expectedIds[index]) {
      throw new TypeError(
        `${label}[${index}].${idKey} must be ${expectedIds[index]}`,
      );
    }
  });
}

export function createApprovedH5Record(reviewDraft, options = {}) {
  const gateIds = [
    "workspace-composition",
    "material-depth",
    "semantic-color",
    "typography-geometry",
    "hardware-identity",
    "four-state-continuity",
  ];
  const objectiveChecks = [
    "package-identity",
    "runtime-environment",
    "fixture-matrix",
    "topology-observations",
    "transition-observations",
  ];
  const statement =
    "I am the authorized visual owner and approve this exact Pixel H5 artifact.";
  const fail = (message) => {
    throw new Error(message);
  };
  const requiredText = (value, label) => {
    if (typeof value !== "string" || value.trim() === "") {
      fail(`${label} must be a non-empty string`);
    }
    return value.trim();
  };
  const reviewer = requiredText(reviewDraft?.reviewer, "reviewer name");
  const sourceAuthor = requiredText(reviewDraft?.source?.author, "source author");
  const normalizedReviewer = reviewer.toLocaleLowerCase();
  if (
    ["automation", "implementer", "codex", sourceAuthor.toLocaleLowerCase()].includes(
      normalizedReviewer,
    )
  ) {
    fail("approval requires an authorized named visual owner");
  }
  if (reviewDraft.source?.dirty !== false) {
    fail("approval requires clean reviewed commit provenance");
  }
  const reviewedCommit = requiredText(
    reviewDraft.source?.commit,
    "reviewed commit",
  );
  if (!/^[a-f0-9]{40}$/.test(reviewedCommit)) {
    fail("reviewed commit must be a full lowercase Git commit");
  }
  const themeCssSha256 = requiredText(
    reviewDraft.package?.themeCssSha256,
    "theme.css SHA-256",
  );
  if (!/^[a-f0-9]{64}$/.test(themeCssSha256)) {
    fail("theme.css SHA-256 must be lowercase SHA-256");
  }
  const fixtureVersion = requiredText(
    reviewDraft.fixtureVersion,
    "fixture version",
  );
  const rubricVersion = requiredText(
    reviewDraft.rubricVersion,
    "rubric version",
  );
  const requiredObsidianVersion = requiredText(
    reviewDraft.environment?.obsidianVersion,
    "required Obsidian version",
  );
  for (const [value, label] of [
    [fixtureVersion, "fixture version"],
    [rubricVersion, "rubric version"],
    [requiredObsidianVersion, "required Obsidian version"],
  ]) {
    if (!/^\d+\.\d+\.\d+$/.test(value)) fail(`${label} must be semver`);
  }
  if (
    !Array.isArray(reviewDraft.objectiveResults) ||
    reviewDraft.objectiveResults.length !== objectiveChecks.length
  ) {
    fail("approval requires the exact objective check set");
  }
  for (const [index, check] of objectiveChecks.entries()) {
    const result = reviewDraft.objectiveResults[index];
    if (result?.check !== check) fail(`objective check ${check} is missing`);
    if (result.result !== "Pass") fail(`objective check ${check} must be Pass`);
  }
  if (!Array.isArray(reviewDraft.gates) || reviewDraft.gates.length !== gateIds.length) {
    fail("approval requires the exact six visual gates");
  }
  for (const [index, gate] of gateIds.entries()) {
    const result = reviewDraft.gates[index];
    if (result?.gate !== gate) fail(`gate ${gate} is missing`);
    if (result.decision !== "Pass") fail(`gate ${gate} must be Pass`);
  }
  if (reviewDraft.identity?.decision !== "Approved") {
    fail("H5 Identity must be Approved");
  }
  const identityRationale = requiredText(
    reviewDraft.identity?.rationale,
    "H5 Identity rationale",
  );
  const reviewedAt = options.reviewedAt || new Date().toISOString();
  if (new Date(reviewedAt).toISOString() !== reviewedAt) {
    fail("reviewedAt must be a normalized ISO-8601 timestamp");
  }

  const record = {
    schemaVersion: 1,
    kind: "pixel-h5-exact-artifact-approval",
    claim: "Approved",
    artifact: { themeCssSha256 },
    source: {
      reviewedCommit,
      dirty: false,
      implementer: sourceAuthor,
    },
    environment: {
      fixtureVersion,
      rubricVersion,
      requiredObsidianVersion,
    },
    reviewedAt,
    reviewer: { name: reviewer, role: "visual-owner" },
    objectiveResults: reviewDraft.objectiveResults.map(({ check }) => ({
      check,
      result: "Pass",
    })),
    gates: reviewDraft.gates.map(({ gate, findings }) => ({
      gate,
      decision: "Pass",
      findings: (Array.isArray(findings) ? findings : [])
        .filter(
          (finding) =>
            typeof finding?.fixtureId === "string" &&
            typeof finding?.region === "string" &&
            typeof finding?.finding === "string" &&
            finding.fixtureId.trim() !== "" &&
            finding.region.trim() !== "" &&
            finding.finding.trim() !== "",
        )
        .map((finding) => ({
          fixtureId: finding.fixtureId.trim(),
          region: finding.region.trim(),
          finding: finding.finding.trim(),
        })),
    })),
    h5Identity: {
      decision: "Approved",
      rationale: identityRationale,
    },
    signature: {
      type: "named-visual-owner",
      signedBy: reviewer,
      signedAt: reviewedAt,
      statement,
    },
  };
  if (
    JSON.stringify(record)
      .toLocaleLowerCase()
      .includes(["data", "image"].join(":"))
  ) {
    fail("approval record cannot embed images");
  }
  return record;
}

export function validateApprovalRecord(record) {
  assertExactKeys(
    record,
    [
      "schemaVersion",
      "kind",
      "claim",
      "artifact",
      "source",
      "environment",
      "reviewedAt",
      "reviewer",
      "objectiveResults",
      "gates",
      "h5Identity",
      "signature",
    ],
    "approval record",
  );
  if (record.schemaVersion !== 1) throw new TypeError("schemaVersion must be 1");
  if (record.kind !== "pixel-h5-exact-artifact-approval") {
    throw new TypeError("approval kind is invalid");
  }
  if (record.claim !== "Approved") throw new Error("approval claim must be Approved");

  assertExactKeys(record.artifact, ["themeCssSha256"], "artifact");
  assertPattern(
    record.artifact.themeCssSha256,
    sha256Pattern,
    "artifact.themeCssSha256",
  );

  assertExactKeys(
    record.source,
    ["reviewedCommit", "dirty", "implementer"],
    "source",
  );
  assertPattern(record.source.reviewedCommit, commitPattern, "source.reviewedCommit");
  if (record.source.dirty !== false) {
    throw new Error("source.dirty must be false for exact commit provenance");
  }
  assertNonEmptyString(record.source.implementer, "source.implementer");

  assertExactKeys(
    record.environment,
    ["fixtureVersion", "rubricVersion", "requiredObsidianVersion"],
    "environment",
  );
  for (const field of [
    "fixtureVersion",
    "rubricVersion",
    "requiredObsidianVersion",
  ]) {
    assertPattern(record.environment[field], semverPattern, `environment.${field}`);
  }

  assertIsoTimestamp(record.reviewedAt, "reviewedAt");
  assertExactKeys(record.reviewer, ["name", "role"], "reviewer");
  if (record.reviewer.role !== "visual-owner") {
    throw new Error("reviewer.role must be visual-owner");
  }
  assertAuthorizedReviewer(record.reviewer.name, record.source.implementer);

  assertExactResultSet(
    record.objectiveResults,
    H5_APPROVAL_OBJECTIVE_CHECKS,
    "objectiveResults",
    "check",
  );
  for (const result of record.objectiveResults) {
    assertExactKeys(result, ["check", "result"], `objective ${result.check}`);
    if (result.result !== "Pass") {
      throw new Error(`objective check ${result.check} must be Pass`);
    }
  }

  assertExactResultSet(record.gates, H5_APPROVAL_GATE_IDS, "gates", "gate");
  for (const gate of record.gates) {
    assertExactKeys(gate, ["gate", "decision", "findings"], `gate ${gate.gate}`);
    if (gate.decision !== "Pass") {
      throw new Error(`gate ${gate.gate} must be Pass`);
    }
    if (!Array.isArray(gate.findings)) {
      throw new TypeError(`gate ${gate.gate}.findings must be an array`);
    }
    gate.findings.forEach((finding, index) => {
      assertExactKeys(
        finding,
        ["fixtureId", "region", "finding"],
        `gate ${gate.gate}.findings[${index}]`,
      );
      for (const field of ["fixtureId", "region", "finding"]) {
        assertNonEmptyString(
          finding[field],
          `gate ${gate.gate}.findings[${index}].${field}`,
        );
      }
    });
  }

  assertExactKeys(record.h5Identity, ["decision", "rationale"], "h5Identity");
  if (record.h5Identity.decision !== "Approved") {
    throw new Error("H5 Identity must be Approved");
  }
  assertNonEmptyString(record.h5Identity.rationale, "h5Identity.rationale");

  assertExactKeys(
    record.signature,
    ["type", "signedBy", "signedAt", "statement"],
    "signature",
  );
  if (record.signature.type !== "named-visual-owner") {
    throw new Error("signature.type must be named-visual-owner");
  }
  if (record.signature.signedBy !== record.reviewer.name) {
    throw new Error("signature.signedBy must match reviewer.name");
  }
  assertIsoTimestamp(record.signature.signedAt, "signature.signedAt");
  if (record.signature.signedAt !== record.reviewedAt) {
    throw new Error("signature.signedAt must match reviewedAt");
  }
  if (record.signature.statement !== approvalStatement) {
    throw new Error("signature.statement must contain the visual-owner attestation");
  }
  if (/data:image/i.test(JSON.stringify(record))) {
    throw new Error("approval record cannot embed images");
  }
  return record;
}

export function verifyApprovalRecord(record, binding) {
  validateApprovalRecord(record);
  assertObject(binding, "approval binding");
  for (const [field, actual] of [
    ["themeCssSha256", record.artifact.themeCssSha256],
    ["fixtureVersion", record.environment.fixtureVersion],
    ["rubricVersion", record.environment.rubricVersion],
    ["requiredObsidianVersion", record.environment.requiredObsidianVersion],
  ]) {
    if (actual !== binding[field]) {
      throw new Error(`approval ${field} is stale`);
    }
  }
  return {
    status: "valid",
    reviewer: record.reviewer.name,
    reviewedAt: record.reviewedAt,
  };
}

export async function verifyApprovalFile({
  approvalPath,
  binding,
  requireApproval = false,
}) {
  let contents;
  try {
    contents = await readFile(approvalPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      if (requireApproval) throw new Error("H5 approval record is required");
      return { status: "absent" };
    }
    throw error;
  }
  let record;
  try {
    record = JSON.parse(contents);
  } catch (error) {
    throw new Error(`malformed H5 approval record: ${error.message}`, {
      cause: error,
    });
  }
  return verifyApprovalRecord(record, binding);
}
