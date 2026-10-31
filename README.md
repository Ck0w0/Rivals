# Rivals of Olympus — online card game

A browser version of the Rivals of Olympus card game for 2–5 players. You can play online with friends or against computer players.

## Play

Double-click `index.html`. That's it: there's nothing to install.

- **Host an Online Game**: you get a 5-letter room code. Send it to your friends (up to 4).
- **Join a Friend's Game**: enter the code your host gives you.
- **Play vs Computer**: an offline game against bots.

Online play is peer-to-peer (WebRTC via PeerJS). The host's browser runs the game, so **the host must keep their tab open**. If a guest drops out, a bot plays for them until they rejoin with the same name and code.

Everyone needs an internet connection and their own copy of the game. They can either open their own copy of this folder, or you can put the folder on free static hosting (GitHub Pages, Netlify, Cloudflare Pages) and share the link. On hosted copies, **Copy Invite** gives a link that opens the join screen with the code already filled in.

## Phones

The game plays on phones held sideways. Held upright, it asks you to turn the phone. On Android the first tap also goes full screen and locks the screen sideways. On iPhone, use Share › Add to Home Screen to get rid of the browser bars.

## The look: Aegean Marble

The game is bright Greek: white marble, lapis blue and gold. Oracle cards (the ones you draw) have blue figures on veined marble. Agora cards (the market) are the same style reversed, with marble-white figures on lapis. Every card is edged in gold, and each card family has its own accent colour round the picture.

Each player's bought cards are shown as small cards stacked by category (Fleet, Polis, Treasure), with their points towards the target underneath. Click one to see it full size.

The game moves:
- cards fly from the decks into your hand and the market;
- bought cards fly to the buyer, and played cards drift to the discard pile;
- a banner sweeps in when the turn changes;
- gold motes drift over the table;
- cards you can play or afford glow, and the deck bounces when it's time to draw.

People who turn on "reduce motion" in their system settings get a still version.

The design files are in `design/`:

| File | What it is |
|---|---|
| `design/theme-aegean-marble.md` | The colours and fonts |
| `design/card-philosophy.md`, `design/plate.html`, `design/plate-reserved-ground.png` | The card design idea and a sample plate |
| `design/kiln-philosophy.md`, `design/kiln-viewer.html` | A p5.js program that makes the card backs, the table and the marble and lapis textures. Open it in a browser to try other seeds and palettes. |
| `design/fire-assets.ps1` | Re-makes `assets/back-oracle.png`, `back-agora.png`, `table.png`, `marble.png` and `lapis.png` from the viewer |

## Custom art

Drop images in and they appear automatically:

| File | Used for |
|---|---|
| `assets/back-oracle.png`, `assets/back-agora.png` | Card backs for the Oracle deck (cards in hand) and the Agora deck (market, raids). |
| `assets/table.png` | The table the game is played on. |
| `assets/menu-bg.png` | Menu background (replaces the drawn scene). Best without title or buttons, about 1600×1000. |
| `assets/cards/<card>.png` | A painting of a whole card face, e.g. `assets/cards/siege.png`. It replaces the drawn face for that card. Card names are the keys in `js/cards.js`; paint at 63×88 proportions. |
| `assets/sfx/<name>.mp3` | Replaces a built-in sound. Names: click, draw, place, shuffle, coin, trade, raid, steal, clang, magic, zap, thunder, turn, tick, victory, defeat, error. |

Card icons come from [game-icons.net](https://game-icons.net) (CC BY 3.0); the authors are credited in-game under Credits. Card, coin, blade, click and jingle sounds are recordings from Kenney's free packs (Casino Audio, RPG Audio, UI Audio and Music Jingles, all CC0, [kenney.nl](https://kenney.nl)) in `assets/sfx/`. Thunder, lightning and magic are synthesised in the browser.

## Files

| File | What it does |
|---|---|
| `js/cards.js` | All 193 cards, heroes, costs and payment rules |
| `js/engine.js` | The game rules (runs on the host only) |
| `js/bot.js` | Computer players |
| `js/net.js` | Hosting, joining and reconnecting |
| `js/ui.js` | Menus, lobby and the game table |
| `js/scene.js` | Drawn menu backdrop and laurels |
| `js/cardart.js` | The card faces: drawings, the marble-and-lapis painting pass and the card frame |
| `js/icons.js` | Card and UI icons (from game-icons.net) |
| `js/sfx.js` | Sound effects, generated with the Web Audio API |
| `tests/sfx.html` | Click to hear each sound; also checks none are silent |
| `tests/sim.html` | Opens in a browser and plays 400 bot games, checking that no card is ever lost |

Open `index.html?demo` to jump straight into a bot game while developing.
