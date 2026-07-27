import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  abandonContract,
  acceptContract,
  activeContractActionLabel,
  advanceWeek,
  batchActionPreview,
  basicFieldObservation,
  buySalvage,
  calendarLabel,
  canPerformFieldAction,
  classifySeasonOutcome,
  completeContract,
  continueToNextYear,
  contractNextStep,
  createNewGame,
  drawCredit,
  expectedYield,
  fertilizeField,
  fertilizeRecommendedFields,
  getEffectiveCreditLimit,
  getHarvestCost,
  getPlantCost,
  getProgressionCost,
  getWeeklyPriorities,
  getWeedTreatmentCost,
  harvestField,
  harvestAllReadyFields,
  payDebt,
  performContractAction,
  plantCrop,
  plantingWindowStatus,
  preparednessCap,
  preparednessText,
  purchaseProgression,
  repairAndFlipSalvage,
  repairEquipment,
  getRepairEstimate,
  getWorkSlotCost,
  getWorkStatus,
  generateWeeklyEvents,
  resolveWeeklyEvent,
  rotationOutlook,
  scoutField,
  scoutAllFields,
  sellCrop,
  sellSalvage,
  salvageEquipmentUsePreview,
  soilTestAllUncheckedFields,
  soilTest,
  stressSummary,
  stripSalvage,
  talkToNpc,
  treatWeeds,
  treatAllHighWeedFields,
  useSalvageOnEquipment,
  availableWeeklyEventChoices,
  weedTreatmentProfile,
  weeklyEventChoiceStatus,
  weeklyEventChoiceWorkCost,
  workSlotStatus,
  workSlotText
} from "../src/state.js";
import { BALANCE, CONTRACT_TEMPLATES, CROP_TYPES, PROGRESSION_UPGRADES, SALVAGE_MARKET_TEMPLATES } from "../src/data.js";
import {
  loadGameFromStorage,
  loadSettingsFromStorage,
  saveGameToStorage,
  saveSettingsToStorage
} from "../src/storage.js";
import { renderApp } from "../src/render.js";
import { ART_MANIFEST, allArtAssets, resolveArtAsset } from "../src/artManifest.js";
import { COUNTY_MAP_ART, FARM_OVERVIEW_ART, characterArtFor, fieldArtFor, locationArtFor } from "../src/ui/worldArt.js";
import { BACKGROUNDS, LOCATIONS, NPCS } from "../src/data.js";
import { playSound, soundCueAvailable } from "../src/sound.js";

const REQUIRED_FIELD_VISUAL_KEYS = [
  "rough",
  "prepped",
  "fallow",
  "harvested",
  "corn_planted",
  "corn_emerged",
  "corn_growing",
  "corn_stressed",
  "corn_ready",
  "corn_harvested",
  "soybeans_planted",
  "soybeans_emerged",
  "soybeans_growing",
  "soybeans_stressed",
  "soybeans_ready",
  "soybeans_harvested",
  "hay_growing",
  "hay_stressed",
  "hay_ready_to_cut",
  "hay_cut",
  "hay_baled",
  "hay_harvested",
  "cover_crop_emerged",
  "cover_crop_growing",
  "cover_crop_stressed",
  "cover_crop_terminated"
];

const IMPORTED_FIELD_CONCEPT_KEYS = [
  "rough",
  "prepped",
  "fallow",
  "harvested",
  "corn_planted",
  "corn_emerged",
  "corn_growing",
  "corn_stressed",
  "corn_ready",
  "corn_harvested",
  "soybeans_planted",
  "soybeans_emerged",
  "soybeans_growing",
  "soybeans_stressed",
  "soybeans_ready",
  "soybeans_harvested",
  "hay_growing",
  "hay_stressed",
  "hay_ready_to_cut",
  "hay_cut",
  "hay_baled",
  "hay_harvested",
  "cover_crop_emerged",
  "cover_crop_growing",
  "cover_crop_stressed",
  "cover_crop_terminated"
];

const OPTIONAL_FIELD_OVERLAY_KEYS = [
  "weeds",
  "drought",
  "storm_damage",
  "wet_muddy",
  "poor_fertility",
  "healthy_fertility"
];

const IMPORTED_FIELD_OVERLAY_KEYS = [
  "weeds",
  "drought",
  "storm_damage",
  "wet_muddy",
  "poor_fertility",
  "healthy_fertility"
];

const REQUIRED_NON_FIELD_ART_IDS = [
  "farm.home_overview",
  "farm.dashboard_hero",
  "farm.machine_shed",
  "map.ash_creek_county",
  "location.home_farm",
  "location.pattis_diner",
  "location.ash_creek_coop",
  "location.grain_elevator",
  "location.roys_place",
  "location.gus_yard",
  "location.hollis_place",
  "location.ash_creek_bank",
  "location.grange_hall",
  "location.machine_shed",
  "character.old_school_farmer",
  "character.it_nephew",
  "character.mechanic",
  "character.patti",
  "character.hollis",
  "character.marge",
  "character.earl",
  "character.roy",
  "character.gus",
  "character.dee",
  "character.sandy"
];

const IMPORTED_NON_FIELD_ART_IDS = [
  "farm.home_overview",
  "map.ash_creek_county",
  "location.pattis_diner",
  "location.ash_creek_coop",
  "location.farmers_coop",
  "location.grain_elevator",
  "location.gus_yard",
  "location.guss_yard",
  "location.ash_creek_bank",
  "location.bank",
  "location.machine_shed",
  "character.old_school_farmer",
  "character.old_school",
  "character.it_nephew",
  "character.mechanic",
  "character.patti",
  "character.roy",
  "character.gus",
  "character.dee",
  "character.sandy"
];

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key)
  };
}

function makeWeeklyEvent(game, templateId, choices, extra = {}) {
  return {
    id: `${templateId}_test`,
    templateId,
    category: extra.category ?? "community",
    locationId: extra.locationId ?? "home_farm",
    source: extra.source ?? "Ash Creek",
    sourcePerson: extra.source ?? "Ash Creek",
    urgency: extra.urgency ?? "Medium",
    week: game.time.week,
    weekGenerated: game.time.week,
    year: game.time.year,
    title: extra.title ?? templateId.replaceAll("_", " "),
    message: extra.message ?? "Test event message.",
    effectSummary: extra.effectSummary ?? "Test effect.",
    visibleConsequence: extra.visibleConsequence ?? "Visible consequence.",
    expiresWeek: game.time.week + 1,
    resultText: null,
    seen: false,
    resolved: false,
    appearsInReport: true,
    handled: false,
    expired: false,
    choices
  };
}

function generatedWeeklyEvent(templateId, configure) {
  for (let seed = 1; seed <= 3000; seed += 1) {
    const game = createNewGame("old_school");
    game.seed = seed;
    configure(game);
    game.weeklyEvents = generateWeeklyEvents(game);
    const event = game.weeklyEvents.find((item) => item.templateId === templateId);
    if (event) return { game, event };
  }
  assert.fail(`Could not generate ${templateId} with supplied state.`);
}

function forceWeather(game, id, name = id) {
  game.weather = { id, name, weed: 0, fertility: 0, stress: 0, note: "" };
}

function marketSalvage(templateId, instanceId = `${templateId}_test_market`) {
  const template = SALVAGE_MARKET_TEMPLATES.find((item) => item.id === templateId);
  assert.ok(template, `Missing salvage template ${templateId}`);
  return {
    ...template,
    instanceId,
    condition: template.condition,
    cost: template.cost,
    flipValue: template.flipValue
  };
}

function sellAllStoredCrops(game) {
  let next = game;
  for (const cropId of Object.keys(CROP_TYPES)) {
    if ((next.inventory.crops[cropId] ?? 0) > 0) {
      const sold = sellCrop(next, cropId);
      next = sold.state;
    }
  }
  return next;
}

function buyAffordableUpgrades(game) {
  let next = game;
  for (const upgrade of PROGRESSION_UPGRADES) {
    if ((next.progression?.upgrades ?? []).includes(upgrade.id)) continue;
    if (next.reputation < upgrade.reputationRequired) continue;
    if (next.financials.cash < getProgressionCost(next, upgrade)) continue;
    const purchased = purchaseProgression(next, upgrade.id);
    if (purchased.ok) next = purchased.state;
  }
  return next;
}

function runEconomyScenario(style) {
  let game = createNewGame(style === "salvage-heavy" ? "mechanic" : "old_school");
  game.seed = {
    normal: 4101,
    aggressive: 4102,
    poor: 4103,
    "contract-heavy": 4104,
    "salvage-heavy": 4105
  }[style];
  game.weeklyEvents = [];

  function step() {
    if (style !== "poor") {
      const soil = soilTestAllUncheckedFields(game);
      if (soil.ok) game = soil.state;
      const fert = fertilizeRecommendedFields(game);
      if (fert.ok) game = fert.state;
      const weed = treatAllHighWeedFields(game);
      if (weed.ok) game = weed.state;
    }

    if (style === "contract-heavy" || style === "aggressive") {
      for (const contract of game.contracts.filter((item) => item.status === "available").slice(0, 2)) {
        const accepted = acceptContract(game, contract.id);
        if (accepted.ok) game = accepted.state;
      }
      for (const contract of game.contracts.filter((item) => item.status === "accepted")) {
        const worked = performContractAction(game, contract.id);
        if (worked.ok) game = worked.state;
      }
      for (const contract of game.contracts.filter((item) => item.status === "ready_to_complete")) {
        const completed = completeContract(game, contract.id);
        if (completed.ok) game = completed.state;
      }
    }

    if (style === "salvage-heavy" || style === "aggressive") {
      const item = game.salvageYard[0];
      if (item) {
        const bought = buySalvage(game, item.instanceId);
        if (bought.ok) {
          game = bought.state;
          const owned = game.inventory.salvage[0];
          if (owned) {
            const stripped = stripSalvage(game, owned.inventoryId);
            if (stripped.ok) game = stripped.state;
          }
        }
      }
    }

    if (style !== "poor") {
      for (const field of game.fields.filter((item) => !item.cropId).slice(0, 2)) {
        const planted = plantCrop(game, field.id, style === "aggressive" ? "corn" : "soybeans");
        if (planted.ok) game = planted.state;
      }
      const harvested = harvestAllReadyFields(game);
      if (harvested.ok) game = harvested.state;
      game = sellAllStoredCrops(game);
    }

    if (style === "aggressive") game = buyAffordableUpgrades(game);
  }

  for (let week = 1; week < game.time.maxWeeks; week += 1) {
    step();
    game.weeklyEvents = [];
    const advanced = advanceWeek(game);
    game = advanced.state;
    game.weeklyEvents = [];
  }
  step();
  game = sellAllStoredCrops(game);

  return {
    style,
    cash: game.financials.cash,
    debt: game.financials.debt,
    creditUsed: game.financials.creditUsed,
    reputation: game.reputation,
    upgradesPurchased: game.progression.upgrades.length,
    fields: game.fields.length,
    equipmentCondition: game.equipment.map((item) => item.condition),
    contractsCompleted: game.stats.contractsCompleted,
    cropIncome: game.stats.cropIncome,
    salvageParts: game.inventory.parts
  };
}

test("new game creates required farm systems", () => {
  const game = createNewGame("mechanic");

  assert.equal(game.player.backgroundName, "Mechanic");
  assert.equal(game.fields.length >= 3, true);
  assert.equal(game.equipment.length >= 3, true);
  assert.equal(game.contracts.length >= 5, true);
  assert.equal(game.salvageYard.length >= 3, true);
  assert.equal(typeof game.financials.cash, "number");
});

test("ready crop can be harvested on credit when cash is negative", () => {
  const game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "corn";
  field.stageIndex = CROP_TYPES.corn.stages.length - 1;
  field.ready = true;
  field.condition = 70;
  game.financials.cash = -125;
  const startingDebt = game.financials.debt;

  const result = harvestField(game, field.id, { useCredit: true });

  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash, -125);
  assert.equal(result.state.financials.debt > startingDebt, true);
  assert.equal(result.state.inventory.crops.corn > 0, true);
  assert.match(result.message, /credit/i);
});

test("ready crop can be harvested with cash without using credit", () => {
  const game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "soybeans";
  field.stageIndex = CROP_TYPES.soybeans.stages.length - 1;
  field.ready = true;
  field.condition = 72;
  game.financials.cash = 5000;
  const startingCredit = game.financials.creditUsed;
  const startingCash = game.financials.cash;

  const result = harvestField(game, field.id);

  assert.equal(result.ok, true);
  assert.equal(result.state.financials.creditUsed, startingCredit);
  assert.equal(result.state.financials.cash < startingCash, true);
  assert.equal(result.state.inventory.crops.soybeans > 0, true);
});

test("salvage purchase has a clear non-dead-end strip outcome", () => {
  const game = createNewGame("mechanic");
  const marketItem = game.salvageYard[0];
  const bought = buySalvage(game, marketItem.instanceId);
  assert.equal(bought.ok, true);
  assert.equal(bought.state.inventory.salvage.length, 1);

  const owned = bought.state.inventory.salvage[0];
  const stripped = stripSalvage(bought.state, owned.inventoryId);

  assert.equal(stripped.ok, true);
  assert.equal(stripped.state.inventory.salvage.length, 0);
  assert.equal(stripped.state.inventory.parts >= game.inventory.parts + owned.partsYield, true);
});

test("salvage can be used directly on equipment", () => {
  const game = createNewGame("mechanic");
  const bought = buySalvage(game, game.salvageYard[0].instanceId);
  const owned = bought.state.inventory.salvage[0];
  const target = bought.state.equipment.find((item) => item.id === owned.helps[0]);
  const before = target.condition;
  const preview = salvageEquipmentUsePreview(bought.state, owned.inventoryId, target.id);
  assert.equal(preview.ok, true);
  assert.equal(preview.previousCondition, before);
  assert.equal(preview.repairAmount > 0, true);

  const used = useSalvageOnEquipment(bought.state, owned.inventoryId, target.id);

  assert.equal(used.ok, true);
  assert.equal(used.previousCondition, before);
  assert.equal(used.newCondition, before + used.repairAmount);
  assert.match(used.message, new RegExp(`from ${before}% to ${used.newCondition}%`));
  assert.equal(used.salvageConsumed, true);
  assert.equal(used.state.inventory.salvage.length, 0);
  assert.equal(used.state.equipment.find((item) => item.id === target.id).condition > before, true);
  assert.equal(used.state.work.remaining, BALANCE.defaultWorkSlots - 2);
});

test("compatible salvage visibly improves the Faded Gleaner and survives save/load", () => {
  let game = createNewGame("mechanic");
  game.salvageYard = [marketSalvage("combine_belt_lot")];
  const bought = buySalvage(game, "combine_belt_lot_test_market");
  assert.equal(bought.ok, true);
  game = bought.state;
  const owned = game.inventory.salvage[0];
  const combine = game.equipment.find((item) => item.id === "combine");
  combine.condition = 42;

  const preview = salvageEquipmentUsePreview(game, owned.inventoryId, "combine");
  assert.equal(preview.ok, true);
  assert.equal(preview.machineName, "Faded Gleaner Combine");
  assert.equal(preview.previousCondition, 42);
  assert.equal(preview.newCondition, 56);
  assert.equal(preview.repairAmount, 14);

  const used = useSalvageOnEquipment(game, owned.inventoryId, "combine");
  assert.equal(used.ok, true);
  assert.equal(used.state.equipment.find((item) => item.id === "combine").condition, 56);
  assert.equal(used.state.inventory.salvage.some((item) => item.inventoryId === owned.inventoryId), false);
  assert.equal(used.state.work.remaining, BALANCE.defaultWorkSlots - 2);
  assert.match(used.message, /Faded Gleaner Combine.*from 42% to 56%/);

  const storage = memoryStorage();
  saveGameToStorage(storage, used.state, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.equipment.find((item) => item.id === "combine").condition, 56);
  assert.equal(loaded.inventory.salvage.some((item) => item.inventoryId === owned.inventoryId), false);
});

test("incompatible salvage cannot be used on the wrong equipment", () => {
  let game = createNewGame("mechanic");
  game.salvageYard = [marketSalvage("truck_axle")];
  game = buySalvage(game, "truck_axle_test_market").state;
  const owned = game.inventory.salvage[0];
  const combineBefore = game.equipment.find((item) => item.id === "combine").condition;
  const workBefore = game.work.remaining;

  const preview = salvageEquipmentUsePreview(game, owned.inventoryId, "combine");
  assert.equal(preview.ok, false);
  assert.equal(preview.compatible, false);
  assert.match(preview.disabledReason, /cannot help Faded Gleaner/i);

  const used = useSalvageOnEquipment(game, owned.inventoryId, "combine");
  assert.equal(used.ok, false);
  assert.match(used.message, /cannot help Faded Gleaner/i);
  assert.equal(used.state.equipment.find((item) => item.id === "combine").condition, combineBefore);
  assert.equal(used.state.inventory.salvage.length, 1);
  assert.equal(used.state.work.remaining, workBefore);
});

test("direct salvage use caps equipment condition at 100", () => {
  let game = createNewGame("mechanic");
  game.salvageYard = [marketSalvage("combine_belt_lot")];
  game = buySalvage(game, "combine_belt_lot_test_market").state;
  const owned = game.inventory.salvage[0];
  game.equipment.find((item) => item.id === "combine").condition = 96;

  const preview = salvageEquipmentUsePreview(game, owned.inventoryId, "combine");
  assert.equal(preview.ok, true);
  assert.equal(preview.repairAmount, 4);
  assert.equal(preview.newCondition, 100);

  const used = useSalvageOnEquipment(game, owned.inventoryId, "combine");
  assert.equal(used.ok, true);
  assert.equal(used.state.equipment.find((item) => item.id === "combine").condition, 100);
});

test("salvage UI shows projected direct-use repair and disabled incompatible choices", () => {
  const game = createNewGame("mechanic");
  game.salvageYard = [];
  game.inventory.salvage = [
    {
      ...marketSalvage("combine_belt_lot", "owned-combine-belt"),
      inventoryId: "owned-combine-belt",
      acquiredWeek: game.time.week
    }
  ];
  game.equipment.find((item) => item.id === "combine").condition = 38;
  const html = renderApp({
    game,
    screen: "salvage",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });

  assert.match(html, /Compatible<\/dt><dd>Faded Gleaner Combine/);
  assert.match(html, /Use on Faded Gleaner Combine - \+14 condition, 1 work slot/);
  assert.match(html, /Faded Gleaner Combine: 38% -&gt; 52%/);
  assert.match(html, /Use on 1978 Row-Crop Tractor - Not compatible/);
});

test("salvage can be sold for cash", () => {
  const game = createNewGame("mechanic");
  const bought = buySalvage(game, game.salvageYard[0].instanceId);
  const owned = bought.state.inventory.salvage[0];
  const cashBeforeSale = bought.state.financials.cash;

  const sold = sellSalvage(bought.state, owned.inventoryId);

  assert.equal(sold.ok, true);
  assert.equal(sold.state.inventory.salvage.length, 0);
  assert.equal(sold.state.financials.cash > cashBeforeSale, true);
});

test("salvage can be repaired and flipped without leaving inventory dead ends", () => {
  const game = createNewGame("mechanic");
  const bought = buySalvage(game, game.salvageYard[0].instanceId);
  const owned = bought.state.inventory.salvage[0];

  const flipped = repairAndFlipSalvage(bought.state, owned.inventoryId);

  assert.equal(flipped.ok, true);
  assert.equal(flipped.state.inventory.salvage.length, 0);
  assert.equal(flipped.state.financials.income > bought.state.financials.income, true);
});

test("stripped salvage parts still repair equipment", () => {
  const game = createNewGame("mechanic");
  game.inventory.parts = 3;
  game.equipment.find((item) => item.id === "combine").condition = 40;
  const estimate = getRepairEstimate(game, "combine", { useParts: true });
  const beforeParts = game.inventory.parts;

  const repaired = repairEquipment(game, "combine", { useParts: true });

  assert.equal(repaired.ok, true);
  assert.equal(repaired.state.inventory.parts, beforeParts - estimate.partsUsed);
  assert.equal(repaired.state.equipment.find((item) => item.id === "combine").condition > 40, true);
  assert.match(repaired.message, /salvage part/i);
});

test("crop can be planted, advanced, harvested, and sold", () => {
  let game = createNewGame("old_school");
  let result = plantCrop(game, "south_40", "winter_wheat");
  assert.equal(result.ok, true);
  game = result.state;

  for (let i = 0; i < 7; i += 1) {
    result = advanceWeek(game);
    game = result.state;
  }

  const field = game.fields.find((item) => item.id === "south_40");
  assert.equal(field.ready, true);

  result = harvestField(game, "south_40", { useCredit: true });
  if (!result.ok && /too wet/i.test(result.message)) {
    game = advanceWeek(game).state;
    result = harvestField(game, "south_40", { useCredit: true });
  }
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.inventory.crops.winter_wheat > 0, true);

  const cashBeforeSale = game.financials.cash;
  result = sellCrop(game, "winter_wheat");
  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash > cashBeforeSale, true);
});

test("contracts can be accepted and completed with rewards", () => {
  let game = createNewGame("old_school");
  let result = acceptContract(game, "hollis_hay");
  assert.equal(result.ok, true);
  game = result.state;
  result = completeContract(game, "hollis_hay");
  assert.equal(result.ok, false);
  assert.match(result.message, /active step|Cut Hay/i);

  result = performContractAction(game, "hollis_hay");
  assert.equal(result.ok, true);
  assert.equal(result.state.contracts.find((item) => item.id === "hollis_hay").status, "in_progress");
  game = result.state;
  result = advanceWeek(game);
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.contracts.find((item) => item.id === "hollis_hay").status, "ready_to_complete");
  const cashBefore = game.financials.cash;

  result = completeContract(game, "hollis_hay");

  assert.equal(result.ok, true);
  assert.equal(result.state.contracts.find((item) => item.id === "hollis_hay").status, "completed");
  assert.equal(result.state.financials.cash > cashBefore, true);
  assert.equal(result.state.reputation > game.reputation, true);
});

test("accepted contracts expire and affect reputation when ignored", () => {
  let game = createNewGame("old_school");
  let result = acceptContract(game, "coop_delivery");
  assert.equal(result.ok, true);
  game = result.state;
  const reputationBefore = game.reputation;

  result = advanceWeek(game);
  result = advanceWeek(result.state);

  const expired = result.state.contracts.find((item) => item.id === "coop_delivery");
  assert.equal(expired.status, "failed");
  assert.equal(result.state.reputation < reputationBefore, true);
  assert.equal(result.state.lastReport.entries.some((entry) => entry.includes("expired")), true);
});

test("completed contracts leave the board and fresh contracts appear", () => {
  let game = createNewGame("old_school");
  let result = acceptContract(game, "grange_supper");
  assert.equal(result.ok, true);
  result = performContractAction(result.state, "grange_supper");
  assert.equal(result.ok, true);
  result = completeContract(result.state, "grange_supper");
  assert.equal(result.ok, true);
  game = result.state;
  const completedId = "grange_supper";

  for (let i = 0; i < BALANCE.contractArchiveWeeks; i += 1) {
    game = advanceWeek(game).state;
  }

  const archived = game.contracts.find((contract) => contract.id === completedId);
  assert.equal(archived.status, "archived");
  assert.equal(game.contracts.some((contract) => contract.status === "available" && contract.id !== completedId), true);
  assert.equal(game.lastReport.entries.some((entry) => /New contract posted|left the active contract board/.test(entry)), true);
});

test("contract board refreshes over time without allowing every job to be instant", () => {
  let game = createNewGame("old_school");
  const startingAvailable = game.contracts.filter((contract) => contract.status === "available").length;
  const delivery = acceptContract(game, "coop_delivery").state;
  const immediate = completeContract(delivery, "coop_delivery");
  assert.equal(immediate.ok, false);
  assert.match(immediate.message, /active step|Haul Seed/i);

  game = delivery;
  game.nextContractRefreshWeek = 2;
  game.contracts
    .filter((contract) => contract.status === "available")
    .forEach((contract) => {
      contract.status = "archived";
    });
  const advanced = advanceWeek(game).state;

  assert.equal(advanced.contracts.filter((contract) => contract.status === "available").length > 0, true);
  assert.equal(advanced.contracts.length > game.contracts.length, true);
  assert.equal(startingAvailable >= 3, true);
});

test("contract templates require active steps and cannot duplicate rewards", () => {
  for (const template of CONTRACT_TEMPLATES) {
    let game = createNewGame("mechanic");
    game.reputation = 100;
    game.financials.cash = 10000;
    game.inventory.parts = 10;
    for (const machine of game.equipment) machine.condition = 90;
    game.contracts = [
      {
        ...template,
        templateId: template.id,
        status: "available",
        weeksLeft: template.deadlineWeeks,
        issueWeek: game.time.week,
        acceptedWeek: null,
        readyWeek: null,
        deadlineWeek: null,
        completedWeek: null,
        failedWeek: null,
        workStartedWeek: null,
        workCostPaid: false,
        choiceNote: null
      }
    ];

    const accepted = acceptContract(game, template.id);
    assert.equal(accepted.ok, true, template.id);
    const active = accepted.state.contracts[0];
    assert.match(contractNextStep(accepted.state, active), /./);
    assert.match(active.activeActionLabel ?? "", /./);
    assert.equal(active.deadlineWeek > accepted.state.time.week, true);

    const immediate = completeContract(accepted.state, template.id);
    assert.equal(immediate.ok, false, `${template.id} completed immediately after accept`);

    const acted = performContractAction(accepted.state, template.id);
    assert.equal(acted.ok, true, template.id);
    assert.equal(acted.state.work.remaining < accepted.state.work.remaining, true);

    let readyState = acted.state;
    if (!template.instant) readyState = advanceWeek(readyState).state;
    const completed = completeContract(readyState, template.id);
    assert.equal(completed.ok, true, template.id);
    const cashAfterReward = completed.state.financials.cash;
    const duplicate = completeContract(completed.state, template.id);
    assert.equal(duplicate.ok, false, `${template.id} paid twice`);
    assert.equal(duplicate.state.financials.cash, cashAfterReward);
  }
});

test("equipment repair can use credit when cash is insufficient", () => {
  const game = createNewGame("mechanic");
  game.financials.cash = 0;
  const machine = game.equipment.find((item) => item.id === "combine");
  machine.condition = 20;

  const result = repairEquipment(game, "combine", { useCredit: true });

  assert.equal(result.ok, true);
  assert.equal(result.state.equipment.find((item) => item.id === "combine").condition > 20, true);
  assert.equal(result.state.financials.creditUsed > 0, true);
});

test("equipment repair with cash subtracts cash and does not use credit", () => {
  const game = createNewGame("old_school");
  const machine = game.equipment.find((item) => item.id === "combine");
  machine.condition = 20;
  game.financials.cash = 5000;
  const estimate = getRepairEstimate(game, "combine");
  const result = repairEquipment(game, "combine");

  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash, game.financials.cash - estimate.cashCost);
  assert.equal(result.state.financials.creditUsed, game.financials.creditUsed);
  assert.equal(result.state.financials.debt, game.financials.debt);
});

test("repair on credit does not subtract cash and explains financed premium", () => {
  const game = createNewGame("old_school");
  const machine = game.equipment.find((item) => item.id === "combine");
  machine.condition = 20;
  game.financials.cash = 5000;
  const estimate = getRepairEstimate(game, "combine");
  const result = repairEquipment(game, "combine", { useCredit: true });

  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash, game.financials.cash);
  assert.equal(result.state.financials.creditUsed, game.financials.creditUsed + estimate.creditCost);
  assert.equal(result.state.financials.debt, game.financials.debt + estimate.creditCost);
  assert.match(result.message, new RegExp(`${estimate.creditCost.toLocaleString("en-US")}`));
  assert.match(result.message, /premium/i);
});

test("repair on credit label matches actual financed behavior", () => {
  const game = createNewGame("old_school");
  const machine = game.equipment.find((item) => item.id === "tractor");
  machine.condition = 25;
  const estimate = getRepairEstimate(game, "tractor");
  const html = renderApp({
    game,
    screen: "equipment",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });

  assert.equal(html.includes(`Repair on Credit - $${estimate.creditCost.toLocaleString("en-US")} financed`), true);
  assert.equal(html.includes(`includes $${estimate.premium.toLocaleString("en-US")} shop/credit premium`), true);
});

test("bank credit draw and debt payment update cash, debt, and credit", () => {
  let game = createNewGame("old_school");
  const startingDebt = game.financials.debt;

  let result = drawCredit(game, 500);
  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash, game.financials.cash + 500);
  assert.equal(result.state.financials.debt, startingDebt + 500);
  assert.equal(result.state.financials.creditUsed, 500);

  game = result.state;
  result = payDebt(game, 250);
  assert.equal(result.ok, true);
  assert.equal(result.state.financials.debt, game.financials.debt - 250);
  assert.equal(result.state.financials.creditUsed, 250);
});

test("negative cash can recover after financed harvest and crop sale", () => {
  let game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "corn";
  field.stageIndex = CROP_TYPES.corn.stages.length - 1;
  field.ready = true;
  field.condition = 78;
  game.financials.cash = -350;

  let result = harvestField(game, field.id, { useCredit: true });
  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash, -350);
  assert.equal(result.state.inventory.crops.corn > 0, true);

  result = sellCrop(result.state, "corn");
  assert.equal(result.ok, true);
  assert.equal(result.state.financials.cash > 0, true);
});

test("multi-turn field, finance, equipment, and report values stay sane", () => {
  let game = createNewGame("it_nephew");
  for (const field of game.fields) {
    const result = plantCrop(game, field.id, "winter_wheat");
    assert.equal(result.ok, true);
    game = result.state;
  }

  for (let i = 0; i < 10; i += 1) {
    const result = advanceWeek(game);
    assert.equal(result.ok, true);
    game = result.state;
  }

  assert.equal(Number.isFinite(game.financials.cash), true);
  assert.equal(Number.isFinite(game.financials.debt), true);
  assert.equal(game.financials.creditUsed <= game.financials.creditLimit, true);
  assert.equal(game.lastReport.entries.length > 0, true);
  for (const field of game.fields) {
    assert.equal(field.condition >= 0 && field.condition <= 100, true);
    assert.equal(field.fertility >= 0 && field.fertility <= 100, true);
    assert.equal(field.weeds >= 0 && field.weeds <= 100, true);
    assert.equal(field.stress >= 0 && field.stress <= 100, true);
  }
  for (const machine of game.equipment) {
    assert.equal(machine.condition >= 0 && machine.condition <= 100, true);
  }
});

test("early economy sanity keeps first harvest from erasing all pressure", () => {
  let game = createNewGame("old_school");
  for (const field of game.fields) {
    const planted = plantCrop(game, field.id, "winter_wheat");
    assert.equal(planted.ok, true);
    game = planted.state;
  }

  for (let i = 0; i < 7; i += 1) {
    game = advanceWeek(game).state;
  }

  for (const field of game.fields.filter((item) => item.ready)) {
    let harvested = harvestField(game, field.id, { useCredit: true });
    let attempts = 0;
    while (!harvested.ok && /too wet|work slots/i.test(harvested.message) && attempts < 3) {
      game = advanceWeek(game).state;
      harvested = harvestField(game, field.id, { useCredit: true });
      attempts += 1;
    }
    assert.equal(harvested.ok, true);
    game = harvested.state;
  }

  for (const cropId of Object.keys(CROP_TYPES)) {
    if (game.inventory.crops[cropId] > 0) game = sellCrop(game, cropId).state;
  }

  assert.equal(game.financials.cash < game.financials.debt, true);
  assert.equal(game.financials.cash < 25000, true);
  assert.equal(game.financials.debt > 25000, true);
});

test("year-one economy scenarios keep work-slot pressure and upgrade pacing", () => {
  const scenarios = ["normal", "aggressive", "poor", "contract-heavy", "salvage-heavy"].map(runEconomyScenario);
  assert.equal(scenarios.length, 5);

  for (const summary of scenarios) {
    assert.equal(Number.isFinite(summary.cash), true, summary.style);
    assert.equal(Number.isFinite(summary.debt), true, summary.style);
    assert.equal(summary.cash < 50000, true, summary.style);
    assert.equal(summary.debt >= 0, true, summary.style);
    assert.equal(summary.reputation >= 0 && summary.reputation <= 100, true, summary.style);
    assert.equal(summary.equipmentCondition.every((condition) => condition >= 0 && condition <= 100), true, summary.style);
  }

  const aggressive = scenarios.find((item) => item.style === "aggressive");
  const normal = scenarios.find((item) => item.style === "normal");
  const poor = scenarios.find((item) => item.style === "poor");
  const contractHeavy = scenarios.find((item) => item.style === "contract-heavy");
  const salvageHeavy = scenarios.find((item) => item.style === "salvage-heavy");

  assert.equal(aggressive.upgradesPurchased <= PROGRESSION_UPGRADES.length, true);
  assert.equal(normal.upgradesPurchased < PROGRESSION_UPGRADES.length, true);
  assert.equal(poor.upgradesPurchased, 0);
  assert.equal(aggressive.debt + aggressive.creditUsed > 0, true);
  assert.equal(contractHeavy.contractsCompleted > 0, true);
  assert.equal(contractHeavy.contractsCompleted >= poor.contractsCompleted, true);
  assert.equal(salvageHeavy.salvageParts > poor.salvageParts, true);
  assert.equal(poor.cropIncome, 0);
});

test("ready crops lose condition when left through storm weather", () => {
  let stormResult = null;
  for (let seed = 1; seed < 500; seed += 1) {
    const game = createNewGame("old_school");
    game.seed = seed;
    const field = game.fields[0];
    field.cropId = "corn";
    field.stageIndex = CROP_TYPES.corn.stages.length - 1;
    field.ready = true;
    field.condition = 80;
    field.stress = 20;
    const result = advanceWeek(game);
    if (result.state.weather.id === "storm_line") {
      stormResult = { before: field, result };
      break;
    }
  }

  assert.ok(stormResult, "Expected to find a deterministic storm seed");
  const afterField = stormResult.result.state.fields[0];
  assert.equal(afterField.condition < 80, true);
  assert.equal(stormResult.result.state.lastReport.entries.some((entry) => entry.includes("Expected yield slipped")), true);
});

test("scouting records actionable field knowledge in state and UI", () => {
  const game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "corn";
  field.weeds = 58;
  field.fertility = 39;
  field.stress = 64;
  const result = scoutField(game, field.id);

  assert.equal(result.ok, true);
  const scouted = result.state.fields.find((item) => item.id === field.id);
  assert.equal(scouted.scouted, true);
  assert.match(scouted.scoutReport, /weed|Fertility|Stress|yield/i);
  assert.match(result.message, /Scout found|Expected yield/i);

  const html = renderApp({
    game: result.state,
    screen: "field",
    selectedFieldId: field.id,
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Scout Report/);
  assert.match(html, /Treating this week|Fertility is the limiting factor|Stress is high/);
});

test("soil test charges once, records useful durable advice, and blocks current repeats", () => {
  let game = createNewGame("old_school");
  const fieldId = "south_40";
  const cashBefore = game.financials.cash;

  let result = soilTest(game, fieldId);

  assert.equal(result.ok, true);
  game = result.state;
  const tested = game.fields.find((field) => field.id === fieldId);
  assert.equal(game.financials.cash, cashBefore - BALANCE.soilTestCost);
  assert.equal(tested.soilTestKnown, true);
  assert.equal(tested.lastSoilTestWeek, game.time.week);
  assert.match(tested.soilRecommendation, /corn|soybeans|cover crop|fertilizer|cash/i);
  assert.match(result.message, /soil test complete/i);

  result = soilTest(game, fieldId);
  assert.equal(result.ok, false);
  assert.equal(result.state.financials.cash, game.financials.cash);
  assert.match(result.message, /already current/i);

  game = result.state;
  game.time.week += BALANCE.soilTestValidityWeeks;
  result = soilTest(game, fieldId);
  assert.equal(result.ok, true);
  assert.equal(result.state.fields.find((field) => field.id === fieldId).lastSoilTestWeek, game.time.week);
});

test("soil test produces structured decision guidance and persists", () => {
  let game = createNewGame("old_school");
  game.fields[2].fertility = 35;
  game.fields[2].soil = 45;
  const result = soilTest(game, "hill_patch");
  assert.equal(result.ok, true);
  assert.equal(result.suppressNotice, true);
  assert.equal(result.result.kind, "soil-test");

  const tested = result.state.fields.find((field) => field.id === "hill_patch");
  assert.equal(tested.soilTestResult.fertilityRating, "Poor");
  assert.equal(tested.soilTestResult.soilHealth, "Thin");
  assert.match(tested.soilTestResult.fertilizerRoi, /Low|High|Medium|None/i);
  assert.match(tested.soilTestResult.bestCropFit, /Hay|cover crop|soybeans/i);
  assert.match(tested.soilTestResult.recommendation, /Do not sink expensive corn|cover crop|soybeans/i);
  assert.match(tested.soilTestResult.nextSeasonNote, /Rebuild|next year/i);
  assert.match(tested.soilTestResult.interpretation, /Old School read/i);

  const storage = memoryStorage();
  saveGameToStorage(storage, result.state, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.fields.find((field) => field.id === "hill_patch").soilTestResult.fertilityRating, "Poor");
});

test("it nephew soil test gets ROI-oriented interpretation", () => {
  const game = createNewGame("it_nephew");
  const result = soilTest(game, "south_40");
  assert.equal(result.ok, true);
  assert.match(result.state.fields[0].soilTestResult.interpretation, /Data read/i);
  assert.match(result.state.fields[0].soilTestResult.fertilizerRoi, /ROI|Medium|Low|High|None/i);
});

test("soil test all produces readable structured summary", () => {
  const game = createNewGame("old_school");
  const result = soilTestAllUncheckedFields(game);
  assert.equal(result.ok, true);
  assert.equal(result.suppressNotice, true);
  assert.equal(result.result.kind, "soil-test-all");
  assert.equal(result.result.fields.length, game.fields.length);
  assert.match(result.result.fields[0].summary, /fertility/i);
  assert.match(result.message, /Review the soil-test summary/i);
});

test("soil test UI uses structured card and avoids duplicate notice", () => {
  const game = soilTest(createNewGame("old_school"), "south_40").state;
  const html = renderApp({
    game,
    screen: "field",
    selectedFieldId: "south_40",
    notice: null,
    resultCard: {
      title: "Soil Test Result",
      message: "South 40 soil test complete.",
      type: "success",
      details: { kind: "soil-test", field: game.fields[0].soilTestResult }
    },
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });

  assert.match(html, /soil-result-card/);
  assert.match(html, /Fertilizer ROI/);
  assert.match(html, /Best Fit/);
  assert.match(html, /Recommended action/);
  assert.doesNotMatch(html, /<div class="notice/);
});

test("ready-stage yield locks and late inputs cannot boost harvest", () => {
  let game = createNewGame("old_school");
  let planted = plantCrop(game, "south_40", "winter_wheat");
  assert.equal(planted.ok, true);
  game = planted.state;

  for (let i = 0; i < 7; i += 1) game = advanceWeek(game).state;
  let field = game.fields.find((item) => item.id === "south_40");
  assert.equal(field.ready, true);
  assert.equal(field.yieldLocked, true);
  const lockedYield = field.lockedYield;

  const fertilized = fertilizeField(game, field.id);
  assert.equal(fertilized.ok, false);
  assert.match(fertilized.message, /will not pay this late|Yield is mostly set/i);
  assert.equal(fertilized.state.fields.find((item) => item.id === field.id).lockedYield, lockedYield);

  const sprayed = treatWeeds(game, field.id);
  assert.equal(sprayed.ok, false);
  assert.match(sprayed.message, /ready|will not recover yield/i);
  assert.equal(sprayed.state.fields.find((item) => item.id === field.id).lockedYield, lockedYield);
});

test("fertilizer and weed treatment help eligible crops but cannot stack in the same week", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 5000;
  game = plantCrop(game, "south_40", "corn").state;
  let field = game.fields.find((item) => item.id === "south_40");
  field.fertility = 35;
  field.weeds = 62;
  field.stress = 22;
  const fertilityBefore = field.fertility;
  const weedsBefore = field.weeds;
  const stressBefore = field.stress;

  let result = fertilizeField(game, field.id);
  assert.equal(result.ok, true);
  game = result.state;
  field = game.fields.find((item) => item.id === "south_40");
  assert.equal(field.fertility > fertilityBefore, true);

  result = fertilizeField(game, field.id);
  assert.equal(result.ok, false);
  assert.match(result.message, /already applied/i);

  result = treatWeeds(game, field.id);
  assert.equal(result.ok, true);
  game = result.state;
  field = game.fields.find((item) => item.id === "south_40");
  assert.equal(field.weeds < weedsBefore, true);
  assert.equal(field.stress <= stressBefore, true);

  result = treatWeeds(game, field.id);
  assert.equal(result.ok, false);
  assert.match(result.message, /already applied this week/i);
});

test("repeated NPC dialogue cannot farm infinite relationship or reputation rewards", () => {
  let game = createNewGame("old_school");
  const startMarge = game.relationships.marge;

  let result = talkToNpc(game, "marge");
  assert.equal(result.ok, true);
  game = result.state;
  const afterFirstMarge = game.relationships.marge;
  result = talkToNpc(game, "marge");
  assert.equal(result.ok, true);
  assert.equal(result.state.relationships.marge, afterFirstMarge);
  assert.match(result.message, /already got this week's practical help/i);
  assert.equal(afterFirstMarge, startMarge + 2);

  game = createNewGame("old_school");
  const reputationBefore = game.reputation;
  result = talkToNpc(game, "sandy");
  assert.equal(result.ok, true);
  game = result.state;
  const reputationAfterFirst = game.reputation;
  result = talkToNpc(game, "sandy");
  assert.equal(result.ok, true);
  assert.equal(result.state.reputation, reputationAfterFirst);
  assert.equal(reputationAfterFirst, reputationBefore + 2);
});

test("contract cards expose next steps and Marge seed delivery explains failure", () => {
  let game = createNewGame("old_school");
  const contract = game.contracts.find((item) => item.id === "coop_delivery");
  assert.match(contractNextStep(game, contract), /grain truck|Marge|seed/i);

  let result = acceptContract(game, "coop_delivery");
  assert.equal(result.ok, true);
  assert.match(result.message, /Next step/i);
  game = result.state;

  const html = renderApp({
    game,
    screen: "contracts",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Next Step/);
  assert.match(html, /Marge|seed route|grain truck/i);

  game = advanceWeek(game).state;
  game = advanceWeek(game).state;
  const failed = game.contracts.find((item) => item.id === "coop_delivery");
  assert.equal(failed.status, "failed");
  assert.match(failed.failureMessage, /seed route/i);
  assert.equal(game.lastReport.entries.some((entry) => /Failed because/i.test(entry)), true);
});

test("equipment upgrade purchase is saved, cannot repeat, and changes costs", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 1000;
  game.reputation = 70;
  const field = game.fields[0];
  field.weeds = 70;
  const beforeCost = getWeedTreatmentCost(game, field);

  let result = purchaseProgression(game, "better_sprayer");
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.progression.upgrades.includes("better_sprayer"), true);
  assert.equal(game.financials.creditUsed > 0, true);
  assert.equal(getWeedTreatmentCost(game, field) < beforeCost, true);

  result = purchaseProgression(game, "better_sprayer");
  assert.equal(result.ok, false);
  assert.match(result.message, /already done/i);

  const storage = memoryStorage();
  saveGameToStorage(storage, game);
  assert.equal(loadGameFromStorage(storage).progression.upgrades.includes("better_sprayer"), true);
});

test("crop rotation tracks previous crop and old school farmer gets clearer advantage", () => {
  let game = createNewGame("it_nephew");
  let field = game.fields.find((item) => item.id === "south_40");
  field.previousCropId = "corn";
  field.fertility = 60;
  field.stress = 20;
  let result = plantCrop(game, field.id, "corn");
  assert.equal(result.ok, true);
  let plantedField = result.state.fields.find((item) => item.id === field.id);
  const itFertilityAfterCornRepeat = plantedField.fertility;
  assert.equal(plantedField.fertility < 60, true);
  assert.equal(plantedField.rotationNote.includes("Tired Ground"), true);

  game = createNewGame("old_school");
  game.time.week = 5;
  field = game.fields.find((item) => item.id === "south_40");
  field.previousCropId = "corn";
  field.fertility = 60;
  field.stress = 20;
  result = plantCrop(game, field.id, "corn");
  plantedField = result.state.fields.find((item) => item.id === field.id);
  assert.equal(plantedField.fertility > itFertilityAfterCornRepeat, true);
  assert.match(rotationOutlook(game, field, "corn").recommendation, /Old School/i);

  game = createNewGame("old_school");
  game.time.week = 5;
  field = game.fields.find((item) => item.id === "south_40");
  field.previousCropId = "cover_crop";
  field.fertility = 45;
  result = plantCrop(game, field.id, "soybeans");
  plantedField = result.state.fields.find((item) => item.id === field.id);
  assert.equal(plantedField.fertility > 45 - BALANCE.seedFertilityImpact, true);
  assert.match(result.message, /Cover Crop Benefit|Good/i);
});

test("calendar, end-of-year report, and next-year continuation are clear", () => {
  let game = createNewGame("old_school");
  assert.match(calendarLabel(game), /Year 1 - Week 1 - Early Spring/);
  for (let i = 0; i < game.time.maxWeeks - 1; i += 1) {
    game = advanceWeek(game).state;
  }
  assert.equal(game.time.week, game.time.maxWeeks);
  assert.equal(game.flags.endOfYearReady, true);
  assert.match(game.lastReport.title, /End-of-Year 1/);

  const report = advanceWeek(game);
  assert.equal(report.ok, true);
  assert.match(report.state.lastReport.title, /End-of-Year 1/);
  assert.equal(report.state.lastReport.entries.some((entry) => /Cash|Debt|Net position|Contracts/.test(entry)), true);

  const continued = continueToNextYear(report.state);
  assert.equal(continued.ok, true);
  assert.equal(continued.state.time.year, 2);
  assert.equal(continued.state.time.week, 1);
  assert.match(calendarLabel(continued.state), /Year 2 - Week 1 - Early Spring/);
});

test("priorities guidance panel responds to ready crop, urgent contract, machines, and soil tests", () => {
  let game = createNewGame("old_school");
  game.fields[0].cropId = "corn";
  game.fields[0].ready = true;
  game.fields[0].yieldLocked = true;
  game.fields[0].lockedYield = 1000;
  game.equipment[0].condition = 30;
  game = acceptContract(game, "coop_delivery").state;
  const contract = game.contracts.find((item) => item.id === "coop_delivery");
  contract.weeksLeft = 1;
  const priorities = getWeeklyPriorities(game);

  assert.equal(priorities.some((item) => /ready/i.test(item.text)), true);
  assert.equal(priorities.some((item) => /deadline|Marge|Contract/i.test(item.text)), true);
  assert.equal(priorities.some((item) => /Repair|condition|machine/i.test(item.text)), true);
  assert.equal(priorities.some((item) => /soil test/i.test(item.text)), true);

  const html = renderApp({
    game,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /This Week's Priorities/);
});

test("weekly event inbox is generated and event choices apply effects", () => {
  let game = createNewGame("old_school");
  assert.equal(game.weeklyEvents.length >= 1, true);
  assert.equal(game.weeklyEvents.length <= 3, true);
  assert.equal(game.weeklyEvents.every((event) => event.title && event.source && event.category && event.expiresWeek && event.choices?.length), true);

  game.reputation = 92;
  game.flags.highRepOpportunityAcknowledged = false;
  game.weeklyEvents = generateWeeklyEvents(game);
  const trusted = game.weeklyEvents.find((event) => event.templateId === "trusted_county");
  assert.ok(trusted);

  const result = resolveWeeklyEvent(game, trusted.id, "talk_terms");
  assert.equal(result.ok, true);
  assert.equal(result.state.flags.highRepOpportunityAcknowledged, true);
  assert.equal(result.state.currentLocationId, "hollis_place");
  assert.equal(result.state.weeklyEvents.find((event) => event.id === trusted.id).handled, true);
  assert.equal(result.state.weeklyEvents.find((event) => event.id === trusted.id).resolved, true);
});

test("weekly event cards expose category, deadline, consequence, and work slot cost", () => {
  const game = createNewGame("old_school");
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "marge_grange_request",
      [{ id: "help_setup", label: "Help Set Up", workCost: 1, summary: "Spend supplies, reputation +3.", consequence: "+3 reputation." }],
      {
        title: "Marge Needs Grange Help",
        source: "Marge",
        category: "community",
        visibleConsequence: "Community work competes with farm work."
      }
    )
  ];

  const html = renderApp({
    game,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });

  assert.match(html, /community \/ Marge/);
  assert.match(html, /End of Week 2/);
  assert.match(html, /Community work competes/);
  assert.match(html, /Help Set Up - 1 work slot/);
});

test("week 1 rain events do not offer ready-crop choices when no crops are ready", () => {
  const { game, event } = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 1;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    for (const field of game.fields) {
      field.cropId = null;
      field.ready = false;
    }
  });

  const allLabels = game.weeklyEvents.flatMap((item) => item.choices.map((choice) => choice.label)).join(" ");
  assert.doesNotMatch(allLabels, /Check Ready Crops|Push Harvest/i);
  assert.match(event.message, /Planting|low fields|wet/i);
  assert.equal(event.choices.some((choice) => choice.id === "walk_low_ground" || choice.id === "delay_planting"), true);
});

test("heavy rain choices adapt to no crop, growing crop, late canopy, and ready crop", () => {
  const noCrop = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 1;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    for (const field of game.fields) {
      field.cropId = null;
      field.ready = false;
    }
  }).event;
  assert.deepEqual(noCrop.choices.map((choice) => choice.id), ["walk_low_ground", "delay_planting", "check_equipment_indoors", "wait"]);

  const growing = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 3;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    game.fields[0].cropId = "corn";
    game.fields[0].stageIndex = 1;
    game.fields[0].ready = false;
    game.fields[0].weeds = 62;
  }).event;
  assert.equal(growing.choices.some((choice) => choice.id === "check"), false);
  assert.equal(growing.choices.some((choice) => choice.id === "watch_weeds"), true);
  assert.equal(growing.choices.some((choice) => choice.id === "delay_spraying"), true);

  const lateCanopy = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 6;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    game.fields[0].cropId = "corn";
    game.fields[0].stageIndex = 3;
    game.fields[0].ready = false;
    game.fields[0].weeds = 74;
  }).event;
  assert.equal(lateCanopy.choices.some((choice) => choice.id === "check_canopy"), true);
  assert.equal(lateCanopy.choices.some((choice) => choice.id === "delay_spraying"), false);
  assert.doesNotMatch(lateCanopy.choices.map((choice) => choice.label).join(" "), /Spray/i);

  const ready = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 12;
    game.reputation = 20;
    game.financials.cash = 20000;
    forceWeather(game, "storm_line", "Storm Line");
    game.fields[0].cropId = "corn";
    game.fields[0].stageIndex = CROP_TYPES.corn.stages.length - 1;
    game.fields[0].ready = true;
    game.fields[0].yieldLocked = true;
    game.fields[0].lockedYield = 900;
  }).event;
  assert.equal(ready.choices.some((choice) => choice.id === "check"), true);
  assert.equal(ready.choices.some((choice) => choice.id === "push_harvest"), true);
});

test("invalid stale weekly event choices are hidden and cannot spend work slots", () => {
  const game = createNewGame("old_school");
  forceWeather(game, "soaking_rain", "Soaking Rain");
  for (const field of game.fields) {
    field.cropId = null;
    field.ready = false;
  }
  const event = makeWeeklyEvent(
    game,
    "heavy_rain_ready_crop",
    [{ id: "check", label: "Check Ready Crops", workCost: 1, summary: "Ready fields get a quick scout note." }],
    { title: "Heavy Rain Coming", source: "Weather Radio", category: "weather" }
  );
  game.weeklyEvents = [event];

  const status = weeklyEventChoiceStatus(game, event, event.choices[0]);
  assert.equal(status.hidden, true);
  assert.match(status.reason, /No ready crops/i);
  assert.equal(availableWeeklyEventChoices(game, event).length, 0);

  const result = resolveWeeklyEvent(game, event.id, "check");
  assert.equal(result.ok, false);
  assert.match(result.message, /No ready crops/i);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots);
});

test("work-slot rain choices produce useful field-condition feedback", () => {
  const { game, event } = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 1;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    for (const field of game.fields) {
      field.cropId = null;
      field.ready = false;
    }
  });

  const result = resolveWeeklyEvent(game, event.id, "walk_low_ground");
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - 1);
  assert.match(result.message, /soft|planting|early stress/i);
  assert.equal(result.state.fields.find((field) => field.id === "creek_bottom").scouted, true);
});

test("dry stretch events do not damage nonexistent crops", () => {
  const { game, event } = generatedWeeklyEvent("dry_stretch", (game) => {
    game.time.week = 1;
    game.reputation = 20;
    forceWeather(game, "hot_wind", "Hot South Wind");
    for (const field of game.fields) {
      field.cropId = null;
      field.ready = false;
    }
  });
  const beforeStress = game.fields.map((field) => field.stress);
  assert.equal(event.choices.some((choice) => choice.id === "water"), false);

  const result = resolveWeeklyEvent(game, event.id, "wait_for_rain");
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.fields.map((field) => field.stress), beforeStress);
  assert.match(result.message, /no crop planted|did not damage yield/i);
});

test("save and load preserve context-safe active weekly events", () => {
  const { game, event } = generatedWeeklyEvent("heavy_rain_ready_crop", (game) => {
    game.time.week = 1;
    game.reputation = 20;
    forceWeather(game, "soaking_rain", "Soaking Rain");
    for (const field of game.fields) {
      field.cropId = null;
      field.ready = false;
    }
  });
  assert.equal(event.choices.some((choice) => choice.label === "Check Ready Crops"), false);

  const storage = memoryStorage();
  saveGameToStorage(storage, game, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  const loadedEvent = loaded.weeklyEvents.find((item) => item.templateId === "heavy_rain_ready_crop");
  assert.ok(loadedEvent);
  assert.equal(availableWeeklyEventChoices(loaded, loadedEvent).some((choice) => choice.label === "Check Ready Crops"), false);
});

test("weather and neighbor weekly event choices change fields and reputation", () => {
  let game = createNewGame("old_school");
  game.fields[0].cropId = "corn";
  game.fields[0].stageIndex = 1;
  game.fields[0].stress = 45;
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "dry_stretch",
      [{ id: "save_cash", label: "Save Cash", workCost: 0, summary: "Standing crop stress +3." }],
      { title: "Dry Stretch Settled In", source: "Weather Radio", category: "weather" }
    )
  ];
  let result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "save_cash");
  assert.equal(result.ok, true);
  assert.equal(result.state.fields[0].stress, 48);
  assert.equal(result.state.events[0].category, "weather");

  game = createNewGame("old_school");
  const reputationBefore = game.reputation;
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "marge_grange_request",
      [{ id: "help_setup", label: "Help Set Up", workCost: 1, summary: "Spend supplies, reputation +3." }],
      { title: "Marge Needs Grange Help", source: "Marge", category: "community" }
    )
  ];
  result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "help_setup");
  assert.equal(result.ok, true);
  assert.equal(result.state.reputation, reputationBefore + 3);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - 1);
  const reported = advanceWeek(result.state);
  assert.equal(reported.state.lastReport.entries.some((entry) => /Marge Needs Grange Help resolved|Grange supper/i.test(entry)), true);
});

test("bank, salvage, and equipment weekly events react to farm state", () => {
  let game = createNewGame("old_school");
  game.financials.debt = 52000;
  game.financials.creditUsed = 12000;
  game.reputation = 72;
  const creditBefore = game.financials.creditLimit;
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "payment_pressure",
      [{ id: "review_terms", label: "Review Terms", workCost: 0, summary: "High reputation improves credit limit." }],
      { title: "Payment Pressure", source: "Ash Creek Savings", category: "bank" }
    )
  ];
  let result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "review_terms");
  assert.equal(result.ok, true);
  assert.equal(result.state.flags.bankNote, true);
  assert.equal(result.state.financials.creditLimit, creditBefore + 250);

  game = createNewGame("mechanic");
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "gus_questionable_deal",
      [{ id: "inspect", label: "Inspect The Deal", workCost: 1, summary: "Spend $80; chance at salvage." }],
      { title: "Questionable Deal Behind Gus's Shed", source: "Gus", category: "salvage" }
    )
  ];
  const yardBefore = game.salvageYard.length;
  result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "inspect");
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - 1);
  assert.equal(result.state.salvageYard.length >= yardBefore, true);

  game = createNewGame("old_school");
  game.equipment[0].condition = 25;
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "breakdown_risk",
      [{ id: "quick_fix", label: "Quick Fix", workCost: 1, summary: "Spend $120, roughest machine +8." }],
      { title: "Breakdown Risk", source: "Machine Shed", category: "equipment" }
    )
  ];
  result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "quick_fix");
  assert.equal(result.ok, true);
  assert.equal(result.state.equipment[0].condition > 25, true);
});

test("expired weekly events resolve safely and appear in the report", () => {
  let game = createNewGame("old_school");
  game.fields[0].cropId = "corn";
  game.fields[0].stageIndex = 1;
  game.fields[0].stress = 30;
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "dry_stretch",
      [{ id: "water", label: "Run Water Where You Can", workCost: 1, summary: "Spend $65." }],
      { title: "Dry Stretch Settled In", source: "Weather Radio", category: "weather" }
    )
  ];

  const result = advanceWeek(game);
  assert.equal(result.ok, true);
  const expiredEvent = result.state.events.find((event) => event.type === "weekly_expired" && event.id === "dry_stretch");
  assert.ok(expiredEvent);
  assert.match(expiredEvent.note, /dry stretch|drought/i);
  assert.equal(result.state.fields[0].stressHistory.some((entry) => /dry weather/i.test(entry.cause)), true);
  assert.equal(result.state.lastReport.entries.some((entry) => /dry stretch|drought/i.test(entry)), true);
});

test("high reputation and used equipment events create better opportunities", () => {
  let game = createNewGame("old_school");
  game.reputation = 92;
  game.flags.highRepOpportunityAcknowledged = false;
  game.weeklyEvents = generateWeeklyEvents(game);
  assert.equal(game.weeklyEvents.some((event) => ["lease_opportunity", "trusted_county"].includes(event.templateId)), true);

  game = createNewGame("old_school");
  game.reputation = 45;
  const sprayerUpgrade = {
    id: "better_sprayer",
    title: "Better Pull-Type Sprayer",
    type: "Equipment upgrade",
    cost: 2100,
    reputationRequired: 30
  };
  const normalCost = getProgressionCost(game, sprayerUpgrade);
  game.weeklyEvents = [
    makeWeeklyEvent(
      game,
      "used_equipment_lead",
      [{ id: "inspect_lead", label: "Inspect Lead", workCost: 1, summary: "Equipment upgrades cheaper." }],
      { title: "Used Equipment Lead", source: "Roy", category: "equipment" }
    )
  ];
  const result = resolveWeeklyEvent(game, game.weeklyEvents[0].id, "inspect_lead");
  assert.equal(result.ok, true);
  assert.equal(result.state.flags.usedEquipmentLeadWeek, result.state.time.week);
  assert.equal(getProgressionCost(result.state, sprayerUpgrade) < normalCost, true);
});

test("severe storm weekly events are rare and gated", () => {
  let earlySevere = false;
  let laterSevere = 0;
  for (let seed = 1; seed <= 300; seed += 1) {
    const early = createNewGame("old_school");
    early.seed = seed;
    early.time.week = 4;
    early.weather = { id: "storm_line", name: "Storm Line", weed: 0, fertility: 0, note: "" };
    if (generateWeeklyEvents(early).some((event) => event.templateId === "severe_storm_line")) earlySevere = true;

    const later = createNewGame("old_school");
    later.seed = seed;
    later.time.week = 12;
    later.weather = { id: "storm_line", name: "Storm Line", weed: 0, fertility: 0, note: "" };
    if (generateWeeklyEvents(later).some((event) => event.templateId === "severe_storm_line")) laterSevere += 1;
  }

  assert.equal(earlySevere, false);
  assert.equal(laterSevere > 0, true);
  assert.equal(laterSevere < 90, true);
});

test("active contract actions are required before contract progress", () => {
  let game = createNewGame("old_school");
  let result = acceptContract(game, "coop_delivery");
  assert.equal(result.ok, true);
  game = result.state;
  const accepted = game.contracts.find((contract) => contract.id === "coop_delivery");
  assert.equal(accepted.status, "accepted");
  assert.equal(activeContractActionLabel(accepted), "Haul Seed");
  assert.match(contractNextStep(game, accepted), /Haul Seed|Marge/i);

  result = advanceWeek(game);
  assert.equal(result.state.contracts.find((contract) => contract.id === "coop_delivery").status, "accepted");

  result = performContractAction(game, "coop_delivery");
  assert.equal(result.ok, true);
  assert.equal(result.state.contracts.find((contract) => contract.id === "coop_delivery").status, "in_progress");
  assert.equal(result.state.financials.cash < game.financials.cash, true);
});

test("work slots start each week, reset on advance, and survive save/load", () => {
  let game = createNewGame("old_school");
  assert.equal(getWorkStatus(game).slotsPerWeek, BALANCE.defaultWorkSlots);
  assert.equal(getWorkStatus(game).remaining, BALANCE.defaultWorkSlots);

  const planted = plantCrop(game, "south_40", "corn");
  assert.equal(planted.ok, true);
  game = planted.state;
  assert.equal(game.work.remaining, BALANCE.defaultWorkSlots - 1);
  assert.equal(game.work.used, 1);

  const storage = memoryStorage();
  saveGameToStorage(storage, game);
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.work.remaining, game.work.remaining);
  assert.equal(loaded.work.used, game.work.used);

  const advanced = advanceWeek(loaded);
  assert.equal(advanced.ok, true);
  assert.equal(advanced.state.work.remaining, BALANCE.defaultWorkSlots);
  assert.equal(advanced.state.work.used, 0);
  assert.equal(advanced.state.lastReport.entries.some((entry) => /work capacity|New week reset/i.test(entry)), true);
});

test("field actions and repairs consume slots and disable when insufficient", () => {
  let game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "corn";
  field.stageIndex = CROP_TYPES.corn.stages.length - 1;
  field.ready = true;
  field.yieldLocked = true;
  field.lockedYield = 1000;

  let result = harvestField(game, field.id, { useCredit: true });
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - getWorkSlotCost("harvest-field"));

  game = createNewGame("old_school");
  game.equipment.find((item) => item.id === "tractor").condition = 30;
  result = repairEquipment(game, "tractor");
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - getWorkSlotCost("repair-equipment"));

  game = createNewGame("old_school");
  const blockedField = game.fields[0];
  blockedField.cropId = "soybeans";
  blockedField.stageIndex = CROP_TYPES.soybeans.stages.length - 1;
  blockedField.ready = true;
  game.work.remaining = 1;
  game.work.used = 4;
  const status = canPerformFieldAction(blockedField, "harvest-field", game);
  assert.equal(status.allowed, false);
  assert.match(status.reason, /needs 2 work slots|only 1 work slot/i);
  result = harvestField(game, blockedField.id, { useCredit: true });
  assert.equal(result.ok, false);
  assert.match(result.message, /work slots/i);
});

test("batch actions consume combined work slots and block impossible weeks", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 20000;
  for (const field of game.fields.slice(0, 2)) {
    field.cropId = "winter_wheat";
    field.stageIndex = CROP_TYPES.winter_wheat.stages.length - 1;
    field.ready = true;
    field.yieldLocked = true;
    field.lockedYield = 600;
  }

  let preview = batchActionPreview(game, "harvest-all");
  assert.equal(preview.workCost, 4);
  let result = harvestAllReadyFields(game);
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, 1);

  game = createNewGame("old_school");
  game.financials.cash = 20000;
  for (const field of game.fields) {
    field.cropId = "winter_wheat";
    field.stageIndex = CROP_TYPES.winter_wheat.stages.length - 1;
    field.ready = true;
    field.yieldLocked = true;
    field.lockedYield = 600;
  }
  preview = batchActionPreview(game, "harvest-all");
  assert.equal(preview.workCost, 6);
  assert.match(preview.workWarning, /only 5 work slots/i);
  result = harvestAllReadyFields(game);
  assert.equal(result.ok, false);
  assert.match(result.message, /work slots/i);
});

test("unused work does not fully carry over by default", () => {
  let game = createNewGame("old_school");
  game.work.remaining = 3;
  game.work.used = 2;
  const advanced = advanceWeek(game);
  assert.equal(advanced.ok, true);
  assert.equal(advanced.state.work.remaining, BALANCE.defaultWorkSlots);
  assert.equal(advanced.state.work.banked, 0);
  assert.equal(preparednessCap(advanced.state), 0);
  assert.equal(advanced.state.lastReport.entries.some((entry) => /did not carry over|New week reset/i.test(entry)), true);
});

test("preparedness cap banks limited unused work and prevents stockpiling", () => {
  let game = createNewGame("old_school");
  game.progression.upgrades.push("farm_office");
  game.work.remaining = 5;
  game.work.used = 0;
  let advanced = advanceWeek(game);
  assert.equal(advanced.state.work.banked, 1);
  assert.equal(advanced.state.work.remaining, BALANCE.defaultWorkSlots + 1);
  assert.equal(advanced.state.lastReport.entries.some((entry) => /banked as preparedness/i.test(entry)), true);
  assert.equal(advanced.state.lastReport.entries.some((entry) => /unused work was lost/i.test(entry)), true);

  game = advanced.state;
  game.work.remaining = 6;
  game.work.used = 0;
  advanced = advanceWeek(game);
  assert.equal(advanced.state.work.banked, 1);
  assert.equal(advanced.state.work.remaining, BALANCE.defaultWorkSlots + 1);
});

test("banked preparedness can be spent next week and survives save/load", () => {
  let game = createNewGame("it_nephew");
  assert.equal(preparednessCap(game), 1);
  game.financials.cash = 20000;
  game.work.remaining = 1;
  game.work.used = 4;
  game = advanceWeek(game).state;
  assert.equal(game.work.banked, 1);
  assert.equal(game.work.remaining, 6);
  assert.match(preparednessText(game), /Preparedness \+1 \/ cap 1/);

  for (const field of game.fields) {
    field.cropId = "winter_wheat";
    field.stageIndex = CROP_TYPES.winter_wheat.stages.length - 1;
    field.ready = true;
    field.yieldLocked = true;
    field.lockedYield = 600;
  }
  const harvest = harvestAllReadyFields(game);
  assert.equal(harvest.ok, true);
  assert.equal(harvest.state.work.remaining, 0);

  const storage = memoryStorage();
  saveGameToStorage(storage, game, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.work.banked, 1);
  assert.equal(loaded.work.remaining, 6);
});

test("organized operation raises preparedness cap to two", () => {
  const game = createNewGame("old_school");
  game.progression.upgrades.push("organized_operation");
  game.work.remaining = 5;
  const advanced = advanceWeek(game);
  assert.equal(advanced.state.work.banked, 2);
  assert.equal(advanced.state.work.remaining, BALANCE.defaultWorkSlots + 2);
});

test("contracts and weekly events compete for the same work slots", () => {
  let game = createNewGame("old_school");
  game = acceptContract(game, "coop_delivery").state;
  let result = performContractAction(game, "coop_delivery");
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - getWorkSlotCost("contract-action", { contract: game.contracts.find((item) => item.id === "coop_delivery") }));

  game = createNewGame("old_school");
  game.weeklyEvents = [
    {
      id: "marge_seed_shortage_test",
      templateId: "marge_seed_shortage",
      week: game.time.week,
      year: game.time.year,
      title: "Marge Is Short On Drivers",
      source: "Marge",
      urgency: "High",
      message: "The co-op seed route is backed up.",
      effectSummary: "Can create seed delivery work.",
      expiresWeek: game.time.week + 1,
      handled: false,
      expired: false,
      choices: [{ id: "haul", label: "Haul Seed", summary: "Spend fuel, reputation +2." }]
    }
  ];
  const event = game.weeklyEvents[0];
  assert.equal(weeklyEventChoiceWorkCost(event, event.choices[0]), 1);
  result = resolveWeeklyEvent(game, event.id, "haul");
  assert.equal(result.ok, true);
  assert.equal(result.state.work.remaining, BALANCE.defaultWorkSlots - 1);

  game = createNewGame("old_school");
  game.work.remaining = 0;
  game.weeklyEvents = [{ ...event, handled: false, expired: false }];
  result = resolveWeeklyEvent(game, event.id, "haul");
  assert.equal(result.ok, false);
  assert.match(result.message, /work slots/i);
});

test("work slot UI helpers return clear labels and disabled reasons", () => {
  const game = createNewGame("old_school");
  assert.equal(workSlotText(0), "0 work slots");
  assert.equal(workSlotText(1), "1 work slot");
  assert.equal(workSlotText(2), "2 work slots");

  const status = workSlotStatus(game, 6, "Harvest all ready fields");
  assert.equal(status.disabled, true);
  assert.match(status.reason, /needs 6 work slots|only 5 work slots/i);

  const html = renderApp({
    game,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Work Slots/);
  assert.match(html, /5\/5/);
});

test("fields overview exposes scout all and batch scouting is free", () => {
  let game = createNewGame("old_school");
  const preview = batchActionPreview(game, "scout-all");
  assert.equal(preview.affectedCount, game.fields.length);
  assert.equal(preview.totalCost, 0);

  const cashBefore = game.financials.cash;
  const result = scoutAllFields(game);
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.financials.cash, cashBefore);
  assert.equal(game.fields.every((field) => field.lastScoutWeek === game.time.week && field.scoutReport), true);
  assert.match(result.message, /Scouted 3 field.*free/i);

  const html = renderApp({
    game,
    screen: "fields",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Scout All Fields/);
  assert.match(html, /Fields Overview/);
  assert.match(html, /Stress Cause/);
});

test("batch soil, weed, fertilizer, and harvest actions produce useful summaries", () => {
  let game = createNewGame("old_school");
  game.fields[0].weeds = 70;
  game.fields[1].fertility = 35;
  game.fields[2].cropId = "winter_wheat";
  game.fields[2].stageIndex = CROP_TYPES.winter_wheat.stages.length - 1;
  game.fields[2].ready = true;
  game.fields[2].yieldLocked = true;
  game.fields[2].lockedYield = 600;
  game.financials.cash = 10000;

  let result = soilTestAllUncheckedFields(game);
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.fields.every((field) => field.soilTestKnown), true);

  result = treatAllHighWeedFields(game);
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.fields[0].weeds < 70, true);

  result = fertilizeRecommendedFields(game);
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.fields[1].fertility > 35, true);

  result = harvestAllReadyFields(game);
  if (!result.ok && /too wet/i.test(result.message)) {
    game = advanceWeek(game).state;
    result = harvestAllReadyFields(game);
  }
  assert.equal(result.ok, true);
  assert.match(result.message, /Harvest All Ready Fields/);
});

test("stress has causes, affects yield, and can be reduced by appropriate action", () => {
  let game = createNewGame("old_school");
  const field = game.fields[0];
  field.cropId = "corn";
  field.stageIndex = 1;
  field.weeds = 65;
  field.fertility = 35;
  field.stress = 72;
  field.condition = 40;
  field.stressCauses = ["weed pressure", "tired fertility"];
  const stressedYield = expectedYield(game, field);
  const stress = stressSummary(game, field);
  assert.match(stress.causeText, /weed|fertility/i);
  assert.equal(stress.yieldPenaltyPercent > 0, true);

  let result = treatWeeds(game, field.id);
  assert.equal(result.ok, true);
  game = result.state;
  const treated = game.fields.find((item) => item.id === field.id);
  assert.equal(treated.stress < 72, true);
  assert.equal(expectedYield(game, treated) >= stressedYield, true);
  assert.match(basicFieldObservation(game, treated), /Stress|Soil|Looks|Weed|Open|Harvest|Rotation/i);
});

test("central field action rules keep batch and detail fertilizer availability consistent", () => {
  let game = createNewGame("old_school");
  game.fields[0].fertility = 70;
  game.fields[1].fertility = 38;
  game.fields[2].fertility = 60;

  const preview = batchActionPreview(game, "fertilize-all");
  for (const field of game.fields) {
    const status = canPerformFieldAction(field, "fertilize-field", game);
    assert.equal(preview.fieldIds.includes(field.id), status.allowed);
  }

  const html = renderApp({
    game,
    screen: "field",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /No crop is using fertilizer right now|Fertilizer not useful now/);
});

test("fertilizer application limits match crop realism rules", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 10000;
  game = plantCrop(game, "south_40", "corn").state;
  let result = fertilizeField(game, "south_40");
  assert.equal(result.ok, true);
  game = result.state;
  game = advanceWeek(game).state;
  game.fields[0].stageIndex = 1;
  game.fields[0].weeksInStage = 0;
  result = fertilizeField(game, "south_40");
  assert.equal(result.ok, true);
  game = result.state;
  game = advanceWeek(game).state;
  game.fields[0].stageIndex = 2;
  result = fertilizeField(game, "south_40");
  assert.equal(result.ok, false);
  assert.match(result.message, /main fertilizer passes|already received/i);

  game = createNewGame("old_school");
  game.time.week = 5;
  game.financials.cash = 10000;
  game = plantCrop(game, "south_40", "soybeans").state;
  result = fertilizeField(game, "south_40");
  assert.equal(result.ok, true);
  result = fertilizeField(result.state, "south_40");
  assert.equal(result.ok, false);
  assert.match(result.message, /Soybeans|another pass|already applied/i);
});

test("scouting is free, useful, and limited to once per week", () => {
  let game = createNewGame("old_school");
  const cashBefore = game.financials.cash;
  let result = scoutField(game, "south_40");
  assert.equal(result.ok, true);
  game = result.state;
  assert.equal(game.financials.cash, cashBefore);
  assert.match(result.message, /free/i);
  assert.match(game.fields[0].scoutReport, /Stress|weed|yield|Soil/i);

  result = scoutField(game, "south_40");
  assert.equal(result.ok, false);
  assert.match(result.message, /already scouted/i);
});

test("weed timing affects yield and late weed treatment is low value", () => {
  let game = createNewGame("old_school");
  game = plantCrop(game, "south_40", "corn").state;
  let field = game.fields[0];
  field.weeds = 75;
  field.stageIndex = 0;
  const earlyYield = expectedYield(game, field);
  field.stageIndex = 3;
  const lateYield = expectedYield(game, field);
  assert.equal(earlyYield < lateYield, true);

  let result = treatWeeds(game, "south_40");
  assert.equal(result.ok, true);
  assert.match(result.message, /low yield benefit|Late weed cleanup will not recover much yield/i);
  assert.equal(result.state.fields[0].weeds < 75, true);
  assert.equal(result.state.fields[0].stress, field.stress);

  game = createNewGame("old_school");
  game = plantCrop(game, "south_40", "corn").state;
  field.stageIndex = 0;
  game.fields[0].stageIndex = 0;
  game.fields[0].weeds = 75;
  result = treatWeeds(game, "south_40");
  assert.equal(result.ok, true);
  assert.equal(result.state.fields[0].stress <= game.fields[0].stress, true);
});

test("weed treatment can repeat in later weeks but not the same week", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 10000;
  game = plantCrop(game, "south_40", "corn").state;
  game.fields[0].weeds = 90;
  game.fields[0].stress = 50;

  let result = treatWeeds(game, "south_40");
  assert.equal(result.ok, true);
  game = result.state;
  const afterFirst = game.fields[0].weeds;

  result = treatWeeds(game, "south_40");
  assert.equal(result.ok, false);
  assert.match(result.message, /already applied this week/i);

  game.weeklyEvents = [];
  game = advanceWeek(game).state;
  game.fields[0].weeds = Math.max(game.fields[0].weeds, 50);
  result = treatWeeds(game, "south_40");
  assert.equal(result.ok, true);
  assert.equal(result.state.fields[0].weeds < game.fields[0].weeds, true);
  assert.equal(result.state.fields[0].weeds < afterFirst + 15, true);

  const storage = memoryStorage();
  saveGameToStorage(storage, result.state, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.fields[0].weedTreatmentAppliedWeeks.includes(loaded.time.week), true);
  assert.equal(loaded.fields[0].weedTreatmentApplicationsThisCrop >= 2, true);
});

test("weed treatment effectiveness declines by crop timing", () => {
  const game = createNewGame("old_school");
  game.financials.cash = 10000;
  game.fields[0].cropId = "corn";
  game.fields[0].weeds = 80;
  game.fields[0].ready = false;

  game.fields[0].stageIndex = 0;
  const early = weedTreatmentProfile(game, game.fields[0]);
  game.fields[0].stageIndex = 2;
  const mid = weedTreatmentProfile(game, game.fields[0]);
  game.fields[0].stageIndex = 3;
  const late = weedTreatmentProfile(game, game.fields[0]);

  assert.equal(early.yieldBenefit, "high");
  assert.equal(mid.yieldBenefit, "moderate");
  assert.equal(late.yieldBenefit, "low");
  assert.equal(early.expectedReduction > mid.expectedReduction, true);
  assert.equal(mid.expectedReduction > late.expectedReduction, true);
  assert.equal(early.stressReduction > late.stressReduction, true);
});

test("weed treatment UI explains low-value late cleanup", () => {
  const game = createNewGame("old_school");
  game.fields[0].cropId = "corn";
  game.fields[0].stageIndex = 3;
  game.fields[0].weeds = 72;
  game.fields[0].ready = false;
  const html = renderApp({
    game,
    screen: "field",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });

  assert.match(html, /Yield benefit: low/i);
  assert.match(html, /Late weed cleanup will not recover much yield/i);
  assert.match(html, /Treat Weeds - 1 work slot/);
});

test("annual corn and soybean rules block same-year replanting but allow cover crop and next year reset", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 20000;
  game = plantCrop(game, "south_40", "corn").state;
  game.fields[0].stageIndex = CROP_TYPES.corn.stages.length - 1;
  game.fields[0].ready = true;
  game.fields[0].yieldLocked = true;
  game.fields[0].lockedYield = 1000;
  let result = harvestField(game, "south_40", { useCredit: true });
  assert.equal(result.ok, true);
  game = result.state;

  result = plantCrop(game, "south_40", "corn");
  assert.equal(result.ok, false);
  assert.match(result.message, /Cash crop already planted|already harvested|next season/i);

  result = plantCrop(game, "south_40", "soybeans");
  assert.equal(result.ok, false);
  assert.match(result.message, /Cash crop already planted|already harvested|next season/i);

  result = plantCrop(game, "south_40", "cover_crop");
  assert.equal(result.ok, true);
  game = result.state;
  game.time.week = game.time.maxWeeks;
  game.flags.endOfYearReady = true;
  game = continueToNextYear(game).state;
  game.time.week = 5;
  result = plantCrop(game, "south_40", "soybeans");
  assert.equal(result.ok, true);
});

test("planting windows block late corn and soybeans but keep cover crop available", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 20000;
  game.time.week = 20;
  assert.equal(plantingWindowStatus(game, "soybeans").allowed, false);
  assert.equal(plantingWindowStatus(game, "cover_crop").allowed, true);

  let result = plantCrop(game, "south_40", "corn");
  assert.equal(result.ok, false);
  assert.match(result.message, /Too late to plant corn/i);

  result = plantCrop(game, "south_40", "soybeans");
  assert.equal(result.ok, false);
  assert.match(result.message, /Soybean planting window has passed/i);

  result = plantCrop(game, "south_40", "cover_crop");
  assert.equal(result.ok, true);
});

test("late allowed planting carries a visible yield penalty", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 20000;
  game.time.week = 10;
  const normal = createNewGame("old_school");
  normal.financials.cash = 20000;
  const normalPlanted = plantCrop(normal, "south_40", "corn").state;

  const result = plantCrop(game, "south_40", "corn");
  assert.equal(result.ok, true);
  assert.match(result.message, /Late corn|reduced yield potential/i);
  assert.equal(result.state.fields[0].latePlantingYieldModifier < 1, true);
  assert.equal(expectedYield(result.state, result.state.fields[0]) < expectedYield(normalPlanted, normalPlanted.fields[0]), true);
});

test("newly leased land obeys crop calendar rules", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 30000;
  game.reputation = 80;
  game.time.week = 22;
  const lease = purchaseProgression(game, "lease_back_20");
  assert.equal(lease.ok, true);
  game = lease.state;
  const leased = game.fields.find((field) => field.id === "hollis_back_20");
  assert.ok(leased);

  let result = plantCrop(game, leased.id, "soybeans");
  assert.equal(result.ok, false);
  assert.match(result.message, /Soybean planting window has passed/i);

  result = plantCrop(game, leased.id, "cover_crop");
  assert.equal(result.ok, true);

  const storage = memoryStorage();
  saveGameToStorage(storage, result.state, "2026-07-09T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.equal(loaded.fields.some((field) => field.id === "hollis_back_20" && field.cropId === "cover_crop"), true);
});

test("field UI explains closed planting windows", () => {
  const game = createNewGame("old_school");
  game.time.week = 22;
  const cornStatus = canPerformFieldAction(game.fields[0], "plant-crop", game, { cropId: "corn" });
  const soybeanStatus = canPerformFieldAction(game.fields[0], "plant-crop", game, { cropId: "soybeans" });
  assert.equal(cornStatus.allowed, false);
  assert.equal(soybeanStatus.allowed, false);

  const html = renderApp({
    game,
    screen: "field",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Too late to plant corn this year/);
  assert.match(html, /Soybean planting window has passed/);
  assert.match(html, /Plant Cover Crop/);
});

test("hay can provide recurring income path with multiple cuttings", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 20000;
  let result = plantCrop(game, "south_40", "hay");
  assert.equal(result.ok, true);
  game = result.state;
  for (let i = 0; i < 6; i += 1) game = advanceWeek(game).state;
  let field = game.fields[0];
  assert.equal(field.ready, true);
  result = harvestField(game, "south_40", { useCredit: true });
  let attempts = 0;
  while (!result.ok && /too wet|work slots|ready/i.test(result.message) && attempts < 3) {
    game = advanceWeek(game).state;
    result = harvestField(game, "south_40", { useCredit: true });
    attempts += 1;
  }
  assert.equal(result.ok, true);
  game = result.state;
  field = game.fields[0];
  assert.equal(game.inventory.crops.hay > 0, true);
  assert.equal(field.cropId, "hay");
  assert.equal(field.hayCuttingsThisYear, 1);
  assert.equal(field.ready, false);

  for (let i = 0; i < 4; i += 1) game = advanceWeek(game).state;
  assert.equal(game.fields[0].ready, true);
});

test("stress requires causes, can recover from weather, and preserves recovery state", () => {
  let game = createNewGame("old_school");
  game.seed = 1;
  game.fields[0].cropId = "corn";
  game.fields[0].stress = 65;
  game.fields[0].stressCauses = ["dry weather"];
  game.weeklyEvents = [];
  const before = game.fields[0].stress;
  const result = advanceWeek(game);
  const after = result.state.fields[0];
  assert.equal(after.stress < before, true);
  assert.equal(after.stressHistory.length > 0, true);
  assert.match(stressSummary(result.state, after).recoveryText, /watching|rain|fertility|weed|harvest|cover|rotate/i);

  const storage = memoryStorage();
  saveGameToStorage(storage, result.state);
  const loaded = loadGameFromStorage(storage);
  assert.deepEqual(loaded.fields[0].stressHistory, result.state.fields[0].stressHistory);
});

test("dashboard shows weekly events and result card markup", () => {
  const game = createNewGame("old_school");
  const html = renderApp({
    game,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    resultCard: { title: "County Notice", message: "Hollis called before breakfast.", type: "success" },
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /This Week in Ash Creek/);
  assert.match(html, /Calls & Visits/);
  assert.match(html, /result-card/);
});

test("season report classification matches strong, stable, struggling, and bad states", () => {
  const strong = createNewGame("old_school");
  strong.financials.cash = 26474;
  strong.financials.debt = 0;
  strong.reputation = 98;
  assert.equal(classifySeasonOutcome(strong).level, "strong");
  assert.match(classifySeasonOutcome(strong).narrative, /room to think/i);

  const stable = createNewGame("old_school");
  stable.financials.cash = 4000;
  stable.financials.debt = 30000;
  stable.reputation = 55;
  assert.equal(classifySeasonOutcome(stable).level, "stable");

  const struggling = createNewGame("old_school");
  struggling.financials.cash = 1200;
  struggling.financials.debt = 62000;
  struggling.reputation = 45;
  assert.equal(classifySeasonOutcome(struggling).level, "struggling");

  const bad = createNewGame("old_school");
  bad.financials.cash = 0;
  bad.financials.debt = 62000;
  bad.reputation = 20;
  assert.equal(classifySeasonOutcome(bad).level, "bad");
});

test("week 36 report button does not show Start Week 36 incorrectly", () => {
  const game = createNewGame("old_school");
  game.time.week = game.time.maxWeeks;
  game.flags.endOfYearReady = true;
  game.lastReport = {
    title: "End-of-Year 1 Report",
    entries: ["Outcome: Stable Outcome."],
    finances: {}
  };
  const html = renderApp({
    game,
    screen: "report",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.doesNotMatch(html, /Start Week 36/);
  assert.match(html, /Continue to Year 2/);
});

test("sound cues exist and muted playback is safe before browser interaction", () => {
  for (const cue of ["click", "warning", "cash", "credit", "contractComplete", "contractFailed", "storm", "harvest", "repair", "reputation", "event"]) {
    assert.equal(soundCueAvailable(cue), true);
  }
  assert.doesNotThrow(() => playSound("cash", { soundMuted: true, soundVolume: 0.5 }));
});

test("save/load preserves weekly event queue and stress causes", () => {
  let game = createNewGame("old_school");
  game.fields[0].stress = 70;
  game.fields[0].stressCauses = ["dry weather", "weed pressure"];
  game.weeklyEvents = generateWeeklyEvents(game);
  assert.equal(game.weeklyEvents.length > 0, true);

  const storage = memoryStorage();
  saveGameToStorage(storage, game, "2026-07-08T12:00:00.000Z");
  const loaded = loadGameFromStorage(storage);
  assert.deepEqual(loaded.weeklyEvents, game.weeklyEvents);
  assert.deepEqual(loaded.fields[0].stressCauses, ["dry weather", "weed pressure"]);
});

test("expanded dynamic events can create visible gameplay opportunities", () => {
  let found = null;
  for (let seed = 1; seed < 2000; seed += 1) {
    const game = createNewGame("old_school");
    game.seed = seed;
    game.time.week = 1;
    const result = advanceWeek(game);
    if (result.state.events.some((event) => event.id === "coop_discount")) {
      found = result.state;
      break;
    }
  }

  assert.ok(found, "Expected to find deterministic co-op discount event");
  assert.equal(found.flags.inputDiscountWeek, found.time.week);
  const field = found.fields[0];
  assert.equal(getPlantCost(found, field, "corn") < getPlantCost(field, "corn"), true);
  assert.equal(found.lastReport.entries.some((entry) => /discount/i.test(entry)), true);
});

test("NPC and location interactions survive normal state transitions", () => {
  let game = createNewGame("old_school");
  const before = game.relationships.patti;

  const result = talkToNpc(game, "patti");

  assert.equal(result.ok, true);
  assert.equal(result.state.relationships.patti > before, true);
  assert.equal(result.state.reputation > game.reputation, true);
});

test("reputation affects bank terms, contract availability, and visible standing text", () => {
  const low = createNewGame("old_school");
  low.reputation = 25;
  const high = createNewGame("old_school");
  high.reputation = 76;

  assert.equal(getEffectiveCreditLimit(low) < low.financials.creditLimit, true);
  assert.equal(getEffectiveCreditLimit(high) > high.financials.creditLimit, true);

  const lowAvailable = low.contracts.filter((contract) => low.reputation >= (contract.minReputation ?? 0));
  const highAvailable = high.contracts.filter((contract) => high.reputation >= (contract.minReputation ?? 0));
  assert.equal(highAvailable.length >= lowAvailable.length, true);

  const html = renderApp({
    game: high,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 }
  });
  assert.match(html, /Trusted/);
  assert.match(html, /better neighbor work/);
});

test("weekly events are recorded and can create gameplay impact", () => {
  let found = null;
  for (let seed = 1; seed < 1000; seed += 1) {
    const game = createNewGame("old_school");
    game.seed = seed;
    game.time.week = 1;
    game.weather = { id: "soaking_rain", name: "Soaking Rain", stress: -3, weed: 8, fertility: -2, note: "" };
    game.fields[0].cropId = "corn";
    game.fields[0].ready = true;
    game.fields[0].stageIndex = CROP_TYPES.corn.stages.length - 1;
    const result = advanceWeek(game);
    if (result.state.events.length) {
      found = result.state;
      break;
    }
  }

  assert.ok(found, "Expected deterministic event seed");
  assert.equal(found.lastReport.entries.some((entry) => /Wet Fields|Drought|Storm|Neighbor|Bank|Co-op|market|equipment|salvage|County|This Week/i.test(entry)), true);
  if (found.flags.harvestDelayWeek === found.time.week) {
    const harvest = harvestField(found, found.fields[0].id, { useCredit: true });
    assert.equal(harvest.ok, false);
    assert.match(harvest.message, /too wet/i);
  }
});

test("game continues beyond the prior 18 week prototype mark", () => {
  let game = createNewGame("old_school");
  for (let i = 0; i < 17; i += 1) {
    game = advanceWeek(game).state;
  }

  assert.equal(game.time.maxWeeks >= 36, true);
  assert.equal(game.time.week, 18);
  assert.equal(game.lastReport.entries.some((entry) => entry.includes("18-week prototype")), true);
});

test("progression purchases enforce requirements and apply effects", () => {
  let game = createNewGame("old_school");
  game.financials.cash = 10000;
  game.reputation = 30;
  let result = purchaseProgression(game, "lease_back_20");
  assert.equal(result.ok, false);
  assert.match(result.message, /standing/i);

  game.reputation = 70;
  result = purchaseProgression(game, "lease_back_20");
  assert.equal(result.ok, true);
  assert.equal(result.state.progression.upgrades.includes("lease_back_20"), true);
  assert.equal(result.state.fields.some((field) => field.id === "hollis_back_20"), true);
  assert.equal(result.state.financials.cash, game.financials.cash - 5200);
});

test("save/load round trip restores progressed core state and settings", () => {
  let game = createNewGame("mechanic");
  game = buySalvage(game, game.salvageYard[0].instanceId).state;
  game = acceptContract(game, "hollis_hay").state;
  game = performContractAction(game, "hollis_hay").state;
  game = advanceWeek(game).state;
  game = completeContract(game, "hollis_hay").state;
  game = advanceWeek(game).state;
  game.currentLocationId = "guss_yard";

  const storage = memoryStorage();
  saveGameToStorage(storage, game, "2026-07-06T12:00:00.000Z");
  saveSettingsToStorage(storage, { fontScale: "large", reduceMotion: true, soundMuted: true, soundVolume: 0.2 });

  const loadedGame = loadGameFromStorage(storage);
  const loadedSettings = loadSettingsFromStorage(storage);

  assert.deepEqual(loadedGame.player, game.player);
  assert.equal(loadedGame.time.week, game.time.week);
  assert.equal(loadedGame.financials.cash, game.financials.cash);
  assert.equal(loadedGame.financials.debt, game.financials.debt);
  assert.deepEqual(loadedGame.fields, game.fields);
  assert.deepEqual(loadedGame.inventory, game.inventory);
  assert.deepEqual(loadedGame.equipment, game.equipment);
  assert.equal(loadedGame.contracts.find((item) => item.id === "hollis_hay").status, "completed");
  assert.equal(loadedGame.currentLocationId, "guss_yard");
  assert.equal(loadedSettings.fontScale, "large");
  assert.equal(loadedSettings.reduceMotion, true);
  assert.equal(loadedSettings.soundMuted, true);
  assert.equal(loadedSettings.soundVolume, 0.2);
});

test("visual world layer renders farm, field, map, location, and portrait assets", () => {
  const game = createNewGame("old_school");
  const baseApp = {
    game,
    screen: "dashboard",
    selectedFieldId: "south_40",
    notice: null,
    hasSave: false,
    settings: { fontScale: "normal", reduceMotion: false }
  };

  const dashboard = renderApp(baseApp);
  assert.match(dashboard, /dm_farm_home_overview_v01_concept\.png/);
  assert.match(dashboard, /Walk the Fields/);

  const backgroundSelect = renderApp({ ...baseApp, game: null, screen: "backgrounds" });
  assert.match(backgroundSelect, /dm_character_old_school_farmer_portrait_v01_concept\.png/);
  assert.match(backgroundSelect, /dm_character_it_nephew_portrait_v01_concept\.png/);
  assert.match(backgroundSelect, /dm_character_mechanic_portrait_v01_concept\.png/);

  const field = renderApp({ ...baseApp, screen: "field" });
  assert.match(field, /dm_field_/);
  assert.match(field, /field-visual-panel/);
  assert.match(field, /Field 1 of 3/);
  assert.match(field, /Next: Creek Bottom/);

  const cornGame = createNewGame("old_school");
  cornGame.fields[0].cropId = "corn";
  cornGame.fields[0].stageIndex = 2;
  const cornField = renderApp({ ...baseApp, game: cornGame, screen: "field" });
  assert.match(cornField, /dm_field_corn_growing_v01_concept\.png/);

  const missingHayHarvestedGame = createNewGame("old_school");
  missingHayHarvestedGame.fields[0].lastAction = "Harvested Hay";
  const hayHarvestedField = renderApp({ ...baseApp, game: missingHayHarvestedGame, screen: "field" });
  assert.match(hayHarvestedField, /dm_field_hay_harvested_v01_concept\.png/);

  const map = renderApp({ ...baseApp, screen: "map" });
  assert.match(map, /dm_map_ash_creek_county_v01_concept\.png/);
  assert.match(map, /class="map-node/);

  const dinerGame = { ...game, currentLocationId: "pattis_diner" };
  const location = renderApp({ ...baseApp, game: dinerGame, screen: "location" });
  assert.match(location, /dm_location_pattis_diner_v01_concept\.png/);
  assert.match(location, /dm_character_patti_portrait_v01_concept\.png/);
  assert.match(location, /dialogue-card/);

  const settings = renderApp({ ...baseApp, screen: "settings", settings: { fontScale: "normal", reduceMotion: false, soundMuted: false, soundVolume: 0.35 } });
  assert.match(settings, /Mute sound/);
  assert.match(settings, /Sound volume/);
});

test("art manifest covers required locations, characters, fields, and farm/map assets", () => {
  for (const location of LOCATIONS) {
    assert.ok(ART_MANIFEST.locations[location.id], `Missing location art entry for ${location.id}`);
  }

  for (const backgroundId of Object.keys(BACKGROUNDS)) {
    assert.ok(ART_MANIFEST.characters[backgroundId], `Missing background portrait entry for ${backgroundId}`);
  }

  for (const npcId of Object.keys(NPCS)) {
    assert.ok(ART_MANIFEST.characters[npcId], `Missing NPC portrait entry for ${npcId}`);
  }

  for (const fieldState of REQUIRED_FIELD_VISUAL_KEYS) {
    assert.ok(ART_MANIFEST.fields[fieldState], `Missing field art entry for ${fieldState}`);
  }

  for (const overlay of OPTIONAL_FIELD_OVERLAY_KEYS) {
    assert.ok(ART_MANIFEST.fieldOverlays[overlay], `Missing field overlay art entry for ${overlay}`);
  }

  for (const artId of REQUIRED_NON_FIELD_ART_IDS) {
    const asset = resolveArtAsset(artId);
    assert.notEqual(asset.type, "missing", `Missing required non-field art entry for ${artId}`);
  }

  assert.ok(ART_MANIFEST.farm.homeOverview);
  assert.ok(ART_MANIFEST.farm.dashboardHero);
  assert.ok(ART_MANIFEST.map.ashCreekCounty);
  assert.ok(ART_MANIFEST.map.markers);
});

test("art manifest fallback paths exist and generated-art folders are present", () => {
  for (const asset of allArtAssets()) {
    const fallbackPath = asset.fallbackPath.replace(/^\.\//, "");
    assert.equal(existsSync(fallbackPath), true, `Missing fallback art: ${fallbackPath}`);
    assert.ok(asset.expectedPath.includes("/final/"), `${asset.id} expectedPath should target final art`);
    assert.ok(asset.conceptPath.includes("/concept/"), `${asset.id} conceptPath should target concept art`);
    assert.ok(["placeholder", "concept", "approved", "final"].includes(asset.status), `${asset.id} has invalid status`);
    if (asset.status === "concept") {
      const conceptPath = asset.conceptPath.replace(/^\.\//, "");
      assert.equal(existsSync(conceptPath), true, `Missing imported concept art: ${conceptPath}`);
    }
    if (asset.status === "final" || asset.status === "approved") {
      const expectedPath = asset.expectedPath.replace(/^\.\//, "");
      assert.equal(existsSync(expectedPath), true, `Missing final art: ${expectedPath}`);
    }
  }

  for (const folder of [
    "assets/concept/farm",
    "assets/concept/locations",
    "assets/concept/characters",
    "assets/concept/fields",
    "assets/concept/fields/overlays",
    "assets/concept/fields/unmapped",
    "assets/concept/map",
    "assets/concept/ui",
    "assets/concept/promo",
    "assets/concept/unmapped",
    "assets/final/farm",
    "assets/final/locations",
    "assets/final/characters",
    "assets/final/fields",
    "assets/final/fields/overlays",
    "assets/final/map",
    "assets/final/ui",
    "assets/final/promo"
  ]) {
    assert.equal(existsSync(folder), true, `Missing art folder: ${folder}`);
  }
});

test("art resolver safely falls back for missing asset ids", () => {
  const missing = resolveArtAsset("missing.asset");

  assert.equal(missing.status, "placeholder");
  assert.equal(missing.isPlaceholder, true);
  assert.match(missing.src, /dm_farm_home_overview_placeholder\.svg/);
});

test("non-field concept art resolves through manifest and runtime aliases", () => {
  for (const artId of IMPORTED_NON_FIELD_ART_IDS) {
    const asset = resolveArtAsset(artId);
    const conceptPath = asset.conceptPath.replace(/^\.\//, "");

    assert.equal(asset.status, "concept", `${asset.id} should use imported concept art`);
    assert.equal(asset.src, asset.conceptPath, `${asset.id} should resolve to concept art`);
    assert.equal(existsSync(conceptPath), true, `Missing imported non-field concept art: ${conceptPath}`);
  }

  assert.equal(FARM_OVERVIEW_ART.id, "farm.home_overview");
  assert.match(FARM_OVERVIEW_ART.src, /dm_farm_home_overview_v01_concept\.png/);
  assert.equal(COUNTY_MAP_ART.id, "map.ash_creek_county");
  assert.match(COUNTY_MAP_ART.src, /dm_map_ash_creek_county_v01_concept\.png/);

  assert.match(locationArtFor("farmers_coop").src, /dm_location_ash_creek_coop_v01_concept\.png/);
  assert.match(locationArtFor("guss_yard").src, /dm_location_gus_yard_v01_concept\.png/);
  assert.match(locationArtFor("bank").src, /dm_location_ash_creek_bank_v01_concept\.png/);
  assert.match(characterArtFor("old_school").src, /dm_character_old_school_farmer_portrait_v01_concept\.png/);
});

test("missing non-field concept art stays placeholder-safe", () => {
  for (const artId of [
    "farm.dashboard_hero",
    "farm.machine_shed",
    "location.home_farm",
    "location.roys_place",
    "location.hollis_place",
    "location.grange_hall",
    "character.hollis",
    "character.marge",
    "character.earl"
  ]) {
    const asset = resolveArtAsset(artId);
    const fallbackPath = asset.fallbackPath.replace(/^\.\//, "");

    assert.notEqual(asset.type, "missing", `${artId} should be present in the manifest`);
    assert.equal(asset.status, "placeholder", `${asset.id} should remain placeholder until concept art is imported`);
    assert.equal(existsSync(fallbackPath), true, `Missing fallback art: ${fallbackPath}`);
  }
});

test("field visual manifest keys resolve to art sources or valid fallbacks", () => {
  for (const key of REQUIRED_FIELD_VISUAL_KEYS) {
    const asset = resolveArtAsset(`field.${key}`);
    const fallbackPath = asset.fallbackPath.replace(/^\.\//, "");

    assert.notEqual(asset.type, "missing", `Missing field visual resolver entry for ${key}`);
    assert.match(asset.conceptPath, new RegExp(`assets/concept/fields/dm_field_${key}_v01_concept\\.png$`));
    assert.ok(
      [asset.expectedPath, asset.conceptPath, asset.fallbackPath].includes(asset.src),
      `${asset.id} should resolve to expected, concept, or fallback art`
    );
    assert.equal(existsSync(fallbackPath), true, `Missing field fallback art: ${fallbackPath}`);
  }

  for (const key of OPTIONAL_FIELD_OVERLAY_KEYS) {
    const asset = resolveArtAsset(`field_overlay.${key}`);
    const fallbackPath = asset.fallbackPath.replace(/^\.\//, "");

    assert.notEqual(asset.type, "missing", `Missing field overlay resolver entry for ${key}`);
    assert.match(asset.conceptPath, new RegExp(`assets/concept/fields/overlays/dm_overlay_${key}_v01_concept\\.png$`));
    assert.ok(
      [asset.expectedPath, asset.conceptPath, asset.fallbackPath].includes(asset.src),
      `${asset.id} should resolve to expected, concept, or fallback art`
    );
    assert.equal(existsSync(fallbackPath), true, `Missing overlay fallback art: ${fallbackPath}`);
  }
});

test("imported field concept entries point at existing files and missing entries stay placeholder-safe", () => {
  for (const key of IMPORTED_FIELD_CONCEPT_KEYS) {
    const asset = resolveArtAsset(`field.${key}`);
    const conceptPath = asset.conceptPath.replace(/^\.\//, "");

    assert.equal(asset.status, "concept", `${asset.id} should use imported concept art`);
    assert.equal(asset.src, asset.conceptPath, `${asset.id} should resolve to concept art`);
    assert.equal(existsSync(conceptPath), true, `Missing imported concept art: ${conceptPath}`);
  }

  for (const key of IMPORTED_FIELD_OVERLAY_KEYS) {
    const asset = resolveArtAsset(`field_overlay.${key}`);
    const conceptPath = asset.conceptPath.replace(/^\.\//, "");

    assert.equal(asset.status, "concept", `${asset.id} should use imported overlay concept art`);
    assert.equal(asset.src, asset.conceptPath, `${asset.id} should resolve to concept art`);
    assert.equal(existsSync(conceptPath), true, `Missing imported overlay concept art: ${conceptPath}`);
  }
});

test("current field states map to crop-specific art where available", () => {
  assert.equal(fieldArtFor(fieldFixture({ cropId: "corn", stageIndex: 0 })).id, "field.corn_planted");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "corn", stageIndex: 1 })).id, "field.corn_emerged");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "corn", stageIndex: 2 })).id, "field.corn_growing");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "corn", stress: 70 })).id, "field.corn_stressed");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "corn", ready: true })).id, "field.corn_ready");
  assert.equal(fieldArtFor(fieldFixture({ lastAction: "Harvested Corn" })).id, "field.corn_harvested");

  assert.equal(fieldArtFor(fieldFixture({ cropId: "soybeans", stageIndex: 0 })).id, "field.soybeans_planted");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "soybeans", stageIndex: 1 })).id, "field.soybeans_emerged");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "soybeans", stageIndex: 2 })).id, "field.soybeans_growing");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "soybeans", stress: 70 })).id, "field.soybeans_stressed");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "soybeans", ready: true })).id, "field.soybeans_ready");
  assert.equal(fieldArtFor(fieldFixture({ lastAction: "Harvested Soybeans" })).id, "field.soybeans_harvested");

  assert.equal(fieldArtFor(fieldFixture({ cropId: "hay", stageIndex: 0 })).id, "field.hay_growing");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "hay", stress: 70 })).id, "field.hay_stressed");
  assert.equal(fieldArtFor(fieldFixture({ cropId: "hay", ready: true })).id, "field.hay_ready_to_cut");
  assert.equal(fieldArtFor(fieldFixture({ lastAction: "Harvested Hay" })).id, "field.hay_harvested");
  assert.match(fieldArtFor(fieldFixture({ lastAction: "Harvested Hay" })).src, /dm_field_hay_harvested_v01_concept\.png/);

  assert.equal(fieldArtFor(fieldFixture({ cropId: "cover_crop", stageIndex: 1 })).id, "field.cover_crop_emerged");
  assert.match(fieldArtFor(fieldFixture({ cropId: "cover_crop", stageIndex: 1 })).src, /dm_field_cover_crop_emerged_v01_concept\.png/);
  assert.equal(fieldArtFor(fieldFixture({ cropId: "cover_crop", stageIndex: 2 })).id, "field.cover_crop_growing");
  assert.match(fieldArtFor(fieldFixture({ cropId: "cover_crop", stageIndex: 2 })).src, /dm_field_cover_crop_growing_v01_concept\.png/);
  assert.equal(fieldArtFor(fieldFixture({ cropId: "cover_crop", stress: 70 })).id, "field.cover_crop_stressed");
  assert.match(fieldArtFor(fieldFixture({ cropId: "cover_crop", stress: 70 })).src, /dm_field_cover_crop_stressed_v01_concept\.png/);
  assert.equal(fieldArtFor(fieldFixture({ cropId: "cover_crop", ready: true })).id, "field.cover_crop_terminated");
  assert.match(fieldArtFor(fieldFixture({ cropId: "cover_crop", ready: true })).src, /dm_field_cover_crop_terminated_v01_concept\.png/);
});

function fieldFixture(overrides = {}) {
  return {
    cropId: null,
    stageIndex: 0,
    ready: false,
    stress: 12,
    condition: 72,
    weeds: 18,
    lastAction: "Fallow",
    ...overrides
  };
}
