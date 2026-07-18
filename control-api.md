# External Control API (WebSocket)

Drive an FSI BoxIO box's grade from outside the app — a control surface, a
Bitfocus Companion module, a browser, or a script. Enable it in the app under
the **⚙ (External Control API)** button in the LUT Boxes header.

- **Transport:** WebSocket, JSON text messages (one JSON object per message).
- **URL:** `ws://<host>:<port>` (default port **4455**). Localhost-only unless
  "Allow LAN access" is on.
- **Auth:** if a token is set, send `hello` with it before anything else.
- **Scope:** FSI BoxIO boxes only. AJA boxes are listed but not controllable.

The app UI and every connected client stay in sync: a change from any source is
broadcast as a `state` message to all clients, and the app's own sliders reflect
changes made over the API.

## Handshake

```json
--> { "op": "hello", "token": "your-token" }      // token optional if none set
<-- { "op": "welcome", "boxes": [ ... ], "paths": [ ... ] }
```

If a token is configured and missing/wrong, the server replies with an `error`
and closes the connection.

## Selecting a box

Each message may name a `box` (its id). If you `select` a box first, later
messages can omit `box` and use the selected one. `select` also changes the
box highlighted in the app UI.

```json
--> { "op": "select", "box": "<id>" }
<-- { "op": "state", "box": "<id>", "name": "...", "controls": { ... }, "bypass": false }
```

## Client → server messages

| op | fields | effect |
|----|--------|--------|
| `hello` | `token?` | authenticate; replies `welcome` |
| `listBoxes` | – | replies `boxes` |
| `select` | `box` | set session default box + app selection; replies `state` |
| `get` | `box?` | replies `state` for that box |
| `set` | `box?`, `path`, `value` | set one control |
| `setControls` | `box?`, `controls` (`{path: value}`) | set many controls in one push |
| `bypass` | `box?`, `value` (bool) | bypass/unbypass the box |
| `ping` | – | replies `pong` |

## Server → client messages

- `welcome` `{ boxes, paths }` — after a successful `hello`.
- `boxes` `{ boxes }` — the box list (on request or when it changes).
- `state` `{ box, name, controls, bypass }` — full control snapshot; broadcast on
  every change from any source.
- `error` `{ message, requestOp? }`.
- `pong`.

`boxes[]` entries: `{ id, name, driver, channel?, boxioMode?, model?, controllable }`.

## Control paths

Values are numbers unless noted. Out-of-range values are clamped.

| path | range | meaning |
|------|-------|---------|
| `rgb/r`, `rgb/g`, `rgb/b` | 0.5 – 1.5 | per-channel gain bias (1 = unity) |
| `temp` | 1563 – 5600 | Color Temp, absolute Kelvin |
| `tempDelta` | ±K | Color Temp as offset from the 3200 K anchor |
| `grade/<wheel>/<r\|g\|b\|master>` | −1 – 1 | grade wheel component |
| `source` | enum | `rec709` \| `hlg` \| `slog2` \| `slog3` |
| `output` | enum | output look (valid set depends on source) |

`<wheel>` = `lift` `gamma` `gain` `offset` `shadow` `midtone` `highlight`.
`master` is the wheel's overall brightness; `r`/`g`/`b` are its color balance.

## Examples

```json
// warm the image slightly and lift the shadows
{ "op": "set", "path": "temp", "value": 3600 }
{ "op": "set", "path": "grade/lift/master", "value": 0.2 }

// several at once
{ "op": "setControls", "controls": { "rgb/r": 1.05, "grade/gain/b": -0.1 } }

// bypass
{ "op": "bypass", "value": true }
```

## Notes

- Exposing the server on the LAN is a real attack surface. Use a token, or keep
  it localhost-only. "LAN, no token" is only appropriate on a trusted, isolated
  show network.
- The address space and server are structured so an OSC front-end or the AJA
  controls can be added later without changing this protocol.
