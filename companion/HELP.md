## VICREO ColorBox Control

Controls the VICREO ColorBox application over its External Control API
(WebSocket, JSON). Through it you can select a LUT box, set and nudge every
grade control, reset controls back to neutral, and read the live state back into
Companion variables and feedbacks.

Only FSI BoxIO boxes are controllable. AJA boxes are listed by the app but
cannot be driven at the moment.

---

### Setup

1. In ColorBox, open the **⚙ (External Control API)** button in the LUT Boxes
   header and enable the API.
2. If ColorBox and Companion run on different machines, enable **Allow LAN
   access** in the app — otherwise the API only listens on localhost.
3. In this module's config, fill in host and port, and the token if one is set
   in the app.

#### Configuration fields

| Field | Default | Notes |
|---|---|---|
| **Host** | `127.0.0.1` | Machine running ColorBox. |
| **Port** | `4455` | The API port shown in the app. |
| **Auth token (optional)** | empty | Must match the token configured in the app. If a token is set in the app and this is empty or wrong, the connection is closed and the module reports an authentication failure. |
| **Default box id (optional)** | empty | Selected automatically on connect. If left empty, the module asks for the box list and selects the first box it receives. |
| **State poll interval (ms)** | `2000` | How often the module requests a fresh state snapshot and pings. Range 250–30000. |
| **Reconnect interval (ms)** | `2000` | Delay before retrying after a dropped or failed connection. Range 250–30000. |

The module reconnects on its own, so it is safe to start Companion before
ColorBox.

---

### Boxes and the "Box id" option

Almost every action has an optional **Box id** field:

- **Leave it empty** to act on the currently selected box. This is what you want
  in nearly all cases, and it is what all bundled presets do.
- **Fill it in** to target one specific box regardless of the current selection —
  useful when you drive several boxes from one page.

Selecting a box also changes the highlighted box in the ColorBox UI, and the
selection is shared with every connected client.

---

### Control paths

Paths are the addresses of individual controls. Actions that take a path offer a
dropdown of all known paths, and each of those dropdowns allows a custom value
if a newer app build exposes something this module does not list yet.

| Path | Range | Meaning |
|---|---|---|
| `rgb/r`, `rgb/g`, `rgb/b` | 0.5 – 1.5 | Per-channel gain bias (1 = unity) |
| `temp` | 1563 – 5600 | Color temperature, absolute Kelvin |
| `tempDelta` | ±K | Color temperature as an offset from the 3200 K anchor |
| `tint` | −1 – 1 | Green/magenta tint |
| `saturation` | −1 – 1 | Overall saturation |
| `grade/<wheel>/<r\|g\|b\|master>` | −1 – 1 | Grade wheel component |
| `source` | enum | `rec709`, `hlg`, `slog2`, `slog3` |
| `output` | enum | Output look; the valid set depends on the source |

`<wheel>` is one of `lift`, `gamma`, `gain`, `offset`, `shadow`, `midtone`,
`highlight`. `master` is the wheel's overall brightness, `r`/`g`/`b` its color
balance — 28 grade paths in total.

`source` and `output` are enums with no neutral default, so they can be set but
never reset.

Output looks are discovered at runtime: the module learns them from the app's
handshake and from any output value it sees in a state update, then rebuilds the
**Set output** dropdown and the output presets. If the list looks short right
after connecting, run **Request current state** or switch source in the app once.

---

### Actions

#### Connection and boxes

| Action | Options | Effect |
|---|---|---|
| **Refresh boxes** | – | Asks the app for a fresh box list. |
| **Select box** | Box (dropdown of known boxes, custom allowed) | Makes that box the active one for this session and in the app UI. |
| **Request current state** | Box id (optional) | Pulls a full snapshot of controls and bypass, updating all variables. |

#### Bypass

| Action | Options | Effect |
|---|---|---|
| **Set bypass** | Box id (optional), Bypass enabled (checkbox) | Bypasses or un-bypasses the box. |

#### Setting values

| Action | Options | Effect |
|---|---|---|
| **Set numeric control path** | Box id, Path, Value | Sets any numeric control. The value is clamped to that path's known range before sending. |
| **Set text/enum control path** | Box id, Path (`source`/`output`, custom allowed), Value | Sets a string-valued control. Use this for anything enum-like that has no dedicated action. |
| **Set source** | Box id, Source (`rec709`, `hlg`, `slog2`, `slog3`) | Sets the input transfer function. |
| **Set output** | Box id, Output (dropdown of discovered looks, custom allowed) | Sets the output look. |

#### Adjusting values

| Action | Options | Effect |
|---|---|---|
| **Adjust path by delta (ideal for knobs)** | Box id, Path, Delta per trigger, Clamp to known range | Adds the delta to the current value and sends the result. |

The delta action reads the current value from the module's cached state. If no
value is known yet — the first state snapshot has not arrived, or the app build
does not report that path at all — it logs a warning and requests state instead
of sending anything. If the same path stays dead after that, the app does not
expose it.

With **Clamp to known range** on (default) the result is limited to the path's
range from the table above, so a knob stops at the end of its travel instead of
running away.

#### Resetting

Resets behave like double-clicking a control in the app.

| Action | Options | Effect |
|---|---|---|
| **Reset control path to default** | Box id, Path | Resets one control. |
| **Reset several control paths** | Box id, Paths (multi-select) | Resets each selected control in one message. |
| **Reset RGB bias (R, G and B)** | Box id | Resets `rgb/r`, `rgb/g` and `rgb/b`. |
| **Reset grade wheel** | Box id, Wheel | Resets `r`, `g`, `b` and `master` of that wheel. |
| **Reset whole grade** | Box id | Resets every resettable control back to neutral. |

---

### Stream Deck+ knobs

Use **Adjust path by delta** on a rotary control:

- Assign the action to **Rotate left** with a negative delta.
- Assign it to **Rotate right** with the same delta, positive.
- Optionally assign **Reset control path to default** to the press, so pushing
  the knob returns the control to neutral.

Sensible deltas: `10` for `temp` and `tempDelta`, `0.01` for `tint`,
`saturation`, the `rgb/*` channels and every `grade/*` path.

The bundled knob presets are already wired this way — pick one from the **Knob
Presets** section rather than building it by hand.

---

### Feedbacks

| Feedback | Options | True when |
|---|---|---|
| **Connection state** | – | The WebSocket is connected and the handshake succeeded. Default style: green background. |
| **Bypass equals** | Bypass enabled (checkbox) | The box's bypass matches the checkbox. Default style: red background. |
| **Selected box id equals** | Box id | That box is the currently selected one. Default style: blue background. |

---

### Variables

| Variable | Contents |
|---|---|
| `$(ColorBox:connection)` | `connected` or `disconnected` |
| `$(ColorBox:selected_box_id)` | Id of the selected box |
| `$(ColorBox:selected_box_name)` | Friendly name of the selected box |
| `$(ColorBox:bypass)` | `on` or `off` |
| `$(ColorBox:control_<path>)` | Live value of a control |

Control variables use the path with slashes replaced by underscores, so
`rgb/r` becomes `$(ColorBox:control_rgb_r)` and `grade/lift/master` becomes
`$(ColorBox:control_grade_lift_master)`. There is one for every path in the
table above — 37 in total. Numeric values are rounded to 4 decimals.

A control variable stays empty until the app has reported a value for it at
least once.

---

### Presets

Presets are grouped into sections in the preset browser:

- **Status** — a connection indicator that turns green when connected.
- **Bypass** — Bypass On and Bypass Off buttons.
- **Knob Presets** — rotary presets for Temp, Tint, Saturation, the three RGB
  channels, and all 28 grade wheel components. Each shows the live value, turns
  to adjust, and presses to reset.
- **Reset Presets** — reset the whole grade, the RGB bias, each scalar control,
  each RGB channel, each grade wheel, and each individual wheel component.
- **Source Presets** — one button per source (`rec709`, `hlg`, `slog2`, `slog3`).
- **Output Presets** — one button per discovered output look.
- **Box Select Presets** — one button per box, with the selected-box feedback
  already attached.

Output and box presets are generated from what the app reports, so they appear
once the module has connected and learned the box list and output looks.

---

### Troubleshooting

- **Status stays "Connecting" or "Connection failure"** — check that the API is
  enabled in ColorBox, that host and port match, and that **Allow LAN access**
  is on if Companion runs on another machine.
- **Status shows an authentication failure** — the token in the module config
  does not match the app's token.
- **Buttons do nothing and the log says "No box selected"** — select a box
  first, set a Default box id in the config, or fill in the Box id option on
  the action.
- **A knob does nothing and warns "No known value"** — the module has no cached
  value for that path. It requests state automatically; if the warning persists,
  the app build does not report that path.
- **Nothing happens on an AJA box** — AJA boxes are listed but not controllable.

### Security note

Exposing the API on the LAN is a real attack surface. Set a token, or keep the
API localhost-only. "LAN, no token" is only appropriate on a trusted, isolated
show network.
