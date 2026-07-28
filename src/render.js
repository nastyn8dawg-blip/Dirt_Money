import {
  BACKGROUNDS,
  BALANCE,
  CROP_TYPES,
  LOCATIONS,
  NPCS
} from "./data.js";
import {
  activeContractActionLabel,
  basicFieldObservation,
  batchActionPreview,
  calendarLabel,
  contractNextStep,
  contractStatusLabel,
  dollars,
  expectedYield,
  fieldActionStatus,
  fieldRecommendation,
  getFertilizeCost,
  getHarvestCost,
  getPlantCost,
  getProgressionCost,
  getRepairEstimate,
  getWeedTreatmentCost,
  npcWarmthTier,
  preparednessText,
  getWorkSlotCost,
  rotationOutlook,
  salvageEquipmentUsePreview,
  selectors,
  stressSummary,
  weedControlWindowLabel,
  availableWeeklyEventChoices,
  weeklyEventChoiceStatus,
  workSlotStatus,
  workSlotText
} from "./state.js";
import { button, escapeHtml, icon, meter } from "./ui/components.js";
import {
  COUNTY_MAP_ART,
  FARM_OVERVIEW_ART,
  characterArtFor,
  fieldArtFor,
  locationArtFor
} from "./ui/worldArt.js";
import { ART_DEV_LABELS } from "./artManifest.js";

const MAP_NODE_POSITIONS = {
  home_farm: [19, 66],
  pattis_diner: [38, 44],
  farmers_coop: [51, 51],
  grain_elevator: [64, 40],
  roys_place: [75, 60],
  guss_yard: [85, 24],
  hollis_place: [27, 24],
  bank: [58, 78],
  grange_hall: [82, 82]
};

function artImage(art, alt, className = "scene-image") {
  const asset =
    typeof art === "string"
      ? {
          id: "unmanaged",
          displayName: alt,
          src: art,
          fallbackPath: art,
          status: "placeholder",
          isPlaceholder: true
        }
      : art;
  const fallback = asset.fallbackPath ? ` onerror="this.onerror=null;this.src='${escapeHtml(asset.fallbackPath)}';"` : "";
  const label =
    ART_DEV_LABELS && asset.isPlaceholder
      ? `<span class="art-dev-label">Placeholder art - replace ${escapeHtml(asset.displayName)}</span>`
      : "";
  return `<span class="art-frame" data-art-id="${escapeHtml(asset.id)}" data-art-status="${escapeHtml(asset.status)}"><img class="${className}" src="${escapeHtml(asset.src)}" alt="${escapeHtml(alt)}"${fallback} />${label}</span>`;
}

function portrait(id, name, className = "portrait-image", warmth = null) {
  return artImage(characterArtFor(id, warmth), `${name} portrait placeholder`, className);
}

function shell(app, content) {
  const state = app.game;
  const derived = selectors(state);
  const navItems = [
    ["dashboard", "Farm Ledger"],
    ["fields", "Fields"],
    ["market", "Grain Elevator"],
    ["salvage", "Gus's Yard"],
    ["equipment", "Machine Shed"],
    ["contracts", "Contract Board"],
    ["map", "County Map"],
    ["bank", "Bank"],
    ["report", "Report"],
    ["menu", "Menu"]
  ];

  return `
    <div class="app-shell ${app.settings.fontScale === "large" ? "large-type" : ""} ${app.settings.reduceMotion ? "reduce-motion" : ""}">
      <header class="topbar">
        <div>
          <p class="eyebrow">Ash Creek County</p>
          <h1>Dirt Money</h1>
        </div>
        <div class="status-strip" aria-label="Farm status">
          <span>${icon("cash")} Cash <strong>${dollars(state.financials.cash)}</strong></span>
          <span>${icon("debt")} Debt <strong>${dollars(state.financials.debt)}</strong></span>
          <span>${icon("credit")} Credit <strong>${dollars(derived.creditRemaining)}</strong></span>
          <span>${icon("equipment")} Work <strong>${derived.work.remaining}/${derived.work.slotsPerWeek}</strong></span>
          ${derived.work.bankedCap || derived.work.banked ? `<span>${icon("weather")} Preparedness <strong>+${derived.work.banked}/${derived.work.bankedCap}</strong></span>` : ""}
          <span>${icon("reputation")} Standing <strong>${derived.standing.label} ${state.reputation}/100</strong></span>
          <span>${icon("weather")} Calendar <strong>${escapeHtml(derived.calendarLabel)}</strong></span>
        </div>
      </header>
      <div class="layout">
        <nav class="side-nav" aria-label="Main navigation">
          ${navItems
            .map(([screen, label]) =>
              button("screen", label, {
                variant: app.screen === screen ? "active" : "ghost",
                data: { screen }
              })
            )
            .join("")}
          ${button("advance-week", "End Week", { variant: "gold" })}
        </nav>
        <main class="content-panel">
          ${app.notice ? `<div class="notice ${escapeHtml(app.notice.type)}">${escapeHtml(app.notice.message)}</div>` : ""}
          ${
            app.resultCard
              ? `<aside class="result-card ${escapeHtml(app.resultCard.type)}" role="status">
                  <div class="result-card-content">
                    <p class="eyebrow">${escapeHtml(app.resultCard.title)}</p>
                    ${renderResultCardBody(app.resultCard)}
                  </div>
                  ${button("dismiss-result", "Dismiss", { variant: "ghost" })}
                </aside>`
              : ""
          }
          ${content}
        </main>
      </div>
    </div>
  `;
}

function renderResultCardBody(card) {
  const details = card.details;
  if (details?.kind === "soil-test") return renderSoilTestResult(details.field);
  if (details?.kind === "soil-test-all") return renderSoilTestAllResult(details.fields);
  return `<p>${escapeHtml(card.message)}</p>`;
}

function renderSoilTestResult(result) {
  if (!result) return "";
  return `
    <div class="soil-result-card">
      <dl class="mini-ledger">
        <div><dt>Fertility</dt><dd>${escapeHtml(result.fertilityRating)}</dd></div>
        <div><dt>Soil Health</dt><dd>${escapeHtml(result.soilHealth)}</dd></div>
        <div><dt>Fertilizer ROI</dt><dd>${escapeHtml(result.fertilizerRoi)}</dd></div>
        <div><dt>Best Fit</dt><dd>${escapeHtml(result.bestCropFit)}</dd></div>
      </dl>
      <p><strong>Recommended action:</strong> ${escapeHtml(result.recommendation)}</p>
      <p><strong>Next season:</strong> ${escapeHtml(result.nextSeasonNote)}</p>
      <p class="muted">${escapeHtml(result.reason)}</p>
      <p class="muted">${escapeHtml(result.interpretation)}</p>
    </div>
  `;
}

function renderSoilTestAllResult(fields = []) {
  return `
    <div class="soil-summary-list">
      ${fields
        .map(
          (field) => `
            <article class="soil-summary-row">
              <strong>${escapeHtml(field.fieldName)}</strong>
              <span>${escapeHtml(field.fertilityRating)} fertility</span>
              <span>${escapeHtml(field.bestCropFit)}</span>
              <p>${escapeHtml(field.recommendation)}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function soilTestSummaryLine(field, status = null) {
  if (!field.soilTestKnown) return "Unchecked";
  const freshness = status?.disabled ? `Current W${field.lastSoilTestWeek}` : `Stale W${field.lastSoilTestWeek}`;
  if (field.soilTestResult?.fertilityRating) {
    return `${freshness}: ${field.soilTestResult.fertilityRating} fertility, ${field.soilTestResult.bestCropFit}`;
  }
  return `${freshness}: ${field.soilRecommendation ?? "Result saved"}`;
}

export function renderApp(app) {
  if (!app.game) {
    if (app.screen === "backgrounds") return renderBackgroundSelect(app);
    if (app.screen === "settings") return renderStandaloneSettings(app);
    return renderTitle(app);
  }

  const screens = {
    dashboard: renderDashboard,
    fields: renderFields,
    field: renderFieldDetail,
    market: renderMarket,
    salvage: renderSalvage,
    equipment: renderEquipment,
    contracts: renderContracts,
    map: renderMap,
    location: renderLocation,
    bank: renderBank,
    report: renderReport,
    settings: renderSettings,
    menu: renderMenu
  };
  const renderer = screens[app.screen] ?? renderDashboard;
  return shell(app, renderer(app));
}

function renderTitle(app) {
  return `
    <div class="title-screen title-screen--hero">
      <div class="title-hero" aria-hidden="true">
        ${artImage(FARM_OVERVIEW_ART, "", "title-hero__art")}
      </div>
      <section class="title-board title-board--hero">
        <p class="eyebrow">Ash Creek County Farm Ledger</p>
        <h1 class="title-wordmark">Dirt Money</h1>
        <p class="lead">Fields, debt, salvage, weather, and county trust. Make practical calls and keep the farm alive.</p>
        <div class="button-row">
          ${button("new-game", "New Game", { variant: "gold" })}
          ${button("load-game", "Load Saved Farm", { disabled: !app.hasSave })}
          ${button("standalone-settings", "Settings", { variant: "ghost" })}
        </div>
        <p class="title-footnote">A season is thirty-six weeks. The note comes due either way.</p>
      </section>
    </div>
  `;
}

function renderStandaloneSettings(app) {
  return `
    <div class="title-screen">
      <section class="title-board narrow">
        <p class="eyebrow">Settings</p>
        <h1>Ledger Preferences</h1>
        ${settingsControls(app)}
        <div class="button-row">
          ${button("save-settings", "Save Settings", { variant: "gold" })}
          ${button("screen", "Back to Title", { variant: "ghost", data: { screen: "title" } })}
        </div>
      </section>
    </div>
  `;
}

function renderBackgroundSelect() {
  return `
    <div class="title-screen">
      <section class="title-board wide">
        <p class="eyebrow">New Game</p>
        <h1>Choose Your Background</h1>
        <div class="card-grid three background-picker">
          ${Object.values(BACKGROUNDS)
            .map(
              (bg) => `
                <article class="ledger-card background-choice">
                  ${portrait(bg.id, bg.name, "portrait-image portrait-large")}
                  <h2>${escapeHtml(bg.name)}</h2>
                  <p class="muted background-choice__subtitle">${escapeHtml(bg.subtitle)}</p>
                  <p class="background-choice__body">${escapeHtml(bg.description)}</p>
                  <p class="rule-text background-choice__perk">${escapeHtml(bg.perkText)}</p>
                  ${button("choose-background", `Start as ${bg.name}`, {
                    variant: "gold",
                    data: { backgroundId: bg.id },
                    className: "background-choice__start"
                  })}
                </article>
              `
            )
            .join("")}
        </div>
        <div class="button-row">${button("screen", "Back to Title", { variant: "ghost", data: { screen: "title" } })}</div>
      </section>
    </div>
  `;
}

function renderDashboard(app) {
  const { game: state } = app;
  const derived = selectors(state);
  const readyFields = state.fields.filter((field) => field.ready);
  const warnings = [...derived.warnings];
  const roughMachines = state.equipment.filter((item) => item.condition < 45);
  if (readyFields.length) warnings.push(`${readyFields.length} field(s) are ready. Waiting risks weather loss.`);
  if (roughMachines.length) warnings.push(`${roughMachines.map((item) => item.name).join(", ")} need machine shed attention.`);

  return `
    <section class="world-hero dashboard-hero">
      ${artImage(FARM_OVERVIEW_ART, "Illustrated home farm overview with farmhouse, barn, machine shed, road, fields, and sky")}
      <div class="hero-scrim"></div>
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(derived.calendarLabel)}</p>
        <h2>What needs doing now</h2>
        <p>${escapeHtml(state.weather.name)}: ${escapeHtml(state.weather.note)}</p>
        <div class="hero-actions">
          ${button("screen", "Walk the Fields", { variant: "gold", data: { screen: "fields" } })}
          ${button("screen", "Open Machine Shed", { data: { screen: "equipment" } })}
          ${button("screen", "Check County Map", { variant: "ghost", data: { screen: "map" } })}
        </div>
      </div>
      <div class="hero-stat-grid">
        <article>${icon("cash")}<span>Cash</span><strong>${dollars(state.financials.cash)}</strong></article>
        <article>${icon("debt")}<span>Debt</span><strong>${dollars(state.financials.debt)}</strong></article>
        <article>${icon("credit")}<span>Credit</span><strong>${dollars(derived.creditRemaining)}</strong></article>
        <article>${icon("equipment")}<span>Work Slots</span><strong>${derived.work.remaining}/${derived.work.slotsPerWeek}</strong></article>
        ${derived.work.bankedCap || derived.work.banked ? `<article>${icon("weather")}<span>Preparedness</span><strong>+${derived.work.banked}/${derived.work.bankedCap}</strong></article>` : ""}
        <article>${icon("reputation")}<span>Rep</span><strong>${state.reputation}/100</strong></article>
      </div>
    </section>
    ${warnings.length ? `<div class="warning-list">${warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>` : ""}
    ${renderWeeklyEvents(state)}
    <section class="priority-panel">
      <h3>This Week's Priorities</h3>
      <div class="stack">
        ${derived.priorities
          .map(
            (priority) => `
              <article class="ledger-card priority ${escapeHtml(priority.urgency.toLowerCase())}">
                <p class="eyebrow">${escapeHtml(priority.urgency)} priority</p>
                <p>${escapeHtml(priority.text)}</p>
                ${button("screen", `Go to ${screenLabel(priority.screen)}`, { data: { screen: priority.screen } })}
              </article>
            `
          )
          .join("")}
      </div>
    </section>
    <div class="split">
      <section>
        <h3>Field Recommendations</h3>
        <div class="stack">
          ${state.fields
            .map(
              (field) => `
                <article class="ledger-card">
                  ${artImage(fieldArtFor(field), `${field.name} field condition placeholder`, "field-card-art")}
                  <div class="card-title">
                    <h4>${escapeHtml(field.name)}</h4>
                    <span>${field.condition}% condition</span>
                  </div>
                  ${meter(field.condition, field.name)}
                  <p>${escapeHtml(fieldRecommendation(state, field))}</p>
                  ${button("select-field", "Open Field Detail", { data: { fieldId: field.id } })}
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section>
        <h3>Current Pressure</h3>
        <div class="stack">
          <article class="ledger-card">
            <h4>County Standing</h4>
            <p><strong>${escapeHtml(derived.standing.label)}</strong>: ${escapeHtml(derived.standing.summary)}.</p>
            ${button("screen", "Review Bank Terms", { data: { screen: "bank" } })}
          </article>
          <article class="ledger-card">
            <h4>Active Contracts</h4>
            <p>${derived.activeContracts.length ? `${derived.activeContracts.length} job(s) have deadlines.` : "No accepted contracts. The board still has work if you need cash or trust."}</p>
            ${button("screen", "View Contract Board", { data: { screen: "contracts" } })}
          </article>
          <article class="ledger-card">
            <h4>Morning Notices</h4>
            <p>${
              state.events?.length
                ? `${escapeHtml(state.events[0].title)}: ${escapeHtml(state.events[0].note)}`
                : "No new county event this morning. Use the quiet while it lasts."
            }</p>
            ${button("screen", "Read Weekly Report", { data: { screen: "report" } })}
          </article>
          <article class="ledger-card">
            <h4>Stored Crop</h4>
            <p>${storedCropLine(state)}</p>
            ${button("screen", "Visit Grain Elevator", { data: { screen: "market" } })}
          </article>
          <article class="ledger-card">
            <h4>Salvage Inventory</h4>
            <p>${state.inventory.salvage.length} item(s), ${state.inventory.parts} usable part(s). Nothing has to be a dead-end purchase.</p>
            ${button("screen", "Open Salvage Ledger", { data: { screen: "salvage" } })}
          </article>
        </div>
      </section>
    </div>
  `;
}

function storedCropLine(state) {
  const entries = Object.entries(state.inventory.crops)
    .filter(([, qty]) => qty > 0)
    .map(([cropId, qty]) => `${qty.toLocaleString("en-US")} ${CROP_TYPES[cropId].unit} ${CROP_TYPES[cropId].name}`);
  return entries.length ? entries.join(", ") : "No crop stored. Revenue is still standing in the field or not planted yet.";
}

function renderWeeklyEvents(state) {
  const events = state.weeklyEvents ?? [];
  return `
    <section class="weekly-events">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">Calls & Visits</p>
          <h3>This Week in Ash Creek</h3>
        </div>
        <span>${events.filter((event) => !event.handled && !event.expired).length} open</span>
      </div>
      <div class="card-grid three">
        ${
          events.length
            ? events
                .map(
                  (event) => `
                    <article class="ledger-card event-card ${escapeHtml(event.category ?? "community")} ${event.handled ? "handled" : ""} ${event.expired ? "expired" : ""}">
                      <div class="card-title">
                        <h4>${escapeHtml(event.title)}</h4>
                        <span>${escapeHtml(event.urgency)} urgency</span>
                      </div>
                      <p class="eyebrow">${escapeHtml(event.category ?? "community")} / ${escapeHtml(event.source)}</p>
                      <p>${escapeHtml(event.message)}</p>
                      <dl class="mini-ledger">
                        <div><dt>Deadline</dt><dd>${event.expiresWeek ? `End of Week ${event.expiresWeek}` : "This week"}</dd></div>
                        <div><dt>Notice</dt><dd>${escapeHtml(event.visibleConsequence ?? event.effectSummary ?? "County information.")}</dd></div>
                      </dl>
                      <p class="muted">${escapeHtml(event.effectSummary)}</p>
                      ${
                        event.handled
                          ? `<p class="next-step"><strong>Resolved:</strong> ${escapeHtml(event.resultText ?? event.result ?? event.choiceLabel ?? "Handled.")}</p>`
                          : event.expired
                            ? `<p class="debt-warning">${escapeHtml(event.resultText ?? event.result ?? "Expired without a response.")}</p>`
                            : availableWeeklyEventChoices(state, event).length
                              ? `<div class="button-grid compact">
                                  ${availableWeeklyEventChoices(state, event)
                                    .map((choice) => {
                                      const status = weeklyEventChoiceStatus(state, event, choice);
                                      const consequence = choice.consequence ? ` ${choice.consequence}` : "";
                                      return button("resolve-weekly-event", `${choice.label} - ${status.label}`, {
                                        variant: choice.id === "decline" || choice.id === "ignore" || choice.id === "pass" || choice.id === "avoid" ? "ghost" : "gold",
                                        disabled: status.disabled,
                                        title: `${choice.summary}${consequence} ${status.reason}`,
                                        data: { eventId: event.id, choiceId: choice.id }
                                      });
                                    })
                                    .join("")}
                                </div>`
                              : `<p class="next-step">Informational notice. No action required.</p>`
                      }
                    </article>
                  `
                )
                .join("")
            : `<article class="ledger-card"><p>No county calls are waiting. Quiet weeks are when maintenance gets done.</p></article>`
        }
      </div>
    </section>
  `;
}

function screenLabel(screen) {
  const labels = {
    dashboard: "Farm Ledger",
    fields: "Fields",
    field: "Field Detail",
    equipment: "Machine Shed",
    contracts: "Contract Board",
    bank: "Bank",
    market: "Grain Elevator",
    salvage: "Gus's Yard"
  };
  return labels[screen] ?? "Farm Ledger";
}

function renderFields(app) {
  const { game: state } = app;
  const scoutPreview = batchActionPreview(state, "scout-all");
  const soilPreview = batchActionPreview(state, "soil-test-all");
  const sprayPreview = batchActionPreview(state, "treat-weeds-all");
  const fertPreview = batchActionPreview(state, "fertilize-all");
  const harvestPreview = batchActionPreview(state, "harvest-all");
  return `
    <section class="screen-head">
      <p class="eyebrow">Home Farm</p>
      <h2>Fields Overview</h2>
      <p>Read the whole farm before you spend the week. Scouting is free, fertilizer is limited, and crop-year rules apply.</p>
    </section>
    <section class="batch-actions">
      <h3>Batch Field Actions</h3>
      <p class="muted">Costs and affected field counts are shown before you click. Scout actions are free; input actions still show cost.</p>
      <div class="button-grid">
        ${batchButton("scout-all-fields", scoutPreview)}
        ${batchButton("soil-test-all-fields", soilPreview)}
        ${batchButton("treat-high-weed-fields", sprayPreview)}
        ${batchButton("fertilize-recommended-fields", fertPreview)}
        ${batchButton("harvest-all-ready-fields", harvestPreview, "gold")}
      </div>
      <div class="action-reasons">
        ${[scoutPreview, soilPreview, sprayPreview, fertPreview, harvestPreview]
          .filter((preview) => preview.creditWarning || preview.workWarning)
          .map((preview) => `<p>${escapeHtml(preview.label)}: ${escapeHtml(preview.workWarning || preview.creditWarning)}</p>`)
          .join("")}
      </div>
    </section>
    <div class="field-overview-grid">
      ${state.fields
        .map((field) => {
          const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
          const stage = crop ? crop.stages[field.stageIndex] : null;
          const stress = stressSummary(state, field);
          const soilTest = fieldActionStatus(state, field, "soil-test");
          const scout = fieldActionStatus(state, field, "scout-field");
          const weedStatus = fieldActionStatus(state, field, "treat-weeds");
          const harvest = fieldActionStatus(state, field, state.financials.cash >= getHarvestCost(state, field) ? "harvest-field" : "harvest-credit");
          return `
            <article class="ledger-card field-overview-card ${field.ready ? "ready" : ""}">
              ${artImage(fieldArtFor(field), `${field.name} field condition placeholder`, "field-card-art")}
              <div class="card-title">
                <h3>${escapeHtml(field.name)}</h3>
                <span>${field.acres} acres</span>
              </div>
              <p class="field-observation">${escapeHtml(basicFieldObservation(state, field))}</p>
              <dl class="mini-ledger">
                <div><dt>Crop</dt><dd>${crop ? escapeHtml(crop.name) : "Fallow"}</dd></div>
                <div><dt>Stage</dt><dd>${stage ? escapeHtml(stage.name) : "Open ground"}</dd></div>
                <div><dt>Condition</dt><dd>${field.condition}%</dd></div>
                <div><dt>Stress</dt><dd>${field.stress}%</dd></div>
                <div><dt>Weeds</dt><dd>${field.weeds}%</dd></div>
                <div><dt>Fertility</dt><dd>${field.fertility}%</dd></div>
                <div><dt>Crop Year</dt><dd>${field.annualCashCropPlantedThisYear ? `${escapeHtml(CROP_TYPES[field.annualCashCropPlantedThisYear]?.name ?? field.annualCashCropPlantedThisYear)} planted` : field.cashCropHarvestedThisYear ? "Cash crop harvested" : "Open"}</dd></div>
                <div><dt>Fertilizer</dt><dd>${field.fertilizerApplicationsThisCrop ?? 0}/${field.cropId === "corn" ? 2 : field.cropId === "soybeans" || field.cropId === "winter_wheat" ? 1 : field.cropId === "hay" ? 3 : field.cropId ? 0 : 1} used</dd></div>
                <div><dt>Weed Window</dt><dd>${escapeHtml(weedControlWindowLabel(field))}</dd></div>
                <div><dt>Soil Test</dt><dd>${escapeHtml(soilTestSummaryLine(field, soilTest))}</dd></div>
                <div><dt>Scout</dt><dd>${field.lastScoutWeek === state.time.week ? "Current" : "Basic observation"}</dd></div>
              </dl>
              ${meter(field.condition, `${field.name} condition`)}
              <div class="stress-box">
                <p><strong>Stress Cause:</strong> ${escapeHtml(stress.causeText)}</p>
                <p><strong>Effect:</strong> ${escapeHtml(stress.effectText)}</p>
                <p><strong>Recovery:</strong> ${escapeHtml(stress.recoveryText)}</p>
              </div>
              <p class="muted"><strong>Weed Treatment:</strong> ${
                weedStatus.disabled
                  ? escapeHtml(weedStatus.reason)
                  : `Expected -${weedStatus.weedReduction} weed pressure, ${escapeHtml(weedStatus.yieldBenefit)} yield benefit. ${escapeHtml(weedStatus.reason)}`
              }</p>
              <p><strong>Recommended:</strong> ${escapeHtml(fieldRecommendation(state, field))}</p>
              <div class="button-grid compact">
                ${button("select-field", "Open Detail", { variant: field.ready ? "gold" : "", data: { fieldId: field.id } })}
                ${button("scout-field", scout.disabled ? "Scouted" : `Scout - Free, ${workSlotText(scout.workCost)}`, { disabled: scout.disabled, title: scout.reason, data: { fieldId: field.id } })}
                ${
                  field.ready
                    ? crop?.isCoverCrop
                      ? button("harvest-field", `Terminate Cover - ${workSlotText(harvest.workCost)}`, { variant: "gold", disabled: harvest.disabled, title: harvest.reason, data: { fieldId: field.id } })
                      : button("harvest-field", `Harvest - ${dollars(getHarvestCost(state, field))}, ${workSlotText(harvest.workCost)}`, { variant: "gold", disabled: harvest.disabled, title: harvest.reason, data: { fieldId: field.id } })
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function batchButton(action, preview, preferredVariant = "") {
  const costLabel = preview.totalCost === 0 ? "Free" : `${dollars(preview.totalCost)} total`;
  const workLabel = workSlotText(preview.workCost);
  const label = preview.affectedCount
    ? `${preview.label} - ${costLabel}, ${workLabel} for ${preview.affectedCount} field${preview.affectedCount === 1 ? "" : "s"}`
    : `${preview.label} - None Needed`;
  return button(action, label, {
    variant: preferredVariant || (preview.affectedCount ? "" : "ghost"),
    disabled: preview.affectedCount === 0 || Boolean(preview.workWarning),
    title: preview.workWarning || preview.creditWarning || `${preview.affectedCount} affected field(s), ${workLabel}.`
  });
}

function renderFieldDetail(app) {
  const state = app.game;
  const field = state.fields.find((item) => item.id === app.selectedFieldId) ?? state.fields[0];
  const fieldIndex = state.fields.findIndex((item) => item.id === field.id);
  const previousField = state.fields[(fieldIndex - 1 + state.fields.length) % state.fields.length];
  const nextField = state.fields[(fieldIndex + 1) % state.fields.length];
  const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
  const stage = crop ? crop.stages[field.stageIndex] : null;
  const nextStageWeeks = crop && !field.ready ? Math.max(0, stage.weeks - field.weeksInStage) : 0;
  const harvestCost = getHarvestCost(state, field);
  const canCashHarvest = state.financials.cash >= harvestCost;
  const financedHarvestAmount = Math.max(0, harvestCost - Math.max(0, state.financials.cash));
  const expectedHarvestRevenue =
    crop && field.ready ? Math.round(expectedYield(state, field) * (state.marketPrices[crop.id]?.price ?? crop.basePrice)) : 0;
  const recommendation = fieldRecommendation(state, field);
  const rotation = rotationOutlook(state, field, crop?.id ?? "soybeans");
  const soilTestStatus = fieldActionStatus(state, field, "soil-test");
  const soilStatus = field.soilTestKnown
    ? soilTestSummaryLine(field, soilTestStatus)
    : "Unknown. A soil test gives fertility, rotation, and input advice.";
  const scoutStatus = fieldActionStatus(state, field, "scout-field");
  const fertilizeStatus = fieldActionStatus(state, field, "fertilize-field");
  const weedStatus = fieldActionStatus(state, field, "treat-weeds");
  const fallowStatus = fieldActionStatus(state, field, "leave-fallow");
  const harvestStatus = fieldActionStatus(state, field, canCashHarvest ? "harvest-field" : "harvest-credit");
  const stress = stressSummary(state, field);
  const fertilizerLimit = field.cropId === "corn" ? 2 : field.cropId === "soybeans" || field.cropId === "winter_wheat" ? 1 : field.cropId === "hay" ? 3 : field.cropId ? 0 : 1;
  const plantOptions = !field.cropId
    ? Object.values(CROP_TYPES).map((item) => ({
        item,
        status: fieldActionStatus(state, field, "plant-crop", { cropId: item.id })
      }))
    : [];

  return `
    <section class="screen-head">
      <p class="eyebrow">Field ${fieldIndex + 1} of ${state.fields.length}</p>
      <h2>${escapeHtml(field.name)}</h2>
      <p>${escapeHtml(field.note)}</p>
      <div class="button-row">
        ${button("select-field", `Previous: ${previousField.name}`, { variant: "ghost", data: { fieldId: previousField.id } })}
        ${button("select-field", `Next: ${nextField.name}`, { variant: "ghost", data: { fieldId: nextField.id } })}
      </div>
    </section>
    <article class="detail-panel">
      <div class="field-visual-panel">
        ${artImage(fieldArtFor(field), `${field.name} visual state placeholder`, "scene-image")}
        <div class="field-visual-caption">
          <strong>${crop ? escapeHtml(crop.name) : "Fallow ground"}</strong>
          <span>${field.ready ? "Ready" : crop ? escapeHtml(stage.name) : field.lastAction}</span>
        </div>
      </div>
      <div class="field-standard">
        <dl class="detail-ledger">
          <div><dt>Crop</dt><dd>${crop ? escapeHtml(crop.name) : "Fallow"}</dd></div>
          <div><dt>Stage</dt><dd>${stage ? escapeHtml(stage.name) : "Open ground"}</dd></div>
          <div><dt>Weeks to next stage</dt><dd>${field.ready || !crop ? "-" : nextStageWeeks}</dd></div>
          <div><dt>Status</dt><dd>${field.ready ? "Ready to harvest" : crop ? "Growing" : "Idle"}</dd></div>
          <div><dt>Calendar</dt><dd>${escapeHtml(calendarLabel(state))}</dd></div>
          <div><dt>Previous Crop</dt><dd>${field.previousCropId ? escapeHtml(CROP_TYPES[field.previousCropId]?.name ?? field.previousCropId) : "No record yet"}</dd></div>
          <div><dt>Rotation Outlook</dt><dd>${escapeHtml(rotation.level)}</dd></div>
          <div><dt>Already planted this year</dt><dd>${field.annualCashCropPlantedThisYear ? escapeHtml(CROP_TYPES[field.annualCashCropPlantedThisYear]?.name ?? field.annualCashCropPlantedThisYear) : "No annual cash crop"}</dd></div>
          <div><dt>Cash crop harvested this year</dt><dd>${field.cashCropHarvestedThisYear ? "Yes" : "No"}</dd></div>
          <div><dt>Fertilizer used</dt><dd>${field.fertilizerApplicationsThisCrop ?? 0}/${fertilizerLimit}</dd></div>
          <div><dt>Weed treatment window</dt><dd>${escapeHtml(weedControlWindowLabel(field))}</dd></div>
          <div><dt>Soil</dt><dd>${field.soil}%</dd></div>
          <div><dt>Fertility</dt><dd>${field.fertility}%</dd></div>
          <div><dt>Weeds</dt><dd>${field.weeds}%</dd></div>
          <div><dt>Stress</dt><dd>${field.stress}%</dd></div>
          <div><dt>Expected yield</dt><dd>${crop && crop.marketable !== false ? `${expectedYield(state, field).toLocaleString("en-US")} ${crop.unit}` : crop?.isCoverCrop ? "Soil benefit, no sale crop" : "-"}</dd></div>
        </dl>
        <div class="recommendation">
          <strong>Recommendation</strong>
          <p>${escapeHtml(recommendation)}</p>
        </div>
        <div class="stress-box">
          <strong>Stress</strong>
          <p><span>Cause:</span> ${escapeHtml(stress.causeText)}</p>
          <p><span>Effect:</span> ${escapeHtml(stress.effectText)}</p>
          <p><span>Recovery:</span> ${escapeHtml(stress.recoveryText)}</p>
          <p><span>Recoverable this season:</span> ${stress.recoverableThisSeason ? "Yes, if timing is still right." : "Mostly locked in or a next-season fix."}</p>
        </div>
        <div class="scout-report ${weedStatus.disabled ? "muted" : ""}">
          <strong>Weed Treatment</strong>
          <p>${
            weedStatus.disabled
              ? escapeHtml(weedStatus.reason)
              : `Expected weed reduction: ${weedStatus.weedReduction} points. Yield benefit: ${escapeHtml(weedStatus.yieldBenefit)}. ${escapeHtml(weedStatus.reason)}`
          }</p>
        </div>
        <div class="scout-report ${field.soilTestKnown ? "" : "muted"}">
          <strong>Soil Test</strong>
          ${
            field.soilTestResult?.fertilityRating
              ? renderSoilTestResult(field.soilTestResult)
              : `<p>${escapeHtml(soilStatus)}</p>`
          }
        </div>
        <div class="scout-report">
          <strong>Rotation</strong>
          <p>${escapeHtml(rotation.summary)} ${escapeHtml(rotation.recommendation)}</p>
        </div>
        ${
          field.scoutReport
            ? `<div class="scout-report"><strong>Scout Report</strong><p>${escapeHtml(field.scoutReport)}</p></div>`
            : `<div class="scout-report muted"><strong>Scout Report</strong><p>Unscouted this week. Scout for free before spending if the field feels uncertain.</p></div>`
        }
      </div>
      <h3>Actions</h3>
      <div class="button-grid">
        ${button("soil-test", soilTestStatus.disabled ? "Soil Test already current" : `Soil Test - ${dollars(BALANCE.soilTestCost)}, ${workSlotText(soilTestStatus.workCost)}`, { disabled: soilTestStatus.disabled, title: soilTestStatus.reason, data: { fieldId: field.id } })}
        ${button("scout-field", scoutStatus.disabled ? "Field already scouted" : `Scout Field - Free, ${workSlotText(scoutStatus.workCost)}`, { disabled: scoutStatus.disabled, title: scoutStatus.reason, data: { fieldId: field.id } })}
        ${button("fertilize-field", fertilizeStatus.disabled ? "Fertilizer not useful now" : `Fertilize - ${dollars(getFertilizeCost(state, field))}, ${workSlotText(fertilizeStatus.workCost)}`, { disabled: fertilizeStatus.disabled, title: fertilizeStatus.reason, data: { fieldId: field.id } })}
        ${button("treat-weeds", weedStatus.disabled ? "Weed treatment not useful now" : `Treat Weeds - ${workSlotText(weedStatus.workCost)}, ${dollars(getWeedTreatmentCost(state, field))}`, { disabled: weedStatus.disabled, title: weedStatus.disabled ? weedStatus.reason : `${weedStatus.reason} Expected -${weedStatus.weedReduction} weed pressure; ${weedStatus.yieldBenefit} yield benefit.`, data: { fieldId: field.id } })}
        ${
          field.ready
            ? crop?.isCoverCrop
              ? button("harvest-field", `Terminate Cover Crop - ${workSlotText(harvestStatus.workCost)}`, { variant: "gold", disabled: harvestStatus.disabled, title: harvestStatus.reason, data: { fieldId: field.id } })
              : canCashHarvest
                ? button("harvest-field", `Harvest - ${dollars(harvestCost)}, ${workSlotText(harvestStatus.workCost)}`, { variant: "gold", disabled: harvestStatus.disabled, title: harvestStatus.reason, data: { fieldId: field.id } })
                : button("harvest-credit", `Harvest on Credit - ${dollars(harvestCost)}, ${workSlotText(harvestStatus.workCost)}`, { variant: "warning", disabled: harvestStatus.disabled, title: harvestStatus.reason, data: { fieldId: field.id } })
            : ""
        }
        ${plantOptions.map(({ item, status: plantStatus }) => {
          const timingLabel = plantStatus.timing && plantStatus.timing !== "Normal" ? `${plantStatus.timing} - ` : "";
          return button("plant-crop", plantStatus.disabled ? `Plant ${item.name} unavailable` : `${timingLabel}Plant ${item.name} - ${dollars(getPlantCost(state, field, item.id))}, ${workSlotText(plantStatus.workCost)}`, {
            disabled: plantStatus.disabled,
            title: plantStatus.reason,
            data: { fieldId: field.id, cropId: item.id }
          });
        }).join("")}
        ${!field.cropId ? button("leave-fallow", fallowStatus.disabled ? "Fallow already chosen" : `Leave Fallow / Rest Ground - ${workSlotText(fallowStatus.workCost)}`, { disabled: fallowStatus.disabled, title: fallowStatus.reason, data: { fieldId: field.id } }) : ""}
        ${button("screen", "Back to Fields", { variant: "ghost", data: { screen: "fields" } })}
      </div>
      <div class="action-reasons">
        <p>${escapeHtml(soilTestStatus.reason)}</p>
        <p>${escapeHtml(scoutStatus.reason)}</p>
        <p>${escapeHtml(fertilizeStatus.reason)}</p>
        <p>${escapeHtml(weedStatus.reason)}</p>
        <p>${escapeHtml(harvestStatus.reason)}</p>
        <p>${escapeHtml(fallowStatus.reason)}</p>
        ${plantOptions.map(({ item, status }) => `<p>${escapeHtml(item.name)}: ${escapeHtml(status.reason)}</p>`).join("")}
      </div>
        ${
          field.ready && !canCashHarvest
            ? `<p class="debt-warning">Cash is short. Harvesting now will put about ${dollars(financedHarvestAmount)} on the operating line. Current elevator value is about ${dollars(expectedHarvestRevenue)}, and waiting risks weather loss.</p>`
            : ""
        }
    </article>
  `;
}

function renderMarket(app) {
  const { game: state } = app;
  return `
    ${locationHero("grain_elevator", "Grain Elevator", "Dee's bid sheet changes each week. Selling turns stored crop into cash; waiting is a choice, not a guarantee.")}
    <div class="card-grid two">
      ${Object.values(CROP_TYPES)
        .filter((crop) => crop.marketable !== false)
        .map((crop) => {
          const stored = state.inventory.crops[crop.id] ?? 0;
          const bid = state.marketPrices[crop.id];
          return `
            <article class="ledger-card">
              <div class="card-title">
                <h3>${escapeHtml(crop.name)}</h3>
                <span>${dollars(bid.price)} / ${escapeHtml(crop.unit)}</span>
              </div>
              <p>Stored: <strong>${stored.toLocaleString("en-US")} ${escapeHtml(crop.unit)}</strong></p>
              <p class="muted">${escapeHtml(bid.note)}</p>
              ${button("sell-crop", `Sell All ${crop.name} - ${workSlotText(0)}`, { variant: stored > 0 ? "gold" : "", disabled: stored <= 0, data: { cropId: crop.id } })}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSalvage(app) {
  const { game: state } = app;
  const salvageWork = workSlotStatus(state, getWorkSlotCost("salvage-action"), "Salvage action");
  return `
    ${locationHero("guss_yard", "Gus's Yard", "Every item shows an exit: scrap it, strip it, repair and flip it, or put it toward machinery.")}
    <div class="split">
      <section>
        <h3>For Sale</h3>
        <div class="stack">
          ${state.salvageYard
            .map(
              (item) => `
                <article class="ledger-card salvage-card">
                  <div class="card-title"><h4>${escapeHtml(item.name)}</h4><span>${dollars(item.cost)}</span></div>
                  <dl class="mini-ledger">
                    <div><dt>Condition</dt><dd>${item.condition}%</dd></div>
                    <div><dt>Scrap</dt><dd>${dollars(item.scrapValue)}</dd></div>
                    <div><dt>Flip Value</dt><dd>${dollars(item.flipValue)}</dd></div>
                    <div><dt>Risk</dt><dd>${Math.round(item.risk * 100)}%</dd></div>
                  </dl>
                  <p>${escapeHtml(item.note)}</p>
                  <p class="muted">Clear exits: sell for scrap, strip into ${item.partsYield} part(s), repair and flip, or use on ${item.helps.map((id) => escapeHtml(machineName(state, id))).join(", ")}.</p>
                  ${button("buy-salvage", `Buy Salvage - ${dollars(item.cost)}, ${salvageWork.label}`, { variant: "gold", disabled: salvageWork.disabled, title: salvageWork.reason, data: { instanceId: item.instanceId } })}
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section>
        <h3>Owned Salvage and Parts</h3>
        <p class="parts-line">Usable salvage parts: <strong>${state.inventory.parts}</strong></p>
        <div class="stack">
          ${
            state.inventory.salvage.length
              ? state.inventory.salvage
                  .map(
                    (item) => `
                      <article class="ledger-card salvage-card">
                        <div class="card-title"><h4>${escapeHtml(item.name)}</h4><span>${item.condition}%</span></div>
                        <p>${escapeHtml(item.note)}</p>
                        <dl class="mini-ledger">
                          <div><dt>Compatible</dt><dd>${item.helps.map((id) => escapeHtml(machineName(state, id))).join(", ") || "No direct fit listed"}</dd></div>
                          <div><dt>Sell scrap</dt><dd>about ${dollars(Math.round(item.scrapValue * (0.9 + item.condition / 220)))}</dd></div>
                          <div><dt>Strip</dt><dd>${item.partsYield} part(s)</dd></div>
                          <div><dt>Repair/flip</dt><dd>spend about ${dollars(item.repairCost)} for a chance at ${dollars(item.flipValue)}</dd></div>
                        </dl>
                        <p class="muted">Direct use consumes this salvage item. Compatible machines show current and projected condition in the button help text.</p>
                        <div class="button-grid compact">
                          ${button("sell-salvage", `Sell Scrap - ${salvageWork.label}`, { disabled: salvageWork.disabled, title: salvageWork.reason, data: { inventoryId: item.inventoryId } })}
                          ${button("strip-salvage", `Strip for Parts - ${salvageWork.label}`, { disabled: salvageWork.disabled, title: salvageWork.reason, data: { inventoryId: item.inventoryId } })}
                          ${button("flip-salvage", `Repair and Flip - ${salvageWork.label}`, { variant: "gold", disabled: salvageWork.disabled, title: salvageWork.reason, data: { inventoryId: item.inventoryId } })}
                          ${state.equipment
                            .map((machine) => {
                              const preview = salvageEquipmentUsePreview(state, item.inventoryId, machine.id);
                              const label = preview.compatible && preview.repairAmount > 0
                                ? `Use on ${machine.name} - +${preview.repairAmount} condition, ${workSlotText(preview.workCost)}`
                                : preview.compatible
                                  ? `Use on ${machine.name} - Already 100%`
                                  : `Use on ${machine.name} - Not compatible`;
                              const title = preview.compatible && preview.repairAmount > 0
                                ? `${machine.name}: ${preview.previousCondition}% -> ${preview.newCondition}%. Uses ${workSlotText(preview.workCost)} and consumes ${item.name}.`
                                : preview.disabledReason;
                              return button("use-salvage-equipment", label, {
                                disabled: preview.disabled,
                                title,
                                data: { inventoryId: item.inventoryId, equipmentId: machine.id }
                              });
                            })
                            .join("")}
                        </div>
                      </article>
                    `
                  )
                  .join("")
              : `<article class="ledger-card"><p>No owned salvage yet. Buying from Gus will put items here with clear exits.</p></article>`
          }
        </div>
      </section>
    </div>
  `;
}

function machineName(state, id) {
  return state.equipment.find((item) => item.id === id)?.name ?? id;
}

function renderEquipment(app) {
  const { game: state } = app;
  const derived = selectors(state);
  const equipmentUpgrades = derived.progressionUpgrades.filter((upgrade) => upgrade.type === "Equipment upgrade");
  const repairWork = workSlotStatus(state, getWorkSlotCost("repair-equipment"), "Repair equipment");
  return `
    ${locationHero("machine_shed", "Machine Shed", "Poor machines raise harvest costs, threaten contracts, and make every good plan less certain.")}
    <div class="card-grid three">
      ${state.equipment
        .map((machine) => {
          const estimate = getRepairEstimate(state, machine.id);
          const partsEstimate = getRepairEstimate(state, machine.id, { useParts: true });
          return `
            <article class="ledger-card">
              <div class="card-title"><h3>${escapeHtml(machine.name)}</h3><span>${machine.condition}%</span></div>
              ${meter(machine.condition, `${machine.name} condition`)}
              <p class="muted">${escapeHtml(machine.role)}</p>
              <p>${escapeHtml(machine.risk)}</p>
              <div class="button-grid compact">
                ${button("repair-equipment", `Repair with Cash - ${dollars(estimate.cashCost)}, ${repairWork.label}`, { disabled: repairWork.disabled, title: repairWork.reason, data: { equipmentId: machine.id } })}
                ${button("repair-equipment-credit", `Repair on Credit - ${dollars(estimate.creditCost)} financed, ${repairWork.label}, includes ${dollars(estimate.premium)} shop/credit premium`, { variant: "warning", disabled: repairWork.disabled, title: repairWork.reason, data: { equipmentId: machine.id } })}
                ${button("repair-equipment-parts", `Repair with Parts (${state.inventory.parts}) - ${repairWork.label}`, {
                  disabled: state.inventory.parts <= 0 || repairWork.disabled,
                  title: repairWork.reason,
                  data: { equipmentId: machine.id }
                })}
              </div>
              ${
                state.inventory.parts > 0
                  ? `<p class="muted">Parts estimate: ${partsEstimate.partsUsed} part(s), ${dollars(partsEstimate.cashCost)} cash if paid now.</p>`
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
    <section>
      <h3>Equipment Purchases</h3>
      <p class="muted">Small first-pass upgrades. Not a full dealership yet, but enough to turn harvest money into long-term leverage.</p>
      <div class="card-grid three">
        ${equipmentUpgrades
          .map((upgrade) => {
            const purchased = derived.purchasedUpgrades.includes(upgrade.id);
            const locked = state.reputation < upgrade.reputationRequired;
            const upgradeCost = getProgressionCost(state, upgrade);
            return `
              <article class="ledger-card">
                <p class="eyebrow">${escapeHtml(upgrade.locationId === "roys_place" ? "Roy's Place" : "Co-op")}</p>
                <div class="card-title"><h4>${escapeHtml(upgrade.title)}</h4><span>${dollars(upgradeCost)}</span></div>
                <p>${escapeHtml(upgrade.description)}</p>
                <p class="muted">${escapeHtml(upgrade.benefit)}</p>
                <p class="muted">Requires standing ${upgrade.reputationRequired}.${upgrade.financingAllowed ? " Can use operating credit if cash is short." : ""}</p>
                ${button("purchase-progression", purchased ? "Purchased" : locked ? "Standing Too Low" : `Buy Upgrade - ${dollars(upgradeCost)}, ${workSlotText(0)}`, {
                  variant: purchased ? "active" : locked ? "ghost" : "gold",
                  disabled: purchased || locked,
                  data: { upgradeId: upgrade.id }
                })}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderContracts(app) {
  const { game: state } = app;
  const derived = selectors(state);
  const visibleContracts = derived.visibleContracts;
  return `
    ${locationHero("farmers_coop", "Co-op Board", "Practical work buys cash, relationships, and sometimes trouble. Deadlines advance each week.")}
    <article class="detail-panel compact-panel">
      <h3>How the Board Works</h3>
      <p>Accepting work reserves the opportunity. After that, do the active step, then let the weekly report move the job toward settlement or failure.</p>
      <p><strong>Standing: ${escapeHtml(derived.standing.label)}</strong> - ${escapeHtml(derived.standing.summary)}.</p>
    </article>
    <div class="card-grid two">
      ${visibleContracts
        .map((contract) => {
          const activeWork = workSlotStatus(state, getWorkSlotCost("contract-action", { contract }), activeContractActionLabel(contract));
          return `
            <article class="ledger-card contract ${contract.status}">
              <div class="card-title">
                <h3>${escapeHtml(contract.title)}</h3>
                <span>${escapeHtml(contractStatusLabel(contract))}</span>
              </div>
              <p class="eyebrow">${escapeHtml(contract.source ?? NPCS[contract.npcId]?.name ?? "County board")}</p>
              <p>${escapeHtml(contract.description)}</p>
              <dl class="mini-ledger">
                <div><dt>Wants</dt><dd>${escapeHtml(contract.actionText ?? contract.description)}</dd></div>
                <div><dt>Deadline</dt><dd>${["in_progress", "ready_to_complete"].includes(contract.status) ? `${contract.weeksLeft} week(s)` : `${contract.deadlineWeeks} week(s)`}</dd></div>
                <div><dt>Work time</dt><dd>${contract.instant ? "Immediate small job" : `${contract.durationWeeks ?? 1} week(s)`}</dd></div>
                <div><dt>Active step</dt><dd>${activeWork.label}</dd></div>
                <div><dt>Reward</dt><dd>${dollars(Math.round(contract.reward * derived.standing.rewardMultiplier))}</dd></div>
                <div><dt>Rep gate</dt><dd>${contract.minReputation ?? 0} standing</dd></div>
                <div><dt>Requirement</dt><dd>${escapeHtml(contract.requirementText)}</dd></div>
                <div><dt>Risk</dt><dd>${escapeHtml(contract.risk ?? contract.consequence)}</dd></div>
                <div><dt>Where</dt><dd>${escapeHtml(LOCATIONS.find((location) => location.id === contract.locationId)?.name ?? "Contract Board")}</dd></div>
                <div><dt>If ignored</dt><dd>${escapeHtml(contract.failureReason ?? contract.consequence ?? "The job expires and standing suffers.")}</dd></div>
              </dl>
              <p class="next-step"><strong>Next Step:</strong> ${escapeHtml(contractNextStep(state, contract))}</p>
              ${["accepted", "in_progress", "ready_to_complete"].includes(contract.status) && (contract.weeksLeft ?? 99) <= 1 ? `<p class="debt-warning">Deadline next week. This will fail if the current step is not handled.</p>` : ""}
              <div class="button-row">
                ${contract.status === "available" ? button("accept-contract", `Accept Contract - ${workSlotText(0)}`, { variant: "gold", data: { contractId: contract.id } }) : ""}
                ${contract.status === "accepted" ? button("perform-contract-action", `${activeContractActionLabel(contract)} - ${activeWork.label}`, { variant: "gold", disabled: activeWork.disabled, title: activeWork.reason, data: { contractId: contract.id } }) : ""}
                ${contract.status === "in_progress" ? button("complete-contract", "In Progress", { disabled: true, data: { contractId: contract.id } }) : ""}
                ${contract.status === "ready_to_complete" ? button("complete-contract", `Complete Contract - ${workSlotText(0)}`, { variant: "gold", data: { contractId: contract.id } }) : ""}
                ${["accepted", "in_progress", "ready_to_complete"].includes(contract.status) ? button("abandon-contract", `Abandon Contract - ${workSlotText(0)}`, { variant: "warning", data: { contractId: contract.id } }) : ""}
              </div>
            </article>
          `;
        })
        .join("") || `<article class="ledger-card"><p>No open board work this week. Low standing or bad timing can make the phone quiet.</p></article>`}
    </div>
  `;
}

function renderMap(app) {
  const state = app.game;
  return `
    <section class="screen-head">
      <p class="eyebrow">Ash Creek County</p>
      <h2>Locations</h2>
      <p>Visit places for jobs, market decisions, repairs, salvage, debt, and local relationships. The map is worn paper, but the consequences are current.</p>
    </section>
    <section class="county-map-panel">
      ${artImage(COUNTY_MAP_ART, "Illustrated Ash Creek County road map placeholder", "county-map-art")}
      ${LOCATIONS.map((location) => mapNode(location, state.currentLocationId)).join("")}
    </section>
    <div class="map-grid">
      ${LOCATIONS.map(
        (location) => `
          <article class="ledger-card location-card">
            <p class="eyebrow">${escapeHtml(location.type)}</p>
            <h3>${escapeHtml(location.name)}</h3>
            <p>${escapeHtml(location.description)}</p>
            <p class="muted">${location.npcIds.map((id) => NPCS[id]?.name).filter(Boolean).join(", ") || "No one waiting, just the work."}</p>
            ${button("visit-location", `Visit ${location.name}`, { variant: state.currentLocationId === location.id ? "active" : "", data: { locationId: location.id } })}
          </article>
        `
      ).join("")}
    </div>
  `;
}

function renderLocation(app) {
  const state = app.game;
  const location = selectors(state).currentLocation;
  return `
    ${locationHero(location.id, location.name, location.description, location.type)}
    <div class="split">
      <section>
        <h3>People Here</h3>
        <div class="stack">
          ${
            location.npcIds.length
              ? location.npcIds
                  .map((id) => {
                    const npc = NPCS[id];
                    // The face matches the greeting: same warmth tier the
                    // spoken line is drawn from.
                    return `
                      <article class="dialogue-card">
                        ${portrait(id, npc.name, "portrait-image", npcWarmthTier(state, id))}
                        <div class="dialogue-copy">
                          <div class="card-title"><h4>${escapeHtml(npc.name)}</h4><span>Relationship ${state.relationships[id] ?? 0}</span></div>
                          <p class="muted">${escapeHtml(npc.role)}</p>
                          <blockquote>${escapeHtml(npc.dialogue)}</blockquote>
                          <p>${escapeHtml(npc.interaction)}</p>
                          ${button("talk-npc", `Talk with ${npc.name} - ${workSlotText(0)}`, { variant: "gold", data: { npcId: id } })}
                        </div>
                      </article>
                    `;
                  })
                  .join("")
              : `<article class="ledger-card"><p>No one is waiting here. The place still matters.</p></article>`
          }
        </div>
      </section>
      <section>
        <h3>Useful Work</h3>
        <div class="button-grid">
          ${location.actions.includes("dashboard") ? button("screen", "Open Farm Ledger", { data: { screen: "dashboard" } }) : ""}
          ${location.actions.includes("fields") ? button("screen", "Manage Fields", { data: { screen: "fields" } }) : ""}
          ${location.actions.includes("equipment") ? button("screen", "Open Machine Shed", { data: { screen: "equipment" } }) : ""}
          ${location.actions.includes("contracts") ? button("screen", "View Contract Board", { data: { screen: "contracts" } }) : ""}
          ${location.actions.includes("market") ? button("screen", "Sell at Grain Elevator", { data: { screen: "market" } }) : ""}
          ${location.actions.includes("salvage") ? button("screen", "Walk Gus's Yard", { data: { screen: "salvage" } }) : ""}
          ${location.actions.includes("bank") ? button("screen", "Review Debt at Bank", { data: { screen: "bank" } }) : ""}
          ${button("screen", "Back to County Map", { variant: "ghost", data: { screen: "map" } })}
        </div>
      </section>
    </div>
  `;
}

function renderBank(app) {
  const state = app.game;
  const derived = selectors(state);
  return `
    ${locationHero("bank", "Ash Creek Savings", "Earl can work with honest numbers. Credit keeps work moving, but the note follows every decision.")}
    <div class="card-grid three">
      <article class="ledger-card stat">${icon("cash")}<h3>Cash</h3><strong>${dollars(state.financials.cash)}</strong></article>
      <article class="ledger-card stat">${icon("debt")}<h3>Total Debt</h3><strong>${dollars(state.financials.debt)}</strong></article>
      <article class="ledger-card stat">${icon("credit")}<h3>Credit Remaining</h3><strong>${dollars(derived.creditRemaining)}</strong></article>
    </div>
    <article class="detail-panel compact-panel">
      <h3>Bank Terms</h3>
      <p><strong>${escapeHtml(derived.standing.label)}</strong>: ${escapeHtml(derived.standing.summary)}.</p>
      <p>Effective operating line: ${dollars(derived.effectiveCreditLimit)}. Base line: ${dollars(state.financials.creditLimit)}.</p>
    </article>
    ${derived.warnings.length ? `<div class="warning-list">${derived.warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>` : ""}
    <article class="detail-panel">
      <h3>Bank Actions</h3>
      <div class="button-grid">
        ${button("pay-debt", `Pay $250 Toward Debt - ${workSlotText(0)}`, { data: { amount: 250 } })}
        ${button("pay-debt", `Pay $500 Toward Debt - ${workSlotText(0)}`, { data: { amount: 500 } })}
        ${button("draw-credit", `Draw $500 Operating Credit - ${workSlotText(0)}`, { variant: "warning", data: { amount: 500 } })}
        ${button("draw-credit", `Draw $1,000 Operating Credit - ${workSlotText(0)}`, { variant: "warning", data: { amount: 1000 } })}
      </div>
    </article>
    <section>
      <h3>Long-Term Progression</h3>
      <div class="card-grid two">
        ${derived.progressionUpgrades
          .map((upgrade) => {
            const purchased = derived.purchasedUpgrades.includes(upgrade.id);
            const locked = state.reputation < upgrade.reputationRequired;
            const upgradeCost = getProgressionCost(state, upgrade);
            return `
              <article class="ledger-card">
                <p class="eyebrow">${escapeHtml(upgrade.type)}</p>
                <div class="card-title"><h4>${escapeHtml(upgrade.title)}</h4><span>${dollars(upgradeCost)}</span></div>
                <p>${escapeHtml(upgrade.description)}</p>
                <p class="muted">${escapeHtml(upgrade.benefit)}</p>
                <p class="muted">Requires standing ${upgrade.reputationRequired}.</p>
                ${button("purchase-progression", purchased ? "Purchased" : locked ? "Standing Too Low" : `Purchase - ${dollars(upgradeCost)}, ${workSlotText(0)}`, {
                  variant: purchased ? "active" : locked ? "ghost" : "gold",
                  disabled: purchased || locked,
                  data: { upgradeId: upgrade.id }
                })}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function locationHero(locationId, title, description, eyebrow = "Ash Creek County") {
  return `
    <section class="world-hero location-hero">
      ${artImage(locationArtFor(locationId), `${title} location placeholder`)}
      <div class="hero-scrim"></div>
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
    </section>
  `;
}

function mapNode(location, currentLocationId) {
  const [x, y] = MAP_NODE_POSITIONS[location.id] ?? [50, 50];
  const label = location.name.replace("Ash Creek ", "").replace(" / Bank", "");
  return `
    <button class="map-node ${currentLocationId === location.id ? "selected" : ""}" style="--x:${x}%; --y:${y}%;" data-action="visit-location" data-location-id="${escapeHtml(location.id)}">
      <span class="map-pin"></span>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(location.type)}</small>
    </button>
  `;
}

function renderReport(app) {
  const report = app.game.lastReport;
  const isEndYear = app.game.flags?.endOfYearReady || app.game.time.week >= app.game.time.maxWeeks;
  return `
    <section class="screen-head">
      <p class="eyebrow">${isEndYear ? "End-of-Year Report" : "End-of-Period Report"}</p>
      <h2>${escapeHtml(report.title)}</h2>
      <p>What changed, what hurt, and what the ledger says now.</p>
    </section>
    <article class="detail-panel report">
      ${report.entries.map((entry) => `<p>${escapeHtml(entry)}</p>`).join("")}
      <div class="button-row">
        ${
          isEndYear
            ? button("continue-year", `Continue to Year ${app.game.time.year + 1}`, { variant: "gold" })
            : button("screen", `Start Week ${app.game.time.week}`, { variant: "gold", data: { screen: "dashboard" } })
        }
        ${isEndYear ? button("screen", "Return to Menu", { variant: "ghost", data: { screen: "menu" } }) : ""}
        ${button("save-game", "Save Game")}
      </div>
    </article>
    <section>
      <h3>Recent Ledger Notes</h3>
      <div class="log-list">
        ${app.game.log.slice(0, 12).map((entry) => `<p><span>Week ${entry.week}</span>${escapeHtml(entry.message)}</p>`).join("")}
      </div>
    </section>
  `;
}

function renderMenu(app) {
  return `
    <section class="screen-head">
      <p class="eyebrow">Pause Menu</p>
      <h2>Farm Menu</h2>
      <p>Save, load, adjust settings, or start fresh.</p>
    </section>
    <article class="detail-panel">
      <div class="button-grid">
        ${button("save-game", "Save Game", { variant: "gold" })}
        ${button("load-game", "Load Saved Farm")}
        ${button("screen", "Settings", { data: { screen: "settings" } })}
        ${button("new-game", "New Game", { variant: "warning" })}
        ${button("screen", "Back to Farm Ledger", { variant: "ghost", data: { screen: "dashboard" } })}
      </div>
    </article>
  `;
}

function renderSettings(app) {
  return `
    <section class="screen-head">
      <p class="eyebrow">Settings</p>
      <h2>Ledger Preferences</h2>
      <p>Readable type and restrained motion. Nothing fancy.</p>
    </section>
    <article class="detail-panel">
      ${settingsControls(app)}
      <div class="button-row">
        ${button("save-settings", "Save Settings", { variant: "gold" })}
        ${button("screen", "Back to Menu", { variant: "ghost", data: { screen: "menu" } })}
      </div>
    </article>
  `;
}

function settingsControls(app) {
  return `
    <form class="settings-form">
      <label>
        Type size
        <select data-setting="fontScale">
          <option value="normal" ${app.settings.fontScale === "normal" ? "selected" : ""}>Normal</option>
          <option value="large" ${app.settings.fontScale === "large" ? "selected" : ""}>Large</option>
        </select>
      </label>
      <label class="check-row">
        <input type="checkbox" data-setting="reduceMotion" ${app.settings.reduceMotion ? "checked" : ""} />
        Reduce motion
      </label>
      <label class="check-row">
        <input type="checkbox" data-setting="soundMuted" ${app.settings.soundMuted ? "checked" : ""} />
        Mute sound
      </label>
      <label>
        Sound volume
        <input type="range" min="0" max="1" step="0.05" data-setting="soundVolume" value="${Number(app.settings.soundVolume ?? 0.35)}" />
      </label>
    </form>
  `;
}
