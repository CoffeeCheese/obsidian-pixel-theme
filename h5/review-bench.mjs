import { writeFile } from "node:fs/promises";
import path from "node:path";

import { createApprovedH5Record } from "./approval.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializeForScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function stateFor(fixture) {
  return fixture.topology.edgeFoldExpected ? "narrow" : "canonical";
}

function renderEvidenceGroups(evidence) {
  const states = ["canonical", "narrow"];
  return states
    .map((state) => {
      const stateEvidence = evidence.filter(
        ({ fixture }) => stateFor(fixture) === state,
      );
      if (stateEvidence.length === 0) return "";
      const topologies = [
        ...new Set(
          stateEvidence.map(({ fixture }) => fixture.topology.rootArrangement),
        ),
      ];
      return `<section class="catalog-state" data-state="${state}">
        <div class="section-heading">
          <p>${state === "canonical" ? "1440 × 1000" : "1024 × 800"}</p>
          <h2>${state === "canonical" ? "Canonical states" : "Narrow continuity"}</h2>
        </div>
        ${topologies
          .map(
            (topology) => `<div class="topology-group" data-topology="${escapeHtml(topology)}">
              <h3>${escapeHtml(topology === "side-by-side" ? "Split units" : "Single unit")}</h3>
              <div class="fixture-grid">
                ${stateEvidence
                  .filter(
                    ({ fixture }) =>
                      fixture.topology.rootArrangement === topology,
                  )
                  .map(
                    ({ fixture, evidencePath }) => `<button class="fixture-card" type="button" data-fixture-id="${escapeHtml(fixture.id)}">
                      <span class="fixture-preview"><img src="${escapeHtml(path.basename(evidencePath))}" alt=""></span>
                      <strong>${escapeHtml(fixture.caseId.replaceAll("-", " "))}</strong>
                      <span>${escapeHtml(fixture.theme)} · ${fixture.viewport.width} × ${fixture.viewport.height}</span>
                    </button>`,
                  )
                  .join("")}
              </div>
            </div>`,
          )
          .join("")}
      </section>`;
    })
    .join("");
}

const visualGates = [
  {
    id: "workspace-composition",
    title: "Workspace composition and tab topology",
    prompt: "Check native ownership, Cockpit Unit count, content tiers, actions, and transition continuity.",
  },
  {
    id: "material-depth",
    title: "Material depth and contour",
    prompt: "Check the canvas-to-screen depth chain, role-scaled hard offsets, contours, and shadowless prose.",
  },
  {
    id: "semantic-color",
    title: "Semantic signal colors",
    prompt: "Check cool, warm, cyan, amber, and brick ownership with neutral-dominant Light and Dark hierarchy.",
  },
  {
    id: "typography-geometry",
    title: "Typography and geometry",
    prompt: "Check type-role boundaries, readable native labels, the 4 px rhythm, and role-scaled geometry.",
  },
  {
    id: "hardware-identity",
    title: "Restrained H5 hardware identity",
    prompt: "Check the full H5 hardware bundle while decoration stays inert, sparse, and distinct from actions.",
  },
  {
    id: "four-state-continuity",
    title: "Four-state identity continuity",
    prompt: "Check canonical and narrow Light/Dark ownership, density, operability, and one continuous identity.",
  },
];

function validateReviewDraft(reviewDraft) {
  const nonPassDecisions = new Set(["Revise", "Fail"]);
  for (const gate of reviewDraft.gates) {
    if (!nonPassDecisions.has(gate.decision)) continue;
    const hasLocalizedFinding = gate.findings.some(
      (finding) =>
        finding.fixtureId.trim() !== "" &&
        finding.region.trim() !== "" &&
        finding.finding.trim() !== "",
    );
    if (!hasLocalizedFinding) {
      return {
        valid: false,
        gateId: gate.gate,
        message: "Revise or Fail requires a fixture, region, and finding.",
      };
    }
  }
  return { valid: true };
}

function validateVisualOwnerClaim({ reviewerName, sourceAuthor }) {
  const normalizedName = reviewerName.trim().toLocaleLowerCase();
  if (normalizedName === "") {
    return { valid: false, message: "Enter a named visual owner." };
  }
  const disallowedNames = new Set(
    [sourceAuthor, "automation", "implementer", "codex"]
      .filter(Boolean)
      .map((name) => name.trim().toLocaleLowerCase()),
  );
  if (disallowedNames.has(normalizedName)) {
    return {
      valid: false,
      message:
        "Visual owner must differ from automation and source-author identities.",
    };
  }
  return { valid: true };
}

function coversCompleteMatrix(catalog, evidence) {
  const capturedIds = new Set(evidence.map(({ fixture }) => fixture.id));
  return (
    evidence.length === catalog.fixtures.length &&
    catalog.fixtures.every(({ id }) => capturedIds.has(id))
  );
}

function renderDecisionChoices(gateId) {
  return ["Pass", "Revise", "Fail"]
    .map(
      (decision) => `<label><input data-human-decision disabled type="radio" name="gate-${gateId}" value="${decision}">${decision}</label>`,
    )
    .join("");
}

function renderFixtureOptions(evidence) {
  return evidence
    .map(
      ({ fixture }) =>
        `<option value="${escapeHtml(fixture.id)}">${escapeHtml(fixture.id)}</option>`,
    )
    .join("");
}

function renderGateCards(evidence) {
  const fixtureOptions = renderFixtureOptions(evidence);
  return visualGates
    .map(
      (gate, index) => `<article class="gate-card" data-gate="${gate.id}">
        <header><span>Gate ${index + 1}</span><h3>${gate.title}</h3><p>${gate.prompt}</p></header>
        <fieldset class="decision-set"><legend>Owner decision</legend>${renderDecisionChoices(gate.id)}</fieldset>
        <div class="findings" data-findings-for="${gate.id}">
          <div class="finding-row">
            <label><span>Finding fixture</span><select data-human-decision disabled name="${gate.id}-fixture">${fixtureOptions}</select></label>
            <label><span>Finding region</span><input data-human-decision disabled name="${gate.id}-region" placeholder="e.g. right bank header"></label>
            <label class="finding-note"><span>Localized finding</span><textarea data-human-decision disabled name="${gate.id}-finding" rows="2" placeholder="Describe what must change and where."></textarea></label>
          </div>
        </div>
        <button data-human-decision disabled class="add-finding" type="button" data-add-finding="${gate.id}">Add finding</button>
      </article>`,
    )
    .join("");
}

export async function writeReviewBench({
  runDirectory,
  catalog,
  evidence,
  packageIdentity,
  environmentIdentity,
  source,
  capturedAt,
  objectiveResults,
}) {
  const completeMatrix = coversCompleteMatrix(catalog, evidence);
  const identity = [
    `${packageIdentity.themeName} ${packageIdentity.themeVersion}`,
    `theme.css ${packageIdentity.themeCssSha256}`,
    `manifest.json ${packageIdentity.manifestSha256}`,
    `Commit ${source.commit}${source.dirty ? " (dirty)" : ""}`,
    `Obsidian ${environmentIdentity.obsidianVersion} / active theme ${environmentIdentity.activeTheme}`,
    `${environmentIdentity.platform} / zoom ${environmentIdentity.zoomFactor}`,
    `Vault ${environmentIdentity.vault.id} (${environmentIdentity.vault.path}) / dedicated`,
    `Profile ${environmentIdentity.profile.path} / dedicated`,
    `Fixture ${catalog.fixtureVersion}`,
    `Rubric ${catalog.rubricVersion}`,
    `Captured ${capturedAt}`,
  ];
  const views = evidence.map(({ fixture, evidencePath }) => ({
    id: fixture.id,
    caseId: fixture.caseId,
    theme: fixture.theme,
    viewport: fixture.viewport,
    topology: fixture.topology.rootArrangement,
    state: stateFor(fixture),
    src: path.basename(evidencePath),
  }));
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pixel H5 review bench</title>
  <style>
    :root {
      color-scheme: dark;
      --canvas: #182127;
      --panel: #222e35;
      --panel-raised: #2a3941;
      --screen: #10171b;
      --line: #52636c;
      --quiet: #9fb0b8;
      --text: #edf2ef;
      --cyan: #4ed7df;
      --amber: #e8b95a;
      --brick: #d56f62;
      --shadow: #090d0f;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    body { margin: 0; background: var(--canvas); color: var(--text); }
    button, select, input { font: inherit; }
    button, select { color: inherit; }
    button:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid var(--cyan); outline-offset: 3px; }
    .masthead { display: grid; grid-template-columns: minmax(18rem, 0.8fr) minmax(32rem, 2fr); gap: 2rem; padding: 2rem clamp(1.25rem, 3vw, 3.5rem); border-bottom: 1px solid var(--line); background: var(--panel); }
    .eyebrow, .section-heading p, .identity-grid dt, .tool-label { margin: 0; color: var(--cyan); font: 700 .7rem/1.3 ui-monospace, "SFMono-Regular", Consolas, monospace; letter-spacing: .12em; text-transform: uppercase; }
    h1 { max-width: 13ch; margin: .5rem 0 0; font: 800 clamp(2.3rem, 5vw, 5.8rem)/.84 ui-sans-serif, system-ui, sans-serif; letter-spacing: -.07em; }
    .identity-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 0; background: var(--line); border: 1px solid var(--line); }
    .identity-grid div { min-width: 0; padding: .65rem .8rem; background: var(--screen); }
    .identity-grid dd { overflow: hidden; margin: .25rem 0 0; color: var(--quiet); font: .72rem/1.45 ui-monospace, "SFMono-Regular", Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
    .workspace { display: grid; grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr); min-height: 70vh; }
    .catalog { max-height: calc(100vh - 11rem); overflow: auto; padding: 1.25rem; border-right: 1px solid var(--line); background: #1d282e; }
    .catalog-state + .catalog-state { margin-top: 2rem; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: .9rem; }
    .section-heading h2 { margin: 0; font-size: 1.05rem; }
    .topology-group + .topology-group { margin-top: 1.25rem; }
    .topology-group h3 { margin: 0 0 .55rem; color: var(--quiet); font: 600 .78rem/1.4 ui-monospace, "SFMono-Regular", Consolas, monospace; text-transform: uppercase; }
    .fixture-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
    .fixture-card { min-width: 0; padding: 0; border: 1px solid var(--line); background: var(--panel); text-align: left; cursor: pointer; box-shadow: 3px 3px 0 var(--shadow); }
    .fixture-card:hover { border-color: var(--cyan); transform: translate(-1px, -1px); }
    .fixture-card.is-a { border-color: var(--cyan); box-shadow: inset 4px 0 0 var(--cyan), 3px 3px 0 var(--shadow); }
    .fixture-card.is-b { border-color: var(--amber); box-shadow: inset 4px 0 0 var(--amber), 3px 3px 0 var(--shadow); }
    .fixture-preview { display: block; aspect-ratio: 1.44; overflow: hidden; border-bottom: 1px solid var(--line); background: var(--screen); }
    .fixture-preview img { width: 100%; height: 100%; object-fit: cover; }
    .fixture-card strong, .fixture-card > span:last-child { display: block; overflow: hidden; margin: .5rem .6rem; text-overflow: ellipsis; white-space: nowrap; }
    .fixture-card strong { font-size: .72rem; text-transform: capitalize; }
    .fixture-card > span:last-child { color: var(--quiet); font: .66rem/1.3 ui-monospace, "SFMono-Regular", Consolas, monospace; }
    .bench { min-width: 0; padding: clamp(1rem, 2vw, 2rem); background-image: linear-gradient(#25333a 1px, transparent 1px), linear-gradient(90deg, #25333a 1px, transparent 1px); background-size: 24px 24px; }
    .tool-rail { display: flex; flex-wrap: wrap; align-items: end; gap: 1rem; margin-bottom: 1rem; padding: .9rem; border: 1px solid var(--line); background: var(--panel); box-shadow: 4px 4px 0 var(--shadow); }
    .tool { display: grid; gap: .35rem; }
    .tool select { min-width: 13rem; padding: .55rem .65rem; border: 1px solid var(--line); background: var(--screen); }
    .mode-switch { display: flex; gap: 1px; padding: 1px; background: var(--line); }
    .mode-switch label { padding: .55rem .7rem; background: var(--screen); cursor: pointer; }
    .mode-switch label:has(input:checked) { background: var(--cyan); color: #0a1a1d; }
    .mode-switch input { position: absolute; opacity: 0; }
    .range { display: flex; align-items: center; gap: .55rem; min-height: 2.2rem; }
    .range input { accent-color: var(--cyan); }
    .comparison { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; min-height: 31rem; padding: .75rem; overflow: hidden; border: 1px solid var(--line); background: var(--screen); box-shadow: 6px 6px 0 var(--shadow); touch-action: none; }
    .comparison[data-mode="overlay"], .comparison[data-mode="difference"] { display: block; }
    .viewport { position: relative; min-width: 0; min-height: 29.5rem; overflow: hidden; background: #070a0c; }
    .viewport img { position: absolute; top: 0; left: 0; max-width: none; transform-origin: 0 0; user-select: none; -webkit-user-drag: none; }
    .viewport-b { border-top: 3px solid var(--amber); }
    .viewport-a { border-top: 3px solid var(--cyan); }
    .comparison[data-mode="overlay"] .viewport { position: absolute; inset: .75rem; }
    .comparison[data-mode="overlay"] .viewport-b { background: transparent; pointer-events: none; }
    .comparison[data-mode="overlay"] .viewport-b img { opacity: var(--overlay-opacity, .5); }
    .comparison[data-mode="difference"] .viewport { display: none; }
    .difference-canvas { display: none; width: 100%; height: auto; }
    .comparison[data-mode="difference"] .difference-canvas { display: block; }
    .bench-note { margin: .9rem 0 0; color: var(--quiet); font-size: .8rem; }
    .rubric { padding: clamp(1.25rem, 3vw, 3.5rem); border-top: 1px solid var(--line); background: #172126; }
    .rubric-intro { display: grid; grid-template-columns: minmax(18rem, 1.1fr) minmax(16rem, .7fr); gap: 2rem; align-items: end; }
    .rubric-intro h2 { max-width: 15ch; margin: .5rem 0 0; font-size: clamp(2rem, 4vw, 4.2rem); line-height: .95; letter-spacing: -.055em; }
    .rubric-intro > p { max-width: 35rem; margin: 0; color: var(--quiet); font-size: 1.05rem; line-height: 1.6; }
    .authority-panel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 2rem 0; border: 1px solid var(--line); background: var(--line); }
    .authority-panel > div, .authority-panel > label { min-width: 0; padding: 1rem; background: var(--panel); }
    .authority-panel span, .finding-row span, .identity-note span { display: block; margin-bottom: .35rem; color: var(--cyan); font: 700 .68rem/1.3 ui-monospace, "SFMono-Regular", Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; }
    .authority-panel strong, .authority-panel small { display: block; }
    .authority-panel small { margin-top: .3rem; color: var(--quiet); }
    .authority-panel input[type="text"], .authority-panel input:not([type]) { width: 100%; padding: .65rem; border: 1px solid var(--line); background: var(--screen); color: var(--text); }
    .authority-check { display: flex; grid-column: 1 / -1; align-items: center; gap: .65rem; color: var(--amber); }
    .authority-check output { margin-left: auto; color: var(--quiet); font-size: .78rem; }
    .gate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .gate-card { padding: 1.1rem; border: 1px solid var(--line); background: var(--panel); box-shadow: 4px 4px 0 var(--shadow); }
    .gate-card header > span { color: var(--cyan); font: 700 .7rem/1.3 ui-monospace, "SFMono-Regular", Consolas, monospace; text-transform: uppercase; }
    .gate-card h3, .identity-gate h3 { margin: .35rem 0 .6rem; font-size: 1.2rem; }
    .gate-card header p, .identity-gate p { margin: 0; color: var(--quiet); line-height: 1.55; }
    fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
    .decision-set { display: flex; flex-wrap: wrap; gap: 1px; margin: 1rem 0; padding: 1px; background: var(--line); }
    .decision-set legend { margin-bottom: .4rem; color: var(--quiet); font: .68rem/1.3 ui-monospace, "SFMono-Regular", Consolas, monospace; text-transform: uppercase; }
    .decision-set label { flex: 1; min-width: 5rem; padding: .55rem .7rem; background: var(--screen); text-align: center; cursor: pointer; }
    .decision-set label:has(input:checked) { background: var(--amber); color: #201808; font-weight: 800; }
    .decision-set input { position: absolute; opacity: 0; }
    .decision-set label:has(input:disabled), button:disabled { opacity: .45; cursor: not-allowed; }
    .finding-row { display: grid; grid-template-columns: minmax(10rem, .8fr) minmax(10rem, 1fr); gap: .7rem; padding-top: .8rem; border-top: 1px solid var(--line); }
    .finding-row + .finding-row { margin-top: .8rem; }
    .finding-note { grid-column: 1 / -1; }
    .finding-row input, .finding-row select, textarea { width: 100%; padding: .6rem; border: 1px solid var(--line); background: var(--screen); color: var(--text); resize: vertical; }
    .add-finding, .copy-review { margin-top: .8rem; padding: .6rem .8rem; border: 1px solid var(--line); background: var(--panel-raised); color: var(--text); cursor: pointer; box-shadow: 2px 2px 0 var(--shadow); }
    .identity-gate { display: grid; grid-template-columns: minmax(15rem, 1fr) minmax(18rem, 1fr); gap: 1.5rem; margin-top: 1.25rem; padding: 1.4rem; border: 2px solid var(--amber); background: #2c302d; box-shadow: 6px 6px 0 var(--shadow); }
    .identity-gate .decision-set { align-self: start; margin: 0; }
    .identity-note { grid-column: 1 / -1; }
    .review-actions { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
    .review-actions output { color: var(--quiet); font-size: .8rem; }
    .diagnostic-only { margin: 0; padding: clamp(1.5rem, 4vw, 4rem); border-top: 2px solid var(--amber); background: #2c302d; }
    .diagnostic-only h2 { margin: .5rem 0; font-size: clamp(2rem, 4vw, 4rem); letter-spacing: -.05em; }
    .diagnostic-only p:last-child { max-width: 50rem; color: var(--quiet); line-height: 1.6; }
    @media (max-width: 900px) {
      .masthead, .workspace { grid-template-columns: 1fr; }
      .catalog { max-height: none; border-right: 0; border-bottom: 1px solid var(--line); }
      .fixture-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .rubric-intro, .identity-gate { grid-template-columns: 1fr; }
      .identity-note { grid-column: 1; }
      .authority-panel, .gate-grid { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; } }
  </style>
</head>
<body>
  <header class="masthead">
    <div><p class="eyebrow">Transient visual session</p><h1>H5 review bench</h1></div>
    <dl class="identity-grid">${identity
      .map((value, index) => `<div><dt>${escapeHtml(["Package", "CSS", "Manifest", "Source", "Runtime", "Platform", "Vault", "Profile", "Fixtures", "Rubric", "Captured"][index])}</dt><dd title="${escapeHtml(value)}">${escapeHtml(value)}</dd></div>`)
    .join("")}</dl>
  </header>
  <main class="workspace">
    <aside class="catalog" aria-label="Captured fixture catalog">${renderEvidenceGroups(evidence)}</aside>
    <section class="bench" aria-label="Image comparison tools">
      <div class="tool-rail">
        <label class="tool"><span class="tool-label">View A</span><select id="view-a"></select></label>
        <label class="tool"><span class="tool-label">View B</span><select id="view-b"></select></label>
        <fieldset class="tool"><legend class="tool-label">Diagnostic mode</legend><div class="mode-switch">
          <label><input type="radio" name="mode" value="side" checked>Side by side</label>
          <label><input type="radio" name="mode" value="overlay">Overlay</label>
          <label><input type="radio" name="mode" value="difference">Difference localization</label>
        </div></fieldset>
        <label class="tool"><span class="tool-label">Synchronized zoom</span><span class="range"><input id="zoom" type="range" min="25" max="300" value="50"><output id="zoom-value">50%</output></span></label>
        <label class="tool" id="opacity-tool" hidden><span class="tool-label">Overlay opacity</span><span class="range"><input id="opacity" type="range" min="0" max="100" value="50"><output id="opacity-value">50%</output></span></label>
      </div>
      <div class="comparison" data-mode="side" id="comparison">
        <div class="viewport viewport-a"><img id="image-a" alt="Selected view A"></div>
        <div class="viewport viewport-b"><img id="image-b" alt="Selected view B"></div>
        <canvas class="difference-canvas" id="difference" aria-label="Difference localization for selected views"></canvas>
      </div>
      <p class="bench-note">Drag either viewport to inspect the same region. Diagnostic images inform the visual owner; this bench does not make the decision.</p>
    </section>
  </main>
  ${completeMatrix ? `<section class="rubric" aria-labelledby="rubric-heading">
    <header class="rubric-intro">
      <div><p class="eyebrow">Non-compensatory review</p><h2 id="rubric-heading">Six gates. One separate identity judgment.</h2></div>
      <p>Each gate stands on its own. A strong result in one area does not offset a finding in another. Revise or Fail requires a fixture, region, and finding.</p>
    </header>
    <div class="authority-panel">
      <div><span>Automation · facts only</span><strong>Fixture capture and objective vetoes</strong><small>Cannot mark a human decision</small></div>
      <div><span>Implementer · provenance only</span><strong>${escapeHtml(source.author || "Not asserted")}</strong><small>Cannot mark a human decision</small></div>
      <label><span>Named visual owner</span><input id="reviewer-name" autocomplete="name" placeholder="Required to record decisions"></label>
      <label class="authority-check"><input id="owner-authority" type="checkbox"> I am the authorized visual owner for this review.<output id="owner-status" aria-live="polite">Visual owner must differ from automation and source-author identities.</output></label>
    </div>
    <div class="gate-grid">${renderGateCards(evidence)}</div>
    <article class="identity-gate">
      <div><p class="eyebrow">Holistic veto</p><h3>H5 Identity</h3><p>Judge whether the complete result reads unmistakably as H5, independent of all six local gate results.</p></div>
      <fieldset class="decision-set"><legend>Named visual owner decision</legend>
        <label><input data-human-decision disabled type="radio" name="h5-identity" value="Approved">Approved</label>
        <label><input data-human-decision disabled type="radio" name="h5-identity" value="Rejected">Rejected</label>
      </fieldset>
      <label class="identity-note"><span>Identity rationale</span><textarea data-human-decision disabled name="h5-identity-rationale" rows="4" placeholder="Record the holistic visual judgment in the owner's own words."></textarea></label>
    </article>
    <div class="review-actions">
      <button data-human-decision disabled class="copy-review" id="copy-review" type="button">Copy text review draft</button>
      <button data-human-decision disabled class="copy-review" id="download-approval" type="button">Download Approved attestation</button>
      <output id="copy-status" aria-live="polite">Only a fully passing named-owner review can export canonical approval JSON.</output>
    </div>
  </section>` : `<section class="diagnostic-only" aria-labelledby="diagnostic-only-heading">
    <p class="eyebrow">Approval controls unavailable</p>
    <h2 id="diagnostic-only-heading">Focused diagnostic rerun</h2>
    <p>This session captured ${evidence.length} of ${catalog.fixtures.length} required views. Use the comparison tools to localize a known issue; a full ten-view run is required to record decisions or judge H5 Identity.</p>
  </section>`}
  <script>
    const views = ${serializeForScript(views)};
    const visualGateIds = ${serializeForScript(visualGates.map(({ id }) => id))};
    const validateReviewDraft = ${validateReviewDraft.toString()};
    const validateVisualOwnerClaim = ${validateVisualOwnerClaim.toString()};
    const createApprovedH5Record = ${createApprovedH5Record.toString()};
    const sourceAuthor = ${serializeForScript(source.author || "")};
    const selectA = document.querySelector("#view-a");
    const selectB = document.querySelector("#view-b");
    const imageA = document.querySelector("#image-a");
    const imageB = document.querySelector("#image-b");
    const comparison = document.querySelector("#comparison");
    const canvas = document.querySelector("#difference");
    const context = canvas.getContext("2d");
    const zoom = document.querySelector("#zoom");
    const opacity = document.querySelector("#opacity");
    const opacityTool = document.querySelector("#opacity-tool");
    const transform = { scale: .5, x: 0, y: 0 };

    function labelFor(view) {
      return view.id + " · " + view.viewport.width + "×" + view.viewport.height;
    }
    for (const view of views) {
      selectA.add(new Option(labelFor(view), view.id));
      selectB.add(new Option(labelFor(view), view.id));
    }
    selectB.selectedIndex = Math.min(1, views.length - 1);

    function selected(select) { return views.find((view) => view.id === select.value); }
    function applyTransform() {
      const value = "translate(" + transform.x + "px," + transform.y + "px) scale(" + transform.scale + ")";
      imageA.style.transform = value;
      imageB.style.transform = value;
    }
    function drawDifference() {
      if (!imageA.complete || !imageB.complete || !imageA.naturalWidth || !imageB.naturalWidth) return;
      canvas.width = Math.max(imageA.naturalWidth, imageB.naturalWidth);
      canvas.height = Math.max(imageA.naturalHeight, imageB.naturalHeight);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      context.drawImage(imageA, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "difference";
      context.drawImage(imageB, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
    }
    function updateSelection() {
      imageA.src = selected(selectA).src;
      imageB.src = selected(selectB).src;
      document.querySelectorAll(".fixture-card").forEach((card) => {
        card.classList.toggle("is-a", card.dataset.fixtureId === selectA.value);
        card.classList.toggle("is-b", card.dataset.fixtureId === selectB.value);
      });
    }
    selectA.addEventListener("change", updateSelection);
    selectB.addEventListener("change", updateSelection);
    imageA.addEventListener("load", drawDifference);
    imageB.addEventListener("load", drawDifference);
    zoom.addEventListener("input", () => {
      transform.scale = Number(zoom.value) / 100;
      document.querySelector("#zoom-value").value = zoom.value + "%";
      applyTransform();
    });
    opacity.addEventListener("input", () => {
      comparison.style.setProperty("--overlay-opacity", Number(opacity.value) / 100);
      document.querySelector("#opacity-value").value = opacity.value + "%";
    });
    document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener("change", () => {
      comparison.dataset.mode = input.value;
      opacityTool.hidden = input.value !== "overlay";
      if (input.value === "difference") drawDifference();
    }));
    document.querySelectorAll(".fixture-card").forEach((card) => card.addEventListener("click", (event) => {
      const target = event.shiftKey ? selectB : selectA;
      target.value = card.dataset.fixtureId;
      updateSelection();
    }));
    let pointer;
    comparison.addEventListener("pointerdown", (event) => {
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      comparison.setPointerCapture(event.pointerId);
    });
    comparison.addEventListener("pointermove", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      transform.x += event.clientX - pointer.x;
      transform.y += event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      applyTransform();
    });
    comparison.addEventListener("pointerup", () => { pointer = undefined; });
    const reviewerName = document.querySelector("#reviewer-name");
    const ownerAuthority = document.querySelector("#owner-authority");
    if (reviewerName && ownerAuthority) {
      function updateHumanAuthority() {
        const claim = validateVisualOwnerClaim({
          reviewerName: reviewerName.value,
          sourceAuthor,
        });
        const enabled = claim.valid && ownerAuthority.checked;
        document.querySelectorAll("[data-human-decision]").forEach((control) => { control.disabled = !enabled; });
        document.querySelector("#owner-status").value = claim.valid
          ? ownerAuthority.checked
            ? "Named visual-owner decisions enabled."
            : "Confirm visual-owner authority to enable decisions."
          : claim.message;
      }
      async function copyText(text) {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
        const copyBuffer = document.createElement("textarea");
        copyBuffer.value = text;
        copyBuffer.style.position = "fixed";
        copyBuffer.style.opacity = "0";
        document.body.append(copyBuffer);
        copyBuffer.select();
        const copied = document.execCommand("copy");
        copyBuffer.remove();
        if (!copied) throw new Error("browser clipboard access was denied");
      }
      function buildReviewDraft() {
        const gates = visualGateIds.map((gateId) => {
          const card = document.querySelector('[data-gate="' + gateId + '"]');
          return {
            gate: gateId,
            decision: card.querySelector('input[type="radio"]:checked')?.value || null,
            findings: [...card.querySelectorAll(".finding-row")].map((row) => ({
              fixtureId: row.querySelector("select").value,
              region: row.querySelector("input").value.trim(),
              finding: row.querySelector("textarea").value.trim(),
            })),
          };
        });
        return {
          kind: "h5-visual-review-draft",
          reviewer: reviewerName.value.trim(),
          source: ${serializeForScript(source)},
          package: ${serializeForScript(packageIdentity)},
          environment: ${serializeForScript(environmentIdentity)},
          fixtureVersion: ${serializeForScript(catalog.fixtureVersion)},
          rubricVersion: ${serializeForScript(catalog.rubricVersion)},
          capturedAt: ${serializeForScript(capturedAt)},
          objectiveResults: ${serializeForScript(objectiveResults)},
          gates,
          identity: {
            decision: document.querySelector('input[name="h5-identity"]:checked')?.value || null,
            rationale: document.querySelector('[name="h5-identity-rationale"]').value.trim(),
          },
        };
      }
      function removeBlankFindings(reviewDraft) {
        for (const gate of reviewDraft.gates) {
          gate.findings = gate.findings.filter(
            (finding) => finding.region !== "" && finding.finding !== "",
          );
        }
        return reviewDraft;
      }
      function downloadJson(record) {
        const blob = new Blob([JSON.stringify(record, null, 2) + "\\n"], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "approval.json";
        link.click();
        URL.revokeObjectURL(url);
      }
      reviewerName.addEventListener("input", updateHumanAuthority);
      ownerAuthority.addEventListener("change", updateHumanAuthority);
      document.querySelectorAll("[data-add-finding]").forEach((button) => button.addEventListener("click", () => {
        const container = document.querySelector('[data-findings-for="' + button.dataset.addFinding + '"]');
        const clone = container.querySelector(".finding-row").cloneNode(true);
        clone.querySelectorAll("input, textarea").forEach((control) => { control.value = ""; });
        container.append(clone);
      }));
      document.querySelector("#copy-review").addEventListener("click", async () => {
        const reviewDraft = buildReviewDraft();
        const validation = validateReviewDraft(reviewDraft);
        const copyStatus = document.querySelector("#copy-status");
        if (!validation.valid) {
          copyStatus.value = validation.gateId + ": " + validation.message;
          document.querySelector('[data-gate="' + validation.gateId + '"] .finding-row input').focus();
          return;
        }
        try {
          await copyText(JSON.stringify(removeBlankFindings(reviewDraft), null, 2));
          copyStatus.value = "Text review draft copied. It is not an approval attestation.";
        } catch (error) {
          copyStatus.value = "Copy failed: " + error.message;
        }
      });
      document.querySelector("#download-approval").addEventListener("click", () => {
        const copyStatus = document.querySelector("#copy-status");
        try {
          const record = createApprovedH5Record(removeBlankFindings(buildReviewDraft()));
          downloadJson(record);
          copyStatus.value = "Canonical Approved attestation downloaded; replace h5/approval.json only after verification.";
        } catch (error) {
          copyStatus.value = "Approval not exported: " + error.message;
        }
      });
      updateHumanAuthority();
    }
    updateSelection();
    applyTransform();
  </script>
</body>
</html>
`;
  const benchPath = path.join(runDirectory, "review.html");
  await writeFile(benchPath, html, { flag: "wx" });
  return benchPath;
}
