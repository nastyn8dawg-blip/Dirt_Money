import {
  BACKGROUNDS,
  BALANCE,
  CONTRACT_TEMPLATES,
  CROP_TYPES,
  EQUIPMENT_TEMPLATES,
  EVENT_TEMPLATES,
  FIELD_TEMPLATES,
  LOCATIONS,
  NPCS,
  PROGRESSION_UPGRADES,
  SALVAGE_MARKET_TEMPLATES,
  WEATHER_PATTERNS
} from "./data.js";

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function dollars(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function noise(seed, salt = 0) {
  const raw = Math.sin(seed * 999 + salt * 37.7) * 10000;
  return raw - Math.floor(raw);
}

function background(state) {
  return BACKGROUNDS[state.player.backgroundId] ?? BACKGROUNDS.old_school;
}

function relationMap() {
  return Object.fromEntries(Object.keys(NPCS).map((id) => [id, 0]));
}

function createField(template) {
  return {
    ...template,
    cropId: null,
    stageIndex: 0,
    weeksInStage: 0,
    plantedWeek: null,
    ready: false,
    tested: false,
    scouted: false,
    scoutReport: null,
    lastAction: "Fallow"
  };
}

function createEquipment(template) {
  return {
    ...template,
    condition: template.condition,
    lastRepairWeek: null
  };
}

function createContract(contract, week, sequence = 0) {
  return {
    ...contract,
    templateId: contract.id,
    id: sequence === 0 ? contract.id : `${contract.id}_${week}_${sequence}`,
    status: "available",
    weeksLeft: contract.deadlineWeeks,
    issueWeek: week,
    acceptedWeek: null,
    readyWeek: null,
    deadlineWeek: null,
    completedWeek: null,
    failedWeek: null
  };
}

function createContracts(reputation) {
  return CONTRACT_TEMPLATES
    .filter((contract) => reputation >= (contract.minReputation ?? 0))
    .slice(0, BALANCE.contractBoardTarget)
    .map((contract) => createContract(contract, 1));
}

function weatherForWeek(week, seed) {
  const index = Math.floor(noise(seed + week, 4) * WEATHER_PATTERNS.length);
  return WEATHER_PATTERNS[index] ?? WEATHER_PATTERNS[0];
}

function marketForWeek(week, backgroundId, seed) {
  const bg = BACKGROUNDS[backgroundId] ?? BACKGROUNDS.old_school;
  return Object.fromEntries(
    Object.values(CROP_TYPES).map((crop, index) => {
      const swing = 0.88 + noise(seed + week, index + 20) * 0.24;
      const insight = bg.modifiers.marketSight > 0 ? "Data shows next week's bid pressure." : "";
      return [
        crop.id,
        {
          cropId: crop.id,
          name: crop.name,
          unit: crop.unit,
          price: Number((crop.basePrice * swing).toFixed(2)),
          note: insight || (swing >= 1 ? "Bid is above the county baseline." : "Bid is under the county baseline.")
        }
      ];
    })
  );
}

function generateSalvageMarket(week, backgroundId, seed) {
  const bg = BACKGROUNDS[backgroundId] ?? BACKGROUNDS.old_school;
  return SALVAGE_MARKET_TEMPLATES
    .map((item, index) => ({
      ...item,
      instanceId: `${week}-${item.id}-${index}`,
      condition: clamp(Math.round(item.condition - 6 + noise(seed + week, index + 60) * 18), 20, 86),
      cost: Math.max(35, Math.round(item.cost * (0.92 + noise(seed + week, index + 90) * 0.18))),
      flipValue: Math.round(item.flipValue * bg.modifiers.salvageValue)
    }))
    .sort((a, b) => noise(seed + week, a.cost) - noise(seed + week, b.cost))
    .slice(0, 3);
}

function appendLog(state, message, type = "info") {
  state.log.unshift({
    week: state.time.week,
    type,
    message
  });
  state.log = state.log.slice(0, BALANCE.maxLog);
  state.alerts = [{ type, message }, ...state.alerts].slice(0, 6);
}

function finish(state, ok, message, type = ok ? "success" : "warning") {
  appendLog(state, message, type);
  return { state, ok, message, type };
}

function recalcCondition(field) {
  const weedScore = 100 - field.weeds;
  field.condition = clamp(
    Math.round(field.soil * 0.24 + field.fertility * 0.31 + weedScore * 0.24 + (100 - field.stress) * 0.21),
    5,
    100
  );
}

export function reputationStanding(reputation) {
  if (reputation < 35) {
    return {
      label: "Watched",
      summary: "fewer neighbor jobs, tighter bank terms, colder conversations",
      creditMultiplier: 0.85,
      rewardMultiplier: 0.94
    };
  }
  if (reputation >= 70) {
    return {
      label: "Trusted",
      summary: "better neighbor work, slightly easier bank terms, and more favors",
      creditMultiplier: 1.1,
      rewardMultiplier: 1.08
    };
  }
  return {
    label: "Known",
    summary: "normal contract access, normal bank terms, and basic neighbor help",
    creditMultiplier: 1,
    rewardMultiplier: 1
  };
}

export function getEffectiveCreditLimit(state) {
  return Math.round(state.financials.creditLimit * reputationStanding(state.reputation).creditMultiplier);
}

function getCreditRemaining(state) {
  return Math.max(0, getEffectiveCreditLimit(state) - state.financials.creditUsed);
}

function spend(state, amount, label, { allowCredit = false, creditOnly = false } = {}) {
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return { ok: true, financed: 0, paidCash: 0 };
  }

  if (creditOnly) {
    if (rounded > getCreditRemaining(state)) {
      return {
        ok: false,
        financed: 0,
        paidCash: 0,
        message: `${label} needs ${dollars(rounded)} on credit, but the operating line only has ${dollars(getCreditRemaining(state))} left.`
      };
    }

    state.financials.debt += rounded;
    state.financials.creditUsed += rounded;
    state.financials.expenses += rounded;
    return { ok: true, financed: rounded, paidCash: 0 };
  }

  if (state.financials.cash >= rounded) {
    state.financials.cash -= rounded;
    state.financials.expenses += rounded;
    return { ok: true, financed: 0, paidCash: rounded };
  }

  if (!allowCredit) {
    return {
      ok: false,
      financed: 0,
      paidCash: 0,
      message: `${label} costs ${dollars(rounded)}, and the farm does not have the cash.`
    };
  }

  const paidCash = Math.max(0, state.financials.cash);
  const financed = rounded - paidCash;
  if (financed > getCreditRemaining(state)) {
    return {
      ok: false,
      financed: 0,
      paidCash: 0,
      message: `${label} needs ${dollars(financed)} on credit, but the operating line only has ${dollars(getCreditRemaining(state))} left.`
    };
  }

  state.financials.cash -= paidCash;
  state.financials.debt += financed;
  state.financials.creditUsed += financed;
  state.financials.expenses += rounded;
  return { ok: true, financed, paidCash };
}

function earn(state, amount, label) {
  const rounded = Math.round(amount);
  state.financials.cash += rounded;
  state.financials.income += rounded;
  return `${label}: +${dollars(rounded)}.`;
}

export function createNewGame(backgroundId = "old_school") {
  const bg = BACKGROUNDS[backgroundId] ?? BACKGROUNDS.old_school;
  const seed = Math.floor(Date.now() % 1000000);
  const state = {
    version: 1,
    player: {
      backgroundId: bg.id,
      backgroundName: bg.name
    },
    time: {
      week: 1,
      year: 1,
      maxWeeks: BALANCE.maxWeeks
    },
    financials: {
      cash: bg.startingCash,
      debt: bg.startingDebt,
      creditLimit: bg.creditLimit,
      creditUsed: 0,
      income: 0,
      expenses: 0
    },
    reputation: bg.startingReputation,
    relationships: relationMap(),
    fields: FIELD_TEMPLATES.map(createField),
    equipment: EQUIPMENT_TEMPLATES.map(createEquipment),
    inventory: {
      crops: Object.fromEntries(Object.keys(CROP_TYPES).map((id) => [id, 0])),
      salvage: [],
      parts: bg.modifiers.startingParts
    },
    contracts: createContracts(bg.startingReputation),
    contractSequence: 0,
    nextContractRefreshWeek: 3,
    events: [],
    progression: {
      upgrades: []
    },
    marketPrices: marketForWeek(1, bg.id, seed),
    salvageYard: generateSalvageMarket(1, bg.id, seed),
    weather: weatherForWeek(1, seed),
    currentLocationId: "home_farm",
    seed,
    alerts: [],
    log: [],
    lastReport: {
      title: "First Week Ledger",
      entries: [
        "You have the keys, the note at Ash Creek Savings, and a county waiting to see what you do first.",
        "Review fields, equipment, credit, contracts, and salvage before advancing the week."
      ]
    },
    flags: {
      marketNote: false,
      bankNote: false,
      priceNote: false,
      harvestDelayWeek: null
    }
  };

  appendLog(state, `New game started as ${bg.name}.`, "success");
  return state;
}

export function getPlantCost(field, cropId) {
  const crop = CROP_TYPES[cropId];
  return crop ? Math.round(crop.plantCost + field.acres * 6) : 0;
}

function hasUpgrade(state, upgradeId) {
  return Boolean(state.progression?.upgrades?.includes(upgradeId));
}

export function getFertilizeCost(field) {
  return Math.round(BALANCE.fertilizerBase + field.acres * BALANCE.fertilizerPerAcre);
}

export function getWeedTreatmentCost(field) {
  return Math.round(BALANCE.weedTreatmentBase + field.acres * BALANCE.weedTreatmentPerAcre);
}

export function getRepairEstimate(state, equipmentId, { useParts = false } = {}) {
  const machine = state.equipment.find((entry) => entry.id === equipmentId);
  if (!machine) return null;

  const bg = background(state);
  const conditionGap = 100 - machine.condition;
  let cashCost = Math.round((machine.repairBase + conditionGap * 7) * bg.modifiers.repairCost);
  if (hasUpgrade(state, "shop_tools")) cashCost = Math.round(cashCost * 0.92);

  let partsUsed = 0;
  if (useParts && state.inventory.parts > 0) {
    partsUsed = Math.min(state.inventory.parts, Math.ceil(conditionGap / 18));
    cashCost = Math.max(35, cashCost - partsUsed * 95);
  }

  const premium = Math.round(cashCost * BALANCE.repairCreditPremiumRate);
  return {
    equipmentId,
    cashCost,
    creditCost: cashCost + premium,
    premium,
    partsUsed
  };
}

export function getHarvestCost(state, field) {
  if (!field.cropId) return 0;
  const crop = CROP_TYPES[field.cropId];
  const combine = state.equipment.find((item) => item.id === "combine");
  const roughMachineMultiplier = combine && combine.condition < BALANCE.poorEquipmentThreshold ? 1.16 : 1;
  return Math.round((crop.harvestCost + field.acres * 10) * roughMachineMultiplier);
}

export function expectedYield(state, field) {
  if (!field.cropId) return 0;
  const crop = CROP_TYPES[field.cropId];
  const bg = background(state);
  const conditionMultiplier = 0.52 + field.condition / 220;
  const stressPenalty = field.stress > 70 ? 0.86 : field.stress > 55 ? 0.93 : 1;
  const storageBump = hasUpgrade(state, "grain_storage") ? 1.02 : 1;
  return Number((field.acres * crop.baseYield * conditionMultiplier * bg.modifiers.cropYield * stressPenalty * storageBump).toFixed(1));
}

function buildScoutReport(state, field) {
  const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
  const expected = crop ? expectedYield(state, field) : 0;
  const issues = [];

  if (field.weeds >= 55) {
    issues.push("Scout found heavy weed pressure. Treating this week protects yield before it slips again.");
  } else if (field.weeds >= 35) {
    issues.push("Scout found early weed pressure. Spraying is worth considering if cash is not tight.");
  } else {
    issues.push("Scout found no urgent weed issue. Save spray money unless rain wakes the field up.");
  }

  if (field.fertility < 44) {
    issues.push("Fertility is the limiting factor. Fertilizer helps, but it will not erase a rough stand.");
  }

  if (field.stress > 60) {
    issues.push("Stress is high. A hot or stormy week could make waiting expensive.");
  }

  if (field.ready) {
    issues.push("Crop is ready. Waiting more than a week risks weather taking part of the crop.");
  } else if (crop) {
    const stage = crop.stages[field.stageIndex];
    const weeks = Math.max(0, stage.weeks - field.weeksInStage);
    issues.push(`Expected yield range is about ${Math.max(0, Math.round(expected * 0.88)).toLocaleString("en-US")}-${Math.round(expected * 1.04).toLocaleString("en-US")} ${crop.unit}; next stage is roughly ${weeks || 1} week(s) away.`);
  }

  return issues.join(" ");
}

export function fieldRecommendation(state, field) {
  if (!field.cropId) {
    if (field.fertility < 48) return "Soil is tired. Fertilize before planting anything expensive.";
    if (field.weeds > 38) return "Weeds are gaining. Treat or plant a crop that can stand rough ground.";
    return "Ground is open. Pick a crop based on cash timing and the week's bid sheet.";
  }

  const crop = CROP_TYPES[field.cropId];
  if (field.scouted && field.scoutReport) return field.scoutReport;
  if (field.ready) {
    const cost = getHarvestCost(state, field);
    if (state.financials.cash < cost) {
      return "Ready to harvest. Cash is short, but harvest can go on credit. Waiting risks weather loss.";
    }
    return "Ready to harvest. Get it out before weather starts taking its share.";
  }
  if (field.weeds > 50) return "Weeds are stealing yield. Spray before the stand loses more ground.";
  if (field.fertility < 44) return "Fertility is low. Feed the crop before the next stage.";
  if (field.stress > 62) return "Stress is high. Scout before spending more money blind.";
  return `${crop.name} is moving. Watch weather, weeds, and machine condition.`;
}

export function getFinancialWarnings(state) {
  const remaining = getCreditRemaining(state);
  const warnings = [];
  if (state.financials.cash < 0) {
    warnings.push("Cash is below zero. Use revenue, credit, or debt payment carefully.");
  }
  if (state.financials.creditUsed / state.financials.creditLimit >= BALANCE.operatingNoteWarning) {
    warnings.push("Operating credit is getting tight. Earl will want a cleaner story soon.");
  }
  if (remaining < 750) {
    warnings.push(`Only ${dollars(remaining)} remains on the operating line.`);
  }
  if (state.reputation < 35) {
    warnings.push("County standing is low. Neighbor work thins out and Earl tightens the operating line.");
  }
  return warnings;
}

export function plantCrop(state, fieldId, cropId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  const crop = CROP_TYPES[cropId];
  if (!field || !crop) return finish(next, false, "That planting choice is not available.");
  if (field.cropId) return finish(next, false, `${field.name} already has a crop standing.`);
  const cost = getPlantCost(field, cropId);
  const payment = spend(next, cost, `Planting ${crop.name}`);
  if (!payment.ok) return finish(next, false, payment.message);

  field.cropId = cropId;
  field.stageIndex = 0;
  field.weeksInStage = 0;
  field.plantedWeek = next.time.week;
  field.ready = false;
  field.scouted = false;
  field.tested = false;
  field.scoutReport = null;
  field.fertility = clamp(field.fertility - BALANCE.seedFertilityImpact);
  field.lastAction = `Planted ${crop.name}`;
  recalcCondition(field);
  return finish(next, true, `${field.name} planted in ${crop.name} for ${dollars(cost)}.`);
}

export function soilTest(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const payment = spend(next, BALANCE.soilTestCost, "Soil test");
  if (!payment.ok) return finish(next, false, payment.message);
  field.tested = true;
  field.lastAction = "Soil test";
  return finish(next, true, `${field.name} soil test complete. ${fieldRecommendation(next, field)}`);
}

export function scoutField(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  field.scouted = true;
  field.stress = clamp(field.stress - 2);
  field.scoutReport = buildScoutReport(next, field);
  field.lastAction = "Scouted";
  recalcCondition(field);
  return finish(next, true, `${field.name} scouted. ${field.scoutReport}`);
}

export function fertilizeField(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const cost = getFertilizeCost(field);
  const payment = spend(next, cost, "Fertilizer");
  if (!payment.ok) return finish(next, false, payment.message);
  field.fertility = clamp(field.fertility + 20);
  field.weeds = clamp(field.weeds + 3);
  field.scouted = false;
  field.scoutReport = null;
  field.lastAction = "Fertilized";
  recalcCondition(field);
  return finish(next, true, `${field.name} fertilized for ${dollars(cost)}. Weeds may answer back.`);
}

export function treatWeeds(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const cost = getWeedTreatmentCost(field);
  const payment = spend(next, cost, "Weed treatment");
  if (!payment.ok) return finish(next, false, payment.message);
  field.weeds = clamp(field.weeds - 28);
  field.stress = clamp(field.stress + 2);
  field.scouted = false;
  field.scoutReport = null;
  field.lastAction = "Treated weeds";
  recalcCondition(field);
  return finish(next, true, `${field.name} treated for weeds for ${dollars(cost)}.`);
}

export function leaveFallow(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  if (field.cropId) return finish(next, false, `${field.name} has a standing crop. Fallow is not available.`);
  field.fertility = clamp(field.fertility + 7);
  field.weeds = clamp(field.weeds + 5);
  field.stress = clamp(field.stress - 5);
  field.scouted = false;
  field.scoutReport = null;
  field.lastAction = "Left fallow";
  recalcCondition(field);
  return finish(next, true, `${field.name} rested. Fertility improved, but weeds kept working too.`);
}

export function harvestField(state, fieldId, { useCredit = false } = {}) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field || !field.cropId) return finish(next, false, "There is no crop to harvest.");
  if (!field.ready) return finish(next, false, `${field.name} is not ready to harvest yet.`);
  if (next.flags.harvestDelayWeek === next.time.week) {
    return finish(next, false, "Fields are too wet for a clean harvest this week. Wait for firmer ground or risk bigger losses.");
  }

  const crop = CROP_TYPES[field.cropId];
  const cost = getHarvestCost(next, field);
  const needsCredit = next.financials.cash < cost;
  const payment = spend(next, cost, `Harvesting ${field.name}`, { allowCredit: useCredit || needsCredit });
  if (!payment.ok) return finish(next, false, payment.message);

  const combine = next.equipment.find((item) => item.id === "combine");
  const machinePenalty = combine.condition < BALANCE.poorEquipmentThreshold ? 0.93 : 1;
  const yieldAmount = Number((expectedYield(next, field) * machinePenalty).toFixed(1));
  next.inventory.crops[crop.id] = Number((next.inventory.crops[crop.id] + yieldAmount).toFixed(1));
  combine.condition = clamp(combine.condition - 7);
  const tractor = next.equipment.find((item) => item.id === "tractor");
  tractor.condition = clamp(tractor.condition - 2);

  const fieldName = field.name;
  field.cropId = null;
  field.stageIndex = 0;
  field.weeksInStage = 0;
  field.plantedWeek = null;
  field.ready = false;
  field.fertility = clamp(field.fertility - 8);
  field.stress = clamp(field.stress + 4);
  field.weeds = clamp(field.weeds + 4);
  field.lastAction = `Harvested ${crop.name}`;
  recalcCondition(field);

  const financeText =
    payment.financed > 0
      ? ` Harvest cost put ${dollars(payment.financed)} on credit. You can get it done, but Earl will see it.`
      : "";
  return finish(
    next,
    true,
    `${fieldName} harvested: ${yieldAmount.toLocaleString("en-US")} ${crop.unit} ${crop.name} stored.${financeText}`,
    payment.financed > 0 ? "warning" : "success"
  );
}

export function sellCrop(state, cropId, amount = "all") {
  const next = cloneState(state);
  const crop = CROP_TYPES[cropId];
  if (!crop) return finish(next, false, "That crop is not in the elevator sheet.");
  const stored = next.inventory.crops[cropId] ?? 0;
  const qty = amount === "all" ? stored : Math.min(stored, Number(amount));
  if (qty <= 0) return finish(next, false, `No ${crop.name} is stored to sell.`);
  const price = next.marketPrices[cropId]?.price ?? crop.basePrice;
  const revenue = qty * price;
  next.inventory.crops[cropId] = Number((stored - qty).toFixed(1));
  const incomeText = earn(next, revenue, `Sold ${qty.toLocaleString("en-US")} ${crop.unit} ${crop.name}`);
  return finish(next, true, `${incomeText} Elevator bid was ${dollars(price)} per ${crop.unit}.`);
}

export function buySalvage(state, instanceId) {
  const next = cloneState(state);
  const item = next.salvageYard.find((entry) => entry.instanceId === instanceId);
  if (!item) return finish(next, false, "That salvage item is gone.");
  const payment = spend(next, item.cost, `Buying ${item.name}`);
  if (!payment.ok) return finish(next, false, payment.message);
  next.salvageYard = next.salvageYard.filter((entry) => entry.instanceId !== instanceId);
  next.inventory.salvage.push({
    ...item,
    inventoryId: `${instanceId}-owned-${next.inventory.salvage.length}`,
    acquiredWeek: next.time.week
  });
  return finish(
    next,
    true,
    `${item.name} bought for ${dollars(item.cost)}. It can be sold, stripped, flipped, or used on equipment.`
  );
}

export function sellSalvage(state, inventoryId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  if (!item) return finish(next, false, "Salvage item not found.");
  const value = Math.round(item.scrapValue * (0.9 + item.condition / 220));
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  const incomeText = earn(next, value, `Sold ${item.name} for scrap`);
  return finish(next, true, `${incomeText} Not pretty money, but it is money.`);
}

export function stripSalvage(state, inventoryId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  if (!item) return finish(next, false, "Salvage item not found.");
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  next.inventory.parts += item.partsYield;
  return finish(next, true, `${item.name} stripped into ${item.partsYield} usable salvage parts.`);
}

export function repairAndFlipSalvage(state, inventoryId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  if (!item) return finish(next, false, "Salvage item not found.");
  const bg = background(next);
  const repairCost = Math.round(item.repairCost * bg.modifiers.repairCost);
  const payment = spend(next, repairCost, `Repairing ${item.name}`, { allowCredit: true });
  if (!payment.ok) return finish(next, false, payment.message);

  const riskRoll = noise(next.seed + next.time.week, item.cost + item.condition);
  const mechanicBonus = bg.id === "mechanic" ? 0.16 : 0;
  const successChance = clamp(0.82 - item.risk + mechanicBonus, 0.25, 0.95);
  const payout = riskRoll <= successChance ? item.flipValue : Math.round(item.scrapValue * 1.05);
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  const incomeText = earn(next, payout, `Flipped ${item.name}`);
  const resultText =
    payout >= item.flipValue ? "The fix held long enough to sell clean." : "The fix fought back. You salvaged what value you could.";
  return finish(next, true, `${incomeText} ${resultText}`);
}

export function useSalvageOnEquipment(state, inventoryId, equipmentId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  const machine = next.equipment.find((entry) => entry.id === equipmentId);
  if (!item || !machine) return finish(next, false, "That equipment salvage choice is not available.");
  const directFit = item.helps.includes(machine.id);
  const repairBoost = directFit ? 14 : 7;
  machine.condition = clamp(machine.condition + repairBoost);
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  return finish(
    next,
    true,
    `${item.name} used on ${machine.name}. Condition improved ${repairBoost} points${directFit ? "." : " after some improvising."}`
  );
}

export function repairEquipment(state, equipmentId, { useParts = false, useCredit = false } = {}) {
  const next = cloneState(state);
  const machine = next.equipment.find((entry) => entry.id === equipmentId);
  if (!machine) return finish(next, false, "Equipment not found.");
  if (machine.condition >= 92) return finish(next, false, `${machine.name} is already in good working order.`);
  const estimate = getRepairEstimate(next, equipmentId, { useParts });
  const explicitCredit = useCredit && !useParts;
  const cost = explicitCredit ? estimate.creditCost : estimate.cashCost;
  const payment = spend(next, cost, `Repairing ${machine.name}`, {
    allowCredit: useCredit,
    creditOnly: explicitCredit
  });
  if (!payment.ok) return finish(next, false, payment.message);
  next.inventory.parts -= estimate.partsUsed;
  machine.condition = clamp(machine.condition + 28 + estimate.partsUsed * 4, 0, 96);
  machine.lastRepairWeek = next.time.week;
  const financeText =
    payment.financed > 0
      ? explicitCredit
        ? ` ${dollars(payment.financed)} financed; includes ${dollars(estimate.premium)} shop/credit premium.`
        : ` ${dollars(payment.financed)} went on credit.`
      : "";
  const partText = estimate.partsUsed > 0 ? ` Used ${estimate.partsUsed} salvage part${estimate.partsUsed === 1 ? "" : "s"}.` : "";
  return finish(next, true, `${machine.name} repaired for ${dollars(cost)}.${partText}${financeText}`);
}

export function acceptContract(state, contractId) {
  const next = cloneState(state);
  const contract = next.contracts.find((entry) => entry.id === contractId);
  if (!contract) return finish(next, false, "Contract not found.");
  if (contract.status !== "available") return finish(next, false, `${contract.title} is already ${contract.status}.`);
  if (next.reputation < (contract.minReputation ?? 0)) {
    return finish(next, false, `${contract.title} needs county standing of ${contract.minReputation} or better.`);
  }
  contract.status = contract.instant ? "ready_to_complete" : "in_progress";
  contract.acceptedWeek = next.time.week;
  contract.readyWeek = next.time.week + (contract.durationWeeks ?? 1);
  contract.deadlineWeek = next.time.week + contract.deadlineWeeks;
  contract.weeksLeft = contract.deadlineWeeks;
  const timing =
    contract.status === "ready_to_complete"
      ? "This is an immediate small job."
      : `Work will be ready to settle after ${contract.durationWeeks ?? 1} week(s).`;
  return finish(next, true, `${contract.title} accepted. Deadline: ${contract.weeksLeft} week(s). ${timing}`);
}

function requirementFailure(state, contract) {
  const req = contract.requirements ?? {};
  if (req.equipment) {
    for (const [equipmentId, minimum] of Object.entries(req.equipment)) {
      const machine = state.equipment.find((entry) => entry.id === equipmentId);
      if (!machine || machine.condition < minimum) {
        return `${machine?.name ?? equipmentId} needs to be at least ${minimum}% condition.`;
      }
    }
  }
  if (req.parts && state.inventory.parts < req.parts) {
    return `Needs ${req.parts} salvage part${req.parts === 1 ? "" : "s"}.`;
  }
  return null;
}

export function completeContract(state, contractId) {
  const next = cloneState(state);
  const contract = next.contracts.find((entry) => entry.id === contractId);
  if (!contract) return finish(next, false, "Contract not found.");
  if (contract.status === "in_progress") {
    const remaining = Math.max(1, (contract.readyWeek ?? next.time.week + 1) - next.time.week);
    return finish(next, false, `${contract.title} is still in progress. Check back after ${remaining} week(s).`);
  }
  if (contract.status !== "ready_to_complete") return finish(next, false, "Accept the contract and let the work progress before completing it.");

  const failure = requirementFailure(next, contract);
  if (failure) return finish(next, false, `${contract.title} cannot be completed yet. ${failure}`);

  const req = contract.requirements ?? {};
  let costNote = "";
  if (req.parts) {
    next.inventory.parts -= req.parts;
    costNote = ` Used ${req.parts} salvage part${req.parts === 1 ? "" : "s"}.`;
  }
  if (req.partsOrCash) {
    if (next.inventory.parts >= req.partsOrCash.parts) {
      next.inventory.parts -= req.partsOrCash.parts;
      costNote = ` Used ${req.partsOrCash.parts} salvage part.`;
    } else {
      const payment = spend(next, req.partsOrCash.cash, contract.title, { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      costNote = ` Covered supplies for ${dollars(req.partsOrCash.cash)}.`;
    }
  }
  if (req.cashCost) {
    const payment = spend(next, req.cashCost, contract.title, { allowCredit: true });
    if (!payment.ok) return finish(next, false, payment.message);
    costNote += payment.financed > 0 ? ` ${dollars(payment.financed)} fuel went on credit.` : ` Fuel cost ${dollars(req.cashCost)}.`;
  }
  if (contract.wear) {
    const worn = [];
    for (const [equipmentId, amount] of Object.entries(contract.wear)) {
      const machine = next.equipment.find((entry) => entry.id === equipmentId);
      if (!machine) continue;
      machine.condition = clamp(machine.condition - amount);
      worn.push(`${machine.name} -${amount}%`);
    }
    if (worn.length) costNote += ` Machine wear: ${worn.join(", ")}.`;
  }

  contract.status = "completed";
  contract.completedWeek = next.time.week;
  const reward = Math.round(contract.reward * reputationStanding(next.reputation).rewardMultiplier);
  next.reputation = clamp(next.reputation + contract.reputation, 0, 100);
  next.relationships[contract.npcId] = (next.relationships[contract.npcId] ?? 0) + 3;
  const incomeText = earn(next, reward, contract.title);
  return finish(next, true, `${incomeText}${costNote} Reputation +${contract.reputation}.`);
}

export function talkToNpc(state, npcId) {
  const next = cloneState(state);
  const npc = NPCS[npcId];
  if (!npc) return finish(next, false, "That person is not around.");
  next.relationships[npcId] = (next.relationships[npcId] ?? 0) + 2;
  let result = npc.dialogue;

  if (npc.effect === "reputation") {
    next.reputation = clamp(next.reputation + 1);
    result += " Patti's counter talk nudges your reputation up.";
  }
  if (npc.effect === "reputation_big") {
    next.reputation = clamp(next.reputation + 2);
    result += " Sandy makes sure the county notice board shows you helped.";
  }
  if (npc.effect === "field_stress") {
    const stressed = [...next.fields].sort((a, b) => b.stress - a.stress)[0];
    stressed.stress = clamp(stressed.stress - 5);
    recalcCondition(stressed);
    result += ` Hollis walks ${stressed.name}; stress drops.`;
  }
  if (npc.effect === "market_note") {
    next.flags.marketNote = true;
    result += " Marge marks the week's best input timing on your ledger.";
  }
  if (npc.effect === "bank_note") {
    next.flags.bankNote = true;
    result += " Earl lays out the note before it turns into a surprise.";
  }
  if (npc.effect === "equipment_bump") {
    const roughest = [...next.equipment].sort((a, b) => a.condition - b.condition)[0];
    roughest.condition = clamp(roughest.condition + 4);
    result += ` Roy adjusts ${roughest.name}; condition improves.`;
  }
  if (npc.effect === "salvage_refresh") {
    const fresh = generateSalvageMarket(next.time.week + next.salvageYard.length + 1, next.player.backgroundId, next.seed)[0];
    next.salvageYard = [fresh, ...next.salvageYard].slice(0, 4);
    result += " Gus drags another questionable opportunity into the yard.";
  }
  if (npc.effect === "price_note") {
    next.flags.priceNote = true;
    result += " Dee circles the bid most worth watching.";
  }

  return finish(next, true, `${npc.name}: "${result}"`);
}

export function payDebt(state, amount) {
  const next = cloneState(state);
  const paymentAmount = Math.min(Math.round(amount), next.financials.debt);
  if (paymentAmount <= 0) return finish(next, false, "There is no debt payment to make.");
  if (next.financials.cash < paymentAmount) {
    return finish(next, false, `Paying ${dollars(paymentAmount)} requires cash on hand.`);
  }
  next.financials.cash -= paymentAmount;
  next.financials.debt -= paymentAmount;
  next.financials.creditUsed = Math.max(0, next.financials.creditUsed - paymentAmount);
  return finish(next, true, `Paid ${dollars(paymentAmount)} toward debt.`);
}

export function drawCredit(state, amount) {
  const next = cloneState(state);
  const draw = Math.round(amount);
  if (draw <= 0) return finish(next, false, "Credit draw must be positive.");
  if (draw > getCreditRemaining(next)) {
    return finish(next, false, `Only ${dollars(getCreditRemaining(next))} remains on the operating line.`);
  }
  next.financials.cash += draw;
  next.financials.debt += draw;
  next.financials.creditUsed += draw;
  return finish(next, true, `Drew ${dollars(draw)} from the operating line. Useful money, not free money.`);
}

export function purchaseProgression(state, upgradeId) {
  const next = cloneState(state);
  const upgrade = PROGRESSION_UPGRADES.find((entry) => entry.id === upgradeId);
  if (!upgrade) return finish(next, false, "That farm improvement is not available.");
  next.progression = next.progression ?? { upgrades: [] };
  next.progression.upgrades = next.progression.upgrades ?? [];
  if (next.progression.upgrades.includes(upgradeId)) return finish(next, false, `${upgrade.title} is already done.`);
  if (next.reputation < upgrade.reputationRequired) {
    return finish(next, false, `${upgrade.title} needs county standing of ${upgrade.reputationRequired} or better.`);
  }
  const payment = spend(next, upgrade.cost, upgrade.title);
  if (!payment.ok) return finish(next, false, payment.message);

  next.progression.upgrades.push(upgradeId);
  if (upgradeId === "lease_back_20" && !next.fields.some((field) => field.id === "hollis_back_20")) {
    next.fields.push(
      createField({
        id: "hollis_back_20",
        name: "Hollis Back 20",
        acres: 20,
        soil: 66,
        fertility: 52,
        weeds: 36,
        stress: 18,
        condition: 58,
        note: "Leased neighbor ground. Productive enough, but it needs you to earn the lease every season."
      })
    );
  }

  return finish(next, true, `${upgrade.title} purchased for ${dollars(upgrade.cost)}. ${upgrade.benefit}`);
}

export function setLocation(state, locationId) {
  const next = cloneState(state);
  if (!LOCATIONS.some((location) => location.id === locationId)) return finish(next, false, "Location not found.");
  next.currentLocationId = locationId;
  return finish(next, true, `Arrived at ${LOCATIONS.find((location) => location.id === locationId).name}.`, "info");
}

function eventForWeek(state) {
  if (state.time.week < 2) return null;
  const roll = noise(state.seed + state.time.week, 310);
  if (roll > BALANCE.eventChance) return null;
  const matching = EVENT_TEMPLATES.filter(
    (event) =>
      state.time.week >= (event.minWeek ?? 1) &&
      (!event.weatherIds || event.weatherIds.includes(state.weather.id))
  );
  if (!matching.length) return null;
  const index = Math.floor(noise(state.seed + state.time.week, 315) * matching.length);
  return matching[index] ?? matching[0];
}

function recordEvent(state, event, entries) {
  if (!event) return;
  state.events = state.events ?? [];
  state.events.unshift({
    week: state.time.week,
    id: event.id,
    title: event.title,
    type: event.type,
    note: event.note
  });
  state.events = state.events.slice(0, 20);
  entries.push(`${event.title}: ${event.note}`);

  if (event.effect === "harvest_delay") {
    state.flags.harvestDelayWeek = state.time.week;
    for (const field of state.fields) {
      field.stress = clamp(field.stress + 3);
      field.scouted = false;
      field.scoutReport = null;
    }
    entries.push("Heavy fieldwork is a poor bet this week; ready crops may need to wait.");
  }

  if (event.effect === "drought") {
    for (const field of state.fields.filter((item) => item.cropId)) {
      field.stress = clamp(field.stress + 10);
      field.condition = clamp(field.condition - 4);
      field.scouted = false;
      field.scoutReport = null;
    }
    entries.push("Standing crops picked up drought stress.");
  }

  if (event.effect === "storm_damage") {
    const readyField = state.fields.find((field) => field.cropId && field.ready);
    if (readyField) {
      readyField.stress = clamp(readyField.stress + 12);
      readyField.condition = clamp(readyField.condition - 12);
      readyField.scouted = false;
      readyField.scoutReport = null;
      entries.push(`${readyField.name} took storm damage while ready. Yield potential fell.`);
    }
  }

  if (event.effect === "contract_push") {
    state.nextContractRefreshWeek = state.time.week;
  }

  if (event.effect === "bank_pressure" && state.financials.creditUsed > getEffectiveCreditLimit(state) * 0.6) {
    state.reputation = clamp(state.reputation - 1);
    entries.push("Bank pressure nicked your local standing. Earl wants cleaner numbers.");
  }
}

function archiveOldContracts(state, entries) {
  for (const contract of state.contracts) {
    if (contract.status === "completed" && state.time.week - contract.completedWeek >= BALANCE.contractArchiveWeeks) {
      contract.status = "archived";
      entries.push(`${contract.title} left the active contract board.`);
    }
    if (contract.status === "failed" && state.time.week - contract.failedWeek >= BALANCE.contractArchiveWeeks) {
      contract.status = "archived";
      entries.push(`${contract.title} was cleared off the board after the miss.`);
    }
  }
}

function refreshContracts(state, entries) {
  state.contracts = state.contracts ?? [];
  state.contractSequence = state.contractSequence ?? 0;
  state.nextContractRefreshWeek = state.nextContractRefreshWeek ?? state.time.week;

  const openContracts = state.contracts.filter((contract) =>
    ["available", "in_progress", "ready_to_complete"].includes(contract.status)
  );
  const availableCount = openContracts.filter((contract) => contract.status === "available").length;
  if (availableCount >= BALANCE.contractBoardTarget || state.time.week < state.nextContractRefreshWeek) return;

  const openTemplateIds = new Set(openContracts.map((contract) => contract.templateId ?? contract.id));
  const eligible = CONTRACT_TEMPLATES.filter(
    (template) => state.reputation >= (template.minReputation ?? 0) && !openTemplateIds.has(template.id)
  );
  if (!eligible.length) return;

  const needed = BALANCE.contractBoardTarget - availableCount;
  for (let count = 0; count < needed && eligible.length; count += 1) {
    const index = Math.floor(noise(state.seed + state.time.week + count, 520) * eligible.length);
    const [template] = eligible.splice(index, 1);
    state.contractSequence += 1;
    state.contracts.push(createContract(template, state.time.week, state.contractSequence));
    entries.push(`New contract posted: ${template.title}.`);
  }

  const spacing =
    BALANCE.contractRefreshMinWeeks +
    Math.floor(noise(state.seed + state.time.week, 525) * (BALANCE.contractRefreshMaxWeeks - BALANCE.contractRefreshMinWeeks + 1));
  state.nextContractRefreshWeek = state.time.week + spacing;
}

function progressContracts(state, entries) {
  for (const contract of state.contracts) {
    if (!["in_progress", "ready_to_complete"].includes(contract.status)) continue;

    if (contract.deadlineWeek && state.time.week >= contract.deadlineWeek && contract.status !== "completed") {
      contract.status = "failed";
      contract.failedWeek = state.time.week;
      nextContractFailure(state, contract);
      entries.push(`${contract.title} expired. ${contract.consequence}`);
      continue;
    }

    contract.weeksLeft = Math.max(0, (contract.deadlineWeek ?? state.time.week) - state.time.week);
    if (contract.status === "in_progress" && state.time.week >= (contract.readyWeek ?? state.time.week + 1)) {
      contract.status = "ready_to_complete";
      entries.push(`${contract.title} is ready to settle on the contract board.`);
    } else if (contract.status === "in_progress") {
      entries.push(`${contract.title} is in progress. ${contract.weeksLeft} week(s) remain.`);
    } else {
      entries.push(`${contract.title} is ready to complete. ${contract.weeksLeft} week(s) remain.`);
    }
  }
}

function nextContractFailure(state, contract) {
  state.reputation = clamp(state.reputation - Math.max(2, Math.floor(contract.reputation / 2)));
  if (contract.npcId) state.relationships[contract.npcId] = (state.relationships[contract.npcId] ?? 0) - 1;
}

export function advanceWeek(state) {
  const next = cloneState(state);
  const entries = [];
  const startingFinancials = {
    cash: next.financials.cash,
    debt: next.financials.debt,
    creditUsed: next.financials.creditUsed,
    reputation: next.reputation
  };
  if (next.time.week >= next.time.maxWeeks) {
    next.lastReport = buildCampaignReport(next);
    return finish(next, true, "Season report is ready.", "info");
  }

  next.time.week += 1;
  next.flags.harvestDelayWeek = null;
  next.weather = weatherForWeek(next.time.week, next.seed);
  next.marketPrices = marketForWeek(next.time.week, next.player.backgroundId, next.seed);
  if (next.time.week % 2 === 1) {
    next.salvageYard = generateSalvageMarket(next.time.week, next.player.backgroundId, next.seed);
    entries.push("Gus dragged a fresh row of salvage into view.");
  }

  recordEvent(next, eventForWeek(next), entries);

  for (const field of next.fields) {
    field.weeds = clamp(field.weeds + BALANCE.weedGrowthBase + next.weather.weed);
    field.fertility = clamp(field.fertility + next.weather.fertility);
    field.stress = clamp(field.stress + next.weather.stress);
    field.scouted = false;
    field.scoutReport = null;

    if (field.cropId) {
      const crop = CROP_TYPES[field.cropId];
      field.weeksInStage += 1;
      const stage = crop.stages[field.stageIndex];
      if (field.weeksInStage >= stage.weeks && field.stageIndex < crop.stages.length - 1) {
        field.stageIndex += 1;
        field.weeksInStage = 0;
        const newStage = crop.stages[field.stageIndex];
        field.ready = field.stageIndex === crop.stages.length - 1;
        entries.push(`${field.name} ${crop.name} moved into ${newStage.name}.`);
      }
    }
    recalcCondition(field);
    if (field.cropId && field.ready && next.weather.harvestLoss) {
      const loss = Math.round(next.weather.harvestLoss * 100);
      field.stress = clamp(field.stress + loss);
      field.condition = clamp(field.condition - loss);
      entries.push(`${field.name} was ready during storm weather. Expected yield slipped about ${loss}%.`);
    }
  }

  for (const machine of next.equipment) {
    let wear = 1 + Math.floor(noise(next.seed + next.time.week, machine.condition) * 3);
    if (hasUpgrade(next, "gravel_lot") && next.flags.harvestDelayWeek === next.time.week) wear = Math.max(1, wear - 1);
    machine.condition = clamp(machine.condition - wear);
    if (machine.condition < BALANCE.poorEquipmentThreshold) {
      entries.push(`${machine.name} is in risky shape at ${machine.condition}%.`);
    }
  }

  progressContracts(next, entries);
  archiveOldContracts(next, entries);
  refreshContracts(next, entries);

  if (next.time.week % BALANCE.interestEveryWeeks === 0 && next.financials.debt > 0) {
    const standing = reputationStanding(next.reputation);
    const rate = BALANCE.weeklyInterestRate + (standing.label === "Watched" ? 0.004 : standing.label === "Trusted" ? -0.002 : 0);
    const interest = Math.round(next.financials.debt * rate);
    next.financials.debt += interest;
    next.financials.expenses += interest;
    entries.push(`Ash Creek Savings added ${dollars(interest)} interest to the note (${standing.label.toLowerCase()} terms).`);
  }

  entries.unshift(`Week ${next.time.week} weather: ${next.weather.name}. ${next.weather.note}`);
  if (next.time.week === 18) {
    entries.push("Mid-season check: the old 18-week prototype mark is now just a checkpoint, not the finish line.");
  }
  if (next.time.week === next.time.maxWeeks) {
    entries.push("End-season checkpoint reached. Review the report before deciding how the farm carries forward.");
  }
  const warnings = getFinancialWarnings(next);
  entries.push(...warnings);
  entries.push(
    `Ledger movement: cash ${dollars(next.financials.cash - startingFinancials.cash)}, debt ${dollars(next.financials.debt - startingFinancials.debt)}, credit used ${dollars(next.financials.creditUsed - startingFinancials.creditUsed)}, reputation ${next.reputation - startingFinancials.reputation >= 0 ? "+" : ""}${next.reputation - startingFinancials.reputation}.`
  );
  if (entries.length === 1) entries.push("Quiet week. That is not the same as a free week.");

  next.lastReport = {
    title: `Week ${next.time.week} Report`,
    entries,
    finances: {
      cash: next.financials.cash,
      debt: next.financials.debt,
      creditRemaining: getCreditRemaining(next),
      reputation: next.reputation
    }
  };

  return finish(next, true, `Advanced to week ${next.time.week}. Review the report before making the next move.`, "info");
}

export function buildCampaignReport(state) {
  const cropValue = Object.entries(state.inventory.crops).reduce((sum, [cropId, qty]) => {
    const price = state.marketPrices[cropId]?.price ?? CROP_TYPES[cropId].basePrice;
    return sum + qty * price;
  }, 0);
  const netPosition = Math.round(state.financials.cash + cropValue - state.financials.debt);
  const result =
    netPosition >= -2500 && state.reputation >= 45
      ? "The farm is still under pressure, but Ash Creek believes you can keep it moving."
      : "The year hurt. The farm is not finished, but next season needs sharper choices.";
  return {
    title: "End-of-Season Report",
    entries: [
      `Cash: ${dollars(state.financials.cash)}.`,
      `Debt: ${dollars(state.financials.debt)}.`,
      `Stored crop value at current bids: ${dollars(cropValue)}.`,
      `Reputation: ${state.reputation}/100.`,
      result
    ],
    finances: {
      cash: state.financials.cash,
      debt: state.financials.debt,
      creditRemaining: getCreditRemaining(state),
      reputation: state.reputation
    }
  };
}

export function selectors(state) {
  const standing = reputationStanding(state.reputation);
  return {
    background: background(state),
    creditRemaining: getCreditRemaining(state),
    effectiveCreditLimit: getEffectiveCreditLimit(state),
    standing,
    activeContracts: state.contracts.filter((contract) => ["in_progress", "ready_to_complete"].includes(contract.status)),
    availableContracts: state.contracts.filter((contract) => contract.status === "available" && state.reputation >= (contract.minReputation ?? 0)),
    completedContracts: state.contracts.filter((contract) => contract.status === "completed"),
    failedContracts: state.contracts.filter((contract) => contract.status === "failed"),
    visibleContracts: state.contracts.filter((contract) => contract.status !== "archived"),
    progressionUpgrades: PROGRESSION_UPGRADES,
    purchasedUpgrades: state.progression?.upgrades ?? [],
    currentLocation: LOCATIONS.find((location) => location.id === state.currentLocationId) ?? LOCATIONS[0],
    warnings: getFinancialWarnings(state)
  };
}
