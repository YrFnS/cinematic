# HELIOS browser verification record

This record describes tests run against the exact production HTML, CSS, shader, and interaction code. The four files were combined into one document only inside the test harness because this workspace blocks browser navigation to localhost and deployment domains; no code path or visual asset was substituted. The browser ran under Xvfb with ANGLE/SwiftShader, which is a software WebGL renderer and therefore a deliberately harsh baseline rather than a hardware-GPU benchmark.

## Desktop visual pass — 800 × 450

- WebGL 2 initialized successfully.
- High-quality renderer path selected.
- Internal canvas: **752 × 423**.
- Six actual browser captures were taken at journey positions 0.03, 0.15, 0.34, 0.49, 0.72, and 0.96.
- The captures visibly show different rendered states: void/planet, signal beacon, threshold tunnel, engine core, monolith city, and dawn.
- The browser reported `gl.getError() === 0` at the finale.
- Final center pixel read: `[241, 235, 218, 255]`, confirming a rendered non-black frame.
- Finale opacity reached `1`.
- Finale content remained inside the viewport.
- Replay reset journey progress from `1` to `0`.
- The actual sound control changed `aria-pressed` from `false` to `true` without an application exception.
- Horizontal and vertical overflow: `[0, 0]`.
- Observed SwiftShader rate after stabilization: approximately **17 fps**.

## Mobile visual and interaction pass — 320 × 568

- WebGL 2 initialized successfully.
- Capability-scaled low-quality renderer path selected.
- Internal canvas: **230 × 409**.
- Actual browser captures were taken at journey positions 0.03, 0.34, 0.72, and 0.96.
- Touch-style pointer events steered and boosted the experience without exceptions.
- All three interactive signal-beacon buttons were activated in their journey windows, producing a final charge state of `3 / 3`.
- Finale content rectangle remained inside the viewport.
- Horizontal and vertical overflow: `[0, 0]`.
- No JavaScript exceptions were recorded.
- Observed SwiftShader rate after stabilization: approximately **20 fps** on the reduced mobile tier.

## Resilience and implementation checks

- Source contains one `<canvas>` and **zero** `<img>` or `<video>` elements.
- There is no page-scroll listener and the document is fixed to the viewport.
- The world uses pointer, keyboard, pulse, boost, beacon, sound, finale, and replay interactions.
- No remote runtime media is required.
- Reduced-motion styling disables grain animation and shortens transitions.
- A CSS visual fallback and status message are present for WebGL initialization failure.

## Test-harness-only warning

Chromium emitted `GPU stall due to ReadPixels` warnings while the QA harness captured screenshots and explicitly sampled a pixel under SwiftShader. Those warnings came from the inspection operations; no application JavaScript exception or WebGL error was observed.
