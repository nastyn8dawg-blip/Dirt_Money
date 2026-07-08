import {
  BACKGROUNDS,
  CROP_TYPES,
  LOCATIONS,
  NPCS
} from "./data.js";
import {
  dollars,
  expectedYield,
  fieldRecommendation,
  getFertilizeCost,
  getHarvestCost,
  getPlantCost,
  getRepairEstimate,
  getWeedTreatmentCost,
  selectors
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

function portrait(id, name, className = "portrait-image") {
  return artImage(characterArtFor(id), `${name} portrait placeholder`, className);
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
          <span>${icon("reputation")} Standing <strong>${derived.standing.label} ${state.reputation}/100</strong></span>
          <span>${icon("weather")} Week <strong>${state.time.week}/${state.time.maxWeeks}</strong></span>
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
          ${content}
        </main>
      </div>
    </div>
  `;
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
    <div class="title-screen">
      <section class="title-board">
        <p class="eyebrow">Ash Creek County Farm Ledger</p>
        <h1>Dirt Money</h1>
        <p class="lead">Fields, debt, salvage, weather, and county trust. Make practical calls and keep the farm alive.</p>
        <div class="button-row">
          ${button("new-game", "New Game", { variant: "gold" })}
          ${button("load-game", "Load Saved Farm", { disabled: !app.hasSave })}
          ${button("standalone-settings", "Settings", { variant: "ghost" })}
        </div>
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
        <div class="card-grid three">
          ${Object.values(BACKGROUNDS)
            .map(
              (bg) => `
                <article class="ledger-card">
                  ${portrait(bg.id, bg.name, "portrait-image portrait-large")}
                  <h2>${escapeHtml(bg.name)}</h2>
                  <p class="muted">${escapeHtml(bg.subtitle)}</p>
                  <p>${escapeHtml(bg.description)}</p>
                  <p class="rule-text">${escapeHtml(bg.perkText)}</p>
                  ${button("choose-background", `Start as ${bg.name}`, {
                    variant: "gold",
                    data: { backgroundId: bg.id }
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
        <p class="eyebrow">Week ${state.time.week} Home Farm</p>
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
        <article>${icon("reputation")}<span>Rep</span><strong>${state.reputation}/100</strong></article>
      </div>
    </section>
    ${warnings.length ? `<div class="warning-list">${warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>` : ""}
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

function renderFields(app) {
  const { game: state } = app;
  return `
    <section class="screen-head">
      <p class="eyebrow">Home Farm</p>
      <h2>Fields</h2>
      <p>Pick a field, read the condition, and make the cost visible before acting.</p>
    </section>
    <div class="card-grid three">
      ${state.fields
        .map((field) => {
          const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
          const stage = crop ? crop.stages[field.stageIndex] : null;
          return `
            <article class="ledger-card">
              ${artImage(fieldArtFor(field), `${field.name} field condition placeholder`, "field-card-art")}
              <div class="card-title">
                <h3>${escapeHtml(field.name)}</h3>
                <span>${field.acres} acres</span>
              </div>
              <p class="muted">${escapeHtml(field.note)}</p>
              <dl class="mini-ledger">
                <div><dt>Crop</dt><dd>${crop ? escapeHtml(crop.name) : "Fallow"}</dd></div>
                <div><dt>Stage</dt><dd>${stage ? escapeHtml(stage.name) : "Open ground"}</dd></div>
                <div><dt>Condition</dt><dd>${field.condition}%</dd></div>
              </dl>
              ${meter(field.condition, `${field.name} condition`)}
              <p>${escapeHtml(fieldRecommendation(state, field))}</p>
              ${button("select-field", "Open Field Detail", { variant: field.ready ? "gold" : "", data: { fieldId: field.id } })}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
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
          <div><dt>Soil</dt><dd>${field.soil}%</dd></div>
          <div><dt>Fertility</dt><dd>${field.fertility}%</dd></div>
          <div><dt>Weeds</dt><dd>${field.weeds}%</dd></div>
          <div><dt>Stress</dt><dd>${field.stress}%</dd></div>
          <div><dt>Expected yield</dt><dd>${crop ? `${expectedYield(state, field).toLocaleString("en-US")} ${crop.unit}` : "-"}</dd></div>
        </dl>
        <div class="recommendation">
          <strong>Recommendation</strong>
          <p>${escapeHtml(recommendation)}</p>
        </div>
        ${
          field.scoutReport
            ? `<div class="scout-report"><strong>Scout Report</strong><p>${escapeHtml(field.scoutReport)}</p></div>`
            : `<div class="scout-report muted"><strong>Scout Report</strong><p>Unscouted this week. Scout before spending if the field feels uncertain.</p></div>`
        }
      </div>
      <h3>Actions</h3>
      <div class="button-grid">
        ${button("soil-test", `Soil Test - ${dollars(40)}`, { data: { fieldId: field.id } })}
        ${button("scout-field", "Scout Field", { data: { fieldId: field.id } })}
        ${button("fertilize-field", `Fertilize - ${dollars(getFertilizeCost(field))}`, { data: { fieldId: field.id } })}
        ${button("treat-weeds", `Treat Weeds - ${dollars(getWeedTreatmentCost(field))}`, { data: { fieldId: field.id } })}
        ${
          field.ready
            ? canCashHarvest
              ? button("harvest-field", `Harvest - ${dollars(harvestCost)}`, { variant: "gold", data: { fieldId: field.id } })
              : button("harvest-credit", `Harvest on Credit - ${dollars(harvestCost)}`, { variant: "warning", data: { fieldId: field.id } })
            : ""
        }
        ${!field.cropId ? Object.values(CROP_TYPES).map((item) => button("plant-crop", `Plant ${item.name} - ${dollars(getPlantCost(field, item.id))}`, { data: { fieldId: field.id, cropId: item.id } })).join("") : ""}
        ${!field.cropId ? button("leave-fallow", "Leave Fallow / Rest Ground", { data: { fieldId: field.id } }) : ""}
        ${button("screen", "Back to Fields", { variant: "ghost", data: { screen: "fields" } })}
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
              ${button("sell-crop", `Sell All ${crop.name}`, { variant: stored > 0 ? "gold" : "", disabled: stored <= 0, data: { cropId: crop.id } })}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSalvage(app) {
  const { game: state } = app;
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
                  ${button("buy-salvage", `Buy Salvage - ${dollars(item.cost)}`, { variant: "gold", data: { instanceId: item.instanceId } })}
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
                          <div><dt>Sell scrap</dt><dd>about ${dollars(Math.round(item.scrapValue * (0.9 + item.condition / 220)))}</dd></div>
                          <div><dt>Strip</dt><dd>${item.partsYield} part(s)</dd></div>
                          <div><dt>Repair/flip</dt><dd>spend about ${dollars(item.repairCost)} for a chance at ${dollars(item.flipValue)}</dd></div>
                        </dl>
                        <div class="button-grid compact">
                          ${button("sell-salvage", "Sell Scrap", { data: { inventoryId: item.inventoryId } })}
                          ${button("strip-salvage", "Strip for Parts", { data: { inventoryId: item.inventoryId } })}
                          ${button("flip-salvage", "Repair and Flip", { variant: "gold", data: { inventoryId: item.inventoryId } })}
                          ${state.equipment
                            .map((machine) =>
                              button("use-salvage-equipment", `Use on ${machine.name}`, {
                                data: { inventoryId: item.inventoryId, equipmentId: machine.id }
                              })
                            )
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
                ${button("repair-equipment", `Repair with Cash - ${dollars(estimate.cashCost)}`, { data: { equipmentId: machine.id } })}
                ${button("repair-equipment-credit", `Repair on Credit - ${dollars(estimate.creditCost)} financed, includes ${dollars(estimate.premium)} shop/credit premium`, { variant: "warning", data: { equipmentId: machine.id } })}
                ${button("repair-equipment-parts", `Repair with Parts (${state.inventory.parts})`, {
                  disabled: state.inventory.parts <= 0,
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
      <p>Most jobs take at least a week. Accepting work reserves the opportunity, then the weekly report moves it toward completion or failure.</p>
      <p><strong>Standing: ${escapeHtml(derived.standing.label)}</strong> - ${escapeHtml(derived.standing.summary)}.</p>
    </article>
    <div class="card-grid two">
      ${visibleContracts
        .map(
          (contract) => `
            <article class="ledger-card contract ${contract.status}">
              <div class="card-title">
                <h3>${escapeHtml(contract.title)}</h3>
                <span>${escapeHtml(contract.status.replaceAll("_", " "))}</span>
              </div>
              <p class="eyebrow">${escapeHtml(contract.source ?? NPCS[contract.npcId]?.name ?? "County board")}</p>
              <p>${escapeHtml(contract.description)}</p>
              <dl class="mini-ledger">
                <div><dt>Deadline</dt><dd>${["in_progress", "ready_to_complete"].includes(contract.status) ? `${contract.weeksLeft} week(s)` : `${contract.deadlineWeeks} week(s)`}</dd></div>
                <div><dt>Work time</dt><dd>${contract.instant ? "Immediate small job" : `${contract.durationWeeks ?? 1} week(s)`}</dd></div>
                <div><dt>Reward</dt><dd>${dollars(Math.round(contract.reward * derived.standing.rewardMultiplier))}</dd></div>
                <div><dt>Rep gate</dt><dd>${contract.minReputation ?? 0} standing</dd></div>
                <div><dt>Requirement</dt><dd>${escapeHtml(contract.requirementText)}</dd></div>
                <div><dt>Risk</dt><dd>${escapeHtml(contract.risk ?? contract.consequence)}</dd></div>
              </dl>
              <div class="button-row">
                ${contract.status === "available" ? button("accept-contract", "Accept Contract", { variant: "gold", data: { contractId: contract.id } }) : ""}
                ${contract.status === "in_progress" ? button("complete-contract", "In Progress", { disabled: true, data: { contractId: contract.id } }) : ""}
                ${contract.status === "ready_to_complete" ? button("complete-contract", "Complete Contract", { variant: "gold", data: { contractId: contract.id } }) : ""}
              </div>
            </article>
          `
        )
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
                    return `
                      <article class="dialogue-card">
                        ${portrait(id, npc.name)}
                        <div class="dialogue-copy">
                          <div class="card-title"><h4>${escapeHtml(npc.name)}</h4><span>Relationship ${state.relationships[id] ?? 0}</span></div>
                          <p class="muted">${escapeHtml(npc.role)}</p>
                          <blockquote>${escapeHtml(npc.dialogue)}</blockquote>
                          <p>${escapeHtml(npc.interaction)}</p>
                          ${button("talk-npc", `Talk with ${npc.name}`, { variant: "gold", data: { npcId: id } })}
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
        ${button("pay-debt", "Pay $250 Toward Debt", { data: { amount: 250 } })}
        ${button("pay-debt", "Pay $500 Toward Debt", { data: { amount: 500 } })}
        ${button("draw-credit", "Draw $500 Operating Credit", { variant: "warning", data: { amount: 500 } })}
        ${button("draw-credit", "Draw $1,000 Operating Credit", { variant: "warning", data: { amount: 1000 } })}
      </div>
    </article>
    <section>
      <h3>Long-Term Progression</h3>
      <div class="card-grid two">
        ${derived.progressionUpgrades
          .map((upgrade) => {
            const purchased = derived.purchasedUpgrades.includes(upgrade.id);
            const locked = state.reputation < upgrade.reputationRequired;
            return `
              <article class="ledger-card">
                <p class="eyebrow">${escapeHtml(upgrade.type)}</p>
                <div class="card-title"><h4>${escapeHtml(upgrade.title)}</h4><span>${dollars(upgrade.cost)}</span></div>
                <p>${escapeHtml(upgrade.description)}</p>
                <p class="muted">${escapeHtml(upgrade.benefit)}</p>
                <p class="muted">Requires standing ${upgrade.reputationRequired}.</p>
                ${button("purchase-progression", purchased ? "Purchased" : locked ? "Standing Too Low" : `Purchase - ${dollars(upgrade.cost)}`, {
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
  return `
    <section class="screen-head">
      <p class="eyebrow">End-of-Period Report</p>
      <h2>${escapeHtml(report.title)}</h2>
      <p>What changed, what hurt, and what the ledger says now.</p>
    </section>
    <article class="detail-panel report">
      ${report.entries.map((entry) => `<p>${escapeHtml(entry)}</p>`).join("")}
      <div class="button-row">
        ${button("screen", `Start Week ${app.game.time.week}`, { variant: "gold", data: { screen: "dashboard" } })}
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
