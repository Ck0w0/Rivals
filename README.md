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

## Custom art

Drop images in and they appear automatically:

| File | Used for |
|---|---|
| `assets/back-oracle.png`, `assets/back-agora.png` | Card backs for the Oracle deck (cards in hand) and the Agora deck (market, raids). |
| `assets/table.png` | The wooden table the game is played on. |
| `assets/menu-bg.png` | Menu background (replaces the drawn scene). Best without title or buttons, about 1600×1000. |
| `assets/cards/<card>.png` | A painting of the whole card face, like the resource cards, e.g. `assets/cards/siege.png`. It replaces the drawn face for that card. Card names are the keys in `js/cards.js`; paint at 63×88 proportions. |
| `assets/sfx/<name>.mp3` | Replaces a built-in sound. Names: click, draw, place, shuffle, coin, trade, raid, steal, clang, magic, zap, thunder, turn, tick, victory, defeat, error. |

Card icons come from [game-icons.net](https://game-icons.net) (CC BY 3.0); the authors are credited in-game under Credits. Sounds are synthesised in the browser, so there are no sound files to license.

## Files

| File | What it does |
|---|---|
| `js/cards.js` | All 193 cards, heroes, costs and payment rules |
| `js/engine.js` | The game rules (runs on the host only) |
| `js/bot.js` | Computer players |
| `js/net.js` | Hosting, joining and reconnecting |
| `js/ui.js` | Menus, lobby and the game table |
| `js/scene.js` | Drawn menu backdrop and laurels |
| `js/cardart.js` | The drawn card faces (frame, banner, picture, text) for every card without a painting |
| `js/icons.js` | Card and UI icons (from game-icons.net) |
| `js/sfx.js` | Sound effects, generated with the Web Audio API |
| `tests/sfx.html` | Click to hear each sound; also checks none are silent |
| `tests/sim.html` | Opens in a browser and plays 400 bot games, checking that no card is ever lost |

Open `index.html?demo` to jump straight into a bot game while developing.
