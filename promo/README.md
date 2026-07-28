# Promo assets

1920x1080 screenshots of the shipping build. No text is drawn onto any image —
titles and copy are deliberately left off so they can be added (or not) later.

Recommended order for a store page or post:
1. `01-title.png` — dawn hero. Best single image; use as the itch.io cover.
2. `06-county-map.png` — clearest "what is this game" shot.
3. `02-choose-background.png` — three painted backgrounds side by side.
4. `05-farm-ledger.png` — live numbers plus an urgent call from Roy.
5. `04-fields-midseason.png` — corn ready, batch actions showing real costs.

## Regenerating

    python3 -m http.server 8765     # from the repo root
    node promo/shoot.mjs            # drives headless Chrome, writes promo/shots/

The capture script plays a real game to week 12–13 before shooting, and waits
for every image to decode first. If a shot looks wrong, check that the bot
actually planted — fields sitting fallow mid-season means a selector changed.

`playthrough.mjs` is a scratch season simulator kept for reference; the
maintained balance tool is `npm run balance` (tools/balance.mjs).
