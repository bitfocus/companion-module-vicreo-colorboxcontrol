## VICREO ColorBox Control

Controls the VICREO ColorBox application over its External Control API
(WebSocket, JSON). Through it you can select a box, set and nudge every
control, reset controls back to neutral, and read the live state back into
Companion variables and feedbacks.

All three box types the app supports are controllable:

- **FSI BoxIO** and **AJA ColorBox** (LUT boxes) — the grade controls described
  below.
- **Blackmagic Teranex** — proc amp, color, clipping, test pattern and presets;
  see [Blackmagic Teranex](#blackmagic-teranex). Requires a ColorBox app build
  with Teranex support.

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

Selecting a box also changes the highlighted box in the ColorBox UI.

The module only changes its selection when you select a box (or, with no
selection yet, picks the first box). The app broadcasts state for *every* box
that changes, and a Teranex reports each front-panel move, but those never move
the selection — variables and feedbacks always show the selected box. After a
reconnect the module re-selects the same box on its own.

The `$(ColorBox:selected_box_driver)` variable tells you which kind of box is
selected: `fsi-boxio`, `aja-colorbox` or `bmd-teranex`.

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

### Blackmagic Teranex

A Teranex is not a LUT box: it has a proc amp, an RGB color correction, clip
levels, a test pattern generator and six stored presets. It has its own paths
and its own actions (all named **Teranex: …**) — the grade paths above don't
apply to it, and it has no bypass.

Values are the **live values of the device**, in the Teranex's own units, and
writes go straight to the device. Changes made on the Teranex front panel or in
Teranex Setup show up in the variables and feedbacks too.

#### Teranex paths

| Path | Range | Default | Meaning |
|---|---|---|---|
| `procamp/gain` | −60 – 60 | 0 | Output video level |
| `procamp/black` | −30 – 30 | 0 | Black level (pedestal) |
| `procamp/saturation` | −60 – 60 | 0 | Saturation |
| `procamp/hue` | −179 – 180 | 0 | Hue, degrees |
| `procamp/ry`, `procamp/by` | −200 – 200 | 0 | R-Y / B-Y level |
| `procamp/sharp` | −50 – 50 | 0 | Sharpness |
| `adjust/red`, `adjust/green`, `adjust/blue` | −200 – 200 | 0 | RGB color correction |
| `adjust/lumalow`, `adjust/chromalow` | 4 – 1018 | 4 | Clip undershoots (10-bit code) |
| `adjust/lumahigh`, `adjust/chromahigh` | 5 – 1019 | 1019 | Clip overshoots (10-bit code) |
| `adjust/filly` | 64 – 940 | 64 | Letterbox fill luma |
| `adjust/fillcb`, `adjust/fillcr` | 64 – 960 | 512 | Letterbox fill color |
| `testpattern/pattern` | enum | `None` | `None`, `Black`, `SMPTEBars`, `Bars`, `Multiburst`, `Grid` |
| `testpattern/nosignal` | enum | – | Output on signal loss: `Black`, `Bars` |
| `testpattern/tone` | enum | `None` | `None`, `Tone750Hz`, `Tone1500Hz`, `Tone3KHz`, `Tone6KHz` |
| `testpattern/motion` | 0 / 1 | – | Moving test pattern |
| `testpattern/rate` | −3 – 3 | 0 | Motion speed and direction |
| `preset/1/name` … `preset/6/name` | text | – | Preset names |

#### Teranex actions

| Action | Options | Effect |
|---|---|---|
| **Teranex: set value** | Box id, Control, Value | Sets a numeric control, clamped to its range. |
| **Teranex: adjust value by delta (ideal for knobs)** | Box id, Control, Delta | Adds the delta to the current value. |
| **Teranex: reset value to default** | Box id, Control | Factory value for one control. |
| **Teranex: reset group** | Box id, Group | Proc amp, RGB color, Clipping, Aspect fill — or Everything, which also turns the test pattern and tone off. |
| **Teranex: test pattern** | Box id, Pattern | Pattern on (or Off). |
| **Teranex: test tone** | Box id, Tone | Audio test tone; only audible while a pattern is on. |
| **Teranex: output on signal loss** | Box id, Output | Black or bars when the input drops. |
| **Teranex: test pattern motion** | Box id, On / Off / Toggle | Moving pattern. |
| **Teranex: recall preset** | Box id, Preset 1–6 | Recalls a stored setup. |
| **Teranex: save current setup to preset** | Box id, Preset 1–6 | **Overwrites** that preset on the Teranex. |
| **Teranex: rename preset** | Box id, Preset 1–6, Name | Renames a preset (max 32 characters). |

Teranex actions only act on a Teranex. With the Box id empty and a LUT box
selected, they do nothing and log a warning — fill in the Teranex's box id to
drive it while another box is selected.

Knob deltas used by the presets: 1 for gain, black, saturation, hue and
sharpness; 2 for R-Y, B-Y and the RGB channels; 4 for clip levels and fill.

---

### Feedbacks

| Feedback | Options | True when |
|---|---|---|
| **Connection state** | – | The WebSocket is connected and the handshake succeeded. Default style: green background. |
| **Bypass equals** | Bypass enabled (checkbox) | The box's bypass matches the checkbox. Default style: red background. |
| **Selected box id equals** | Box id | That box is the currently selected one. Default style: blue background. |
| **Teranex: selected box is a Teranex** | – | The selected box is a Teranex. |
| **Teranex: test pattern equals** | Pattern | The Teranex outputs that pattern (`Off` = no pattern). Default style: amber. |
| **Teranex: test tone equals** | Tone | That test tone is selected. Default style: amber. |
| **Teranex: test pattern motion on** | – | Pattern motion is on. |
| **Teranex: value differs from default** | Control | The control is away from its factory value — handy on a knob to see at a glance what has been touched. |

Teranex feedbacks follow the device, including front-panel changes.

---

### Variables

| Variable | Contents |
|---|---|
| `$(ColorBox:connection)` | `connected` or `disconnected` |
| `$(ColorBox:selected_box_id)` | Id of the selected box |
| `$(ColorBox:selected_box_name)` | Friendly name of the selected box |
| `$(ColorBox:selected_box_driver)` | `fsi-boxio`, `aja-colorbox` or `bmd-teranex` |
| `$(ColorBox:bypass)` | `on` or `off` |
| `$(ColorBox:control_<path>)` | Live value of a control |

Control variables use the path with slashes replaced by underscores, so
`rgb/r` becomes `$(ColorBox:control_rgb_r)` and `grade/lift/master` becomes
`$(ColorBox:control_grade_lift_master)`. There is one for every grade path in
the table above, and one for every Teranex path — so `procamp/gain` is
`$(ColorBox:control_procamp_gain)` and preset 1's name is
`$(ColorBox:control_preset_1_name)`. Numeric values are rounded to 4 decimals.

Variables show the **selected** box. When you select another box they are
cleared and refilled from that box, so a Teranex never shows a stale grade value
and vice versa.

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

- **Teranex Knobs** — proc amp (gain, black, saturation, hue, R-Y, B-Y,
  sharpness) and RGB knobs. Each shows the live value, turns to adjust, presses
  to reset, and lights amber while away from default.
- **Teranex Test Pattern** — one button per pattern and per tone (with
  feedback), and a motion toggle.
- **Teranex Presets** — recall buttons 1–6 showing the preset's name. There are
  deliberately no one-press Save presets: saving overwrites a stored setup, so
  build that button yourself with **Teranex: save current setup to preset**.
- **Teranex Reset** — reset proc amp, RGB color, clipping, aspect fill, or
  everything.

Output, box and Teranex presets are generated from what the app reports, so
they appear once the module has connected and learned the box list and output
looks. The Teranex sections only appear when the app has a Teranex box.

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
- **A Teranex button does nothing and warns "not a Teranex"** — a LUT box is
  selected. Select the Teranex, or fill in its box id on the action.
- **Teranex controls are missing from the variables** — the app reports only
  what the connected Teranex model supports, and needs a build with Teranex
  support.

### Security note

Exposing the API on the LAN is a real attack surface. Set a token, or keep the
API localhost-only. "LAN, no token" is only appropriate on a trusted, isolated
show network.
