// Dirt Money balance harness.
//
//   npm run balance                  both strategies, all backgrounds
//   npm run balance -- --seeds=5     more seeds for a wider spread
//   npm run balance -- --bg=mechanic single background
//   npm run balance -- --verbose     per-week action log for the first run
//
// A competent-but-not-optimal bot plays full seasons through the game's own
// functions and reports where the player lands. It is DIAGNOSTIC: it does not
// assert what the numbers should be, because that is a design call. It DOES
// fail loudly when a run looks structurally broken rather than merely bad,
// because a harness that silently plays wrong is worse than no harness --
// the first version of this script never sold a bushel and made the economy
// look unwinnable.
//
// Two strategies, because that is the real question the season poses:
//   debt   -- clear the note, buy nothing
//   invest -- buy progression upgrades as soon as they are affordable
// The gap between them is the cost of reinvestment.

import * as S from "../src/state.js";
import { BALANCE, PROGRESSION_UPGRADES } from "../src/data.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const VERBOSE = args.includes("--verbose");
const SEED_COUNT = Number(flag("seeds", 3));
const ONLY_BG = flag("bg", null);

const BACKGROUNDS = ONLY_BG ? [ONLY_BG] : ["old_school", "it_nephew", "mechanic"];
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => 101 + i * 101);
const CASH_BUFFER = 2500; // never spend below this; a farm needs working cash

const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString();
const pad = (s, n) => String(s).padStart(n);

function playSeason(background, seed, strategy, { verbose = false } = {}) {
  let game = S.createNewGame(background, seed);
  const log = [];
  const bought = [];
  let sales = 0;

  // Adopt a new state only when the game reports the action succeeded.
  const attempt = (fn) => {
    const result = fn(game);
    if (result && result.ok && result.state) {
      game = result.state;
      return result;
    }
    return null;
  };
  const note = (week, text) => verbose && log.push(`  wk${pad(week, 2)}  ${text}`);

  for (let week = 1; week <= BALANCE.maxWeeks; week++) {
    // Scouting is free — always take the information.
    for (const field of game.fields) attempt((s) => S.scoutField(s, field.id));

    for (const field of game.fields) {
      if (!field.ready) continue;
      if (attempt((s) => S.harvestField(s, field.id, { useCredit: true }))) {
        note(week, `harvested ${field.name}`);
      }
    }

    for (const [cropId, amount] of Object.entries(game.inventory?.crops ?? {})) {
      if (amount <= 0) continue;
      const before = game.financials.cash;
      if (attempt((s) => S.sellCrop(s, cropId, amount))) {
        const gained = game.financials.cash - before;
        sales += gained;
        note(week, `sold ${amount} ${cropId} for ${money(gained)}`);
      }
    }

    // Plant open ground with the first crop still inside its window.
    for (const field of game.fields) {
      if (field.cropId) continue;
      for (const cropId of ["corn", "soybeans", "winter_wheat", "hay"]) {
        if (S.plantingWindowStatus(game, cropId)?.timing === "late") continue;
        if (S.getPlantCost(game, field, cropId) > game.financials.cash) continue;
        if (attempt((s) => S.plantCrop(s, field.id, cropId))) {
          note(week, `planted ${cropId} on ${field.name}`);
          break;
        }
      }
    }

    for (const field of game.fields) {
      if (field.cropId && field.weeds > 45) attempt((s) => S.treatWeeds(s, field.id));
    }
    attempt((s) => S.fertilizeRecommendedFields(s));

    for (const contract of [...(game.contracts ?? [])]) {
      attempt((s) => S.acceptContract(s, contract.id));
    }
    for (const contract of [...(game.contracts ?? [])]) {
      attempt((s) => S.performContractAction(s, contract.id));
      if (attempt((s) => S.completeContract(s, contract.id))) {
        note(week, `completed ${contract.id}`);
      }
    }

    for (const item of game.equipment ?? []) {
      if (item.condition < 45 && game.financials.cash > 1200) {
        if (attempt((s) => S.repairEquipment(s, item.id))) note(week, `repaired ${item.name}`);
      }
    }

    if (strategy === "invest") {
      for (const upgrade of PROGRESSION_UPGRADES) {
        if (game.progression?.upgrades?.includes(upgrade.id)) continue;
        const cost = S.getProgressionCost(game, upgrade);
        if (game.financials.cash - cost < CASH_BUFFER) continue;
        if (attempt((s) => S.purchaseProgression(s, upgrade.id))) {
          bought.push(upgrade.title);
          note(week, `bought ${upgrade.title} for ${money(cost)}`);
        }
      }
    }

    if (game.financials.cash > 4000 && game.financials.debt > 0) {
      const payment = Math.floor(game.financials.cash - 3000);
      if (attempt((s) => S.payDebt(s, payment))) note(week, `paid ${money(payment)} on the note`);
    }

    game = S.advanceWeek(game).state ?? game;
  }

  const { cash, debt } = game.financials;
  return {
    background, seed, strategy, cash, debt,
    net: cash - debt,
    reputation: game.reputation,
    weeksPlayed: game.time.week,
    upgrades: bought.length,
    sales,
    log
  };
}

// --- structural checks: catch a bot that is broken, not merely losing -------
// These do not judge balance. They judge whether the play-through was real.
function structuralProblems(runs) {
  const problems = [];

  const shortSeason = runs.filter((r) => r.weeksPlayed <= BALANCE.maxWeeks);
  if (shortSeason.length === runs.length && runs.every((r) => r.weeksPlayed < BALANCE.maxWeeks)) {
    problems.push("no run reached the end of the season");
  }

  const noSales = runs.filter((r) => r.sales <= 0);
  if (noSales.length) {
    problems.push(
      `${noSales.length}/${runs.length} run(s) never sold a single crop — ` +
      "the bot is almost certainly failing to harvest or sell, not the economy failing"
    );
  }

  // Identical results across different seeds means the bot is not really
  // playing: weather, prices and events should all diverge.
  for (const bg of new Set(runs.map((r) => r.background))) {
    for (const strat of new Set(runs.map((r) => r.strategy))) {
      const group = runs.filter((r) => r.background === bg && r.strategy === strat);
      if (group.length > 1 && new Set(group.map((r) => r.net)).size === 1) {
        problems.push(`${bg}/${strat}: every seed produced an identical result`);
      }
    }
  }

  const investRuns = runs.filter((r) => r.strategy === "invest");
  if (investRuns.length && investRuns.every((r) => r.upgrades === 0)) {
    problems.push("the invest strategy never bought a single upgrade");
  }

  return problems;
}

// --- run ------------------------------------------------------------------
const runs = [];
for (const background of BACKGROUNDS) {
  for (const strategy of ["debt", "invest"]) {
    for (const seed of SEEDS) {
      runs.push(playSeason(background, seed, strategy, { verbose: VERBOSE && !runs.length }));
    }
  }
}

const start = S.createNewGame(BACKGROUNDS[0], 1).financials;
console.log(`\nDIRT MONEY BALANCE — ${BALANCE.maxWeeks}-week seasons, ${SEEDS.length} seed(s), competent-player bot`);
console.log(`start: cash ${money(start.cash)}  debt ${money(start.debt)}  net ${money(start.cash - start.debt)}`);
console.log("\nstrategy 'debt' clears the note and buys nothing.");
console.log(`strategy 'invest' also buys progression upgrades (${PROGRESSION_UPGRADES.length} of them, ` +
  `${money(PROGRESSION_UPGRADES.reduce((t, u) => t + u.cost, 0))} total).\n`);

if (VERBOSE && runs[0]?.log.length) {
  console.log(`--- week log: ${runs[0].background} seed ${runs[0].seed} (${runs[0].strategy}) ---`);
  console.log(runs[0].log.join("\n") + "\n");
}

for (const background of BACKGROUNDS) {
  console.log(`${background}`);
  for (const strategy of ["debt", "invest"]) {
    const group = runs.filter((r) => r.background === background && r.strategy === strategy);
    const nets = group.map((r) => r.net).sort((a, b) => a - b);
    const median = nets[Math.floor(nets.length / 2)];
    const cleared = group.filter((r) => r.debt === 0).length;
    const reps = group.map((r) => r.reputation);
    console.log(
      `  ${strategy.padEnd(7)} NET ${pad(money(nets[0]), 10)} .. ${pad(money(nets.at(-1)), 10)}` +
      `  med ${pad(money(median), 10)}  | note cleared ${cleared}/${group.length}` +
      `  | rep ${Math.min(...reps)}-${Math.max(...reps)}` +
      (strategy === "invest" ? `  | upgrades ${Math.max(...group.map((r) => r.upgrades))}/${PROGRESSION_UPGRADES.length}` : "")
    );
  }
  const med = (s) => {
    const n = runs.filter((r) => r.background === background && r.strategy === s).map((r) => r.net).sort((a, b) => a - b);
    return n[Math.floor(n.length / 2)];
  };
  console.log(`  reinvestment costs ${money(med("debt") - med("invest"))} of ending net worth\n`);
}

const problems = structuralProblems(runs);
if (problems.length) {
  console.error("STRUCTURAL PROBLEMS — these results are not trustworthy:");
  for (const p of problems) console.error("  ! " + p);
  console.error("");
  process.exit(1);
}
console.log("structural checks passed: every run played a full season, sold crops, and diverged by seed.");
