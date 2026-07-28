// Capture 1920x1080 promo shots of Dirt Money by driving headless Chrome over
// the DevTools Protocol: navigate, run a setup script to reach a photogenic
// state, wait for art to decode, screenshot. No text is drawn onto any image.
import { writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const GAME = "http://localhost:8765/index.html";
const OUT = new URL("./shots/", import.meta.url).pathname;
const PORT = 9333;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=" + PORT,
  "--disable-gpu", "--hide-scrollbars", "--no-first-run",
  "--user-data-dir=/tmp/dm-promo-profile",
  "--window-size=1920,1080", "about:blank"
], { stdio: "ignore" });

let ws;
let seq = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

async function connect() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const targets = await (await fetch("http://127.0.0.1:" + PORT + "/json")).json();
      const page = targets.find((t) => t.type === "page");
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => { ws.onopen = r; });
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg.result);
            pending.delete(msg.id);
          }
        };
        return;
      }
    } catch { /* chrome still starting */ }
    await sleep(250);
  }
  throw new Error("could not attach to Chrome");
}

const evaluate = (expression) =>
  send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
    .then((r) => r?.result?.value);

async function shot(name, setup, settle = 1000) {
  await send("Page.navigate", { url: GAME });
  await sleep(1500);
  if (setup) await evaluate(setup);
  await sleep(settle);
  await evaluate("Promise.all([...document.images].map(i => i.complete ? 1 : i.decode().catch(() => 1))).then(() => 1)");
  await sleep(300);
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(OUT + name, Buffer.from(data, "base64"));
  console.log("  " + name);
}

// Build a setup script: start a run, play N weeks, optionally land on a screen.
function play(options) {
  const weeks = options.weeks || 0;
  const screen = options.screen || null;
  const background = options.background || 0;
  const goto = screen
    ? "document.querySelector('[data-action=\"screen\"][data-screen=\"" + screen + "\"]').click(); await wait(250);"
    : "";
  return [
    "(async () => {",
    "  const wait = (ms) => new Promise(r => setTimeout(r, ms));",
    "  document.querySelector('[data-action=\"new-game\"]').click();",
    "  await wait(200);",
    "  document.querySelectorAll('[data-action=\"choose-background\"]')[" + background + "].click();",
    "  await wait(200);",
    "  for (let w = 0; w < " + weeks + "; w += 1) {",
    "    document.querySelector('[data-action=\"screen\"][data-screen=\"fields\"]').click();",
    "    await wait(70);",
    // Planting lives in the field detail view, so step into each field, take
    // the first affordable crop, and come back out.
    "    const openers = [...document.querySelectorAll('[data-action=\"select-field\"]')];",
    "    for (let f = 0; f < openers.length; f += 1) {",
    "      const fresh = [...document.querySelectorAll('[data-action=\"select-field\"]')][f];",
    "      if (!fresh) continue;",
    "      fresh.click(); await wait(90);",
    "      const plant = [...document.querySelectorAll('[data-action=\"plant-crop\"]')].filter(b => !b.disabled);",
    "      if (plant.length) { plant[0].click(); await wait(90); }",
    "      document.querySelector('[data-action=\"screen\"][data-screen=\"fields\"]').click();",
    "      await wait(70);",
    "    }",
    "    const scout = document.querySelector('[data-action=\"scout-all\"]');",
    "    if (scout) { scout.click(); await wait(70); }",
    "    const end = document.querySelector('[data-action=\"advance-week\"]');",
    "    if (end) { end.click(); await wait(140); }",
    "    const dismiss = document.querySelector('[data-action=\"dismiss-result\"]');",
    "    if (dismiss) { dismiss.click(); await wait(70); }",
    "  }",
    "  " + goto,
    "  return 1;",
    "})()"
  ].join("\n");
}

await connect();
await send("Page.enable");
await send("Runtime.enable");
console.log("capturing 1920x1080 shots:");

await shot("01-title.png", null);
await shot("02-choose-background.png", "document.querySelector('[data-action=\"new-game\"]').click(); 1");
await shot("03-fields-early.png", play({ weeks: 3, screen: "fields" }), 1400);
await shot("04-fields-midseason.png", play({ weeks: 12, screen: "fields" }), 1600);
await shot("05-farm-ledger.png", play({ weeks: 12, screen: "dashboard" }), 1600);
await shot("06-county-map.png", play({ weeks: 6, screen: "map" }), 1400);
await shot("07-contracts.png", play({ weeks: 6, screen: "contracts" }), 1400);
await shot("08-salvage-yard.png", play({ weeks: 6, screen: "salvage" }), 1400);
await shot("09-machine-shed.png", play({ weeks: 6, screen: "equipment" }), 1400);
await shot("10-elevator.png", play({ weeks: 12, screen: "market" }), 1400);
await shot("11-bank.png", play({ weeks: 8, screen: "bank" }), 1400);

chrome.kill();
console.log("\nshots in " + OUT);
process.exit(0);
