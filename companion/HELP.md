## Vicreo ColorBox Control

This module connects to the Vicreo/FSI BoxIO External Control API over WebSocket.

### Setup

1. Enable External Control API in the app.
2. Set host and port (default `4455`).
3. If a token is configured in the app, enter the same token in module config.
4. Optionally set a default box id.

### Stream Deck+ knobs

Use the `Adjust path by delta` action for rotary controls:

- Assign one action with positive `Delta` for clockwise
- Assign one action with negative `Delta` for counter-clockwise

### Included features

- Box selection and refresh
- Full control value set/adjust actions
- Bypass control
- Variables for all key controls
- Feedbacks for connection, bypass, and box selection
- Presets for common temperature/RGB/grade controls
