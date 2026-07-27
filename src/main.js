import { renderApp } from "./render.js";
import {
  abandonContract,
  acceptContract,
  advanceWeek,
  buySalvage,
  completeContract,
  continueToNextYear,
  createNewGame,
  drawCredit,
  fertilizeField,
  fertilizeRecommendedFields,
  harvestField,
  harvestAllReadyFields,
  leaveFallow,
  payDebt,
  performContractAction,
  plantCrop,
  purchaseProgression,
  repairAndFlipSalvage,
  repairEquipment,
  resolveWeeklyEvent,
  scoutField,
  scoutAllFields,
  sellCrop,
  sellSalvage,
  setLocation,
  soilTestAllUncheckedFields,
  soilTest,
  stripSalvage,
  talkToNpc,
  treatWeeds,
  treatAllHighWeedFields,
  useSalvageOnEquipment
} from "./state.js";
import { hasSavedGame, loadGame, loadSettings, saveGame, saveSettings } from "./storage.js";
import { playSound } from "./sound.js";

const app = {
  game: null,
  screen: "title",
  selectedFieldId: null,
  notice: null,
  resultCard: null,
  hasSave: hasSavedGame(),
  settings: loadSettings()
};

const root = document.querySelector("#app");

function setNotice(message, type = "info") {
  app.notice = { message, type };
}

function applyResult(result, nextScreen = app.screen) {
  app.game = result.state;
  app.notice = result.suppressNotice ? null : { message: result.message, type: result.type };
  app.resultCard = result.ok
    ? {
        title: resultTitle(result.message),
        message: result.message,
        type: result.type,
        details: result.result ?? null
      }
    : {
        title: "Needs Attention",
        message: result.message,
        type: result.type,
        details: result.result ?? null
      };
  app.screen = nextScreen;
  playSound(soundForResult(result), app.settings);
  render();
}

function soundForResult(result) {
  if (!result.ok || result.type === "warning") return "warning";
  if (/storm|tornado|severe/i.test(result.message)) return "storm";
  if (/This Week|County|Called|Rain|Storm|Weather|Dry Stretch|Hollis|Marge|Gus|Roy|Sandy|Dee|Earl|Co-op|Grange|Lease|Lead/i.test(result.message)) return "event";
  if (/Contract|completed|abandoned|Haul Seed|Cut Hay|Start Harvest Help/i.test(result.message)) return /failed|abandoned/i.test(result.message) ? "contractFailed" : "contractComplete";
  if (/harvested|Harvest All|terminated/i.test(result.message)) return "harvest";
  if (/repair|adjustment|Roy/i.test(result.message)) return "repair";
  if (/credit|debt|operating line|financed/i.test(result.message)) return "credit";
  if (/reputation|standing|trusts you/i.test(result.message)) return "reputation";
  if (/Sold|Flipped|\+|\$/.test(result.message)) return "cash";
  return "success";
}

function resultTitle(message) {
  if (/soil test/i.test(message)) return "Soil Test Result";
  if (/scouted/i.test(message)) return "Scout Result";
  if (/harvest/i.test(message)) return "Harvest Result";
  if (/accepted/i.test(message)) return "Contract Accepted";
  if (/completed/i.test(message)) return "Contract Completed";
  if (/This Week|County|Called|Rain|Storm|Dry Stretch|Hollis|Marge|Gus|Roy|Sandy|Dee|Earl|Co-op|Grange|Lease|Lead/i.test(message)) return "County Notice";
  if (/Year \d+ started|End-of-Year|Season report/i.test(message)) return "Season Result";
  return "Result";
}

function render() {
  root.innerHTML = renderApp(app);
}

function withGame(handler) {
  if (!app.game) {
    setNotice("Start or load a farm first.", "warning");
    render();
    return;
  }
  handler();
}

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;
  playSound("click", app.settings);

  try {
    if (action === "new-game") {
      app.game = null;
      app.screen = "backgrounds";
      app.notice = null;
      app.resultCard = null;
      render();
      return;
    }

    if (action === "standalone-settings") {
      app.screen = "settings";
      render();
      return;
    }

    if (action === "choose-background") {
      app.game = createNewGame(button.dataset.backgroundId);
      app.screen = "dashboard";
      app.selectedFieldId = app.game.fields[0]?.id ?? null;
      setNotice(`Started as ${app.game.player.backgroundName}.`, "success");
      app.resultCard = {
        title: "First Morning",
        message: "The farm is yours now. Check This Week in Ash Creek before you spend the day.",
        type: "success"
      };
      render();
      return;
    }

    if (action === "load-game") {
      const loaded = loadGame();
      if (!loaded) {
        setNotice("No saved farm found.", "warning");
      } else {
        app.game = loaded;
        app.screen = "dashboard";
        app.selectedFieldId = loaded.fields?.[0]?.id ?? null;
        setNotice("Saved farm loaded.", "success");
        app.resultCard = null;
      }
      render();
      return;
    }

    if (action === "save-game") {
      withGame(() => {
        saveGame(app.game);
        app.hasSave = true;
        setNotice("Game saved to this browser.", "success");
        render();
      });
      return;
    }

    if (action === "save-settings") {
      saveSettings(app.settings);
      setNotice("Settings saved.", "success");
      render();
      return;
    }

    if (action === "screen") {
      app.screen = button.dataset.screen;
      app.notice = null;
      app.resultCard = null;
      render();
      return;
    }

    if (action === "dismiss-result") {
      app.resultCard = null;
      render();
      return;
    }

    withGame(() => {
      if (action === "advance-week") {
        applyResult(advanceWeek(app.game), "report");
      }
      if (action === "select-field") {
        app.selectedFieldId = button.dataset.fieldId;
        app.screen = "field";
        app.notice = null;
        render();
      }
      if (action === "plant-crop") {
        applyResult(plantCrop(app.game, button.dataset.fieldId, button.dataset.cropId), "field");
      }
      if (action === "soil-test") {
        applyResult(soilTest(app.game, button.dataset.fieldId), "field");
      }
      if (action === "scout-field") {
        applyResult(scoutField(app.game, button.dataset.fieldId), "field");
      }
      if (action === "scout-all-fields") {
        applyResult(scoutAllFields(app.game), "fields");
      }
      if (action === "soil-test-all-fields") {
        applyResult(soilTestAllUncheckedFields(app.game), "fields");
      }
      if (action === "fertilize-field") {
        applyResult(fertilizeField(app.game, button.dataset.fieldId), "field");
      }
      if (action === "fertilize-recommended-fields") {
        applyResult(fertilizeRecommendedFields(app.game), "fields");
      }
      if (action === "treat-weeds") {
        applyResult(treatWeeds(app.game, button.dataset.fieldId), "field");
      }
      if (action === "treat-high-weed-fields") {
        applyResult(treatAllHighWeedFields(app.game), "fields");
      }
      if (action === "leave-fallow") {
        applyResult(leaveFallow(app.game, button.dataset.fieldId), "field");
      }
      if (action === "harvest-field") {
        applyResult(harvestField(app.game, button.dataset.fieldId), "field");
      }
      if (action === "harvest-credit") {
        applyResult(harvestField(app.game, button.dataset.fieldId, { useCredit: true }), "field");
      }
      if (action === "harvest-all-ready-fields") {
        applyResult(harvestAllReadyFields(app.game), "fields");
      }
      if (action === "sell-crop") {
        applyResult(sellCrop(app.game, button.dataset.cropId), "market");
      }
      if (action === "buy-salvage") {
        applyResult(buySalvage(app.game, button.dataset.instanceId), "salvage");
      }
      if (action === "sell-salvage") {
        applyResult(sellSalvage(app.game, button.dataset.inventoryId), "salvage");
      }
      if (action === "strip-salvage") {
        applyResult(stripSalvage(app.game, button.dataset.inventoryId), "salvage");
      }
      if (action === "flip-salvage") {
        applyResult(repairAndFlipSalvage(app.game, button.dataset.inventoryId), "salvage");
      }
      if (action === "use-salvage-equipment") {
        applyResult(useSalvageOnEquipment(app.game, button.dataset.inventoryId, button.dataset.equipmentId), "salvage");
      }
      if (action === "repair-equipment") {
        applyResult(repairEquipment(app.game, button.dataset.equipmentId), "equipment");
      }
      if (action === "repair-equipment-credit") {
        applyResult(repairEquipment(app.game, button.dataset.equipmentId, { useCredit: true }), "equipment");
      }
      if (action === "repair-equipment-parts") {
        applyResult(repairEquipment(app.game, button.dataset.equipmentId, { useParts: true, useCredit: true }), "equipment");
      }
      if (action === "accept-contract") {
        applyResult(acceptContract(app.game, button.dataset.contractId), "contracts");
      }
      if (action === "complete-contract") {
        applyResult(completeContract(app.game, button.dataset.contractId), "contracts");
      }
      if (action === "perform-contract-action") {
        applyResult(performContractAction(app.game, button.dataset.contractId), "contracts");
      }
      if (action === "abandon-contract") {
        applyResult(abandonContract(app.game, button.dataset.contractId), "contracts");
      }
      if (action === "resolve-weekly-event") {
        applyResult(resolveWeeklyEvent(app.game, button.dataset.eventId, button.dataset.choiceId), app.screen);
      }
      if (action === "continue-year") {
        applyResult(continueToNextYear(app.game), "dashboard");
      }
      if (action === "visit-location") {
        applyResult(setLocation(app.game, button.dataset.locationId), "location");
      }
      if (action === "talk-npc") {
        applyResult(talkToNpc(app.game, button.dataset.npcId), "location");
      }
      if (action === "pay-debt") {
        applyResult(payDebt(app.game, Number(button.dataset.amount)), "bank");
      }
      if (action === "draw-credit") {
        applyResult(drawCredit(app.game, Number(button.dataset.amount)), "bank");
      }
      if (action === "purchase-progression") {
        applyResult(purchaseProgression(app.game, button.dataset.upgradeId), app.screen === "equipment" ? "equipment" : "bank");
      }
    });
  } catch (error) {
    console.error(error);
    setNotice(error.message || "Something broke in the ledger.", "warning");
    render();
  }
});

root.addEventListener("change", (event) => {
  const field = event.target.closest("[data-setting]");
  if (!field) return;
  const key = field.dataset.setting;
  app.settings[key] = field.type === "checkbox" ? field.checked : field.type === "range" ? Number(field.value) : field.value;
  if (key === "soundVolume" || key === "soundMuted") playSound("click", app.settings);
  render();
});

window.addEventListener("keydown", (event) => {
  if (!app.game || app.screen !== "field") return;
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const currentIndex = app.game.fields.findIndex((field) => field.id === app.selectedFieldId);
  const index = currentIndex < 0 ? 0 : currentIndex;
  const offset = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (index + offset + app.game.fields.length) % app.game.fields.length;
  app.selectedFieldId = app.game.fields[nextIndex].id;
  app.notice = null;
  playSound("click", app.settings);
  render();
});

render();
