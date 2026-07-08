import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  acceptContract,
  advanceWeek,
  buySalvage,
  completeContract,
  createNewGame,
  drawCredit,
  getEffectiveCreditLimit,
  harvestField,
  payDebt,
  plantCrop,
  purchaseProgression,
  repairAndFlipSalvage,
  repairEquipment,
  getRepairEstimate,
  scoutField,
  sellCrop,
  sellSalvage,
  stripSalvage,
  talkToNpc,
  useSalvageOnEquipment
} from "../src/state.js";
import { BALANCE, CROP_TYPES } from "../src/data.js";
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

  const used = useSalvageOnEquipment(bought.state, owned.inventoryId, target.id);

  assert.equal(used.ok, true);
  assert.equal(used.state.inventory.salvage.length, 0);
  assert.equal(used.state.equipment.find((item) => item.id === target.id).condition > before, true);
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
  assert.match(result.message, /in progress/i);

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
  assert.match(immediate.message, /in progress/i);

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
    if (!harvested.ok && /too wet/i.test(harvested.message)) {
      game = advanceWeek(game).state;
      harvested = harvestField(game, field.id, { useCredit: true });
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
  assert.equal(found.lastReport.entries.some((entry) => /Wet Fields|Drought|Storm|Neighbor|Bank/.test(entry)), true);
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
