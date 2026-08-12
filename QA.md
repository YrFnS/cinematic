# MIRAGE browser verification

This document records the checks performed against the exact loader and decompressed production experience committed and deployed for MIRAGE.

## Test environment

- Chromium under Xvfb on Linux.
- WebGL 2 through ANGLE + SwiftShader, intentionally exercising the software-renderer quality tier.
- Desktop viewport: 960 × 540 and 1280 × 720.
- Mobile viewport: 390 × 844 with touch and mobile emulation.
- JavaScript syntax checked with `node --check` before browser tests.

SwiftShader is much slower than a normal discrete or integrated GPU. Its measured frame rate is therefore a conservative fallback benchmark, not a claim about hardware-accelerated browsers.

## Verified behavior

### Rendering

- WebGL 2 context created successfully.
- All five camera locations produced distinct nonblank frames.
- Eleven evenly spaced progress positions from `0.0` through `1.0` were rendered and inspected for continuity.
- The tunnel-to-planet transition was specifically retested after replacing a camera cut with a safe continuous orbital path.
- Software-renderer tier warmed to approximately 9–12 FPS at a 533 × 299 internal framebuffer.
- The forced high-quality shader path compiled and rendered Arrival, Orrery, and The Other Side without console or page errors.

### Interaction

- Enter control starts the experience and soundtrack.
- Mouse wheel changes camera target and advances chapters.
- Touch swipe changes camera target on the mobile layout.
- Pointer click/tap triggers the pulse response.
- Chapter rail reaches all locations and updates the active state.
- Brand control returns the camera to Arrival.
- Sound control toggles the synthesized score.
- Keyboard navigation supports arrows, Page Up/Down, Space, Home, End, Enter, and M.

### Responsive and accessibility paths

- Desktop and 390 × 844 phone layouts render without horizontal overflow.
- Phone layout uses a portrait composition rather than cropping a landscape video.
- `prefers-reduced-motion: reduce` is honored and still renders the complete world.
- WebGL-disabled mode shows a readable failure explanation rather than an empty page.
- Chapter controls have accessible names and the dynamic location copy uses `aria-live`.
- The production file made zero external resource requests during the browser test.

## Automated evidence generated during development

The local verification run produced:

- five desktop world captures and a contact sheet;
- three portrait world captures and a mobile contact sheet;
- desktop and phone UI screenshots;
- fallback and reduced-motion screenshots;
- JSON reports for desktop, mobile, continuity, interaction, rendering modes, and software-renderer performance.

These development artifacts are not required by the production runtime.
