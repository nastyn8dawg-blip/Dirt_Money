// Headless play-through: a competent-but-not-optimal player runs a full
// 36-week season through the game's own functions. Diagnostic only — nothing
// here ships. Usage: node playthrough.mjs [background] [seed]
import * as S from "/Users/dnresources/Documents/DirtMoney_Codex/src/state.js";
import { BALANCE, CROP_TYPES, PROGRESSION_UPGRADES as UPGRADES } from "/Users/dnresources/Documents/DirtMoney_Codex/src/data.js";
const BUY_UPGRADES = process.env.BUY_UPGRADES !== "0";

const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString();

function playSeason(background, seed, { verbose = false } = {}) {
  let g = S.createNewGame(background, seed);
  const log = [];
  const bought = [];
  const note = (w, s) => { if (verbose) log.push(`  wk${String(w).padStart(2)}  ${s}`); };

  // Try an action; adopt the new state only when the game says it worked.
  const attempt = (fn) => {
    const r = fn(g);
    if (r && r.ok && r.state) { g = r.state; return r; }
    return null;
  };

  for (let week = 1; week <= BALANCE.maxWeeks; week++) {
    // 1. Free intel first — scouting costs no work slot.
    for (const f of g.fields) attempt((s) => S.scoutField(s, f.id));

    // 2. Harvest anything ready (highest value use of a slot).
    for (const f of g.fields) {
      if (f.ready) {
        const r = attempt((s) => S.harvestField(s, f.id, { useCredit: true }));
        if (r) note(week, `harvested ${f.name}`);
      }
    }

    // 3. Sell whatever is in the bin.
    for (const [crop, amt] of Object.entries(g.inventory?.crops ?? {})) {
      if (amt > 0) {
        const before = g.financials.cash;
        const r = attempt((s) => S.sellCrop(s, crop, amt));
        if (r) note(week, `sold ${amt} ${crop} for ${money(g.financials.cash - before)}`);
      }
    }

    // 4. Plant open ground inside its window, best-fit crop.
    for (const f of g.fields) {
      if (f.cropId) continue;
      for (const cropId of ["corn", "soybeans", "winter_wheat", "hay"]) {
        const w = S.plantingWindowStatus(g, cropId);
        if (w && w.timing === "late") continue;
        const cost = S.getPlantCost(g, f, cropId);
        if (cost > g.financials.cash) continue;
        const r = attempt((s) => S.plantCrop(s, f.id, cropId));
        if (r) { note(week, `planted ${cropId} on ${f.name}`); break; }
      }
    }

    // 5. Care: treat heavy weeds, fertilize when it pays.
    for (const f of g.fields) {
      if (f.cropId && f.weeds > 45) attempt((s) => S.treatWeeds(s, f.id));
    }
    attempt((s) => S.fertilizeRecommendedFields(s));

    // 6. Contracts: take what's offered, work the active steps, close them out.
    // contracts is a flat array; each carries its own status.
    for (const c of [...(g.contracts ?? [])]) {
      attempt((s) => S.acceptContract(s, c.id));
    }
    for (const c of [...(g.contracts ?? [])]) {
      attempt((s) => S.performContractAction(s, c.id));
      const r = attempt((s) => S.completeContract(s, c.id));
      if (r) note(week, `completed contract ${c.id}`);
    }

    // 7. Keep the iron alive when it is getting rough and we can afford it.
    for (const e of g.equipment ?? []) {
      if (e.condition < 45 && g.financials.cash > 1200) {
        const r = attempt((s) => S.repairEquipment(s, e.id));
        if (r) note(week, `repaired ${e.name}`);
      }
    }

    // 8. Reinvest: buy any upgrade we can afford while keeping a buffer.
    // (BUY_UPGRADES=0 reproduces a player who only ever pays down debt.)
    if (BUY_UPGRADES) {
      for (const u of UPGRADES) {
        if (g.progression?.upgrades?.includes(u.id)) continue;
        const cost = S.getProgressionCost(g, u);
        if (g.financials.cash - cost < 2500) continue;
        const r = attempt((s) => S.purchaseProgression(s, u.id));
        if (r) { note(week, `bought ${u.title} for ${money(cost)}`); bought.push(u.title); }
      }
    }

    // 9. Put real surplus against the note (keep a working buffer).
    if (g.financials.cash > 4000 && g.financials.debt > 0) {
      const pay = Math.floor(g.financials.cash - 3000);
      const r = attempt((s) => S.payDebt(s, pay));
      if (r) note(week, `paid ${money(pay)} on the note`);
    }

    const adv = S.advanceWeek(g);
    g = adv.state ?? g;
  }

  return { g, log, bought };
}

const bgs = process.argv[2] ? [process.argv[2]] : ["old_school", "it_nephew", "mechanic"];
const seeds = [101, 202, 303];

console.log(`\nDIRT MONEY — full-season play-through (${BALANCE.maxWeeks} weeks, competent-player bot)\n`);
const rows = [];
for (const bg of bgs) {
  for (const seed of seeds) {
    const { g, bought } = playSeason(bg, seed);
    const cash = g.financials.cash;
    const debt = g.financials.debt;
    const net = cash - debt;
    rows.push({ bg, seed, cash, debt, net, rep: g.reputation, ups: bought.length });
    console.log(
      `${bg.padEnd(11)} seed ${seed}  ->  cash ${money(cash).padStart(9)} | ` +
      `debt ${money(debt).padStart(9)} | NET ${money(net).padStart(10)} | rep ${String(g.reputation).padStart(2)} | upgrades ${bought.length}/9`
    );
  }
}
console.log("\n--- summary ---");
for (const bg of bgs) {
  const r = rows.filter((x) => x.bg === bg);
  const nets = r.map((x) => x.net).sort((a, b) => a - b);
  const debts = r.map((x) => x.debt);
  console.log(
    `${bg.padEnd(11)} NET  min ${money(nets[0])}  med ${money(nets[Math.floor(nets.length / 2)])}  max ${money(nets[nets.length - 1])}` +
    `   | debt ${money(Math.min(...debts))}..${money(Math.max(...debts))}`
  );
}
const start = S.createNewGame("old_school", 1);
console.log(`\nstarting position: cash ${money(start.financials.cash)}, debt ${money(start.financials.debt)}, net ${money(start.financials.cash - start.financials.debt)}`);
