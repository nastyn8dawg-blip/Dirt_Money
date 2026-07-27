import {
  BACKGROUNDS,
  BALANCE,
  CONTRACT_TEMPLATES,
  CROP_TYPES,
  DIALOGUE_BANKS,
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
    lastSoilTestWeek: null,
    soilTestKnown: false,
    soilTestResult: null,
    soilTestSummary: null,
    soilRecommendation: null,
    lastScoutWeek: null,
    lastFertilizedWeek: null,
    lastFertilizedStage: null,
    lastWeedTreatmentWeek: null,
    lastWeedTreatmentStage: null,
    lastFallowWeek: null,
    currentYear: 1,
    cropPlantedThisYear: null,
    annualCashCropPlantedThisYear: null,
    cashCropHarvestedThisYear: false,
    lastCashCrop: null,
    previousYearCrop: null,
    fieldAvailabilityState: "open",
    fertilizerApplicationsThisCrop: 0,
    fertilizerAppliedWeeks: [],
    fertilizerStageApplied: [],
    fertilizerAppliedYear: null,
    weedTreatmentApplicationsThisCrop: 0,
    weedTreatmentAppliedWeeks: [],
    weedTreatmentStageApplied: [],
    hayCuttingsThisYear: 0,
    stressCauses: [],
    stressHistory: [],
    stressLockedInYieldLoss: 0,
    yieldLocked: false,
    lockedYield: null,
    previousCropId: null,
    rotationNote: null,
    rotationYieldModifier: 1,
    plantingWindow: null,
    latePlantingYieldModifier: 1,
    latePlantingNote: null,
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
    failedWeek: null,
    workStartedWeek: null,
    workCostPaid: false,
    choiceNote: null
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

function finish(state, ok, message, type = ok ? "success" : "warning", extra = {}) {
  appendLog(state, message, type);
  return { state, ok, message, type, ...extra };
}

function recalcCondition(field) {
  const weedScore = 100 - field.weeds;
  field.condition = clamp(
    Math.round(field.soil * 0.24 + field.fertility * 0.31 + weedScore * 0.24 + (100 - field.stress) * 0.21),
    5,
    100
  );
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function isAnnualCashCrop(cropId) {
  return cropId === "corn" || cropId === "soybeans";
}

function ensureFieldSeasonState(state, field) {
  if (field.currentYear !== state.time.year) {
    field.previousYearCrop = field.lastCashCrop ?? field.previousCropId ?? field.cropPlantedThisYear ?? field.previousYearCrop ?? null;
    field.currentYear = state.time.year;
    field.cropPlantedThisYear = null;
    field.annualCashCropPlantedThisYear = null;
    field.cashCropHarvestedThisYear = false;
    field.fieldAvailabilityState = field.cropId ? "standing_crop" : "open";
    field.fertilizerApplicationsThisCrop = 0;
    field.fertilizerAppliedWeeks = [];
    field.fertilizerStageApplied = [];
    field.fertilizerAppliedYear = null;
    field.weedTreatmentApplicationsThisCrop = 0;
    field.weedTreatmentAppliedWeeks = [];
    field.weedTreatmentStageApplied = [];
    field.hayCuttingsThisYear = 0;
    field.stressLockedInYieldLoss = 0;
  }
  field.fertilizerApplicationsThisCrop = field.fertilizerApplicationsThisCrop ?? 0;
  field.fertilizerAppliedWeeks = field.fertilizerAppliedWeeks ?? [];
  field.fertilizerStageApplied = field.fertilizerStageApplied ?? [];
  field.weedTreatmentApplicationsThisCrop = field.weedTreatmentApplicationsThisCrop ?? 0;
  field.weedTreatmentAppliedWeeks = field.weedTreatmentAppliedWeeks ?? [];
  field.weedTreatmentStageApplied = field.weedTreatmentStageApplied ?? [];
  field.stressCauses = field.stressCauses ?? [];
  field.stressHistory = field.stressHistory ?? [];
  field.stressLockedInYieldLoss = field.stressLockedInYieldLoss ?? 0;
  field.soilTestSummary = field.soilTestSummary ?? field.soilTestResult?.summary ?? null;
  field.plantingWindow = field.plantingWindow ?? null;
  field.latePlantingYieldModifier = field.latePlantingYieldModifier ?? 1;
  field.latePlantingNote = field.latePlantingNote ?? null;
  field.fieldAvailabilityState = field.fieldAvailabilityState ?? (field.cropId ? "standing_crop" : "open");
  return field;
}

function recordStressHistory(state, field, cause, delta, note) {
  ensureFieldSeasonState(state, field);
  if (!cause && delta === 0) return;
  field.stressHistory.unshift({
    year: state.time.year,
    week: state.time.week,
    cause,
    delta,
    note
  });
  field.stressHistory = field.stressHistory.slice(0, 8);
}

function fertilizerLimitFor(field) {
  if (!field.cropId) return 1;
  if (field.cropId === "corn") return 2;
  if (field.cropId === "soybeans") return 1;
  if (field.cropId === "hay") return 3;
  if (field.cropId === "winter_wheat") return 1;
  return 0;
}

function isEarlyWeedWindow(field) {
  if (!field.cropId) return true;
  if (field.ready) return false;
  if (field.cropId === "corn" || field.cropId === "soybeans") return field.stageIndex <= 1;
  if (field.cropId === "winter_wheat") return field.stageIndex <= 1;
  if (field.cropId === "hay") return field.stageIndex <= 2;
  if (field.cropId === "cover_crop") return field.stageIndex <= 1;
  return field.stageIndex <= 1;
}

export function weedControlWindowLabel(field) {
  if (!field.cropId) return field.weeds > 35 ? "Pre-plant cleanup window" : "No crop canopy yet";
  if (field.ready) return "Past yield window";
  if (isEarlyWeedWindow(field)) return "Early enough to matter";
  if (field.weeds >= 60 && field.stressCauses?.includes("weed pressure")) return "Late rescue only";
  return "Canopy established";
}

function baseStressCauses(state, field) {
  const causes = [];
  if (field.stress >= 58) causes.push("general crop pressure");
  if (state.weather?.id === "hot_wind" && field.cropId) causes.push("dry weather");
  if (state.flags?.harvestDelayWeek === state.time.week) causes.push("wet fields");
  if (field.weeds >= 48) causes.push("weed pressure");
  if (field.fertility < 45) causes.push("tired fertility");
  if (field.soil < 52) causes.push("thin soil");
  if (field.previousCropId && field.cropId && field.previousCropId === field.cropId) causes.push("repeat crop rotation");
  if (field.rotationNote && /tired|risk|repeat/i.test(field.rotationNote)) causes.push("rotation pressure");
  if (field.ready && field.yieldLocked) causes.push("yield already mostly set");
  if ((field.stressLockedInYieldLoss ?? 0) > 0) causes.push("locked-in yield loss");
  return unique(causes);
}

function syncStressCauses(state, field, extra = []) {
  field.stressCauses = unique([...baseStressCauses(state, field), ...extra]).slice(0, 5);
  return field.stressCauses;
}

export function stressSummary(state, field) {
  ensureFieldSeasonState(state, field);
  const causes = unique([...(field.stressCauses ?? []), ...baseStressCauses(state, field)]);
  const yieldPenaltyPercent =
    (field.stressLockedInYieldLoss ?? 0) > 0
      ? Math.round(field.stressLockedInYieldLoss)
      : field.ready && field.yieldLocked
      ? Math.max(0, Math.round((1 - Number(field.lockedYield ?? expectedYield(state, field)) / Math.max(1, expectedYield({ ...state }, { ...field, yieldLocked: false, lockedYield: null }))) * 100))
      : field.stress >= 70
        ? 14
        : field.stress >= 55
          ? 8
          : field.stress >= 40
            ? 4
            : 0;
  let recommendation = "Keep watching weather, weeds, and fertility.";
  let recoverableThisSeason = true;
  if (field.ready) {
    recommendation = "Yield is mostly locked. Harvest timing matters more than late inputs.";
    recoverableThisSeason = false;
  } else if (causes.includes("locked-in yield loss") || causes.includes("storm damage")) {
    recommendation = "Storm damage is partly locked in. Prevent more loss by harvesting on time and repairing field health next season.";
    recoverableThisSeason = false;
  } else if (causes.includes("weed pressure")) {
    recommendation = isEarlyWeedWindow(field)
      ? "Treat weeds before canopy closes to protect yield and reduce weed stress."
      : "The weed window is mostly past. Spraying now will not buy much yield.";
    recoverableThisSeason = isEarlyWeedWindow(field);
  } else if (causes.includes("tired fertility") || causes.includes("thin soil")) {
    recommendation = field.cropId && !field.ready
      ? "Timely fertilizer can help fertility stress, but cover crop or rotation helps the next crop more."
      : "Use cover crop, hay, or rotation to rebuild this field before the next cash crop.";
  } else if (causes.includes("dry weather")) {
    recommendation = "Rain is the real cure, but clean weeds and decent fertility keep stress from compounding.";
  } else if (causes.includes("repeat crop rotation") || causes.includes("rotation pressure")) {
    recommendation = "Rotate after harvest or plant cover crop to rebuild resilience.";
    recoverableThisSeason = false;
  }

  return {
    causes: causes.length ? causes : ["no urgent stress source"],
    primaryCause: causes[0] ?? "no urgent stress source",
    causeText: causes.length ? causes.join(", ") : "No urgent stress source.",
    effectText:
      yieldPenaltyPercent > 0
        ? `Yield potential reduced about ${yieldPenaltyPercent}%.`
        : "No major yield penalty showing yet.",
    recommendation,
    recoverableThisSeason,
    recoveryText: recommendation,
    yieldPenaltyPercent
  };
}

export function basicFieldObservation(state, field) {
  const stress = stressSummary(state, field);
  if (field.ready) return field.cropId === "cover_crop" ? "Cover crop ready to terminate" : "Harvest now";
  if (field.weeds >= 55) return "Weed pressure visible";
  if (field.stress >= 62) return `Stress rising: ${stress.causeText}`;
  if (field.fertility < 42) return "Soil looks tired";
  if (state.flags?.harvestDelayWeek === state.time.week) return "Too wet to work clean";
  if (field.previousCropId && field.cropId && field.previousCropId === field.cropId) return "Rotation concern";
  if (field.cropId) return "Looks clean enough this week";
  return "Open ground";
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

function baseWorkSlots(state) {
  let slots = BALANCE.defaultWorkSlots;
  if (state.progression?.upgrades?.includes("shop_tools")) slots += 1;
  return slots;
}

export function preparednessCap(state) {
  let cap = BALANCE.preparednessBaseCap ?? 0;
  if (state.player?.backgroundId === "it_nephew") cap = Math.max(cap, 1);
  if (state.progression?.upgrades?.includes("farm_office")) cap = Math.max(cap, 1);
  if (state.progression?.upgrades?.includes("organized_operation")) cap = Math.max(cap, 2);
  return cap;
}

function ensureWorkState(state) {
  const slotsPerWeek = baseWorkSlots(state);
  const bankedCap = preparednessCap(state);
  state.work = state.work ?? {};
  state.work.banked = Math.max(0, Math.min(bankedCap, state.work.banked ?? 0));
  state.work.bankedCap = bankedCap;
  state.work.slotsPerWeek = state.work.slotsPerWeek ?? slotsPerWeek;
  if (state.work.slotsPerWeek !== slotsPerWeek && state.work.remaining === state.work.slotsPerWeek) {
    state.work.remaining = slotsPerWeek + state.work.banked;
  }
  state.work.slotsPerWeek = slotsPerWeek;
  state.work.remaining = Math.max(0, Math.min(slotsPerWeek + state.work.banked, state.work.remaining ?? slotsPerWeek + state.work.banked));
  state.work.used = Math.max(0, slotsPerWeek + state.work.banked - state.work.remaining);
  state.work.spent = state.work.spent ?? [];
  state.work.unfinished = state.work.unfinished ?? [];
  return state.work;
}

function resetWorkSlots(state, banked = 0) {
  const slotsPerWeek = baseWorkSlots(state);
  const bankedCap = preparednessCap(state);
  const prepared = Math.max(0, Math.min(bankedCap, banked));
  state.work = {
    slotsPerWeek,
    remaining: slotsPerWeek + prepared,
    used: 0,
    banked: prepared,
    bankedCap,
    spent: [],
    unfinished: []
  };
  return state.work;
}

export function workSlotText(cost) {
  const amount = Number(cost) || 0;
  return `${amount} work slot${amount === 1 ? "" : "s"}`;
}

export function preparednessText(state) {
  const work = ensureWorkState(state);
  if (!work.bankedCap && !work.banked) return "No preparedness banking";
  return `Preparedness +${work.banked} / cap ${work.bankedCap}`;
}

export function getWorkSlotCost(action, context = {}) {
  const normalized = normalizeFieldAction(action);
  if (normalized === "scout-field") return 0;
  if (action === "scout-all") return 1;
  if (normalized === "soil-test" || action === "soil-test-all") return 0;
  if (normalized === "fertilize-field") return 1;
  if (normalized === "treat-weeds") return 1;
  if (normalized === "plant-crop") return 1;
  if (normalized === "leave-fallow") return 1;
  if (normalized === "harvest-field" || normalized === "harvest-credit") return 2;
  if (action === "repair-equipment") return 1;
  if (action === "salvage-action") return 1;
  if (action === "event-choice") return context.workCost ?? 0;
  if (action === "contract-action") {
    const contract = context.contract;
    const contractId = contract?.templateId ?? contract?.id;
    if (contractId === "elevator_emergency" || contractId === "hollis_hay") return 2;
    return contract?.workSlots ?? 1;
  }
  return context.workCost ?? 0;
}

function checkWorkSlots(state, cost, label = "That action") {
  const work = ensureWorkState(state);
  if (cost <= 0) return { ok: true, work, cost };
  if (work.remaining < cost) {
    return {
      ok: false,
      work,
      cost,
      message: `${label} needs ${workSlotText(cost)}, but only ${workSlotText(work.remaining)} remain this week. End the week to reset work capacity.`
    };
  }
  return { ok: true, work, cost };
}

function consumeWorkSlots(state, cost, label) {
  const check = checkWorkSlots(state, cost, label);
  if (!check.ok) return check;
  if (cost > 0) {
    check.work.remaining -= cost;
    check.work.used += cost;
    check.work.spent.unshift({
      week: state.time.week,
      year: state.time.year,
      label,
      cost
    });
    check.work.spent = check.work.spent.slice(0, 12);
  }
  return { ok: true, work: check.work, cost };
}

export function getWorkStatus(state) {
  return ensureWorkState(state);
}

export function workSlotStatus(state, cost, label = "That action") {
  const check = checkWorkSlots(state, cost, label);
  return {
    cost,
    label: workSlotText(cost),
    remaining: check.work.remaining,
    slotsPerWeek: check.work.slotsPerWeek,
    banked: check.work.banked,
    bankedCap: check.work.bankedCap,
    used: check.work.used,
    disabled: !check.ok,
    reason: check.ok ? `${label} uses ${workSlotText(cost)}.` : check.message
  };
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

export function createNewGame(backgroundId = "old_school", seedOverride = null) {
  const bg = BACKGROUNDS[backgroundId] ?? BACKGROUNDS.old_school;
  // Optional fixed seed keeps tests and replays deterministic; normal play
  // still varies run to run off the clock.
  const seed = Number.isInteger(seedOverride) ? seedOverride : Math.floor(Date.now() % 1000000);
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
    weeklyEvents: [],
    progression: {
      upgrades: []
    },
    work: {
      slotsPerWeek: BALANCE.defaultWorkSlots,
      remaining: BALANCE.defaultWorkSlots,
      used: 0,
      banked: 0,
      bankedCap: 0,
      spent: [],
      unfinished: []
    },
    npcInteractionFlags: {},
    completedDialogueRewards: {},
    weeklyNpcInteractions: {},
    stats: {
      contractsCompleted: 0,
      contractsFailed: 0,
      cropIncome: 0,
      cropHarvests: 0,
      upgradesPurchased: 0,
      majorEvents: 0
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
      harvestDelayWeek: null,
      inputDiscountWeek: null,
      usedEquipmentLeadWeek: null,
      endOfYearReady: false
    }
  };

  for (const field of state.fields) syncStressCauses(state, field);
  resetWorkSlots(state);
  state.weeklyEvents = generateWeeklyEvents(state);
  appendLog(state, `New game started as ${bg.name}.`, "success");
  return state;
}

export function getPlantCost(stateOrField, fieldOrCropId, maybeCropId) {
  const state = maybeCropId ? stateOrField : null;
  const field = maybeCropId ? fieldOrCropId : stateOrField;
  const cropId = maybeCropId ?? fieldOrCropId;
  const crop = CROP_TYPES[cropId];
  if (!crop) return 0;
  let cost = crop.plantCost + field.acres * 6;
  if (state && hasUpgrade(state, "used_planter_upgrade") && !crop.isCoverCrop) cost *= 0.97;
  if (state && state.flags?.inputDiscountWeek === state.time.week) cost *= 0.94;
  return Math.round(cost);
}

function hasUpgrade(state, upgradeId) {
  return Boolean(state.progression?.upgrades?.includes(upgradeId));
}

function actionStageKey(field) {
  if (!field.cropId) return "open";
  return `${field.cropId}:${field.stageIndex}`;
}

export function getFertilizeCost(stateOrField, maybeField) {
  const state = maybeField ? stateOrField : null;
  const field = maybeField ?? stateOrField;
  let cost = BALANCE.fertilizerBase + field.acres * BALANCE.fertilizerPerAcre;
  if (state && state.flags?.inputDiscountWeek === state.time.week) cost *= 0.9;
  return Math.round(cost);
}

export function getWeedTreatmentCost(stateOrField, maybeField) {
  const state = maybeField ? stateOrField : null;
  const field = maybeField ?? stateOrField;
  let cost = BALANCE.weedTreatmentBase + field.acres * BALANCE.weedTreatmentPerAcre;
  if (state && hasUpgrade(state, "better_sprayer")) cost *= 0.9;
  if (state && state.flags?.inputDiscountWeek === state.time.week) cost *= 0.9;
  return Math.round(cost);
}

export function weedTreatmentProfile(state, field) {
  const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
  const treatedThisWeek = field.weedTreatmentAppliedWeeks?.includes(state.time.week);
  const applications = field.weedTreatmentApplicationsThisCrop ?? 0;
  const sprayerBonus = hasUpgrade(state, "better_sprayer") ? 6 : 0;
  const base = {
    timing: "open",
    yieldBenefit: "none",
    expectedReduction: 0,
    stressReduction: 0,
    allowed: false,
    disabledReason: "",
    summary: "",
    expectedEffect: "",
    lowValue: false,
    treatedThisWeek
  };

  if (treatedThisWeek) {
    return {
      ...base,
      disabledReason: "Weed treatment already applied this week.",
      summary: "Treat again next week if pressure remains meaningful."
    };
  }

  if (field.weeds < 35) {
    return {
      ...base,
      disabledReason: "Weed pressure is already low.",
      summary: "Save cash and work slots unless weeds climb again."
    };
  }

  if (field.cropId && field.ready) {
    return {
      ...base,
      timing: "ready",
      disabledReason: "Crop is ready; spraying will not recover yield.",
      summary: "Harvest timing matters more than late weed cleanup."
    };
  }

  let timing = "open";
  let yieldBenefit = "none";
  let baseReduction = 22;
  let stressReduction = 0;
  let summary = "Pre-plant cleanup lowers weed pressure before the next crop, but does not boost yield by itself.";
  let expectedEffect = "Reduces weeds before planting.";
  let lowValue = false;

  if (field.cropId) {
    if (isEarlyWeedWindow(field)) {
      timing = "early";
      yieldBenefit = "high";
      baseReduction = 28;
      stressReduction = 5;
      summary = "Early weed treatment protects yield while the crop can still respond.";
      expectedEffect = "Reduces weeds and early weed-related stress.";
    } else {
      const lastGrowingStage = Math.max(0, (crop?.stages?.length ?? 2) - 2);
      const midWindow = field.stageIndex <= Math.max(1, lastGrowingStage - 1);
      if (midWindow) {
        timing = "mid";
        yieldBenefit = "moderate";
        baseReduction = 18;
        stressReduction = 2;
        summary = "Mid-season treatment lowers pressure, but yield recovery is smaller than an early pass.";
        expectedEffect = "Reduces weeds with moderate yield protection.";
      } else {
        timing = "late";
        yieldBenefit = "low";
        baseReduction = 10;
        stressReduction = 0;
        summary = "Late weed cleanup will not recover much yield, but can clean up pressure before harvest or next steps.";
        expectedEffect = "Reduces weeds; little to no yield recovery.";
        lowValue = true;
      }
    }
  }

  const diminishing = Math.max(0.45, 1 - applications * 0.2);
  const expectedReduction = Math.max(4, Math.min(field.weeds, Math.round((baseReduction + sprayerBonus) * diminishing)));
  return {
    ...base,
    timing,
    yieldBenefit,
    expectedReduction,
    stressReduction,
    allowed: true,
    disabledReason: "",
    summary,
    expectedEffect,
    lowValue
  };
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

export function getProgressionCost(state, upgrade) {
  if (!upgrade) return 0;
  let cost = upgrade.cost;
  if (state.flags?.usedEquipmentLeadWeek === state.time.week && upgrade.type === "Equipment upgrade") {
    cost *= 0.92;
  }
  return Math.round(cost);
}

export function getHarvestCost(state, field) {
  if (!field.cropId) return 0;
  const crop = CROP_TYPES[field.cropId];
  if (crop.isCoverCrop) return 0;
  const combine = state.equipment.find((item) => item.id === "combine");
  const roughMachineMultiplier = combine && combine.condition < BALANCE.poorEquipmentThreshold ? 1.16 : 1;
  const upgradeMultiplier = hasUpgrade(state, "harvest_upgrade") ? 0.92 : 1;
  return Math.round((crop.harvestCost + field.acres * 10) * roughMachineMultiplier * upgradeMultiplier);
}

export function expectedYield(state, field) {
  if (!field.cropId) return 0;
  if (field.ready && field.yieldLocked && field.lockedYield !== null && field.lockedYield !== undefined) {
    return Number(Number(field.lockedYield).toFixed(1));
  }
  const crop = CROP_TYPES[field.cropId];
  if (crop.isCoverCrop) return 0;
  const bg = background(state);
  const conditionMultiplier = 0.52 + field.condition / 220;
  const stressPenalty = field.stress > 70 ? 0.86 : field.stress > 55 ? 0.93 : 1;
  const storageBump = hasUpgrade(state, "grain_storage") ? 1.02 : 1;
  const planterBump = hasUpgrade(state, "used_planter_upgrade") ? 1.03 : 1;
  const rotationBump = field.rotationYieldModifier ?? 1;
  const plantingWindowBump = field.latePlantingYieldModifier ?? 1;
  const earlyWeedPenalty =
    (crop.id === "corn" || crop.id === "soybeans") && isEarlyWeedWindow(field) && field.weeds >= 50
      ? field.weeds >= 70
        ? 0.86
        : 0.93
      : 1;
  const lockedStressPenalty = Math.max(0.65, 1 - (field.stressLockedInYieldLoss ?? 0) / 100);
  return Number(
    (
      field.acres *
      crop.baseYield *
      conditionMultiplier *
      bg.modifiers.cropYield *
      stressPenalty *
      storageBump *
      planterBump *
      rotationBump *
      plantingWindowBump *
      earlyWeedPenalty *
      lockedStressPenalty
    ).toFixed(1)
  );
}

function cropName(cropId) {
  return CROP_TYPES[cropId]?.name ?? "None";
}

function soilTestCurrent(state, field) {
  if (field.soilTestResult?.year && field.soilTestResult.year !== state.time.year) return false;
  return Boolean(
    field.soilTestKnown &&
      field.lastSoilTestWeek &&
      state.time.week - field.lastSoilTestWeek < BALANCE.soilTestValidityWeeks
  );
}

function fertilityRating(value) {
  if (value < 38) return "Poor";
  if (value < 50) return "Low";
  if (value < 62) return "Medium";
  if (value < 76) return "Good";
  return "Excellent";
}

function soilHealthRating(value) {
  if (value < 52) return "Thin";
  if (value < 62) return "Tired";
  if (value < 74) return "Stable";
  return "Strong";
}

function rotationConcernLabel(rotation) {
  if (/repeat|tired/i.test(rotation.level)) return "Repeated Crop";
  if (/risk|managed/i.test(rotation.level)) return "Risky";
  if (/good|benefit/i.test(rotation.level)) return "Good";
  if (/unknown/i.test(rotation.level)) return "Unknown";
  return "Good";
}

function fertilizerRoiFor(state, field, fertility) {
  if (field.ready) return "None - crop is ready and yield is mostly set";
  if (field.cropId === "cover_crop") return "None - cover crop should build soil";
  if (fertility === "Poor" || fertility === "Low") {
    return field.cropId === "soybeans" ? "Medium - one modest pass only if cash allows" : "High - especially if planting corn or hay";
  }
  if (fertility === "Medium") return "Medium if planting corn, low for soybeans";
  return "Low right now - save cash unless a hungry crop is already standing";
}

function bestCropFitFor(state, field, fertility, soilHealth) {
  const cornWindow = plantingWindowStatus(state, "corn");
  const soybeanWindow = plantingWindowStatus(state, "soybeans");
  const cashTight = state.financials.cash < 1800;
  const wetProne = field.id === "creek_bottom" || /wet|rain|bottom/i.test(field.note ?? "");

  if (soilHealth === "Thin" || fertility === "Poor") return "Hay, cover crop, or soybeans";
  if (!cornWindow.allowed && !soybeanWindow.allowed) return "Cover crop or fallow this year";
  if (wetProne) {
    if (cornWindow.allowed) return cashTight ? "Soybeans if cash is tight; corn only with timing discipline" : "Corn if planting window is open; soybeans if cash is tight";
    if (soybeanWindow.allowed) return "Soybeans, then cover crop after harvest";
    return "Cover crop or fallow until next season";
  }
  if (cashTight && soybeanWindow.allowed) return "Soybeans - lower input risk";
  if (cornWindow.allowed && (fertility === "Good" || fertility === "Excellent")) return "Corn";
  if (soybeanWindow.allowed) return cornWindow.allowed ? "Soybeans or corn with modest fertilizer" : "Soybeans";
  return cornWindow.allowed ? "Corn with modest fertilizer" : "Cover crop or hay";
}

function thisYearSoilAction(state, field, fertility, soilHealth, fertilizerRoi) {
  const cornWindow = plantingWindowStatus(state, "corn");
  const soybeanWindow = plantingWindowStatus(state, "soybeans");
  if (field.cropId) {
    if (field.ready) return "Harvest timing matters more than new inputs. Do not spend on fertilizer or spray for yield recovery.";
    if (/High|Medium/.test(fertilizerRoi)) return `One fertilizer pass may still pay on this ${cropName(field.cropId)} if cash and work slots allow.`;
    return `Keep this ${cropName(field.cropId)} clean and avoid extra fertilizer unless conditions change.`;
  }
  if (!cornWindow.allowed && !soybeanWindow.allowed) {
    return "Too late for corn or soybeans this year. Plant cover crop, leave fallow, or prep for next season.";
  }
  if (soilHealth === "Thin" || fertility === "Poor" || fertility === "Low") {
    return "Do not sink expensive corn inputs here. Use hay, soybeans, cover crop, or fallow to manage risk.";
  }
  if (state.financials.cash < 1800 && soybeanWindow.allowed) {
    return "If cash is tight, plant soybeans and save fertilizer. Spend work slots on weeds and timing.";
  }
  if (cornWindow.allowed) return "Corn can work here if you budget one fertilizer pass and keep weeds down.";
  return "Soybeans are the cleaner cash-crop fit right now; cover crop is safer if the week is crowded.";
}

function nextYearSoilAction(state, field, fertility, soilHealth, rotationConcern) {
  if (soilHealth === "Thin" || fertility === "Poor" || fertility === "Low") {
    return "Rebuild with cover crop or hay before expecting strong corn yields next year.";
  }
  if (rotationConcern === "Repeated Crop" || rotationConcern === "Risky") {
    return "Rotate away from the repeated crop next year or budget extra fertility and weed control.";
  }
  if (field.id === "creek_bottom") return "Keep drainage and planting timing in mind before chasing extra fertilizer.";
  return "Use rotation and timely planting next year; this field can support a normal cash crop.";
}

export function buildSoilTestResult(state, field) {
  const rotation = rotationOutlook(state, field);
  const fertility = fertilityRating(field.fertility);
  const soilHealth = soilHealthRating(field.soil);
  const rotationConcern = rotationConcernLabel(rotation);
  const fertilizerRoi = fertilizerRoiFor(state, field, fertility);
  const bestCropFit = bestCropFitFor(state, field, fertility, soilHealth);
  const recommendation = thisYearSoilAction(state, field, fertility, soilHealth, fertilizerRoi);
  const nextSeasonNote = nextYearSoilAction(state, field, fertility, soilHealth, rotationConcern);
  const reason = `${field.name} tested at ${fertility.toLowerCase()} fertility with ${soilHealth.toLowerCase()} soil health. ${rotation.summary}`;
  const backgroundId = state.player?.backgroundId;
  const interpretation =
    backgroundId === "old_school"
      ? `Old School read: ${fertility === "Low" || soilHealth === "Thin" ? "This field will grow corn, but it will make you pay for it." : "This field can pay if timing and weeds stay honest."}`
      : backgroundId === "it_nephew"
        ? `Data read: ${state.financials.cash < 1800 ? "soybean input risk is lower at this cash level." : "fertilizer ROI should be judged against the crop window, not habit."}`
        : "Mechanic read: field risk is cheaper to prevent than to repair after the crop is stressed.";
  const summary = `${field.name}: ${fertility} fertility, ${bestCropFit.toLowerCase()}. ${recommendation}`;

  return {
    week: state.time.week,
    year: state.time.year,
    fieldId: field.id,
    fieldName: field.name,
    fertilityValue: field.fertility,
    soilValue: field.soil,
    weedPressure: field.weeds,
    stress: field.stress,
    fertilityRating: fertility,
    soilHealth,
    rotationConcern,
    fertilizerRoi,
    bestCropFit,
    recommendation,
    nextSeasonNote,
    reason,
    interpretation,
    summary,
    rotation: rotation.level,
    previousCropId: field.previousCropId
  };
}

function buildSoilRecommendation(state, field) {
  if (field.soilTestResult?.recommendation) return field.soilTestResult.recommendation;
  const rotation = rotationOutlook(state, field);
  const issues = [];
  if (field.fertility < 45) {
    issues.push("Soil test came back low on fertility. Fertilizer should pay if the crop is not already ready.");
  } else if (field.fertility >= 62) {
    issues.push("Soil test shows decent fertility. Save your cash unless stress or weeds show up.");
  } else {
    issues.push("Soil test shows middling fertility. Spend only where the crop can still respond.");
  }

  if (field.soil < 55) {
    issues.push("The soil profile is thin enough that cover crop or hay would help rebuild it.");
  }
  if (field.weeds > 40) {
    issues.push("Weed pressure is high enough to plan a spray pass before the crop gets too far along.");
  }
  if (field.previousCropId === "corn" && field.cropId === "corn") {
    issues.push("Tired ground after repeated corn is showing up. Rotate to soybeans or cover crop when you can.");
  } else if (rotation.level !== "Neutral") {
    issues.push(rotation.recommendation);
  }

  return issues.join(" ");
}

export function rotationOutlook(state, field, nextCropId = field.cropId) {
  const previous = field.previousCropId;
  const oldSchool = state.player?.backgroundId === "old_school";
  if (!previous) {
    return {
      level: "Unknown",
      summary: "No prior crop recorded yet.",
      recommendation: oldSchool
        ? "Old School read: get a soil test before guessing. This field has not shown its rotation pattern yet."
        : "Get a soil test before spending hard into this field."
    };
  }

  if (previous === "cover_crop") {
    return {
      level: "Cover Crop Benefit",
      summary: "Cover crop residue is helping this field recover.",
      recommendation: "A cash crop can use the cover crop benefit this season."
    };
  }
  if (previous === "hay") {
    return {
      level: "Good",
      summary: "Hay left the field in better shape than a hard cash-crop repeat.",
      recommendation: "This field can handle a cash crop, though weeds still need watching."
    };
  }
  if (previous === "corn" && nextCropId === "corn") {
    return {
      level: oldSchool ? "Managed Risk" : "Tired Ground",
      summary: oldSchool
        ? "Corn after corn will still cost fertility, but your field sense trims the mistake."
        : "Corn after corn will cost fertility unless you feed it.",
      recommendation: oldSchool
        ? "Old School warning: corn after corn needs feed and timing. Beans would be cleaner."
        : "Soybeans or cover crop would help this field recover."
    };
  }
  if (previous === "corn" && nextCropId === "soybeans") {
    return {
      level: "Good",
      summary: "Soybeans after corn lighten the fertility demand.",
      recommendation: "Beans are a sensible recovery crop after corn."
    };
  }
  if (previous === nextCropId) {
    return {
      level: "Repeat Risk",
      summary: `Repeating ${cropName(previous)} raises input needs.`,
      recommendation: `Rotate away from ${cropName(previous)} or budget more field care.`
    };
  }

  return {
    level: "Neutral",
    summary: `${cropName(previous)} before ${cropName(nextCropId)} is workable.`,
    recommendation: "No major rotation concern, but soil test before heavy inputs."
  };
}

function applyRotationAtPlant(state, field, cropId) {
  const outlook = rotationOutlook(state, field, cropId);
  const oldSchool = state.player?.backgroundId === "old_school";
  field.rotationNote = `${outlook.level}: ${outlook.summary}`;
  field.rotationYieldModifier = 1;

  if (field.previousCropId === "corn" && cropId === "corn") {
    const fertilityPenalty = oldSchool ? 3 : 7;
    const stressPenalty = oldSchool ? 2 : 5;
    field.fertility = clamp(field.fertility - fertilityPenalty);
    field.stress = clamp(field.stress + stressPenalty);
    field.rotationYieldModifier = oldSchool ? 0.98 : 0.94;
  }
  if (field.previousCropId === "corn" && cropId === "soybeans") {
    field.fertility = clamp(field.fertility + 4);
    field.stress = clamp(field.stress - 2);
    field.rotationYieldModifier = 1.03;
  }
  if (field.previousCropId === "cover_crop") {
    field.fertility = clamp(field.fertility + 8);
    field.stress = clamp(field.stress - 4);
    field.weeds = clamp(field.weeds - 5);
    field.rotationYieldModifier = 1.04;
  }
  if (field.previousCropId === "hay") {
    field.fertility = clamp(field.fertility + 3);
    field.rotationYieldModifier = 1.02;
  }

  return outlook;
}

function lockReadyYield(state, field, entries = null) {
  if (!field.cropId || !field.ready || field.yieldLocked) return;
  field.yieldLocked = true;
  field.lockedYield = expectedYield({ ...state, fields: state.fields }, { ...field, yieldLocked: false, lockedYield: null });
  if (entries) entries.push(`${field.name} yield is mostly set. Inputs will not add much now; harvest timing matters.`);
}

function reduceLockedYield(field, fraction) {
  if (field.yieldLocked && field.lockedYield !== null && field.lockedYield !== undefined) {
    const floor = Number(field.lockedYield) * BALANCE.readyYieldWeatherLossFloor;
    field.lockedYield = Number(Math.max(floor, Number(field.lockedYield) * (1 - fraction)).toFixed(1));
  }
}

export function seasonPhaseForWeek(week) {
  const normalized = ((week - 1) % BALANCE.maxWeeks) + 1;
  if (normalized <= 4) return "Early Spring";
  if (normalized <= 8) return "Late Spring";
  if (normalized <= 12) return "Early Summer";
  if (normalized <= 16) return "Mid Summer";
  if (normalized <= 21) return "Late Summer";
  if (normalized <= 26) return "Early Fall";
  if (normalized <= 32) return "Harvest Season";
  return "Late Fall / Winter Planning";
}

export function calendarLabel(state) {
  return `Year ${state.time.year} - Week ${state.time.week} - ${seasonPhaseForWeek(state.time.week)}`;
}

export function plantingWindowStatus(state, cropId) {
  const crop = CROP_TYPES[cropId];
  const week = ((state.time.week - 1) % BALANCE.maxWeeks) + 1;
  const phase = seasonPhaseForWeek(state.time.week);
  const open = (reason, extra = {}) => ({
    cropId,
    cropName: crop?.name ?? cropId,
    allowed: true,
    disabled: false,
    phase,
    timing: extra.timing ?? "Normal",
    yieldModifier: extra.yieldModifier ?? 1,
    late: Boolean(extra.late),
    reason
  });
  const closed = (reason) => ({
    cropId,
    cropName: crop?.name ?? cropId,
    allowed: false,
    disabled: true,
    phase,
    timing: "Closed",
    yieldModifier: 1,
    late: false,
    reason
  });

  if (!crop) return closed("That crop is not available.");
  if (cropId === "cover_crop") {
    return open("Cover crop can be planted to build soil or recover after the cash-crop window.", { timing: phase.includes("Fall") || phase.includes("Harvest") ? "Ideal cover window" : "Soil-building option" });
  }
  if (cropId === "winter_wheat") {
    return open("Winter wheat remains a flexible modest-cash crop in this build.", { timing: "Flexible" });
  }
  if (cropId === "hay") {
    if (week <= 16) return open("Hay can be established now.", { timing: "Good hay establishment" });
    if (week <= 26) {
      return open("Hay can be established, but yield will be limited this year.", {
        timing: "Late hay establishment",
        yieldModifier: 0.72,
        late: true
      });
    }
    return closed("Too late to establish useful hay this year. Plant cover crop, leave fallow, or prep for next season.");
  }
  if (cropId === "corn") {
    if (week <= 8) return open("Corn planting window is open.", { timing: "Corn window open" });
    if (week <= 12) {
      return open("Late corn is possible, but yield potential is reduced.", {
        timing: "Late corn - reduced yield potential",
        yieldModifier: 0.82,
        late: true
      });
    }
    return closed("Too late to plant corn this year. Plant cover crop, leave fallow, or prep for next season.");
  }
  if (cropId === "soybeans") {
    if (week < 5) return closed("Too early for soybeans. Wait for Late Spring, or choose corn/wheat if you need to plant now.");
    if (week <= 12) return open("Soybean planting window is open.", { timing: "Soybean window open" });
    if (week <= 16) {
      return open("Late soybeans are possible, but yield potential is reduced.", {
        timing: "Late soybeans - reduced yield potential",
        yieldModifier: 0.84,
        late: true
      });
    }
    return closed("Soybean planting window has passed. Plant cover crop, leave fallow, or prep for next season.");
  }

  return open(`${crop.name} can be planted now.`, { timing: "Open" });
}

export function contractStatusLabel(contract) {
  const labels = {
    available: "Available",
    accepted: "Action Needed",
    in_progress: "Waiting for Week Advance",
    ready_to_complete: "Ready to Complete",
    completed: "Completed",
    failed: "Failed",
    expired: "Expired",
    archived: "Archived"
  };
  return labels[contract.status] ?? contract.status.replaceAll("_", " ");
}

export function contractNextStep(state, contract) {
  if (contract.status === "available") return contract.nextStepText ?? contract.actionText ?? "Accept the job, then follow the deadline.";
  if (contract.status === "accepted") {
    return `${activeContractActionLabel(contract)}: ${contract.activeActionText ?? contract.actionText ?? "Do the job step before the deadline."}`;
  }
  if (contract.status === "in_progress") {
    const readyWeek = contract.readyWeek ?? state.time.week + 1;
    const weeks = Math.max(1, readyWeek - state.time.week);
    return `${contract.nextStepText ?? "Let the work progress."} ${weeks} week(s) before it can settle.`;
  }
  if (contract.status === "ready_to_complete") return contract.completionText ?? "Requirements are ready. Complete the contract on the board.";
  if (contract.status === "completed") return "Completed and waiting to clear from the board.";
  if (contract.status === "failed") return `Failed: ${contract.failureMessage ?? contract.failureReason ?? contract.consequence}`;
  return contract.nextStepText ?? "No current action.";
}

export function activeContractActionLabel(contract) {
  return contract.activeActionLabel ?? "Start Job";
}

function normalizeFieldAction(action) {
  const aliases = {
    scout: "scout-field",
    "scout-all": "scout-field",
    "soil-test-all": "soil-test",
    fertilize: "fertilize-field",
    "fertilize-all": "fertilize-field",
    "treat-weeds-all": "treat-weeds",
    plant: "plant-crop",
    harvest: "harvest-field",
    "harvest-all": "harvest-field",
    "harvest-credit": "harvest-credit",
    fallow: "leave-fallow"
  };
  return aliases[action] ?? action;
}

export function canPerformFieldAction(field, action, gameState, options = {}) {
  const state = gameState;
  ensureFieldSeasonState(state, field);
  const normalized = normalizeFieldAction(action);
  const stageKey = actionStageKey(field);
  const response = (allowed, reason, extra = {}) => ({
    action: normalized,
    allowed,
    disabled: !allowed,
    reason,
    cost: extra.cost ?? 0,
    workCost: extra.workCost ?? getWorkSlotCost(normalized, { ...options, field }),
    expectedEffect: extra.expectedEffect ?? "",
    weedReduction: extra.weedReduction ?? 0,
    yieldBenefit: extra.yieldBenefit ?? "",
    timing: extra.timing ?? "",
    creditAllowed: Boolean(extra.creditAllowed),
    repeatLimited: Boolean(extra.repeatLimited),
    cropId: extra.cropId ?? options.cropId ?? field.cropId ?? null
  });
  const checkedResponse = (allowed, reason, extra = {}) => {
    const result = response(allowed, reason, extra);
    if (result.allowed && !options.ignoreWork) {
      const check = checkWorkSlots(state, result.workCost, "This field action");
      if (!check.ok) return { ...result, allowed: false, disabled: true, reason: check.message };
    }
    return result;
  };

  if (normalized === "soil-test") {
    if (soilTestCurrent(state, field)) {
      return checkedResponse(false, `Soil test already current from Week ${field.lastSoilTestWeek}.`, {
        cost: BALANCE.soilTestCost,
        repeatLimited: true
      });
    }
    return checkedResponse(true, "Reveals fertility, soil pressure, stress causes, and rotation advice.", {
      cost: BALANCE.soilTestCost,
      expectedEffect: "Identifies fertility, tired soil, and rotation-related stress."
    });
  }

  if (normalized === "scout-field") {
    if (field.lastScoutWeek === state.time.week) {
      return checkedResponse(false, "Field already scouted this week.", { repeatLimited: true });
    }
    return checkedResponse(true, "Scout is free and updates weeds, stress causes, recovery advice, yield, and harvest timing.", {
      cost: 0,
      expectedEffect: "Free field knowledge; limited to once per week.",
      repeatLimited: true
    });
  }

  if (normalized === "fertilize-field") {
    const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
    const limit = fertilizerLimitFor(field);
    if (crop?.isCoverCrop) {
      return checkedResponse(false, "Cover crop should build soil, not take another fertilizer pass.", { repeatLimited: true });
    }
    if (field.cropId && field.ready) {
      return checkedResponse(false, "Too late to fertilize. Yield is mostly set.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (!field.cropId && field.fertility >= 42) {
      return checkedResponse(false, "No crop is using fertilizer right now. Use soil test, cover crop, or plant first.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (limit <= 0) {
      return checkedResponse(false, "Fertilizer is not recommended for this field state.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (field.fertilizerAppliedWeeks?.includes(state.time.week)) {
      return checkedResponse(false, "Fertilizer already applied this week.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (field.cropId && field.fertilizerStageApplied?.includes(stageKey)) {
      return checkedResponse(false, "Fertilizer already applied for this crop stage.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if ((field.fertilizerApplicationsThisCrop ?? 0) >= limit) {
      const cropNameText = crop?.name ?? "This field";
      const reason =
        field.cropId === "corn"
          ? "Corn has already received its main fertilizer passes."
          : field.cropId === "soybeans"
            ? "Soybeans will not return enough benefit from another pass."
            : `${cropNameText} has already received its meaningful fertilizer support.`;
      return checkedResponse(false, reason, {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (field.cropId === "corn" && field.stageIndex > 2) {
      return checkedResponse(false, "Too late to fertilize corn. Yield potential is mostly set.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    if (field.cropId === "soybeans" && field.stageIndex > 1) {
      return checkedResponse(false, "Soybeans are past the fertilizer window.", {
        cost: getFertilizeCost(state, field),
        repeatLimited: true
      });
    }
    const roiText = field.soilTestResult?.fertilizerRoi ? `Soil test ROI: ${field.soilTestResult.fertilizerRoi}. ` : "";
    return checkedResponse(true, `${roiText}Useful now if fertility is limiting yield; application count is limited for this crop cycle.`, {
      cost: getFertilizeCost(state, field),
      expectedEffect: "Raises fertility and can reduce fertility-related stress if applied early enough.",
      repeatLimited: true
    });
  }

  if (normalized === "treat-weeds") {
    const profile = weedTreatmentProfile(state, field);
    if (!profile.allowed) {
      return checkedResponse(false, profile.disabledReason, {
        cost: getWeedTreatmentCost(state, field),
        expectedEffect: profile.summary,
        weedReduction: profile.expectedReduction,
        yieldBenefit: profile.yieldBenefit,
        timing: profile.timing,
        repeatLimited: true
      });
    }
    return checkedResponse(true, `${profile.summary} Treat again next week if pressure remains.`, {
      cost: getWeedTreatmentCost(state, field),
      expectedEffect: profile.expectedEffect,
      weedReduction: profile.expectedReduction,
      yieldBenefit: profile.yieldBenefit,
      timing: profile.timing,
      repeatLimited: true
    });
  }

  if (normalized === "plant-crop") {
    const cropId = options.cropId;
    const crop = CROP_TYPES[cropId];
    if (!crop) return checkedResponse(false, "That crop is not available.", { cropId });
    if (field.cropId) return checkedResponse(false, `${field.name} already has a crop standing.`, { cropId });
    if (isAnnualCashCrop(cropId) && (field.annualCashCropPlantedThisYear || field.cashCropHarvestedThisYear)) {
      return checkedResponse(
        false,
        "Cash crop already planted or harvested this year. Plant cover crop, hay, leave fallow, or wait for next season.",
        { cropId, cost: getPlantCost(state, field, cropId), repeatLimited: true }
      );
    }
    const plantingWindow = plantingWindowStatus(state, cropId);
    if (!plantingWindow.allowed) {
      return checkedResponse(false, plantingWindow.reason, {
        cropId,
        cost: getPlantCost(state, field, cropId),
        timing: plantingWindow.timing,
        repeatLimited: true
      });
    }
    return checkedResponse(true, `${plantingWindow.reason} ${rotationOutlook(state, field, cropId).recommendation}`, {
      cropId,
      cost: getPlantCost(state, field, cropId),
      expectedEffect: plantingWindow.late
        ? `${plantingWindow.timing}. Expected yield is reduced.`
        : crop.isCoverCrop
          ? "Builds soil and rotation resilience."
          : "Starts a crop cycle.",
      timing: plantingWindow.timing,
      repeatLimited: isAnnualCashCrop(cropId)
    });
  }

  if (normalized === "harvest-field" || normalized === "harvest-credit") {
    if (!field.cropId) return checkedResponse(false, "There is no crop to harvest.");
    if (!field.ready) return checkedResponse(false, `${field.name} is not ready to harvest yet.`);
    if (state.flags?.harvestDelayWeek === state.time.week) {
      return checkedResponse(false, "Fields are too wet for a clean harvest this week.", {
        cost: getHarvestCost(state, field),
        creditAllowed: normalized === "harvest-credit"
      });
    }
    const cost = getHarvestCost(state, field);
    return checkedResponse(true, field.cropId === "cover_crop" ? "Cover crop can be terminated now." : "Crop is ready. Harvest timing matters more than new inputs.", {
      cost,
      expectedEffect: "Locks in crop or cover-crop outcome.",
      creditAllowed: normalized === "harvest-credit" || state.financials.cash < cost
    });
  }

  if (normalized === "leave-fallow") {
    if (field.cropId) return checkedResponse(false, "Standing crop is in the field.");
    if (field.lastFallowWeek === state.time.week) return checkedResponse(false, "This field has already been rested this week.", { repeatLimited: true });
    return checkedResponse(true, "Resting builds fertility and helps rotation recovery, but weeds can creep.", {
      expectedEffect: "Improves fertility and reduces rotation/stress pressure."
    });
  }

  return checkedResponse(true, "");
}

export function fieldActionStatus(state, field, action, options = {}) {
  const status = canPerformFieldAction(field, action, state, options);
  return { ...status, disabled: !status.allowed };
}

export function getWeeklyPriorities(state) {
  const priorities = [];
  const push = (urgency, text, screen = "dashboard") => priorities.push({ urgency, text, screen });
  const activeEvent = (state.weeklyEvents ?? []).find((event) => !event.handled && !event.expired);
  if (activeEvent) push(activeEvent.urgency ?? "High", `${activeEvent.source}: ${activeEvent.title}. ${activeEvent.message}`, "dashboard");
  const ready = state.fields.filter((field) => field.ready);
  if (ready.length) push("High", `${ready[0].name} is ready. Harvest before weather steals yield.`, "fields");
  const urgentContract = state.contracts.find(
    (contract) => ["accepted", "in_progress", "ready_to_complete"].includes(contract.status) && (contract.weeksLeft ?? 99) <= 1
  );
  if (urgentContract) push("High", `${urgentContract.title} is close to deadline. ${contractNextStep(state, urgentContract)}`, "contracts");
  const actionNeeded = state.contracts.find((contract) => contract.status === "accepted" && contract.id !== urgentContract?.id);
  if (actionNeeded) push("High", `${actionNeeded.title} needs action: ${contractNextStep(state, actionNeeded)}`, "contracts");
  const roughMachine = state.equipment.find((machine) => machine.condition < BALANCE.poorEquipmentThreshold);
  if (roughMachine) push("Medium", `${roughMachine.name} is at ${roughMachine.condition}%. Repair before hard work.`, "equipment");
  const stressedField = state.fields.find((field) => field.stress >= 58 && field.cropId && !field.ready);
  if (stressedField) {
    const stress = stressSummary(state, stressedField);
    push("Medium", `${stressedField.name} stress: ${stress.causeText}. ${stress.recommendation}`, "fields");
  }
  const soilNeed = state.fields.find((field) => !soilTestCurrent(state, field));
  if (soilNeed) push("Medium", `${soilNeed.name} needs a current soil test before expensive inputs.`, "fields");
  const soilAction = state.fields.find((field) => soilTestCurrent(state, field) && field.soilTestResult?.recommendation && !field.cropId);
  if (soilAction) push("Medium", `${soilAction.name} soil test: ${soilAction.soilTestResult.recommendation}`, "fields");
  const weedField = state.fields.find((field) => field.weeds > 45 && !field.ready);
  if (weedField) push("Medium", `${weedField.name} has weed pressure. Treat before the crop is too far along.`, "fields");
  if (state.reputation >= 90 && !state.flags?.highRepOpportunityAcknowledged) {
    push("High", "Ash Creek trusts you now. Hollis is willing to talk about the Back 20.", "map");
  }
  const affordableUpgrade = PROGRESSION_UPGRADES.find(
    (upgrade) => !(state.progression?.upgrades ?? []).includes(upgrade.id) && state.reputation >= upgrade.reputationRequired && state.financials.cash >= getProgressionCost(state, upgrade)
  );
  if (affordableUpgrade) push("Low", `${affordableUpgrade.title} is affordable and would give the farm another lever.`, "equipment");
  if (priorities.length === 0) push("Low", "Quiet week. Check contracts, equipment, and fields before ending it.", "dashboard");
  return priorities.slice(0, 6);
}

function buildScoutReport(state, field) {
  const crop = field.cropId ? CROP_TYPES[field.cropId] : null;
  const expected = crop ? expectedYield(state, field) : 0;
  const issues = [];

  if (field.ready) {
    issues.push("Crop is ready. Yield is mostly set; fertilizer and weed treatment will not pay this late.");
  }

  if (field.weeds >= 55) {
    issues.push(field.ready ? "Scout found heavy weeds, but harvest timing matters more than a late spray now." : "Scout found heavy weed pressure. Treating this week protects yield before it slips again.");
  } else if (field.weeds >= 35) {
    issues.push(field.ready ? "Scout found some weeds. Save spray money; the crop is already made." : "Scout found early weed pressure. Spraying is worth considering if cash is not tight.");
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
    issues.push("Waiting more than a week risks weather taking part of the crop.");
  } else if (crop) {
    const stage = crop.stages[field.stageIndex];
    const weeks = Math.max(0, stage.weeks - field.weeksInStage);
    issues.push(`Expected yield range is about ${Math.max(0, Math.round(expected * 0.88)).toLocaleString("en-US")}-${Math.round(expected * 1.04).toLocaleString("en-US")} ${crop.unit}; next stage is roughly ${weeks || 1} week(s) away.`);
  }

  if (field.soilTestKnown && field.soilRecommendation) {
    issues.push(`Soil note: ${field.soilRecommendation}`);
  }

  return issues.join(" ");
}

export function fieldRecommendation(state, field) {
  if (!field.cropId) {
    if (field.soilTestKnown && field.soilRecommendation) return field.soilRecommendation;
    if (field.previousCropId) return rotationOutlook(state, field, "soybeans").recommendation;
    if (field.fertility < 48) return "Soil is tired. Fertilize before planting anything expensive.";
    if (field.weeds > 38) return "Weeds are gaining. Treat or plant a crop that can stand rough ground.";
    return "Ground is open. Pick a crop based on cash timing and the week's bid sheet.";
  }

  const crop = CROP_TYPES[field.cropId];
  if (field.scouted && field.scoutReport) return field.scoutReport;
  if (field.ready) {
    const cost = getHarvestCost(state, field);
    if (crop.isCoverCrop) return "Cover crop is ready to terminate. Cash crop benefits come after you work it down.";
    if (state.financials.cash < cost) {
      return "Ready to harvest. Cash is short, but harvest can go on credit. Waiting risks weather loss.";
    }
    return "Ready to harvest. Yield is mostly set; inputs will not improve it now.";
  }
  if (field.soilTestKnown && field.soilRecommendation && field.fertility < 46) return field.soilRecommendation;
  if (field.weeds > 50) return "Weeds are stealing yield. Spray before the stand loses more ground.";
  if (field.fertility < 44) return "Fertility is low. Feed the crop before the next stage.";
  if (field.stress > 62) return "Stress is high. Scout before spending more money blind.";
  return `${crop.name} is moving. Watch weather, weeds, and machine condition.`;
}

function batchAffectedFields(state, action) {
  if (action === "scout-all") {
    return state.fields.filter((field) => !fieldActionStatus(state, field, "scout-field", { ignoreWork: true }).disabled);
  }
  if (action === "soil-test-all") {
    return state.fields.filter((field) => !fieldActionStatus(state, field, "soil-test", { ignoreWork: true }).disabled);
  }
  if (action === "treat-weeds-all") {
    return state.fields.filter((field) => !fieldActionStatus(state, field, "treat-weeds", { ignoreWork: true }).disabled);
  }
  if (action === "fertilize-all") {
    return state.fields.filter((field) => !fieldActionStatus(state, field, "fertilize-field", { ignoreWork: true }).disabled);
  }
  if (action === "harvest-all") {
    return state.fields.filter((field) => !fieldActionStatus(state, field, "harvest-field", { ignoreWork: true }).disabled);
  }
  return [];
}

export function batchActionPreview(state, action) {
  const fields = batchAffectedFields(state, action);
  let totalCost = 0;
  let label = "Batch Action";
  if (action === "scout-all") {
    totalCost = fields.length * BALANCE.scoutCost;
    label = "Scout All Fields";
  }
  if (action === "soil-test-all") {
    totalCost = fields.length * BALANCE.soilTestCost;
    label = "Soil Test All Unchecked Fields";
  }
  if (action === "treat-weeds-all") {
    totalCost = fields.reduce((sum, field) => sum + getWeedTreatmentCost(state, field), 0);
    label = "Treat All High Weed Fields";
  }
  if (action === "fertilize-all") {
    totalCost = fields.reduce((sum, field) => sum + getFertilizeCost(state, field), 0);
    label = "Fertilize Eligible Fields";
  }
  if (action === "harvest-all") {
    totalCost = fields.reduce((sum, field) => sum + getHarvestCost(state, field), 0);
    label = "Harvest All Ready Fields";
  }
  const cashShort = Math.max(0, totalCost - Math.max(0, state.financials.cash));
  const workCost =
    action === "scout-all"
      ? getWorkSlotCost("scout-all")
      : action === "soil-test-all"
        ? 0
        : action === "treat-weeds-all"
          ? fields.length * getWorkSlotCost("treat-weeds")
          : action === "fertilize-all"
            ? fields.length * getWorkSlotCost("fertilize-field")
            : action === "harvest-all"
              ? fields.length * getWorkSlotCost("harvest-field")
              : 0;
  const work = ensureWorkState(state);
  const workWarning =
    workCost > work.remaining
      ? `Needs ${workSlotText(workCost)}, but only ${workSlotText(work.remaining)} remain this week.`
      : "";
  return {
    action,
    label,
    fields,
    fieldIds: fields.map((field) => field.id),
    totalCost,
    workCost,
    affectedCount: fields.length,
    creditWarning: cashShort > 0 ? `${dollars(cashShort)} would need operating credit if you run this now.` : "",
    workWarning
  };
}

export function scoutAllFields(state) {
  const next = cloneState(state);
  const preview = batchActionPreview(next, "scout-all");
  if (!preview.affectedCount) return finish(next, false, "All fields are already scouted this week.");
  const workCheck = consumeWorkSlots(next, preview.workCost, "Scout all fields");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const summaries = [];
  for (const field of preview.fields) {
    const target = next.fields.find((item) => item.id === field.id);
    target.scouted = true;
    target.lastScoutWeek = next.time.week;
    target.stress = clamp(target.stress - 2);
    target.scoutReport = buildScoutReport(next, target);
    target.lastAction = "Scouted";
    recalcCondition(target);
    syncStressCauses(next, target);
    summaries.push(`${target.name}: ${basicFieldObservation(next, target)}.`);
  }
  return finish(next, true, `Scouted ${preview.affectedCount} field(s) for free. ${summaries.join(" ")}`);
}

export function soilTestAllUncheckedFields(state) {
  const next = cloneState(state);
  const preview = batchActionPreview(next, "soil-test-all");
  if (!preview.affectedCount) return finish(next, false, "Every field already has a current soil test.");
  const payment = spend(next, preview.totalCost, "Soil test all unchecked fields", { allowCredit: true });
  if (!payment.ok) return finish(next, false, payment.message);
  const workCheck = consumeWorkSlots(next, preview.workCost, "Soil test all unchecked fields");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const summaries = [];
  for (const field of preview.fields) {
    const target = next.fields.find((item) => item.id === field.id);
    target.tested = true;
    target.soilTestKnown = true;
    target.lastSoilTestWeek = next.time.week;
    target.soilTestResult = buildSoilTestResult(next, target);
    target.soilTestSummary = target.soilTestResult.summary;
    target.soilRecommendation = buildSoilRecommendation(next, target);
    target.lastAction = "Soil test";
    syncStressCauses(next, target);
    summaries.push({
      fieldId: target.id,
      fieldName: target.name,
      fertilityRating: target.soilTestResult.fertilityRating,
      soilHealth: target.soilTestResult.soilHealth,
      fertilizerRoi: target.soilTestResult.fertilizerRoi,
      bestCropFit: target.soilTestResult.bestCropFit,
      recommendation: target.soilTestResult.recommendation,
      nextSeasonNote: target.soilTestResult.nextSeasonNote,
      summary: `${target.name}: ${target.soilTestResult.fertilityRating} fertility, ${target.soilTestResult.bestCropFit.toLowerCase()}.`
    });
  }
  const creditText = payment.financed ? ` ${dollars(payment.financed)} went on credit.` : "";
  return finish(
    next,
    true,
    `Soil tested ${preview.affectedCount} field(s) for ${dollars(preview.totalCost)}.${creditText} Review the soil-test summary before buying inputs.`,
    "success",
    {
      suppressNotice: true,
      result: {
        kind: "soil-test-all",
        title: "Soil Test Summary",
        fields: summaries
      }
    }
  );
}

export function treatAllHighWeedFields(state) {
  const next = cloneState(state);
  const preview = batchActionPreview(next, "treat-weeds-all");
  if (!preview.affectedCount) return finish(next, false, "No eligible high-weed fields need treatment right now.");
  const workCheck = checkWorkSlots(next, preview.workCost, "Treat high weed fields");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const payment = spend(next, preview.totalCost, "Treat high weed fields", { allowCredit: true });
  if (!payment.ok) return finish(next, false, payment.message);
  consumeWorkSlots(next, preview.workCost, "Treat high weed fields");
  const summaries = [];
  for (const field of preview.fields) {
    const target = next.fields.find((item) => item.id === field.id);
    const stageKey = actionStageKey(target);
    const profile = weedTreatmentProfile(next, target);
    const beforeWeeds = target.weeds;
    target.weeds = clamp(target.weeds - profile.expectedReduction);
    if (profile.stressReduction > 0) {
      target.stress = clamp(target.stress - profile.stressReduction);
      recordStressHistory(next, target, "weed pressure", -profile.stressReduction, "Batch weed treatment reduced weed stress.");
    }
    target.scouted = false;
    target.scoutReport = null;
    target.lastWeedTreatmentWeek = next.time.week;
    target.lastWeedTreatmentStage = stageKey;
    target.weedTreatmentApplicationsThisCrop = (target.weedTreatmentApplicationsThisCrop ?? 0) + 1;
    target.weedTreatmentAppliedWeeks = unique([...(target.weedTreatmentAppliedWeeks ?? []), next.time.week]);
    target.weedTreatmentStageApplied = unique([...(target.weedTreatmentStageApplied ?? []), stageKey]);
    target.soilRecommendation = target.soilTestKnown ? buildSoilRecommendation(next, target) : target.soilRecommendation;
    target.lastAction = "Treated weeds";
    recalcCondition(target);
    syncStressCauses(next, target);
    summaries.push(`${target.name} weeds ${beforeWeeds}% -> ${target.weeds}% (${profile.yieldBenefit} yield benefit).`);
  }
  const creditText = payment.financed ? ` ${dollars(payment.financed)} went on credit.` : "";
  return finish(next, true, `Treated ${preview.affectedCount} high-weed field(s) for ${dollars(preview.totalCost)}.${creditText} ${summaries.join(" ")}`);
}

export function fertilizeRecommendedFields(state) {
  const next = cloneState(state);
  const preview = batchActionPreview(next, "fertilize-all");
  if (!preview.affectedCount) return finish(next, false, "No fields have a strong fertilizer recommendation right now.");
  const workCheck = checkWorkSlots(next, preview.workCost, "Fertilize eligible fields");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const payment = spend(next, preview.totalCost, "Fertilize recommended fields", { allowCredit: true });
  if (!payment.ok) return finish(next, false, payment.message);
  consumeWorkSlots(next, preview.workCost, "Fertilize eligible fields");
  const summaries = [];
  for (const field of preview.fields) {
    const target = next.fields.find((item) => item.id === field.id);
    const stageKey = actionStageKey(target);
    const fertilityBoost = target.cropId === "soybeans" ? 10 : target.cropId === "hay" ? 16 : 20;
    target.fertility = clamp(target.fertility + fertilityBoost);
    target.weeds = clamp(target.weeds + 3);
    if (target.cropId && !target.ready && (target.fertility < 64 || target.stressCauses?.includes("tired fertility"))) {
      target.stress = clamp(target.stress - (target.cropId === "soybeans" ? 2 : 5));
      recordStressHistory(next, target, "tired fertility", -4, "Batch fertilizer eased fertility stress.");
    }
    target.scouted = false;
    target.scoutReport = null;
    target.lastFertilizedWeek = next.time.week;
    target.lastFertilizedStage = stageKey;
    target.fertilizerAppliedYear = next.time.year;
    target.fertilizerApplicationsThisCrop = (target.fertilizerApplicationsThisCrop ?? 0) + 1;
    target.fertilizerAppliedWeeks = unique([...(target.fertilizerAppliedWeeks ?? []), next.time.week]);
    target.fertilizerStageApplied = unique([...(target.fertilizerStageApplied ?? []), stageKey]);
    target.soilRecommendation = target.soilTestKnown ? buildSoilRecommendation(next, target) : target.soilRecommendation;
    target.lastAction = "Fertilized";
    recalcCondition(target);
    syncStressCauses(next, target);
    summaries.push(`${target.name} fertility now ${target.fertility}%.`);
  }
  const creditText = payment.financed ? ` ${dollars(payment.financed)} went on credit.` : "";
  return finish(next, true, `Fertilized ${preview.affectedCount} field(s) for ${dollars(preview.totalCost)}.${creditText} ${summaries.join(" ")}`);
}

export function harvestAllReadyFields(state) {
  let next = cloneState(state);
  const preview = batchActionPreview(next, "harvest-all");
  if (!preview.affectedCount) return finish(next, false, "No fields are ready to harvest.");
  const workCheck = checkWorkSlots(next, preview.workCost, "Harvest all ready fields");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const messages = [];
  for (const fieldId of preview.fieldIds) {
    const result = harvestField(next, fieldId, { useCredit: true, skipWork: true });
    next = result.state;
    messages.push(result.message);
  }
  const ok = messages.some((message) => /harvested|terminated/i.test(message));
  if (ok) consumeWorkSlots(next, preview.workCost, "Harvest all ready fields");
  return finish(next, ok, `Harvest All Ready Fields: ${messages.join(" ")}`, ok ? "success" : "warning");
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
  const status = canPerformFieldAction(field, "plant-crop", next, { cropId });
  if (!status.allowed) return finish(next, false, status.reason);
  const cost = getPlantCost(next, field, cropId);
  const payment = spend(next, cost, `Planting ${crop.name}`);
  if (!payment.ok) return finish(next, false, payment.message);
  const workCheck = consumeWorkSlots(next, status.workCost, `Plant ${crop.name} on ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);

  const prePlantFertilityPass =
    field.lastFertilizedStage === "open" && field.fertilizerAppliedYear === next.time.year
      ? 1
      : 0;
  const plantingWindow = plantingWindowStatus(next, cropId);
  const rotation = applyRotationAtPlant(next, field, cropId);
  field.cropId = cropId;
  field.stageIndex = 0;
  field.weeksInStage = 0;
  field.plantedWeek = next.time.week;
  field.currentYear = next.time.year;
  field.cropPlantedThisYear = cropId;
  if (isAnnualCashCrop(cropId)) field.annualCashCropPlantedThisYear = cropId;
  field.fieldAvailabilityState = "standing_crop";
  field.plantingWindow = plantingWindow.timing;
  field.latePlantingYieldModifier = plantingWindow.yieldModifier;
  field.latePlantingNote = plantingWindow.late ? plantingWindow.reason : null;
  field.fertilizerApplicationsThisCrop = prePlantFertilityPass;
  field.fertilizerAppliedWeeks = prePlantFertilityPass ? field.fertilizerAppliedWeeks ?? [] : [];
  field.fertilizerStageApplied = prePlantFertilityPass ? ["open"] : [];
  field.weedTreatmentApplicationsThisCrop = 0;
  field.weedTreatmentAppliedWeeks = [];
  field.weedTreatmentStageApplied = [];
  field.ready = false;
  field.yieldLocked = false;
  field.lockedYield = null;
  field.stressLockedInYieldLoss = 0;
  field.scouted = false;
  field.tested = false;
  field.scoutReport = null;
  field.fertility = clamp(field.fertility - BALANCE.seedFertilityImpact);
  field.lastAction = `Planted ${crop.name}`;
  recalcCondition(field);
  syncStressCauses(next, field);
  const lateText = plantingWindow.late ? ` ${plantingWindow.timing}: reduced yield potential is now reflected in expected yield.` : "";
  return finish(next, true, `${field.name} planted in ${crop.name} for ${dollars(cost)}.${lateText} Rotation outlook: ${rotation.level}. ${rotation.recommendation}`);
}

export function soilTest(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const status = fieldActionStatus(next, field, "soil-test");
  if (status.disabled) return finish(next, false, status.reason);
  const payment = spend(next, BALANCE.soilTestCost, "Soil test");
  if (!payment.ok) return finish(next, false, payment.message);
  const workCheck = consumeWorkSlots(next, status.workCost, `Soil test ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  field.tested = true;
  field.soilTestKnown = true;
  field.lastSoilTestWeek = next.time.week;
  field.soilTestResult = buildSoilTestResult(next, field);
  field.soilTestSummary = field.soilTestResult.summary;
  field.soilRecommendation = buildSoilRecommendation(next, field);
  field.lastAction = "Soil test";
  syncStressCauses(next, field);
  return finish(
    next,
    true,
    `${field.name} soil test complete: ${field.soilTestResult.recommendation}`,
    "success",
    {
      suppressNotice: true,
      result: {
        kind: "soil-test",
        title: `${field.name} Soil Test`,
        field: field.soilTestResult
      }
    }
  );
}

export function scoutField(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const status = fieldActionStatus(next, field, "scout-field");
  if (status.disabled) return finish(next, false, status.reason);
  const workCheck = consumeWorkSlots(next, status.workCost, `Scout ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  field.scouted = true;
  field.lastScoutWeek = next.time.week;
  field.scoutReport = buildScoutReport(next, field);
  field.lastAction = "Scouted";
  recalcCondition(field);
  syncStressCauses(next, field);
  return finish(next, true, `${field.name} scouted for free. ${field.scoutReport}`);
}

export function fertilizeField(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const status = fieldActionStatus(next, field, "fertilize-field");
  if (status.disabled) return finish(next, false, status.reason);
  const stageKey = actionStageKey(field);
  const cost = getFertilizeCost(next, field);
  const payment = spend(next, cost, "Fertilizer");
  if (!payment.ok) return finish(next, false, payment.message);
  const workCheck = consumeWorkSlots(next, status.workCost, `Fertilize ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const fertilityBoost = field.cropId === "soybeans" ? 10 : field.cropId === "hay" ? 16 : 20;
  field.fertility = clamp(field.fertility + fertilityBoost);
  field.weeds = clamp(field.weeds + 3);
  field.scouted = false;
  field.scoutReport = null;
  field.lastFertilizedWeek = next.time.week;
  field.lastFertilizedStage = stageKey;
  field.fertilizerAppliedYear = next.time.year;
  field.fertilizerApplicationsThisCrop = (field.fertilizerApplicationsThisCrop ?? 0) + 1;
  field.fertilizerAppliedWeeks = unique([...(field.fertilizerAppliedWeeks ?? []), next.time.week]);
  field.fertilizerStageApplied = unique([...(field.fertilizerStageApplied ?? []), stageKey]);
  field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
  if (field.cropId && !field.ready && (field.fertility < 64 || field.stressCauses?.includes("tired fertility"))) {
    field.stress = clamp(field.stress - (field.cropId === "soybeans" ? 2 : 5));
    recordStressHistory(next, field, "tired fertility", -4, "Timely fertilizer eased fertility stress.");
  }
  field.lastAction = "Fertilized";
  recalcCondition(field);
  syncStressCauses(next, field);
  return finish(next, true, `${field.name} fertilized for ${dollars(cost)}. Weeds may answer back.`);
}

export function treatWeeds(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const status = fieldActionStatus(next, field, "treat-weeds");
  if (status.disabled) return finish(next, false, status.reason);
  const stageKey = actionStageKey(field);
  const cost = getWeedTreatmentCost(next, field);
  const payment = spend(next, cost, "Weed treatment");
  if (!payment.ok) return finish(next, false, payment.message);
  const workCheck = consumeWorkSlots(next, status.workCost, `Treat weeds on ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const profile = weedTreatmentProfile(next, field);
  const beforeWeeds = field.weeds;
  const beforeStress = field.stress;
  field.weeds = clamp(field.weeds - profile.expectedReduction);
  field.scouted = false;
  field.scoutReport = null;
  field.lastWeedTreatmentWeek = next.time.week;
  field.lastWeedTreatmentStage = stageKey;
  field.weedTreatmentApplicationsThisCrop = (field.weedTreatmentApplicationsThisCrop ?? 0) + 1;
  field.weedTreatmentAppliedWeeks = unique([...(field.weedTreatmentAppliedWeeks ?? []), next.time.week]);
  field.weedTreatmentStageApplied = unique([...(field.weedTreatmentStageApplied ?? []), stageKey]);
  field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
  if (profile.stressReduction > 0) {
    field.stress = clamp(field.stress - profile.stressReduction);
    recordStressHistory(next, field, "weed pressure", -profile.stressReduction, `${profile.timing} weed treatment reduced weed stress.`);
  }
  field.lastAction = "Treated weeds";
  recalcCondition(field);
  syncStressCauses(next, field);
  const stressText = field.stress < beforeStress ? ` Stress eased from ${beforeStress}% to ${field.stress}%.` : " Stress did not increase.";
  const timingText = profile.lowValue ? " Late weed cleanup will not recover much yield." : "";
  return finish(
    next,
    true,
    `${field.name} treated for weeds for ${dollars(cost)}. Weed pressure fell from ${beforeWeeds}% to ${field.weeds}% (${profile.yieldBenefit} yield benefit).${stressText}${timingText} Treat again next week if pressure remains.`
  );
}

export function leaveFallow(state, fieldId) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field) return finish(next, false, "Field not found.");
  const status = fieldActionStatus(next, field, "leave-fallow");
  if (status.disabled) return finish(next, false, status.reason);
  const workCheck = consumeWorkSlots(next, status.workCost, `Rest ${field.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  field.fertility = clamp(field.fertility + 7);
  field.weeds = clamp(field.weeds + 5);
  field.stress = clamp(field.stress - 5);
  field.scouted = false;
  field.scoutReport = null;
  field.lastFallowWeek = next.time.week;
  field.fieldAvailabilityState = "fallow_rest";
  field.plantingWindow = null;
  field.latePlantingYieldModifier = 1;
  field.latePlantingNote = null;
  field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
  recordStressHistory(next, field, "fallow rest", -5, "Fallow rest reduced field stress and rotation pressure.");
  field.lastAction = "Left fallow";
  recalcCondition(field);
  syncStressCauses(next, field);
  return finish(next, true, `${field.name} rested. Fertility improved, but weeds kept working too.`);
}

export function harvestField(state, fieldId, { useCredit = false, skipWork = false } = {}) {
  const next = cloneState(state);
  const field = next.fields.find((item) => item.id === fieldId);
  if (!field || !field.cropId) return finish(next, false, "There is no crop to harvest.");
  const harvestStatus = canPerformFieldAction(field, useCredit ? "harvest-credit" : "harvest-field", next, { ignoreWork: skipWork });
  if (!harvestStatus.allowed) return finish(next, false, harvestStatus.reason);

  const crop = CROP_TYPES[field.cropId];
  if (!field.yieldLocked) lockReadyYield(next, field);
  if (crop.isCoverCrop) {
    if (!skipWork) {
      const workCheck = consumeWorkSlots(next, harvestStatus.workCost, `Terminate cover crop on ${field.name}`);
      if (!workCheck.ok) return finish(next, false, workCheck.message);
    }
    const tractor = next.equipment.find((item) => item.id === "tractor");
    if (tractor) tractor.condition = clamp(tractor.condition - 2);
    field.cropId = null;
    field.stageIndex = 0;
    field.weeksInStage = 0;
    field.plantedWeek = null;
    field.previousYearCrop = field.lastCashCrop ?? field.previousCropId ?? field.cropPlantedThisYear ?? field.previousYearCrop ?? null;
    field.currentYear = next.time.year;
    field.cropPlantedThisYear = null;
    field.annualCashCropPlantedThisYear = null;
    field.cashCropHarvestedThisYear = false;
    field.fieldAvailabilityState = "open";
    field.fertilizerApplicationsThisCrop = 0;
    field.fertilizerAppliedWeeks = [];
    field.fertilizerStageApplied = [];
    field.fertilizerAppliedYear = null;
    field.weedTreatmentApplicationsThisCrop = 0;
    field.weedTreatmentAppliedWeeks = [];
    field.weedTreatmentStageApplied = [];
    field.hayCuttingsThisYear = 0;
    field.stressLockedInYieldLoss = 0;
    field.ready = false;
    field.yieldLocked = false;
    field.lockedYield = null;
    field.stressLockedInYieldLoss = 0;
    field.previousCropId = "cover_crop";
    field.fieldAvailabilityState = "post_cover_crop";
    field.plantingWindow = null;
    field.latePlantingYieldModifier = 1;
    field.latePlantingNote = null;
    field.rotationNote = "Cover Crop Benefit: residue and root growth should help the next cash crop.";
    field.rotationYieldModifier = 1;
    field.fertility = clamp(field.fertility + 12);
    field.stress = clamp(field.stress - 8);
    field.weeds = clamp(field.weeds - 10);
    field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
    field.lastAction = "Terminated Cover Crop";
    recalcCondition(field);
    syncStressCauses(next, field);
    return finish(next, true, `${field.name} cover crop terminated. Fertility improved and next crop rotation outlook is better.`);
  }
  const cost = getHarvestCost(next, field);
  const needsCredit = next.financials.cash < cost;
  const payment = spend(next, cost, `Harvesting ${field.name}`, { allowCredit: useCredit || needsCredit });
  if (!payment.ok) return finish(next, false, payment.message);
  if (!skipWork) {
    const workCheck = consumeWorkSlots(next, harvestStatus.workCost, `Harvest ${field.name}`);
    if (!workCheck.ok) return finish(next, false, workCheck.message);
  }

  const combine = next.equipment.find((item) => item.id === "combine");
  const machinePenalty = combine.condition < BALANCE.poorEquipmentThreshold ? 0.93 : 1;
  const yieldAmount = Number((expectedYield(next, field) * machinePenalty).toFixed(1));
  next.inventory.crops[crop.id] = Number((next.inventory.crops[crop.id] + yieldAmount).toFixed(1));
  combine.condition = clamp(combine.condition - 7);
  const tractor = next.equipment.find((item) => item.id === "tractor");
  tractor.condition = clamp(tractor.condition - 2);

  const fieldName = field.name;
  const wasHay = crop.id === "hay";
  const hayCanRegrow = wasHay && next.time.week <= next.time.maxWeeks - 5;
  field.cropId = null;
  field.stageIndex = 0;
  field.weeksInStage = 0;
  field.plantedWeek = null;
  field.ready = false;
  field.yieldLocked = false;
  field.lockedYield = null;
  field.stressLockedInYieldLoss = 0;
  field.previousCropId = crop.id;
  field.plantingWindow = null;
  field.latePlantingYieldModifier = 1;
  field.latePlantingNote = null;
  if (isAnnualCashCrop(crop.id)) {
    field.cashCropHarvestedThisYear = true;
    field.lastCashCrop = crop.id;
    field.fieldAvailabilityState = "post_harvest";
  } else {
    field.fieldAvailabilityState = wasHay ? "hay_cut" : "post_harvest";
  }
  field.rotationYieldModifier = 1;
  field.fertility = clamp(field.fertility - 8);
  field.stress = wasHay ? clamp(field.stress - 2) : clamp(field.stress + 4);
  field.weeds = clamp(field.weeds + 4);
  field.fertilizerApplicationsThisCrop = 0;
  field.fertilizerAppliedWeeks = [];
  field.fertilizerStageApplied = [];
  field.weedTreatmentApplicationsThisCrop = 0;
  field.weedTreatmentAppliedWeeks = [];
  field.weedTreatmentStageApplied = [];
  field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
  field.lastAction = `Harvested ${crop.name}`;
  if (hayCanRegrow) {
    field.cropId = "hay";
    field.stageIndex = 1;
    field.weeksInStage = 0;
    field.plantedWeek = next.time.week;
    field.ready = false;
    field.cropPlantedThisYear = "hay";
    field.fieldAvailabilityState = "hay_regrowth";
    field.hayCuttingsThisYear = (field.hayCuttingsThisYear ?? 0) + 1;
    field.lastAction = "Harvested Hay / Regrowth";
  }
  recalcCondition(field);
  syncStressCauses(next, field);
  next.stats = next.stats ?? {};
  next.stats.cropHarvests = (next.stats.cropHarvests ?? 0) + 1;

  const financeText =
    payment.financed > 0
      ? ` Harvest cost put ${dollars(payment.financed)} on credit. You can get it done, but Earl will see it.`
      : "";
  return finish(
    next,
    true,
    `${fieldName} harvested: ${yieldAmount.toLocaleString("en-US")} ${crop.unit} ${crop.name} stored.${hayCanRegrow ? " Hay will regrow for another cutting if weather holds." : ""}${financeText}`,
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
  next.stats = next.stats ?? {};
  next.stats.cropIncome = (next.stats.cropIncome ?? 0) + Math.round(revenue);
  return finish(next, true, `${incomeText} Elevator bid was ${dollars(price)} per ${crop.unit}.`);
}

export function buySalvage(state, instanceId) {
  const next = cloneState(state);
  const item = next.salvageYard.find((entry) => entry.instanceId === instanceId);
  if (!item) return finish(next, false, "That salvage item is gone.");
  const workCost = getWorkSlotCost("salvage-action");
  const workCheck = checkWorkSlots(next, workCost, "Salvage trip");
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const payment = spend(next, item.cost, `Buying ${item.name}`);
  if (!payment.ok) return finish(next, false, payment.message);
  consumeWorkSlots(next, workCost, "Salvage trip");
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
  const workCost = getWorkSlotCost("salvage-action");
  const workCheck = checkWorkSlots(next, workCost, `Sell ${item.name} for scrap`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const value = Math.round(item.scrapValue * (0.9 + item.condition / 220));
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  consumeWorkSlots(next, workCost, `Sell ${item.name} for scrap`);
  const incomeText = earn(next, value, `Sold ${item.name} for scrap`);
  return finish(next, true, `${incomeText} Not pretty money, but it is money.`);
}

export function stripSalvage(state, inventoryId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  if (!item) return finish(next, false, "Salvage item not found.");
  const workCost = getWorkSlotCost("salvage-action");
  const workCheck = checkWorkSlots(next, workCost, `Strip ${item.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  next.inventory.parts += item.partsYield;
  consumeWorkSlots(next, workCost, `Strip ${item.name}`);
  return finish(next, true, `${item.name} stripped into ${item.partsYield} usable salvage parts.`);
}

export function repairAndFlipSalvage(state, inventoryId) {
  const next = cloneState(state);
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  if (!item) return finish(next, false, "Salvage item not found.");
  const workCost = getWorkSlotCost("salvage-action");
  const workCheck = checkWorkSlots(next, workCost, `Repair and flip ${item.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const bg = background(next);
  const repairCost = Math.round(item.repairCost * bg.modifiers.repairCost);
  const payment = spend(next, repairCost, `Repairing ${item.name}`, { allowCredit: true });
  if (!payment.ok) return finish(next, false, payment.message);
  consumeWorkSlots(next, workCost, `Repair and flip ${item.name}`);

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

const DIRECT_SALVAGE_REPAIR_AMOUNT = 14;

export function salvageEquipmentUsePreview(state, inventoryId, equipmentId) {
  const item = state.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  const machine = state.equipment.find((entry) => entry.id === equipmentId);
  const workCost = getWorkSlotCost("salvage-action");
  const base = {
    success: false,
    ok: false,
    disabled: true,
    inventoryId,
    equipmentId,
    itemName: item?.name ?? "Salvage item",
    machineName: machine?.name ?? "Equipment",
    compatible: false,
    previousCondition: machine?.condition ?? null,
    newCondition: machine?.condition ?? null,
    repairAmount: 0,
    expectedRepairAmount: 0,
    salvageConsumed: false,
    workCost,
    disabledReason: null,
    message: null
  };
  if (!item || !machine) {
    return {
      ...base,
      disabledReason: "That equipment salvage choice is not available.",
      message: "That equipment salvage choice is not available."
    };
  }
  const compatible = item.helps?.includes(machine.id);
  if (!compatible) {
    const message = `This salvage cannot help ${machine.name}. Strip it for parts or sell it instead.`;
    return {
      ...base,
      compatible: false,
      disabledReason: message,
      message
    };
  }
  if (machine.condition >= 100) {
    const message = `${machine.name} is already at 100% condition. Save this salvage for another job.`;
    return {
      ...base,
      compatible: true,
      disabledReason: message,
      message
    };
  }
  const newCondition = clamp(machine.condition + DIRECT_SALVAGE_REPAIR_AMOUNT, 0, 100);
  const repairAmount = newCondition - machine.condition;
  const workCheck = checkWorkSlots(state, workCost, `Use ${item.name} on ${machine.name}`);
  if (!workCheck.ok) {
    return {
      ...base,
      compatible: true,
      expectedRepairAmount: repairAmount,
      newCondition,
      repairAmount,
      disabledReason: workCheck.message,
      message: workCheck.message
    };
  }
  const message = `Used ${item.name} on ${machine.name}. Condition improved from ${machine.condition}% to ${newCondition}%. The salvage item was used.`;
  return {
    ...base,
    success: true,
    ok: true,
    disabled: false,
    compatible: true,
    expectedRepairAmount: repairAmount,
    newCondition,
    repairAmount,
    salvageConsumed: true,
    disabledReason: null,
    message
  };
}

export function useSalvageOnEquipment(state, inventoryId, equipmentId) {
  const next = cloneState(state);
  const preview = salvageEquipmentUsePreview(next, inventoryId, equipmentId);
  if (!preview.ok) {
    const failed = finish(next, false, preview.disabledReason ?? preview.message ?? "That equipment salvage choice is not available.");
    return { ...failed, ...preview };
  }
  const item = next.inventory.salvage.find((entry) => entry.inventoryId === inventoryId);
  const machine = next.equipment.find((entry) => entry.id === equipmentId);
  machine.condition = preview.newCondition;
  machine.lastRepairWeek = next.time.week;
  next.inventory.salvage = next.inventory.salvage.filter((entry) => entry.inventoryId !== inventoryId);
  consumeWorkSlots(next, preview.workCost, `Use ${item.name} on ${machine.name}`);
  const result = finish(next, true, preview.message);
  return { ...result, ...preview, state: result.state };
}

export function repairEquipment(state, equipmentId, { useParts = false, useCredit = false } = {}) {
  const next = cloneState(state);
  const machine = next.equipment.find((entry) => entry.id === equipmentId);
  if (!machine) return finish(next, false, "Equipment not found.");
  if (machine.condition >= 92) return finish(next, false, `${machine.name} is already in good working order.`);
  const workCost = getWorkSlotCost("repair-equipment");
  const workCheck = checkWorkSlots(next, workCost, `Repair ${machine.name}`);
  if (!workCheck.ok) return finish(next, false, workCheck.message);
  const estimate = getRepairEstimate(next, equipmentId, { useParts });
  const explicitCredit = useCredit && !useParts;
  const cost = explicitCredit ? estimate.creditCost : estimate.cashCost;
  const payment = spend(next, cost, `Repairing ${machine.name}`, {
    allowCredit: useCredit,
    creditOnly: explicitCredit
  });
  if (!payment.ok) return finish(next, false, payment.message);
  consumeWorkSlots(next, workCost, `Repair ${machine.name}`);
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
  contract.status = "accepted";
  contract.acceptedWeek = next.time.week;
  contract.readyWeek = null;
  contract.deadlineWeek = next.time.week + contract.deadlineWeeks;
  contract.weeksLeft = contract.deadlineWeeks;
  return finish(
    next,
    true,
    `${contract.title} accepted. Deadline: ${contract.weeksLeft} week(s). Next step: ${contractNextStep(next, contract)} If ignored: ${contract.failureReason ?? contract.consequence}.`
  );
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

function applyContractWorkCosts(state, contract) {
  const req = contract.requirements ?? {};
  let costNote = "";

  if (req.parts) {
    if (state.inventory.parts < req.parts) {
      return { ok: false, message: `Needs ${req.parts} salvage part${req.parts === 1 ? "" : "s"}.` };
    }
    state.inventory.parts -= req.parts;
    costNote = ` Used ${req.parts} salvage part${req.parts === 1 ? "" : "s"}.`;
  }

  if (req.partsOrCash) {
    if (state.inventory.parts >= req.partsOrCash.parts) {
      state.inventory.parts -= req.partsOrCash.parts;
      costNote = ` Used ${req.partsOrCash.parts} salvage part.`;
    } else {
      const payment = spend(state, req.partsOrCash.cash, contract.title, { allowCredit: true });
      if (!payment.ok) return payment;
      costNote = ` Covered supplies for ${dollars(req.partsOrCash.cash)}.`;
    }
  }

  if (req.cashCost) {
    const payment = spend(state, req.cashCost, contract.title, { allowCredit: true });
    if (!payment.ok) return payment;
    costNote += payment.financed > 0 ? ` ${dollars(payment.financed)} fuel went on credit.` : ` Fuel cost ${dollars(req.cashCost)}.`;
  }

  if (contract.wear) {
    const worn = [];
    for (const [equipmentId, amount] of Object.entries(contract.wear)) {
      const machine = state.equipment.find((entry) => entry.id === equipmentId);
      if (!machine) continue;
      machine.condition = clamp(machine.condition - amount);
      worn.push(`${machine.name} -${amount}%`);
    }
    if (worn.length) costNote += ` Machine wear: ${worn.join(", ")}.`;
  }

  return { ok: true, costNote };
}

export function performContractAction(state, contractId) {
  const next = cloneState(state);
  const contract = next.contracts.find((entry) => entry.id === contractId);
  if (!contract) return finish(next, false, "Contract not found.");
  if (contract.status !== "accepted") {
    return finish(next, false, `${contract.title} does not need that action right now.`);
  }

  const failure = requirementFailure(next, contract);
  if (failure) return finish(next, false, `${activeContractActionLabel(contract)} cannot start. ${failure}`);
  const workCost = getWorkSlotCost("contract-action", { contract });
  const workCheck = checkWorkSlots(next, workCost, activeContractActionLabel(contract));
  if (!workCheck.ok) return finish(next, false, workCheck.message);

  const costs = applyContractWorkCosts(next, contract);
  if (!costs.ok) return finish(next, false, costs.message ?? "The job cannot be started.");
  consumeWorkSlots(next, workCost, activeContractActionLabel(contract));

  contract.workStartedWeek = next.time.week;
  contract.workCostPaid = true;
  contract.readyWeek = contract.instant ? next.time.week : next.time.week + (contract.durationWeeks ?? 1);
  contract.status = contract.instant ? "ready_to_complete" : "in_progress";
  contract.choiceNote = `${activeContractActionLabel(contract)} done Week ${next.time.week}.`;
  contract.weeksLeft = Math.max(0, (contract.deadlineWeek ?? next.time.week) - next.time.week);
  const settleText = contract.instant
    ? "It is ready to complete now."
    : `It will be ready to settle after ${contract.durationWeeks ?? 1} week(s).`;
  return finish(next, true, `${activeContractActionLabel(contract)}: ${contract.activeActionText ?? contract.actionText}.${costs.costNote} ${settleText}`);
}

export function abandonContract(state, contractId) {
  const next = cloneState(state);
  const contract = next.contracts.find((entry) => entry.id === contractId);
  if (!contract) return finish(next, false, "Contract not found.");
  if (!["accepted", "in_progress", "ready_to_complete"].includes(contract.status)) {
    return finish(next, false, `${contract.title} cannot be abandoned now.`);
  }
  contract.status = "failed";
  contract.failedWeek = next.time.week;
  contract.failureMessage = `You walked away from the job. ${contract.consequence ?? ""}`.trim();
  nextContractFailure(next, contract);
  next.stats = next.stats ?? {};
  next.stats.contractsFailed = (next.stats.contractsFailed ?? 0) + 1;
  return finish(next, true, `${contract.title} abandoned. ${contract.failureMessage}`, "warning");
}

export function completeContract(state, contractId) {
  const next = cloneState(state);
  const contract = next.contracts.find((entry) => entry.id === contractId);
  if (!contract) return finish(next, false, "Contract not found.");
  if (contract.status === "in_progress") {
    const remaining = Math.max(1, (contract.readyWeek ?? next.time.week + 1) - next.time.week);
    return finish(next, false, `${contract.title} is still in progress. Check back after ${remaining} week(s).`);
  }
  if (contract.status === "accepted") {
    return finish(next, false, `${contract.title} needs its active step first: ${contractNextStep(next, contract)}`);
  }
  if (contract.status !== "ready_to_complete") return finish(next, false, "Accept the contract, do its active step, and let the work progress before completing it.");

  let costNote = "";
  if (!contract.workCostPaid) {
    const failure = requirementFailure(next, contract);
    if (failure) return finish(next, false, `${contract.title} cannot be completed yet. ${failure}`);
    const workCost = getWorkSlotCost("contract-action", { contract });
    const workCheck = checkWorkSlots(next, workCost, contract.title);
    if (!workCheck.ok) return finish(next, false, workCheck.message);
    const costs = applyContractWorkCosts(next, contract);
    if (!costs.ok) return finish(next, false, costs.message ?? "The contract costs could not be covered.");
    consumeWorkSlots(next, workCost, contract.title);
    costNote = costs.costNote;
  }

  contract.status = "completed";
  contract.completedWeek = next.time.week;
  const reward = Math.round(contract.reward * reputationStanding(next.reputation).rewardMultiplier);
  next.reputation = clamp(next.reputation + contract.reputation, 0, 100);
  next.relationships[contract.npcId] = (next.relationships[contract.npcId] ?? 0) + 3;
  next.stats = next.stats ?? {};
  next.stats.contractsCompleted = (next.stats.contractsCompleted ?? 0) + 1;
  const incomeText = earn(next, reward, contract.title);
  return finish(next, true, `${incomeText}${costNote} Reputation +${contract.reputation}.`);
}

const NPC_DIALOGUE_SALTS = {
  patti: 411,
  hollis: 412,
  marge: 413,
  earl: 414,
  roy: 415,
  gus: 416,
  dee: 417,
  sandy: 418
};

function npcContextMatches(state, when) {
  if (when === "wet_week") return state.flags?.harvestDelayWeek === state.time.week;
  if (when === "note_tight") {
    const limit = state.financials?.creditLimit ?? 0;
    return limit > 0 && (state.financials?.creditUsed ?? 0) / limit >= 0.7;
  }
  if (when === "rough_iron") return (state.equipment ?? []).some((item) => item.condition < 40);
  if (when === "high_rep") return state.reputation >= 70;
  return false;
}

export function pickNpcDialogueLine(state, npcId) {
  const npc = NPCS[npcId];
  const bank = DIALOGUE_BANKS[npcId];
  if (!npc) return "";
  if (!bank) return npc.dialogue;
  for (const entry of bank.context ?? []) {
    if (npcContextMatches(state, entry.when)) return entry.line;
  }
  const standingLabel = reputationStanding(state.reputation).label;
  let tier = standingLabel === "Watched" ? 0 : standingLabel === "Trusted" ? 2 : 1;
  const relationship = state.relationships?.[npcId] ?? 0;
  if (relationship >= 20 && tier < 2) tier += 1;
  const lines = bank[["watched", "steady", "trusted"][tier]];
  if (!lines || lines.length === 0) return npc.dialogue;
  const roll = noise(state.seed + state.time.week, NPC_DIALOGUE_SALTS[npcId] ?? 400);
  return lines[Math.floor(roll * lines.length) % lines.length];
}

export function talkToNpc(state, npcId) {
  const next = cloneState(state);
  const npc = NPCS[npcId];
  if (!npc) return finish(next, false, "That person is not around.");
  next.weeklyNpcInteractions = next.weeklyNpcInteractions ?? {};
  next.completedDialogueRewards = next.completedDialogueRewards ?? {};
  next.npcInteractionFlags = next.npcInteractionFlags ?? {};
  const spokenLine = pickNpcDialogueLine(state, npcId) || npc.dialogue;
  const rewardKey = `${npcId}:year${next.time.year}:week${next.time.week}`;
  if (next.weeklyNpcInteractions[rewardKey]) {
    return finish(next, true, `${npc.name}: "${spokenLine}" You already got this week's practical help here; talking again is free, not a second reward.`, "info");
  }
  next.weeklyNpcInteractions[rewardKey] = true;
  next.completedDialogueRewards[rewardKey] = true;
  next.relationships[npcId] = (next.relationships[npcId] ?? 0) + 2;
  let result = spokenLine;

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
    syncStressCauses(next, stressed);
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
  const cost = getProgressionCost(next, upgrade);
  const payment = spend(next, cost, upgrade.title, { allowCredit: Boolean(upgrade.financingAllowed) });
  if (!payment.ok) return finish(next, false, payment.message);

  next.progression.upgrades.push(upgradeId);
  next.stats = next.stats ?? {};
  next.stats.upgradesPurchased = (next.stats.upgradesPurchased ?? 0) + 1;
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

  const financeText = payment.financed > 0 ? ` ${dollars(payment.financed)} went on the operating line.` : "";
  return finish(next, true, `${upgrade.title} purchased for ${dollars(cost)}.${financeText} ${upgrade.benefit}`);
}

export function setLocation(state, locationId) {
  const next = cloneState(state);
  if (!LOCATIONS.some((location) => location.id === locationId)) return finish(next, false, "Location not found.");
  next.currentLocationId = locationId;
  return finish(next, true, `Arrived at ${LOCATIONS.find((location) => location.id === locationId).name}.`, "info");
}

function weeklyEventContext(state) {
  const fields = state.fields ?? [];
  const plantedFields = fields.filter((field) => field.cropId);
  const readyFields = plantedFields.filter((field) => field.ready);
  const growingFields = plantedFields.filter((field) => !field.ready);
  const openFields = fields.filter((field) => !field.cropId);
  const lowGroundFields = fields.filter(
    (field) => field.id === "creek_bottom" || /creek|bottom|low/i.test(field.name) || field.stressCauses?.includes("wet fields")
  );
  const weedWindowFields = fields.filter(
    (field) => !field.ready && field.weeds >= (field.cropId ? 45 : 35) && (!field.cropId || isEarlyWeedWindow(field))
  );
  const roughMachine = [...(state.equipment ?? [])].sort((a, b) => a.condition - b.condition)[0];
  const plantingWindow = state.time.week <= 10;
  const earlySeason = state.time.week <= 4;

  return {
    plantedFields,
    readyFields,
    growingFields,
    openFields,
    lowGroundFields,
    weedWindowFields,
    roughMachine,
    hasPlantedCrop: plantedFields.length > 0,
    hasReadyCrop: readyFields.length > 0,
    hasGrowingCrop: growingFields.length > 0,
    hasOpenField: openFields.length > 0,
    hasWetFieldworkWarning:
      ["soaking_rain", "storm_line"].includes(state.weather?.id) && (plantingWindow || plantedFields.length > 0 || lowGroundFields.length > 0),
    hasDroughtPlantingOutlook: state.weather?.id === "hot_wind" && plantingWindow && openFields.length > 0,
    hasWeedWindow: weedWindowFields.length > 0,
    earlySeason,
    plantingWindow
  };
}

function eventChoiceCashStatus(state, choice) {
  const cashCost = choice?.cashCost ?? 0;
  if (cashCost <= 0) return null;
  const cash = state.financials?.cash ?? 0;
  const credit = choice.allowCredit === false ? 0 : getCreditRemaining(state);
  if (cash + credit >= cashCost) return null;
  return `${choice.label} needs ${dollars(cashCost)}, but the farm only has ${dollars(cash + credit)} available${choice.allowCredit === false ? " in cash" : " in cash and credit"}.`;
}

function eventChoiceContextStatus(state, event, choice) {
  const context = weeklyEventContext(state);
  const templateId = event?.templateId ?? event?.id;
  const requires = choice?.requires ?? {};

  if (requires.readyCrop && !context.hasReadyCrop) {
    return { hidden: true, reason: "No ready crops to check." };
  }
  if (requires.growingCrop && !context.hasGrowingCrop) {
    return { hidden: true, reason: "No growing crops need that response." };
  }
  if (requires.plantedCrop && !context.hasPlantedCrop) {
    return { hidden: true, reason: "No crop is planted for that response." };
  }
  if (requires.openField && !context.hasOpenField) {
    return { hidden: true, reason: "No open field needs that response." };
  }
  if (requires.weedWindow && !context.hasWeedWindow) {
    return { hidden: true, reason: "No field is in a useful weed-control window." };
  }

  if (templateId === "heavy_rain_ready_crop" && choice?.id === "check" && !context.hasReadyCrop) {
    return { hidden: true, reason: "No ready crops to check." };
  }
  if (templateId === "heavy_rain_ready_crop" && choice?.id === "push_harvest" && !context.hasReadyCrop) {
    return { hidden: true, reason: "No ready crops can be harvested before the rain." };
  }
  if (templateId === "dry_stretch" && choice?.id === "water" && !context.hasGrowingCrop) {
    return { hidden: true, reason: "No growing crops need water." };
  }

  const cashReason = eventChoiceCashStatus(state, choice);
  if (cashReason) return { hidden: false, reason: cashReason };
  return { hidden: false, reason: null };
}

export function weeklyEventChoiceStatus(state, event, choice) {
  const workCost = weeklyEventChoiceWorkCost(event, choice);
  const workStatus = workSlotStatus(state, workCost, `${event?.title ?? "Event"}: ${choice?.label ?? "Choice"}`);
  const contextStatus = eventChoiceContextStatus(state, event, choice);
  const disabled = Boolean(contextStatus.reason) || workStatus.disabled;
  return {
    ...workStatus,
    hidden: Boolean(contextStatus.hidden),
    disabled,
    reason: contextStatus.reason ?? workStatus.reason
  };
}

export function availableWeeklyEventChoices(state, event) {
  return (event?.choices ?? []).filter((choice) => !weeklyEventChoiceStatus(state, event, choice).hidden);
}

function canGenerateWeeklyEvent(state, event) {
  const eligible = event.isEligible ? event.isEligible() : event.condition();
  if (!eligible) return false;
  return availableWeeklyEventChoices(state, event).length > 0;
}

function heavyRainChoices(state) {
  const context = weeklyEventContext(state);
  if (context.hasReadyCrop) {
    const harvestTarget = context.readyFields.find((field) => !CROP_TYPES[field.cropId]?.isCoverCrop) ?? context.readyFields[0];
    return [
      {
        id: "check",
        label: "Check Ready Crops",
        workCost: 1,
        requires: { readyCrop: true },
        summary: "Scout ready fields before the rain changes harvest timing.",
        consequence: "Harvest timing becomes clearer."
      },
      {
        id: "push_harvest",
        label: "Push Harvest Before Rain",
        workCost: 2,
        cashCost: harvestTarget ? getHarvestCost(state, harvestTarget) : 0,
        allowCredit: true,
        requires: { readyCrop: true },
        summary: harvestTarget ? `Harvest ${harvestTarget.name} now before weather gets a vote.` : "Harvest one ready field now.",
        consequence: "One ready field is harvested before the rain."
      },
      {
        id: "wait",
        label: "Wait It Out",
        workCost: 0,
        summary: "Save the slot and accept some wet-harvest risk.",
        consequence: "Ready crops may pick up wet-field risk."
      }
    ];
  }

  if (context.hasGrowingCrop) {
    const choices = [
      {
        id: "scout_wet",
        label: "Scout Wet Fields",
        workCost: 1,
        requires: { growingCrop: true },
        summary: "Walk standing crop fields and update wet-field risk.",
        consequence: "Wet-field stress causes become visible."
      },
    ];
    if (context.hasWeedWindow) {
      choices.push(
        {
          id: "watch_weeds",
          label: "Watch Weed Pressure",
          workCost: 0,
          requires: { weedWindow: true },
          summary: "Use the rain warning to flag early weed pressure.",
          consequence: "Weed risk is called out without spending a slot."
        },
        {
          id: "delay_spraying",
          label: "Delay Spraying",
          workCost: 0,
          requires: { weedWindow: true },
          summary: "Avoid running spray through fields that are too wet.",
          consequence: "No rutting risk from forced wet work."
        }
      );
    } else {
      choices.push({
        id: "check_canopy",
        label: "Check Crop Canopy",
        workCost: 0,
        summary: "The weed window is mostly closed, so do not spray just because it rained.",
        consequence: "Confirms late weed work is not useful."
      });
    }
    choices.push(
      {
        id: "wait",
        label: "Wait It Out",
        workCost: 0,
        summary: "Save the slot and accept minor wet-field stress.",
        consequence: "Growing crops +2 stress."
      }
    );
    return choices;
  }

  return [
    {
      id: "walk_low_ground",
      label: "Walk The Low Ground",
      workCost: 1,
      requires: { openField: true },
      summary: "Scout low fields before planting into mud.",
      consequence: "Wet planting risk becomes clear."
    },
    {
      id: "delay_planting",
      label: "Delay Planting Plans",
      workCost: 0,
      summary: "Save the slot and avoid planting into soft ground.",
      consequence: "No crop stress because nothing is planted yet."
    },
    {
      id: "check_equipment_indoors",
      label: "Check Equipment Indoors",
      workCost: 0,
      summary: "Use the rain day to review the weakest machine.",
      consequence: "Equipment risk becomes clearer."
    },
    {
      id: "wait",
      label: "Wait It Out",
      workCost: 0,
      summary: "Do nothing costly while the field is too wet to work.",
      consequence: "No crop damage because nothing is planted."
    }
  ];
}

function dryStretchChoices(state) {
  const context = weeklyEventContext(state);
  if (context.hasGrowingCrop) {
    return [
      {
        id: "water",
        label: "Run Water Where You Can",
        workCost: 1,
        cashCost: 65,
        allowCredit: true,
        requires: { growingCrop: true },
        summary: "Spend $65, standing crop stress -5.",
        consequence: "-$65, growing crop stress -5."
      },
      {
        id: "save_cash",
        label: "Save Cash",
        workCost: 0,
        summary: "Standing crop stress +3.",
        consequence: "Growing crops +3 stress."
      }
    ];
  }

  return [
    {
      id: "walk_dry_ground",
      label: "Walk Dry Ground",
      workCost: 1,
      requires: { openField: true },
      summary: "Scout open fields for crusting and planting risk.",
      consequence: "Dry planting risk becomes clear."
    },
    {
      id: "wait_for_rain",
      label: "Wait For Rain",
      workCost: 0,
      summary: "No crop is planted, so this is a planting-timing warning.",
      consequence: "No crop stress because nothing is planted."
    }
  ];
}

function weeklyEventDeck(state) {
  const context = weeklyEventContext(state);
  const hasReadyCrop = context.hasReadyCrop;
  const hasGrowingCrop = context.hasGrowingCrop;
  const stressedField = state.fields.find((field) => field.cropId && !field.ready && field.stress >= 55);
  const roughMachine = context.roughMachine;
  const debtPressure = state.financials.debt >= 48000 || state.financials.creditUsed > getEffectiveCreditLimit(state) * 0.55;
  const hasActiveContract = state.contracts.some((contract) => ["accepted", "in_progress", "ready_to_complete"].includes(contract.status));
  const hasOpenContract = state.contracts.some((contract) => ["available", "accepted", "in_progress", "ready_to_complete"].includes(contract.status));
  const severeRoll = noise(state.seed + state.time.week + state.time.year * 31, 930);
  const needsEquipmentUpgrade = PROGRESSION_UPGRADES.some(
    (upgrade) => upgrade.type === "Equipment upgrade" && !(state.progression?.upgrades ?? []).includes(upgrade.id)
  );
  return [
    {
      id: "hollis_rain_hay",
      title: "Hollis Called Before Breakfast",
      source: "Hollis",
      category: "neighbor",
      locationId: "hollis_place",
      urgency: state.weather?.id === "storm_line" || state.weather?.id === "soaking_rain" ? "High" : "Medium",
      message: "Rain is nosing around the county and Hollis has hay down.",
      effectSummary: "Choice can trade cash, time, and reputation.",
      visibleConsequence: "Help costs work time; ignoring Hollis can cool the relationship.",
      condition: () => state.time.week >= 2,
      choices: [
        { id: "help", label: "Help Hollis Today", workCost: 1, summary: "Spend $55 fuel, reputation +2, worst field stress -4.", consequence: "+2 reputation, relationship improves." },
        { id: "upfront", label: "Ask for Payment", workCost: 1, summary: "Gain $90, reputation +1, smaller relationship gain.", consequence: "+$90, +1 reputation." },
        { id: "decline", label: "Tell Him You Can't", workCost: 0, summary: "No cost, reputation -1.", consequence: "-1 reputation." }
      ]
    },
    {
      id: "marge_grange_request",
      title: "Marge Needs Grange Help",
      source: "Marge",
      category: "community",
      locationId: "grange_hall",
      urgency: state.reputation < 45 ? "High" : "Medium",
      message: "The Grange Hall supper is short on hands, and Marge is counting names before noon.",
      effectSummary: "Low cash, good standing, and a county relationship bump.",
      visibleConsequence: "Community work competes with farm work but improves reputation.",
      condition: () => state.time.week >= 2 && state.reputation >= 28,
      choices: [
        { id: "help_setup", label: "Help Set Up", workCost: 1, summary: "Spend $30 supplies, reputation +3.", consequence: "+3 reputation, +1 Marge relationship." },
        { id: "send_cash", label: "Send Cash Instead", workCost: 0, summary: "Spend $75, reputation +1.", consequence: "-$75, +1 reputation." },
        { id: "pass", label: "Pass", workCost: 0, summary: "No cost, no help.", consequence: "No immediate change." }
      ]
    },
    {
      id: "marge_seed_shortage",
      title: "Marge Is Short On Drivers",
      source: "Marge",
      category: "contract",
      locationId: "farmers_coop",
      urgency: "High",
      message: "The co-op seed route is backed up. She wants to know if your truck can move today.",
      effectSummary: "Can create or support seed delivery work.",
      visibleConsequence: "Hauling seed costs a slot but can post contract work and reputation.",
      condition: () => state.reputation >= 30,
      choices: [
        { id: "haul", label: "Haul Seed", workCost: 1, summary: "Spend $35 fuel, reputation +2, co-op relationship +2.", consequence: "May add seed delivery work." },
        { id: "discount", label: "Ask About Inputs", workCost: 0, summary: "Unlock this week's input discount.", consequence: "Input discount this week." },
        { id: "pass", label: "Pass", workCost: 0, summary: "No cost, no help.", consequence: "No immediate change." }
      ]
    },
    {
      id: "roy_machine_warning",
      title: "Roy Heard Something Ugly",
      source: "Roy",
      category: "equipment",
      locationId: "roys_place",
      urgency: roughMachine?.condition < BALANCE.poorEquipmentThreshold ? "High" : "Medium",
      message: `${roughMachine?.name ?? "Your machine"} is close enough to trouble that Roy called instead of waiting.`,
      effectSummary: "Can slightly stabilize equipment or ignore the warning.",
      visibleConsequence: "Listening costs work time; ignoring can leave the weakest machine worse.",
      condition: () => context.earlySeason || (roughMachine?.condition ?? 100) < 58 || hasReadyCrop || (context.plantingWindow && context.hasOpenField),
      choices: [
        { id: "listen", label: context.earlySeason ? "Inspect Equipment" : "Listen To Roy", workCost: 1, cashCost: 25, allowCredit: true, summary: "Spend $25, roughest machine +3 condition.", consequence: "Small repair and relationship gain." },
        { id: "ignore", label: "Ignore Warning", workCost: 0, summary: "No cost, roughest machine -1 condition.", consequence: "Small equipment condition loss." }
      ]
    },
    {
      id: "breakdown_risk",
      title: "Breakdown Risk",
      source: "Machine Shed",
      category: "equipment",
      locationId: "machine_shed",
      urgency: "High",
      message: `${roughMachine?.name ?? "A machine"} is limping badly enough that waiting may cost more than fixing.`,
      effectSummary: "A quick repair response can prevent a sharper condition drop.",
      visibleConsequence: "Repair response costs cash and one work slot; ignoring risks more wear.",
      condition: () => state.time.week >= 3 && (roughMachine?.condition ?? 100) < 35,
      choices: [
        { id: "quick_fix", label: "Quick Fix", workCost: 1, summary: "Spend $120, roughest machine +8 condition.", consequence: "-$120, +8 equipment condition." },
        { id: "ignore", label: "Risk It", workCost: 0, summary: "No cost now, roughest machine -6 condition.", consequence: "Equipment condition drops." }
      ]
    },
    {
      id: "patti_market_rumor",
      title: "Patti Has Elevator Talk",
      source: "Patti",
      category: "market",
      locationId: "pattis_diner",
      urgency: "Low",
      message: "Coffee counter talk says one grain bid has more room than the sheet admits.",
      effectSummary: "Can improve one market bid this week.",
      visibleConsequence: "A free market read can make selling timing less blind.",
      condition: () => state.time.week >= 3,
      choices: [
        { id: "listen", label: "Listen In", workCost: 0, summary: "Best market bid +3% this week.", consequence: "Best market bid improves." },
        { id: "skip", label: "Skip Coffee", workCost: 0, summary: "No effect.", consequence: "No immediate change." }
      ]
    },
    {
      id: "earl_market_warning",
      title: "Earl Mentions Crop Timing",
      source: "Earl",
      category: "market",
      locationId: "bank",
      urgency: hasReadyCrop ? "Medium" : "Low",
      message: hasReadyCrop
        ? "Earl says ready grain and borrowed money make bad roommates if weather turns."
        : "Earl says the elevator sheet is worth reading before the note gets fatter.",
      effectSummary: "Informational market and credit timing advice.",
      visibleConsequence: "Reviewing can sharpen the best bid and mark the bank note clearer.",
      condition: () => state.time.week >= 3 && (hasReadyCrop || state.financials.creditUsed > 0),
      choices: [
        { id: "review", label: "Review Timing", workCost: 0, summary: "Best bid +2%, bank note clearer.", consequence: "Small bid bump and bank warning flag." },
        { id: "nod", label: "Just Nod", workCost: 0, summary: "No effect.", consequence: "No immediate change." }
      ]
    },
    {
      id: "gus_salvage_lead",
      title: "Gus Found Something In The Yard",
      source: "Gus",
      category: "salvage",
      locationId: "guss_yard",
      urgency: "Medium",
      message: "Gus says he dragged a better-than-usual piece out from behind the bins.",
      effectSummary: "Can add one salvage lead.",
      visibleConsequence: "Visiting costs a work slot and refreshes salvage opportunity.",
      condition: () => state.time.week % 2 === 1,
      choices: [
        { id: "visit", label: "Visit Gus", workCost: 1, summary: "Adds one salvage item to the yard.", consequence: "New salvage item appears." },
        { id: "pass", label: "Pass", workCost: 0, summary: "No effect.", consequence: "Lead may disappear next week." }
      ]
    },
    {
      id: "gus_questionable_deal",
      title: "Questionable Deal Behind Gus's Shed",
      source: "Gus",
      category: "salvage",
      locationId: "guss_yard",
      urgency: state.player?.backgroundId === "mechanic" ? "Medium" : "Low",
      message: "Gus has a cash-only lead that might be a bargain or might be somebody else's problem.",
      effectSummary: "Risk/reward salvage choice. Mechanics read it better.",
      visibleConsequence: "Inspecting costs cash and work time; passing is safe.",
      condition: () => state.time.week >= 3 && state.time.week % 2 === 0,
      choices: [
        { id: "inspect", label: "Inspect The Deal", workCost: 1, summary: "Spend $80; chance to add discounted salvage.", consequence: "Possible salvage bargain, possible wasted cash." },
        { id: "pass", label: "Walk Away", workCost: 0, summary: "No cost, no risk.", consequence: "No immediate change." }
      ]
    },
    {
      id: "dee_credit_pressure",
      title: "Dee Says Earl Is Watching Notes",
      source: "Dee",
      category: "bank",
      locationId: "bank",
      urgency: state.financials.creditUsed > getEffectiveCreditLimit(state) * 0.6 ? "High" : "Low",
      message: "The bank talk is polite, which somehow makes it worse.",
      effectSummary: "Can clarify bank pressure.",
      visibleConsequence: "Reviewing helps if credit is controlled; ducking high credit hurts reputation.",
      condition: () => state.time.week >= 4 && (state.financials.debt >= 36000 || state.financials.creditUsed > 0 || state.financials.cash < 900),
      choices: [
        { id: "review", label: "Review The Note", workCost: 0, summary: "Bank warning becomes clearer, reputation +1 if credit is controlled.", consequence: "Bank note flag; possible +1 reputation." },
        { id: "duck", label: "Duck The Call", workCost: 0, summary: "If credit is high, reputation -1.", consequence: "Possible reputation loss." }
      ]
    },
    {
      id: "payment_pressure",
      title: "Payment Pressure",
      source: "Ash Creek Savings",
      category: "bank",
      locationId: "bank",
      urgency: "High",
      message: "The note is getting heavy enough that Earl wants a cleaner weekly story.",
      effectSummary: "Debt and credit pressure can create reputation risk.",
      visibleConsequence: "Ignoring hot credit can ding standing; reviewing can improve terms if reputation is strong.",
      condition: () => state.time.week >= 4 && debtPressure,
      choices: [
        { id: "review_terms", label: "Review Terms", workCost: 0, summary: "Sets bank warning; high reputation improves credit limit a little.", consequence: "Possible small credit-limit improvement." },
        { id: "avoid", label: "Avoid Earl", workCost: 0, summary: "If debt pressure is high, reputation -1.", consequence: "Possible reputation loss." }
      ]
    },
    {
      id: "sandy_driver_shortage",
      title: "Sandy Needs Names For County Work",
      source: "Sandy",
      category: "contract",
      locationId: "grange_hall",
      urgency: "Medium",
      message: "The Grange board is short on people who can actually show up.",
      effectSummary: "Can push fresh contract work.",
      visibleConsequence: "Offering takes a slot and can refresh the contract board.",
      condition: () => state.reputation >= 38 || !hasOpenContract,
      choices: [
        { id: "offer", label: "Offer Your Name", workCost: 1, summary: "Contract board refreshes sooner, reputation +1.", consequence: "New contracts may post." },
        { id: "wait", label: "Wait", workCost: 0, summary: "No immediate effect.", consequence: "No immediate change." }
      ]
    },
    {
      id: "coop_discount_notice",
      title: "Co-op Discount Notice",
      source: "Marge",
      category: "market",
      locationId: "farmers_coop",
      urgency: "Medium",
      message: "Marge says seed, fertilizer, and spray pricing is a little softer today, but only for this week.",
      effectSummary: "Can lower input costs for the current week.",
      visibleConsequence: "Acknowledge to activate this week's input discount.",
      condition: () => state.time.week >= 2 && state.flags?.inputDiscountWeek !== state.time.week && ["fair", "cool_snap", "soaking_rain"].includes(state.weather?.id),
      choices: [
        { id: "activate_discount", label: "Mark The Discount", workCost: 0, summary: "Input discount active this week.", consequence: "Seed, fertilizer, and spray discounts this week." },
        { id: "miss_it", label: "Let It Slide", workCost: 0, summary: "No discount.", consequence: "No immediate change." }
      ]
    },
    {
      id: "heavy_rain_ready_crop",
      title: "Heavy Rain Coming",
      source: "Weather Radio",
      category: "weather",
      locationId: "home_farm",
      urgency: hasReadyCrop ? "High" : "Medium",
      message: hasReadyCrop
        ? "Ready crop is exposed if storm weather lands wrong."
        : hasGrowingCrop
          ? "Standing crops and wet fieldwork need a calmer look."
          : "Rain has the low fields soft. Planting too early could add stress.",
      effectSummary: hasReadyCrop
        ? "Can scout or push ready crop before rain."
        : hasGrowingCrop
          ? "Can scout wet standing crop fields or avoid forcing fieldwork."
          : "Early-season rain is a fieldwork warning, not a harvest warning.",
      visibleConsequence: hasReadyCrop
        ? "Ready-crop choices only appear when a ready crop exists."
        : hasGrowingCrop
          ? "Walking fields costs a slot and clarifies wet-field risk."
          : "Walking low ground costs a slot; waiting or delaying planting is free.",
      condition: () => ["soaking_rain", "storm_line"].includes(state.weather?.id) && (context.hasPlantedCrop || context.hasWetFieldworkWarning),
      choices: heavyRainChoices(state)
    },
    {
      id: "rain_window",
      title: "Rain Window",
      source: "Weather Radio",
      category: "weather",
      locationId: "home_farm",
      urgency: stressedField ? "Medium" : "Low",
      message: stressedField
        ? `${stressedField.name} may get a little relief if the rain holds steady.`
        : "A soft rain window is giving the county a rare quiet breath.",
      effectSummary: "Helpful weather can reduce drought stress and improve crop outlook.",
      visibleConsequence: "No disaster here; this is a chance to read fields calmly.",
      condition: () => state.weather?.id === "soaking_rain" && hasGrowingCrop,
      choices: [
        { id: "walk_after_rain", label: "Walk Fields After Rain", workCost: 0, summary: "Standing crops shed a little dry-weather stress.", consequence: "Growing crops stress -3." },
        { id: "take_the_win", label: "Take The Win", workCost: 0, summary: "No extra action.", consequence: "No immediate change." }
      ]
    },
    {
      id: "dry_stretch",
      title: "Dry Stretch Settled In",
      source: "Weather Radio",
      category: "weather",
      locationId: "home_farm",
      urgency: "High",
      message: hasGrowingCrop
        ? "The hot wind is pulling moisture out of every exposed decision."
        : "The hot wind has planting ground drying fast, but no crop is up to damage yet.",
      effectSummary: hasGrowingCrop ? "Can reduce drought stress at a fuel cost." : "Early dry weather changes planting timing, not crop yield.",
      visibleConsequence: hasGrowingCrop
        ? "Water response costs a slot and cash; saving cash raises crop stress."
        : "Walking dry ground costs a slot; waiting costs nothing and does not damage nonexistent crops.",
      condition: () => state.weather?.id === "hot_wind" && (hasGrowingCrop || context.hasDroughtPlantingOutlook),
      choices: dryStretchChoices(state)
    },
    {
      id: "severe_storm_line",
      title: "Severe Storm Line",
      source: "Weather Radio",
      category: "weather",
      locationId: "home_farm",
      urgency: "High",
      message: "A hard storm line is tracking close enough that every loose end feels loud.",
      effectSummary: "Rare event. Can damage ready crops or equipment if ignored.",
      visibleConsequence: "Securing the yard costs a slot and cash; ignoring can damage crop or equipment.",
      condition: () => state.time.week >= 8 && state.weather?.id === "storm_line" && (hasReadyCrop || (roughMachine?.condition ?? 100) < 60) && severeRoll < 0.18,
      choices: [
        { id: "secure_yard", label: "Secure The Yard", workCost: 1, cashCost: 40, allowCredit: true, summary: "Spend $40, soften crop/equipment damage.", consequence: "-$40, reduced storm loss." },
        { id: "ride_it_out", label: "Ride It Out", workCost: 0, summary: "No cost now, possible crop/equipment damage.", consequence: "Ready crop or equipment may take damage." }
      ]
    },
    {
      id: "trusted_county",
      title: "Ash Creek Trusts You Now",
      source: "Hollis",
      category: "land",
      locationId: "hollis_place",
      urgency: "High",
      message: "Hollis is willing to talk about leasing the Back 20 because people say you do what you promise.",
      effectSummary: "Acknowledges 90+ reputation and points to land opportunity.",
      visibleConsequence: "Starts the land conversation without forcing a purchase.",
      condition: () => state.reputation >= 90 && !state.flags?.highRepOpportunityAcknowledged,
      choices: [
        { id: "talk_terms", label: "Talk Lease Terms", workCost: 0, summary: "Marks the opportunity, reputation +1, points to Hollis's Place.", consequence: "+1 reputation, map moves to Hollis." },
        { id: "later", label: "Ask Later", workCost: 0, summary: "Opportunity remains on your radar.", consequence: "No immediate change." }
      ]
    },
    {
      id: "lease_opportunity",
      title: "Lease Opportunity",
      source: "Sandy",
      category: "land",
      locationId: "grange_hall",
      urgency: state.reputation >= 85 ? "High" : "Medium",
      message: "Sandy heard about small acreage that might come open if you keep county trust high.",
      effectSummary: "Progression hint toward leased ground and long-term growth.",
      visibleConsequence: "Following up points you toward the bank and land opportunity.",
      condition: () => state.reputation >= 72 && !(state.progression?.upgrades ?? []).includes("lease_back_20"),
      choices: [
        { id: "follow_up", label: "Follow Up", workCost: 0, summary: "Bank note clearer, current location becomes Grange Hall.", consequence: "Points to land progression." },
        { id: "not_now", label: "Not Now", workCost: 0, summary: "No effect.", consequence: "No immediate change." }
      ]
    },
    {
      id: "used_equipment_lead",
      title: "Used Equipment Lead",
      source: "Roy",
      category: "equipment",
      locationId: "roys_place",
      urgency: "Medium",
      message: "Roy says a usable piece of equipment is moving through the county before sunset.",
      effectSummary: "Can discount equipment upgrades this week.",
      visibleConsequence: "Inspecting costs a slot and opens a short equipment-upgrade discount.",
      condition: () => state.time.week >= 4 && state.reputation >= 35 && needsEquipmentUpgrade,
      choices: [
        { id: "inspect_lead", label: "Inspect Lead", workCost: 1, summary: "Equipment upgrades 8% cheaper this week.", consequence: "Equipment upgrade discount this week." },
        { id: "pass", label: "Pass", workCost: 0, summary: "No effect.", consequence: "No immediate change." }
      ]
    },
    {
      id: "quiet_county_notice",
      title: "Quiet Morning",
      source: "Ash Creek",
      category: "reputation",
      locationId: "home_farm",
      urgency: "Low",
      message: hasActiveContract
        ? "No fresh fire this morning, but accepted work is still waiting on the board."
        : "No one is pounding on the door yet. That is usually when good maintenance happens.",
      effectSummary: "Informational reminder that quiet weeks are still choices.",
      visibleConsequence: "No penalty; use the quiet.",
      condition: () => true,
      choices: [
        { id: "acknowledge", label: "Use The Quiet", workCost: 0, summary: "No effect.", consequence: "No immediate change." }
      ]
    }
  ];
}

export function generateWeeklyEvents(state) {
  const candidates = weeklyEventDeck(state)
    .filter((event) => canGenerateWeeklyEvent(state, event))
    .map((event) => ({ ...event, choices: availableWeeklyEventChoices(state, event) }));
  if (!candidates.length) return [];
  const urgencyWeight = { High: 0, Medium: 0.18, Low: 0.36 };
  const sorted = candidates
    .map((event, index) => ({ event, roll: noise(state.seed + state.time.week + state.time.year * 17, index + 800) }))
    .sort((a, b) => {
      if (a.event.id === "trusted_county") return -1;
      if (b.event.id === "trusted_county") return 1;
      if (a.event.id === "quiet_county_notice") return 1;
      if (b.event.id === "quiet_county_notice") return -1;
      return a.roll + (urgencyWeight[a.event.urgency] ?? 0.2) - (b.roll + (urgencyWeight[b.event.urgency] ?? 0.2));
    })
    .map(({ event }) => event);
  let count = 1;
  if (noise(state.seed + state.time.week, 805) < 0.45) count += 1;
  if (noise(state.seed + state.time.week, 806) < 0.16) count += 1;
  count = Math.max(1, Math.min(3, count, sorted.length));
  return sorted.slice(0, count).map((event) => ({
    id: `${event.id}_y${state.time.year}_w${state.time.week}`,
    templateId: event.id,
    category: event.category ?? "community",
    locationId: event.locationId ?? "home_farm",
    sourcePerson: event.source,
    week: state.time.week,
    weekGenerated: state.time.week,
    year: state.time.year,
    title: event.title,
    source: event.source,
    urgency: event.urgency,
    message: event.message,
    effectSummary: event.effectSummary,
    visibleConsequence: event.visibleConsequence ?? event.effectSummary,
    expiresWeek: state.time.week + (event.expiresInWeeks ?? 1),
    automaticEffect: event.automaticEffect ?? null,
    resultText: null,
    seen: false,
    resolved: false,
    appearsInReport: event.appearsInReport ?? true,
    handled: false,
    expired: false,
    choices: event.choices
  }));
}

export function weeklyEventChoiceWorkCost(event, choice) {
  if (choice?.workCost !== undefined) return choice.workCost;
  const templateId = event?.templateId ?? event?.id;
  const choiceId = choice?.id ?? choice;
  const workChoices = new Set([
    "hollis_rain_hay:help",
    "hollis_rain_hay:upfront",
    "marge_grange_request:help_setup",
    "marge_seed_shortage:haul",
    "roy_machine_warning:listen",
    "breakdown_risk:quick_fix",
    "gus_salvage_lead:visit",
    "gus_questionable_deal:inspect",
    "heavy_rain_ready_crop:check",
    "heavy_rain_ready_crop:scout_wet",
    "heavy_rain_ready_crop:walk_low_ground",
    "dry_stretch:water",
    "dry_stretch:walk_dry_ground",
    "severe_storm_line:secure_yard",
    "sandy_driver_shortage:offer",
    "used_equipment_lead:inspect_lead"
  ]);
  if (`${templateId}:${choiceId}` === "heavy_rain_ready_crop:push_harvest") return 2;
  return workChoices.has(`${templateId}:${choiceId}`) ? 1 : 0;
}

function addContractIfMissing(state, templateId, entries) {
  if (state.contracts.some((contract) => (contract.templateId ?? contract.id) === templateId && contract.status !== "archived")) {
    return;
  }
  const template = CONTRACT_TEMPLATES.find((contract) => contract.id === templateId);
  if (!template || state.reputation < (template.minReputation ?? 0)) return;
  state.contractSequence = (state.contractSequence ?? 0) + 1;
  state.contracts.push(createContract(template, state.time.week, state.contractSequence));
  entries.push(`New contract posted: ${template.title}.`);
}

export function resolveWeeklyEvent(state, eventId, choiceId) {
  const next = cloneState(state);
  let event = (next.weeklyEvents ?? []).find((item) => item.id === eventId);
  if (!event) return finish(next, false, "That weekly event is no longer on the board.");
  if (event.handled) return finish(next, false, `${event.title} has already been handled.`);
  if (event.expired || event.expiresWeek <= next.time.week - 1) return finish(next, false, `${event.title} already expired.`);

  const requestedChoice = event.choices?.find((item) => item.id === choiceId);
  if (requestedChoice) {
    const requestedStatus = weeklyEventChoiceStatus(next, event, requestedChoice);
    if (requestedStatus.hidden || requestedStatus.disabled) return finish(next, false, requestedStatus.reason);
  }
  const choices = availableWeeklyEventChoices(next, event);
  const choice = requestedChoice ?? choices[0];
  if (!choice) return finish(next, false, `${event.title} has no available response.`);
  const choiceStatus = weeklyEventChoiceStatus(next, event, choice);
  if (choiceStatus.hidden || choiceStatus.disabled) return finish(next, false, choiceStatus.reason);
  const workCost = getWorkSlotCost("event-choice", { workCost: choiceStatus.cost });
  const entries = [];
  let type = "success";

  if (event.templateId === "hollis_rain_hay") {
    const field = [...next.fields].sort((a, b) => b.stress - a.stress)[0];
    if (choice.id === "help") {
      const payment = spend(next, 55, "Helping Hollis", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      next.reputation = clamp(next.reputation + 2);
      next.relationships.hollis = (next.relationships.hollis ?? 0) + 2;
      if (field) {
        field.stress = clamp(field.stress - 4);
        recalcCondition(field);
        syncStressCauses(next, field);
      }
      entries.push(`You helped Hollis before the rain. Reputation +2${field ? `, ${field.name} stress eased.` : "."}`);
    } else if (choice.id === "upfront") {
      earn(next, 90, "Hollis cash favor");
      next.reputation = clamp(next.reputation + 1);
      next.relationships.hollis = (next.relationships.hollis ?? 0) + 1;
      entries.push("Hollis paid up front. The county respects the help, just a little less warmly.");
    } else {
      next.reputation = clamp(next.reputation - 1);
      entries.push("You told Hollis you could not make it. Fair enough, but people notice.");
      type = "warning";
    }
  }

  if (event.templateId === "marge_seed_shortage") {
    if (choice.id === "haul") {
      const payment = spend(next, 35, "Co-op seed route", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      next.reputation = clamp(next.reputation + 2);
      next.relationships.marge = (next.relationships.marge ?? 0) + 2;
      addContractIfMissing(next, "coop_delivery", entries);
      entries.push("You hauled enough seed to get Marge breathing again. Reputation +2.");
    } else if (choice.id === "discount") {
      next.flags.inputDiscountWeek = next.time.week;
      next.relationships.marge = (next.relationships.marge ?? 0) + 1;
      entries.push("Marge pointed you to this week's input discount.");
    } else {
      entries.push("You passed on the co-op scramble.");
      type = "info";
    }
  }

  if (event.templateId === "marge_grange_request") {
    if (choice.id === "help_setup") {
      const payment = spend(next, 30, "Grange setup supplies", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      next.reputation = clamp(next.reputation + 3);
      next.relationships.marge = (next.relationships.marge ?? 0) + 1;
      next.relationships.sandy = (next.relationships.sandy ?? 0) + 1;
      entries.push("You helped set up the Grange supper. Reputation +3, and Marge will remember the hands-on help.");
    } else if (choice.id === "send_cash") {
      const payment = spend(next, 75, "Grange supper cash help", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      next.reputation = clamp(next.reputation + 1);
      entries.push("You sent cash for the Grange supper. Reputation +1.");
    } else {
      entries.push("You passed on the Grange request. Nothing breaks, but no one writes your name down either.");
      type = "info";
    }
  }

  if (event.templateId === "roy_machine_warning") {
    const roughest = [...next.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (choice.id === "listen") {
      const payment = spend(next, 25, "Roy's quick listen", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      if (roughest) roughest.condition = clamp(roughest.condition + 3);
      next.relationships.roy = (next.relationships.roy ?? 0) + 1;
      entries.push(`${roughest?.name ?? "The roughest machine"} got a quick Roy adjustment.`);
    } else {
      if (roughest) roughest.condition = clamp(roughest.condition - 1);
      entries.push("You ignored Roy's ear. Maybe he is wrong. He usually is not.");
      type = "warning";
    }
  }

  if (event.templateId === "breakdown_risk") {
    const roughest = [...next.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (choice.id === "quick_fix") {
      const payment = spend(next, 120, "Quick breakdown prevention", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      if (roughest) roughest.condition = clamp(roughest.condition + 8);
      entries.push(`${roughest?.name ?? "The weakest machine"} got a quick fix before it turned into a bigger breakdown.`);
    } else {
      if (roughest) roughest.condition = clamp(roughest.condition - 6);
      entries.push(`${roughest?.name ?? "The weakest machine"} kept limping and lost condition.`);
      type = "warning";
    }
  }

  if (event.templateId === "patti_market_rumor") {
    if (choice.id === "listen") {
      const bids = Object.values(next.marketPrices).filter((bid) => CROP_TYPES[bid.cropId]?.marketable !== false);
      const best = bids.sort((a, b) => b.price - a.price)[0];
      if (best) {
        best.price = Number((best.price * 1.03).toFixed(2));
        best.note = "Patti's rumor says this bid has room today.";
        entries.push(`${best.name} bid improved after coffee-counter talk.`);
      }
      next.relationships.patti = (next.relationships.patti ?? 0) + 1;
    } else {
      entries.push("You skipped Patti's rumor. The coffee was probably better than the bid.");
      type = "info";
    }
  }

  if (event.templateId === "earl_market_warning") {
    if (choice.id === "review") {
      const bids = Object.values(next.marketPrices).filter((bid) => CROP_TYPES[bid.cropId]?.marketable !== false);
      const best = bids.sort((a, b) => b.price - a.price)[0];
      if (best) {
        best.price = Number((best.price * 1.02).toFixed(2));
        best.note = "Earl's timing warning nudged this bid onto your short list.";
        entries.push(`${best.name} bid improved after Earl's timing warning.`);
      }
      next.flags.bankNote = true;
      next.flags.priceNote = true;
      entries.push("The bank note and crop timing are clearer.");
    } else {
      entries.push("You nodded through Earl's warning and kept your own counsel.");
      type = "info";
    }
  }

  if (event.templateId === "gus_salvage_lead") {
    if (choice.id === "visit") {
      const fresh = generateSalvageMarket(next.time.week + next.salvageYard.length + 3, next.player.backgroundId, next.seed)[0];
      next.salvageYard = [fresh, ...next.salvageYard].slice(0, 4);
      next.relationships.gus = (next.relationships.gus ?? 0) + 1;
      entries.push(`Gus dragged out ${fresh.name}. It is now on the salvage list.`);
    } else {
      entries.push("You left Gus's find sitting in the weeds.");
      type = "info";
    }
  }

  if (event.templateId === "gus_questionable_deal") {
    if (choice.id === "inspect") {
      const payment = spend(next, 80, "Questionable salvage inspection", { allowCredit: false });
      if (!payment.ok) return finish(next, false, payment.message);
      const mechanicBonus = next.player?.backgroundId === "mechanic" ? 0.2 : 0;
      const success = noise(next.seed + next.time.week, next.inventory.salvage.length + 940) < 0.55 + mechanicBonus;
      if (success) {
        const fresh = generateSalvageMarket(next.time.week + next.salvageYard.length + 7, next.player.backgroundId, next.seed)[0];
        fresh.cost = Math.max(25, Math.round(fresh.cost * (next.player?.backgroundId === "mechanic" ? 0.72 : 0.84)));
        fresh.note = `${fresh.note} Gus's questionable lead has this priced below normal.`;
        next.salvageYard = [fresh, ...next.salvageYard].slice(0, 4);
        entries.push(`The questionable deal was real enough. ${fresh.name} is now in Gus's yard at a better price.`);
      } else {
        entries.push("The questionable deal was mostly noise. You spent cash learning not to chase that one.");
        type = "warning";
      }
    } else {
      entries.push("You walked away from Gus's questionable deal. Safe money is still money.");
      type = "info";
    }
  }

  if (event.templateId === "dee_credit_pressure") {
    if (choice.id === "review") {
      next.flags.bankNote = true;
      if (next.financials.creditUsed < getEffectiveCreditLimit(next) * 0.5) next.reputation = clamp(next.reputation + 1);
      entries.push("You reviewed the note before Earl had to chase you. The bank pressure is clearer.");
    } else {
      if (next.financials.creditUsed > getEffectiveCreditLimit(next) * 0.6) {
        next.reputation = clamp(next.reputation - 1);
        entries.push("You ducked the call while credit was hot. Earl noticed.");
        type = "warning";
      } else {
        entries.push("You ducked the call. Nothing caught fire today.");
        type = "info";
      }
    }
  }

  if (event.templateId === "payment_pressure") {
    if (choice.id === "review_terms") {
      next.flags.bankNote = true;
      if (next.reputation >= 65) {
        next.financials.creditLimit += 250;
        entries.push("You reviewed the terms before Earl had to chase you. High standing helped add $250 to the operating line.");
      } else {
        entries.push("You reviewed the terms. Earl did not loosen the line, but the pressure is no longer hidden.");
      }
    } else {
      if (next.financials.debt >= 48000 || next.financials.creditUsed > getEffectiveCreditLimit(next) * 0.55) {
        next.reputation = clamp(next.reputation - 1);
        entries.push("You avoided the bank conversation while the note was hot. Reputation -1.");
        type = "warning";
      } else {
        entries.push("You avoided the bank conversation. The numbers held for now.");
        type = "info";
      }
    }
  }

  if (event.templateId === "sandy_driver_shortage") {
    if (choice.id === "offer") {
      next.nextContractRefreshWeek = next.time.week;
      next.reputation = clamp(next.reputation + 1);
      next.relationships.sandy = (next.relationships.sandy ?? 0) + 1;
      refreshContracts(next, entries);
      entries.push("Sandy put your name on the board. Reputation +1.");
    } else {
      entries.push("You waited on the Grange request.");
      type = "info";
    }
  }

  if (event.templateId === "coop_discount_notice") {
    if (choice.id === "activate_discount") {
      next.flags.inputDiscountWeek = next.time.week;
      next.relationships.marge = (next.relationships.marge ?? 0) + 1;
      entries.push("You marked Marge's co-op discount. Seed, fertilizer, and spray are cheaper this week.");
    } else {
      entries.push("You let the co-op discount slide. Prices stay normal.");
      type = "info";
    }
  }

  if (event.templateId === "heavy_rain_ready_crop") {
    if (choice.id === "check") {
      const readyFields = next.fields.filter((item) => item.cropId && item.ready);
      for (const field of readyFields) {
        field.scouted = true;
        field.lastScoutWeek = next.time.week;
        field.scoutReport = buildScoutReport(next, field);
      }
      entries.push(`You checked ${readyFields.length} ready field(s) before the rain. Harvest timing is clearer.`);
    } else if (choice.id === "push_harvest") {
      const readyField = next.fields.find((item) => item.cropId && item.ready && !CROP_TYPES[item.cropId]?.isCoverCrop) ?? next.fields.find((item) => item.cropId && item.ready);
      if (!readyField) return finish(next, false, "No ready crops can be harvested before the rain.");
      const harvestResult = harvestField(next, readyField.id, { useCredit: true, skipWork: true });
      if (!harvestResult.ok) return finish(next, false, harvestResult.message);
      Object.assign(next, harvestResult.state);
      event = (next.weeklyEvents ?? []).find((item) => item.id === eventId) ?? event;
      entries.push(`You pushed harvest before the rain. ${harvestResult.message}`);
    } else if (choice.id === "scout_wet") {
      const targets = next.fields.filter((item) => item.cropId && !item.ready);
      for (const field of targets) {
        field.scouted = true;
        field.lastScoutWeek = next.time.week;
        field.scoutReport = buildScoutReport(next, field);
        if (field.id === "creek_bottom" || /creek|bottom|low/i.test(field.name)) {
          syncStressCauses(next, field, ["wet fields"]);
        }
      }
      entries.push(`You scouted ${targets.length} standing crop field(s). Wet-field risk is now visible before you spend more fieldwork.`);
    } else if (choice.id === "watch_weeds") {
      const targets = next.fields.filter((item) => item.cropId && !item.ready && item.weeds >= 40);
      for (const field of targets) syncStressCauses(next, field, ["weed pressure"]);
      entries.push(
        targets.length
          ? `You marked rain-fed weed pressure on ${targets.length} field(s). Treat only fields still in the useful weed window.`
          : "You checked weed pressure after the rain warning. Nothing needs a spray pass yet."
      );
      type = "info";
    } else if (choice.id === "delay_spraying") {
      next.flags.wetSprayDelayWeek = next.time.week;
      entries.push("You delayed spraying instead of rutting wet fields. No crop stress was added by forced fieldwork.");
      type = "info";
    } else if (choice.id === "check_canopy") {
      entries.push("You checked the canopy after the rain warning. The useful weed window is mostly closed, so spraying would be busywork.");
      type = "info";
    } else if (choice.id === "walk_low_ground") {
      const target = next.fields.find((item) => item.id === "creek_bottom") ?? next.fields.find((item) => !item.cropId) ?? next.fields[0];
      if (target) {
        target.scouted = true;
        target.lastScoutWeek = next.time.week;
        target.scoutReport = `${target.name} is soft after rain. Planting into it this week could create wet-field stress.`;
        target.lastAction = "Walked low ground";
        recordStressHistory(next, target, "wet fields", 0, "Walked low ground before planting; risk identified without adding stress.");
        syncStressCauses(next, target, ["wet fields"]);
      }
      entries.push(`${target?.name ?? "Low ground"} is too soft for clean planting this week. Waiting avoids early stress.`);
    } else if (choice.id === "delay_planting") {
      next.flags.plantingDelayedByRainWeek = next.time.week;
      entries.push("You delayed planting plans until the ground firms up. No crop took damage because nothing is planted.");
      type = "info";
    } else if (choice.id === "check_equipment_indoors") {
      const roughest = [...next.equipment].sort((a, b) => a.condition - b.condition)[0];
      next.flags.equipmentRainCheckWeek = next.time.week;
      entries.push(`${roughest?.name ?? "Your equipment"} is the machine to watch once fields dry.`);
      type = "info";
    } else {
      const readyFields = next.fields.filter((item) => item.cropId && item.ready);
      const growingFields = next.fields.filter((item) => item.cropId && !item.ready);
      if (readyFields.length) {
        for (const field of readyFields) {
          field.stress = clamp(field.stress + 3);
          field.stressLockedInYieldLoss = clamp((field.stressLockedInYieldLoss ?? 0) + 1, 0, 35);
          recordStressHistory(next, field, "wet fields", 3, "Waited through heavy rain with ready crop standing.");
          recalcCondition(field);
          syncStressCauses(next, field, ["wet fields"]);
        }
        entries.push("You waited out the rain. Ready crops picked up wet harvest risk.");
      } else if (growingFields.length) {
        for (const field of growingFields) {
          field.stress = clamp(field.stress + 2);
          recalcCondition(field);
          syncStressCauses(next, field, ["wet fields"]);
        }
        entries.push("You waited out the rain. Standing crops picked up a little wet-field stress.");
      } else {
        entries.push("You waited out the rain. Planting waits, but no crop exists to damage.");
        type = "info";
      }
      if (readyFields.length || growingFields.length) type = "warning";
    }
  }

  if (event.templateId === "rain_window") {
    if (choice.id === "walk_after_rain") {
      let changed = 0;
      for (const field of next.fields.filter((item) => item.cropId && !item.ready)) {
        const before = field.stress;
        field.stress = clamp(field.stress - 3);
        if (field.stress !== before) {
          changed += 1;
          recordStressHistory(next, field, "helpful rain", -3, "Rain window eased growing crop stress.");
        }
        recalcCondition(field);
        syncStressCauses(next, field);
      }
      entries.push(changed ? `Rain helped ${changed} growing field(s) shed stress.` : "The rain window helped the county more than your fields this time.");
    } else {
      entries.push("You took the rain window as a small win and moved on.");
      type = "info";
    }
  }

  if (event.templateId === "dry_stretch") {
    if (choice.id === "water") {
      const payment = spend(next, 65, "Dry stretch water run", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      for (const field of next.fields.filter((item) => item.cropId && !item.ready)) {
        field.stress = clamp(field.stress - 5);
        recalcCondition(field);
        syncStressCauses(next, field);
      }
      entries.push("You ran water where you could. Drought stress eased, not vanished.");
    } else if (choice.id === "save_cash") {
      for (const field of next.fields.filter((item) => item.cropId && !item.ready)) {
        field.stress = clamp(field.stress + 3);
        recalcCondition(field);
        syncStressCauses(next, field, ["dry weather"]);
      }
      entries.push("You saved cash and let the dry stretch ride. Standing crops felt it.");
      type = "warning";
    } else if (choice.id === "walk_dry_ground") {
      const targets = next.fields.filter((item) => !item.cropId);
      for (const field of targets) {
        field.scouted = true;
        field.lastScoutWeek = next.time.week;
        field.scoutReport = `${field.name} is drying fast. Wait for moisture before planting if you can spare the timing.`;
        recordStressHistory(next, field, "dry planting outlook", 0, "Walked open ground during dry stretch; planting risk identified without crop damage.");
      }
      entries.push(`You walked ${targets.length || 1} open field(s). Dry weather is a planting-timing risk, not crop damage yet.`);
    } else {
      next.flags.waitingForRainWeek = next.time.week;
      entries.push("You waited for rain. With no crop planted, the dry stretch did not damage yield.");
      type = "info";
    }
  }

  if (event.templateId === "severe_storm_line") {
    const readyField = next.fields.find((item) => item.cropId && item.ready);
    const roughest = [...next.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (choice.id === "secure_yard") {
      const payment = spend(next, 40, "Storm yard prep", { allowCredit: true });
      if (!payment.ok) return finish(next, false, payment.message);
      if (readyField) {
        readyField.stress = clamp(readyField.stress + 2);
        readyField.stressLockedInYieldLoss = clamp((readyField.stressLockedInYieldLoss ?? 0) + 2, 0, 35);
        recordStressHistory(next, readyField, "storm damage", 2, "Storm prep softened ready-crop damage.");
        recalcCondition(readyField);
        syncStressCauses(next, readyField, ["storm damage"]);
      }
      entries.push(`You secured the yard before the severe line. ${readyField ? `${readyField.name} still took a little stress, but the worst missed.` : "The storm mostly missed your crop."}`);
    } else {
      if (readyField) {
        readyField.stress = clamp(readyField.stress + 10);
        readyField.condition = clamp(readyField.condition - 8);
        reduceLockedYield(readyField, 0.07);
        readyField.stressLockedInYieldLoss = clamp((readyField.stressLockedInYieldLoss ?? 0) + 8, 0, 35);
        recordStressHistory(next, readyField, "storm damage", 10, "Severe storm line damaged ready crop.");
        syncStressCauses(next, readyField, ["storm damage", "locked-in yield loss"]);
      } else if (roughest) {
        roughest.condition = clamp(roughest.condition - 5);
      }
      entries.push(readyField ? `${readyField.name} took severe storm damage.` : `${roughest?.name ?? "Equipment"} took storm wear.`);
      type = "warning";
    }
  }

  if (event.templateId === "trusted_county") {
    if (choice.id === "talk_terms") {
      next.flags.highRepOpportunityAcknowledged = true;
      next.reputation = clamp(next.reputation + 1);
      next.currentLocationId = "hollis_place";
      entries.push("Ash Creek trusts you now. Hollis is ready to talk seriously about the Back 20.");
    } else {
      entries.push("You told Hollis you would talk later. The opportunity stays warm.");
      type = "info";
    }
  }

  if (event.templateId === "lease_opportunity") {
    if (choice.id === "follow_up") {
      next.flags.bankNote = true;
      next.currentLocationId = "grange_hall";
      entries.push("You followed Sandy's lease lead. The Grange and bank are the places to watch for land growth.");
    } else {
      entries.push("You left the lease lead warm but untouched.");
      type = "info";
    }
  }

  if (event.templateId === "used_equipment_lead") {
    if (choice.id === "inspect_lead") {
      next.flags.usedEquipmentLeadWeek = next.time.week;
      next.currentLocationId = "roys_place";
      next.relationships.roy = (next.relationships.roy ?? 0) + 1;
      entries.push("Roy's used equipment lead is live. Equipment upgrades are 8% cheaper this week.");
    } else {
      entries.push("You passed on Roy's used equipment lead.");
      type = "info";
    }
  }

  if (event.templateId === "quiet_county_notice") {
    entries.push("Quiet morning noted. No one gets paid for panic you did not need.");
    type = "info";
  }

  consumeWorkSlots(next, workCost, `${event.title}: ${choice.label}`);
  event.handled = true;
  event.resolved = true;
  event.seen = true;
  event.choiceId = choice.id;
  event.choiceLabel = choice.label;
  event.result = entries.join(" ");
  event.resultText = event.result;
  next.events = next.events ?? [];
  next.events.unshift({
    week: next.time.week,
    id: event.templateId,
    title: event.title,
    category: event.category ?? "community",
    type: "weekly",
    note: event.result
  });
  next.events = next.events.slice(0, 20);
  return finish(next, true, `${event.title}: ${event.result}`, type);
}

function expireWeeklyEvent(state, event, entries) {
  event.expired = true;
  event.seen = Boolean(event.seen);
  let result = `${event.title} expired without a response.`;

  if (event.templateId === "hollis_rain_hay") {
    state.relationships.hollis = (state.relationships.hollis ?? 0) - 1;
    result = "Hollis found help elsewhere, but he noticed you never called back. Hollis relationship -1.";
  }

  if (event.templateId === "marge_grange_request") {
    result = "The Grange supper got handled without you. No penalty, no standing gained.";
  }

  if (event.templateId === "roy_machine_warning") {
    const roughest = [...state.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (roughest) roughest.condition = clamp(roughest.condition - 2);
    result = `${roughest?.name ?? "The roughest machine"} kept getting rougher after Roy's warning went unanswered.`;
  }

  if (event.templateId === "breakdown_risk") {
    const roughest = [...state.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (roughest) roughest.condition = clamp(roughest.condition - 5);
    result = `${roughest?.name ?? "The weakest machine"} lost condition after the breakdown warning was ignored.`;
  }

  if (event.templateId === "gus_salvage_lead" || event.templateId === "gus_questionable_deal") {
    result = "Gus's salvage lead disappeared. Somebody else hauled it off.";
  }

  if (event.templateId === "dee_credit_pressure" || event.templateId === "payment_pressure") {
    if (state.financials.debt >= 48000 || state.financials.creditUsed > getEffectiveCreditLimit(state) * 0.55) {
      state.reputation = clamp(state.reputation - 1);
      result = "Dee's credit warning went unanswered while the note was hot. Reputation -1.";
    } else {
      result = "Dee's credit warning passed without a new issue.";
    }
  }

  if (event.templateId === "heavy_rain_ready_crop") {
    for (const field of state.fields.filter((item) => item.cropId && !item.ready)) {
      field.stress = clamp(field.stress + 2);
      recordStressHistory(state, field, "wet fields", 2, "Unresolved heavy rain warning added wet-field stress.");
      recalcCondition(field);
      syncStressCauses(state, field, ["wet fields"]);
    }
    result = "The heavy rain warning passed unresolved. Standing crops picked up wet-field stress.";
  }

  if (event.templateId === "dry_stretch") {
    for (const field of state.fields.filter((item) => item.cropId && !item.ready)) {
      field.stress = clamp(field.stress + 3);
      recordStressHistory(state, field, "dry weather", 3, "Unresolved dry stretch added drought stress.");
      recalcCondition(field);
      syncStressCauses(state, field, ["dry weather"]);
    }
    result = "The dry stretch went unanswered. Growing crops picked up drought stress.";
  }

  if (event.templateId === "severe_storm_line") {
    const readyField = state.fields.find((item) => item.cropId && item.ready);
    if (readyField) {
      readyField.stress = clamp(readyField.stress + 8);
      readyField.condition = clamp(readyField.condition - 7);
      reduceLockedYield(readyField, 0.06);
      readyField.stressLockedInYieldLoss = clamp((readyField.stressLockedInYieldLoss ?? 0) + 7, 0, 35);
      recordStressHistory(state, readyField, "storm damage", 8, "Unanswered severe storm line damaged ready crop.");
      syncStressCauses(state, readyField, ["storm damage", "locked-in yield loss"]);
      result = `${readyField.name} took storm damage after the severe warning went unresolved.`;
    } else {
      const roughest = [...state.equipment].sort((a, b) => a.condition - b.condition)[0];
      if (roughest) roughest.condition = clamp(roughest.condition - 4);
      result = `${roughest?.name ?? "Equipment"} took storm wear after the severe warning went unresolved.`;
    }
  }

  if (event.templateId === "coop_discount_notice") {
    result = "The co-op discount expired. Input prices are back to normal.";
  }

  if (event.templateId === "used_equipment_lead") {
    result = "Roy's used equipment lead moved on to another buyer.";
  }

  if (event.templateId === "lease_opportunity" || event.templateId === "trusted_county") {
    result = "The land conversation cooled for now, but county trust can bring it back.";
  }

  if (event.templateId === "quiet_county_notice") {
    result = "The quiet morning passed. Nothing demanded a response.";
  }

  event.result = result;
  event.resultText = result;
  state.events = state.events ?? [];
  state.events.unshift({
    week: state.time.week,
    id: event.templateId,
    title: event.title,
    category: event.category ?? "community",
    type: "weekly_expired",
    note: result
  });
  state.events = state.events.slice(0, 20);
  if (event.appearsInReport !== false) entries.push(result);
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
  state.stats = state.stats ?? {};
  if (event.type === "weather" && event.rare) state.stats.majorEvents = (state.stats.majorEvents ?? 0) + 1;
  entries.push(`${event.title}: ${event.note}`);

  if (event.effect === "harvest_delay") {
    state.flags.harvestDelayWeek = state.time.week;
    for (const field of state.fields) {
      field.stress = clamp(field.stress + 3);
      field.scouted = false;
      field.scoutReport = null;
      syncStressCauses(state, field, ["wet fields"]);
    }
    entries.push("Heavy fieldwork is a poor bet this week; ready crops may need to wait.");
  }

  if (event.effect === "drought") {
    for (const field of state.fields.filter((item) => item.cropId)) {
      field.stress = clamp(field.stress + 10);
      field.condition = clamp(field.condition - 4);
      field.scouted = false;
      field.scoutReport = null;
      syncStressCauses(state, field, ["dry weather"]);
    }
    entries.push("Standing crops picked up drought stress.");
  }

  if (event.effect === "storm_damage") {
    const readyField = state.fields.find((field) => field.cropId && field.ready);
    if (readyField) {
      readyField.stress = clamp(readyField.stress + 12);
      readyField.condition = clamp(readyField.condition - 12);
      reduceLockedYield(readyField, hasUpgrade(state, "harvest_upgrade") ? 0.05 : 0.09);
      readyField.stressLockedInYieldLoss = clamp((readyField.stressLockedInYieldLoss ?? 0) + 9, 0, 35);
      readyField.scouted = false;
      readyField.scoutReport = null;
      syncStressCauses(state, readyField, ["storm damage", "locked-in yield loss"]);
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

  if (event.effect === "severe_community") {
    const roughest = [...state.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (roughest) {
      roughest.condition = clamp(roughest.condition - 4);
      entries.push(`${roughest.name} picked up storm-check wear. Roy will have opinions.`);
    }
    state.nextContractRefreshWeek = state.time.week;
  }

  if (event.effect === "input_discount") {
    state.flags.inputDiscountWeek = state.time.week;
    entries.push("Fertilizer, seed, and spray costs are discounted this week.");
  }

  if (event.effect === "equipment_warning") {
    const roughest = [...state.equipment].sort((a, b) => a.condition - b.condition)[0];
    if (roughest) entries.push(`Roy says ${roughest.name} is the machine most likely to cost you next.`);
  }

  if (event.effect === "market_rumor") {
    const bids = Object.values(state.marketPrices).filter((bid) => CROP_TYPES[bid.cropId]?.marketable !== false);
    const best = bids.sort((a, b) => b.price - a.price)[0];
    if (best) {
      best.price = Number((best.price * 1.04).toFixed(2));
      best.note = "Patti's rumor nudged this bid up for the week.";
      entries.push(`${best.name} bid improved after Patti's rumor.`);
    }
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
    ["available", "accepted", "in_progress", "ready_to_complete"].includes(contract.status)
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
    if (!["accepted", "in_progress", "ready_to_complete"].includes(contract.status)) continue;

    if (contract.deadlineWeek && state.time.week >= contract.deadlineWeek && contract.status !== "completed") {
      contract.status = "failed";
      contract.failedWeek = state.time.week;
      contract.failureMessage = contract.failureReason ?? contract.consequence ?? "The job was not completed before its deadline.";
      nextContractFailure(state, contract);
      state.stats = state.stats ?? {};
      state.stats.contractsFailed = (state.stats.contractsFailed ?? 0) + 1;
      entries.push(`${contract.title} expired. Failed because: ${contract.failureMessage}`);
      continue;
    }

    contract.weeksLeft = Math.max(0, (contract.deadlineWeek ?? state.time.week) - state.time.week);
    if (contract.status === "accepted") {
      const warning = contract.weeksLeft <= 1 ? " Deadline next week. This will fail if the active step is not done." : "";
      entries.push(`${contract.title} is waiting on you. Next step: ${contractNextStep(state, contract)}${warning}`);
      continue;
    }
    if (contract.status === "in_progress" && state.time.week >= (contract.readyWeek ?? state.time.week + 1)) {
      contract.status = "ready_to_complete";
      entries.push(`${contract.title} is ready to settle on the contract board. Next step: ${contractNextStep(state, contract)}`);
    } else if (contract.status === "in_progress") {
      const warning = contract.weeksLeft <= 1 ? " Deadline next week. This will fail if not completed." : "";
      entries.push(`${contract.title} is in progress. ${contract.weeksLeft} week(s) remain. Next step: ${contractNextStep(state, contract)}${warning}`);
    } else {
      const warning = contract.weeksLeft <= 1 ? " Deadline next week. This will fail if not completed." : "";
      entries.push(`${contract.title} is ready to complete. ${contract.weeksLeft} week(s) remain. Next step: ${contractNextStep(state, contract)}${warning}`);
    }
  }
}

function nextContractFailure(state, contract) {
  state.reputation = clamp(state.reputation - Math.max(2, Math.floor(contract.reputation / 2)));
  if (contract.npcId) state.relationships[contract.npcId] = (state.relationships[contract.npcId] ?? 0) - 1;
}

function workLeftUndoneSummary(state) {
  const items = [];
  const readyFields = state.fields.filter((field) => field.ready && field.cropId);
  if (readyFields.length) items.push(`${readyFields.length} harvest-ready field${readyFields.length === 1 ? "" : "s"}`);
  const acceptedContracts = state.contracts.filter((contract) => contract.status === "accepted");
  if (acceptedContracts.length) items.push(`${acceptedContracts.length} contract active step${acceptedContracts.length === 1 ? "" : "s"}`);
  const openEvents = (state.weeklyEvents ?? []).filter((event) => !event.handled && !event.expired);
  if (openEvents.length) items.push(`${openEvents.length} county call${openEvents.length === 1 ? "" : "s"}`);
  const roughMachines = state.equipment.filter((machine) => machine.condition < BALANCE.poorEquipmentThreshold);
  if (roughMachines.length) items.push(`${roughMachines.length} machine repair risk${roughMachines.length === 1 ? "" : "s"}`);
  const needyFields = state.fields.filter(
    (field) => field.cropId && !field.ready && (field.weeds >= 50 || field.fertility < 42 || field.stress >= 58)
  );
  if (needyFields.length) items.push(`${needyFields.length} stressed field decision${needyFields.length === 1 ? "" : "s"}`);
  return items.slice(0, 3);
}

function weeklyStressDelta(state, field) {
  const causes = [];
  let delta = 0;
  const weather = state.weather;
  const standingCrop = Boolean(field.cropId);

  if (!standingCrop) {
    delta -= 2;
    if (field.fieldAvailabilityState === "fallow_rest" || field.fieldAvailabilityState === "post_cover_crop") delta -= 2;
    return { delta, causes: delta < 0 ? ["resting ground"] : causes, note: "Open ground recovered slightly." };
  }

  if (weather.id === "hot_wind") {
    delta += 8;
    causes.push("dry weather");
  } else if (weather.id === "storm_line") {
    delta += field.ready ? 6 : 4;
    causes.push("storm damage");
  } else if (weather.id === "soaking_rain") {
    if (field.stressCauses?.includes("dry weather")) {
      delta -= 7;
      causes.push("recovering after rain");
    } else if (field.id === "creek_bottom") {
      delta += 3;
      causes.push("wet fields");
    } else {
      delta -= 2;
      causes.push("helpful rain");
    }
  } else if (weather.id === "fair" || weather.id === "cool_snap") {
    delta -= field.stress > 35 ? 3 : 1;
    causes.push("better weather");
  }

  if (field.fertility < 42 && !field.ready) {
    delta += field.cropId === "corn" ? 3 : 2;
    causes.push("tired fertility");
  }

  if (field.weeds >= 50 && !field.ready) {
    if (isEarlyWeedWindow(field)) {
      delta += 4;
      causes.push("weed pressure");
    } else {
      delta += 1;
      causes.push("late weeds");
    }
  }

  if ((field.rotationNote && /tired|repeat|risk/i.test(field.rotationNote)) || (field.previousCropId && field.previousCropId === field.cropId)) {
    delta += 2;
    causes.push("rotation pressure");
  }

  return { delta, causes: unique(causes), note: causes.length ? `Stress changed from ${causes.join(", ")}.` : "No active stress cause." };
}

export function advanceWeek(state) {
  const next = cloneState(state);
  const entries = [];
  const previousWork = { ...ensureWorkState(next) };
  const leftUndone = workLeftUndoneSummary(next);
  const startingFinancials = {
    cash: next.financials.cash,
    debt: next.financials.debt,
    creditUsed: next.financials.creditUsed,
    reputation: next.reputation
  };
  if (next.time.week >= next.time.maxWeeks) {
    next.lastReport = buildCampaignReport(next);
    next.flags.endOfYearReady = true;
    return finish(next, true, "Season report is ready.", "info");
  }

  for (const event of next.weeklyEvents ?? []) {
    if (event.handled && event.appearsInReport !== false) {
      entries.push(`${event.title} resolved: ${event.resultText ?? event.result ?? event.choiceLabel ?? "Handled."}`);
    } else if (!event.handled && !event.expired) {
      expireWeeklyEvent(next, event, entries);
    }
  }
  next.weeklyEvents = [];
  next.time.week += 1;
  const preparednessLimit = preparednessCap(next);
  const bankedPreparedness = Math.min(preparednessLimit, previousWork.remaining ?? 0);
  const lostUnusedWork = Math.max(0, (previousWork.remaining ?? 0) - bankedPreparedness);
  resetWorkSlots(next, bankedPreparedness);
  if ((previousWork.remaining ?? 0) <= 0) {
    entries.push(`Last week's work capacity was fully booked: ${workSlotText(previousWork.used)} used. New week reset to ${workSlotText(next.work.remaining)}.`);
  } else if (bankedPreparedness > 0) {
    entries.push(
      `${workSlotText(bankedPreparedness)} was banked as preparedness. New week starts with ${workSlotText(next.work.remaining)} available (${workSlotText(next.work.slotsPerWeek)} base + ${workSlotText(bankedPreparedness)} banked).`
    );
    if (lostUnusedWork > 0) entries.push(`${workSlotText(lostUnusedWork)} unused work was lost. Better planning upgrades can bank more.`);
  } else if (leftUndone.length) {
    entries.push(
      `Last week ended with ${workSlotText(previousWork.remaining)} unused while ${leftUndone.join(", ")} waited. New week reset to ${workSlotText(next.work.remaining)}.`
    );
  } else if (lostUnusedWork > 0 && preparednessLimit > 0) {
    entries.push(`Unused work was lost. Better planning upgrades can bank more. New week reset to ${workSlotText(next.work.remaining)}.`);
  } else {
    entries.push(`New week reset to ${workSlotText(next.work.remaining)}. Unused slots did not carry over.`);
  }
  next.flags.harvestDelayWeek = null;
  if (next.flags.inputDiscountWeek !== next.time.week) next.flags.inputDiscountWeek = null;
  if (next.flags.usedEquipmentLeadWeek !== next.time.week) next.flags.usedEquipmentLeadWeek = null;
  next.flags.endOfYearReady = false;
  next.weather = weatherForWeek(next.time.week, next.seed);
  next.marketPrices = marketForWeek(next.time.week, next.player.backgroundId, next.seed);
  if (next.time.week % 2 === 1) {
    next.salvageYard = generateSalvageMarket(next.time.week, next.player.backgroundId, next.seed);
    entries.push("Gus dragged a fresh row of salvage into view.");
  }

  recordEvent(next, eventForWeek(next), entries);
  next.weeklyEvents = generateWeeklyEvents(next);
  if (next.weeklyEvents.length) {
    entries.push(
      `This Week in Ash Creek: ${next.weeklyEvents
        .map((event) => `${event.source} - ${event.title}`)
        .join("; ")}.`
    );
  }

  for (const field of next.fields) {
    ensureFieldSeasonState(next, field);
    field.weeds = clamp(field.weeds + BALANCE.weedGrowthBase + next.weather.weed);
    field.fertility = clamp(field.fertility + next.weather.fertility);
    const stressChange = weeklyStressDelta(next, field);
    field.stress = clamp(field.stress + stressChange.delta);
    if (stressChange.delta !== 0) {
      recordStressHistory(next, field, stressChange.causes[0] ?? "weather", stressChange.delta, stressChange.note);
    }
    if (stressChange.delta < 0 && stressChange.causes.includes("recovering after rain")) {
      entries.push(`${field.name} shed drought stress after soaking rain.`);
    }
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
    syncStressCauses(next, field, stressChange.delta > 0 ? stressChange.causes : []);
    if (field.cropId && field.ready) lockReadyYield(next, field, entries);
    if (field.cropId && field.ready && next.weather.harvestLoss) {
      const loss = Math.round(next.weather.harvestLoss * 100);
      field.stress = clamp(field.stress + loss);
      field.condition = clamp(field.condition - loss);
      reduceLockedYield(field, hasUpgrade(next, "harvest_upgrade") ? next.weather.harvestLoss * 0.55 : next.weather.harvestLoss);
      field.stressLockedInYieldLoss = clamp((field.stressLockedInYieldLoss ?? 0) + loss, 0, 35);
      syncStressCauses(next, field, ["storm damage", "locked-in yield loss"]);
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

  entries.unshift(`${calendarLabel(next)} weather: ${next.weather.name}. ${next.weather.note}`);
  if (next.time.week === 18) {
    entries.push("Mid-season check: the old 18-week prototype mark is now just a checkpoint, not the finish line.");
  }
  if (next.time.week === next.time.maxWeeks) {
    entries.push("End-season checkpoint reached. Review the report before deciding how the farm carries forward.");
    next.flags.endOfYearReady = true;
  }
  const warnings = getFinancialWarnings(next);
  entries.push(...warnings);
  entries.push(
    `Ledger movement: cash ${dollars(next.financials.cash - startingFinancials.cash)}, debt ${dollars(next.financials.debt - startingFinancials.debt)}, credit used ${dollars(next.financials.creditUsed - startingFinancials.creditUsed)}, reputation ${next.reputation - startingFinancials.reputation >= 0 ? "+" : ""}${next.reputation - startingFinancials.reputation}.`
  );
  if (entries.length === 1) entries.push("Quiet week. That is not the same as a free week.");

  const weeklyReport = {
    title: `Week ${next.time.week} Report`,
    entries,
    finances: {
      cash: next.financials.cash,
      debt: next.financials.debt,
      creditRemaining: getCreditRemaining(next),
      reputation: next.reputation
    }
  };
  next.lastReport = next.time.week === next.time.maxWeeks ? buildCampaignReport(next) : weeklyReport;

  return finish(next, true, `Advanced to week ${next.time.week}. Review the report before making the next move.`, "info");
}

export function buildCampaignReport(state) {
  const cropValue = Object.entries(state.inventory.crops).reduce((sum, [cropId, qty]) => {
    const price = state.marketPrices[cropId]?.price ?? CROP_TYPES[cropId].basePrice;
    return sum + qty * price;
  }, 0);
  const netPosition = Math.round(state.financials.cash + cropValue - state.financials.debt);
  const completed = state.stats?.contractsCompleted ?? state.contracts.filter((contract) => contract.status === "completed").length;
  const failed = state.stats?.contractsFailed ?? state.contracts.filter((contract) => contract.status === "failed").length;
  const upgrades = state.progression?.upgrades?.length ?? 0;
  const season = classifySeasonOutcome(state);
  return {
    title: `End-of-Year ${state.time.year} Report`,
    entries: [
      `Outcome: ${season.label}.`,
      `Cash: ${dollars(state.financials.cash)}.`,
      `Debt: ${dollars(state.financials.debt)}.`,
      `Net position after stored crop value: ${dollars(netPosition)}.`,
      `Stored crop value at current bids: ${dollars(cropValue)}.`,
      `Reputation: ${state.reputation}/100.`,
      `Fields managed: ${state.fields.length}. Contracts completed/failed: ${completed}/${failed}.`,
      `Crop income booked: ${dollars(state.stats?.cropIncome ?? state.financials.income)}. Repairs, inputs, interest, and upgrades spent: ${dollars(state.financials.expenses)}.`,
      `Upgrades or land improvements owned: ${upgrades}. Major events survived: ${state.stats?.majorEvents ?? 0}.`,
      season.narrative
    ],
    finances: {
      cash: state.financials.cash,
      debt: state.financials.debt,
      creditRemaining: getCreditRemaining(state),
      reputation: state.reputation
    }
  };
}

export function classifySeasonOutcome(state) {
  const cropValue = Object.entries(state.inventory.crops ?? {}).reduce((sum, [cropId, qty]) => {
    const price = state.marketPrices?.[cropId]?.price ?? CROP_TYPES[cropId]?.basePrice ?? 0;
    return sum + qty * price;
  }, 0);
  const netPosition = Math.round(state.financials.cash + cropValue - state.financials.debt);
  const averageEquipment =
    state.equipment.length > 0
      ? state.equipment.reduce((sum, machine) => sum + machine.condition, 0) / state.equipment.length
      : 50;

  if (state.financials.cash <= 0 && state.financials.debt > 52000 && state.reputation < 35) {
    return {
      level: "bad",
      label: "Bad Outcome",
      narrative: "Ash Creek has seen farms get quiet this way. You still have keys, but next year starts with every number leaning on you."
    };
  }

  if (netPosition < -26000 || averageEquipment < 24 || state.reputation < 30) {
    return {
      level: "struggling",
      label: "Struggling Outcome",
      narrative: "You kept the place moving, but next year starts with a tighter rope. Repairs, credit, and trust all need attention."
    };
  }

  if ((state.financials.debt <= 8000 && state.financials.cash >= 9000 && state.reputation >= 75) || (netPosition >= 8000 && state.reputation >= 70)) {
    return {
      level: "strong",
      label: "Strong Outcome",
      narrative: "You did not just survive the season. You bought yourself room to think, and Ash Creek knows it."
    };
  }

  return {
    level: "stable",
    label: "Stable Outcome",
    narrative: "The farm is still under pressure, but the year did not break you. You have enough room to plan the next season instead of just flinching at it."
  };
}

export function continueToNextYear(state) {
  const next = cloneState(state);
  if (next.time.week < next.time.maxWeeks && !next.flags?.endOfYearReady) {
    return finish(next, false, "Finish the current year before rolling into the next one.");
  }

  next.time.year += 1;
  next.time.week = 1;
  next.flags = {
    ...next.flags,
    marketNote: false,
    bankNote: false,
    priceNote: false,
    harvestDelayWeek: null,
    inputDiscountWeek: null,
    usedEquipmentLeadWeek: null,
    endOfYearReady: false
  };
  next.weeklyNpcInteractions = {};
  next.marketPrices = marketForWeek(1, next.player.backgroundId, next.seed + next.time.year * 1000);
  next.salvageYard = generateSalvageMarket(1, next.player.backgroundId, next.seed + next.time.year * 1000);
  next.weather = weatherForWeek(1, next.seed + next.time.year * 1000);
  resetWorkSlots(next);
  next.contracts = next.contracts.map((contract) =>
    ["available", "accepted", "in_progress", "ready_to_complete"].includes(contract.status)
      ? { ...contract, status: "failed", failedWeek: state.time.week, failureMessage: "Year closed before the work was settled." }
      : contract
  );
  next.nextContractRefreshWeek = 1;
  for (const field of next.fields) {
    field.cropId = null;
    field.stageIndex = 0;
    field.weeksInStage = 0;
    field.plantedWeek = null;
    field.ready = false;
    field.scouted = false;
    field.scoutReport = null;
    field.yieldLocked = false;
    field.lockedYield = null;
    field.lastFertilizedWeek = null;
    field.lastFertilizedStage = null;
    field.lastWeedTreatmentWeek = null;
    field.lastWeedTreatmentStage = null;
    field.lastScoutWeek = null;
    field.lastFallowWeek = null;
    field.currentYear = next.time.year;
    field.cropPlantedThisYear = null;
    field.annualCashCropPlantedThisYear = null;
    field.cashCropHarvestedThisYear = false;
    field.fieldAvailabilityState = "open";
    field.fertilizerApplicationsThisCrop = 0;
    field.fertilizerAppliedWeeks = [];
    field.fertilizerStageApplied = [];
    field.fertilizerAppliedYear = null;
    field.weedTreatmentApplicationsThisCrop = 0;
    field.weedTreatmentAppliedWeeks = [];
    field.weedTreatmentStageApplied = [];
    field.hayCuttingsThisYear = 0;
    field.stressLockedInYieldLoss = 0;
    field.plantingWindow = null;
    field.latePlantingYieldModifier = 1;
    field.latePlantingNote = null;
    field.soilRecommendation = field.soilTestKnown ? buildSoilRecommendation(next, field) : field.soilRecommendation;
    field.lastAction = "Winter reset";
    recalcCondition(field);
    syncStressCauses(next, field);
  }
  next.weeklyEvents = generateWeeklyEvents(next);
  next.lastReport = {
    title: `Year ${next.time.year} Opening Ledger`,
    entries: [
      `${calendarLabel(next)} begins with last year's debts, reputation, fields, equipment, relationships, and upgrades still real.`,
      "Previous crops are still recorded for rotation. Pick spring crops with that history in mind.",
      next.weeklyEvents.length
        ? `Year ${next.time.year} begins with county noise already waiting: ${next.weeklyEvents.map((event) => `${event.source} - ${event.title}`).join("; ")}.`
        : "Contract board, weather, salvage, and events continue into the new year."
    ],
    finances: {
      cash: next.financials.cash,
      debt: next.financials.debt,
      creditRemaining: getCreditRemaining(next),
      reputation: next.reputation
    }
  };
  refreshContracts(next, next.lastReport.entries);
  return finish(next, true, `Year ${next.time.year} started. Rotation history carried forward.`, "success");
}

export function selectors(state) {
  const standing = reputationStanding(state.reputation);
  const work = ensureWorkState(state);
  return {
    calendarLabel: calendarLabel(state),
    seasonPhase: seasonPhaseForWeek(state.time.week),
    background: background(state),
    creditRemaining: getCreditRemaining(state),
    effectiveCreditLimit: getEffectiveCreditLimit(state),
    work,
    standing,
    activeContracts: state.contracts.filter((contract) => ["accepted", "in_progress", "ready_to_complete"].includes(contract.status)),
    availableContracts: state.contracts.filter((contract) => contract.status === "available" && state.reputation >= (contract.minReputation ?? 0)),
    completedContracts: state.contracts.filter((contract) => contract.status === "completed"),
    failedContracts: state.contracts.filter((contract) => contract.status === "failed"),
    visibleContracts: state.contracts.filter((contract) => contract.status !== "archived"),
    weeklyEvents: state.weeklyEvents ?? [],
    progressionUpgrades: PROGRESSION_UPGRADES,
    purchasedUpgrades: state.progression?.upgrades ?? [],
    currentLocation: LOCATIONS.find((location) => location.id === state.currentLocationId) ?? LOCATIONS[0],
    warnings: getFinancialWarnings(state),
    priorities: getWeeklyPriorities(state)
  };
}
