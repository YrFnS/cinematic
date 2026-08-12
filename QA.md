# SENTINEL verification record

The experience was tested from the exact self-contained production source in Chromium using WebGL 2 through ANGLE/SwiftShader. SwiftShader is a software renderer and therefore a deliberately harsh performance baseline, not a hardware-GPU benchmark.

## Desktop — 960 × 540

- WebGL 2 initialized successfully.
- Renderer: ANGLE / Vulkan / SwiftShader.
- No console warnings, JavaScript exceptions, or GL errors in the standard path.
- Internal canvas: 581 × 327 under the software-renderer quality tier.
- The sampled approach, threshold, sanctum, awakening, dawn, and finale frames were non-blank and visually distinct.
- Wheel input increased progress from `0.200` to `0.343`.
- Pointer drag increased progress from `0.343` to `0.650`.
- End and Home resolved to progress `1` and `0`.
- The chapter rail resolved the Sanctum camera point to `0.520`.
- Audio activation changed `aria-pressed` to `true` without an exception.
- Final WebGL center pixel read: `[233, 209, 136, 255]`; GL error code: `0`.
- The finale reached opacity `1` and both calls to action remained inside the viewport.
- Horizontal overflow: `0`; vertical overflow: `0`; document scroll position remained `[0, 0]`.
- Recorded journey: 960 × 540 VP8, 25 fps capture, 12.64 seconds.

## Mobile — 390 × 844

- WebGL 2 initialized successfully.
- No console warnings or JavaScript exceptions.
- Internal canvas: 296 × 641 under the mobile/software tier.
- Touch-style drag increased progress from `0.150` to `0.623`.
- The final state reached progress `0.980` and finale opacity `1`.
- Header, chapter rail, finale, and replay control remained within the viewport.
- Horizontal overflow: `0`; vertical overflow: `0`.
- Observed software-renderer rate at the final state: approximately 14 fps. Hardware devices are capability-scaled independently.

## Accessibility and resilience

- `prefers-reduced-motion` disables grain animation and shortens interface transitions.
- WebGL-disabled test entered the `no-webgl ready` state.
- The fallback visual layer reached opacity `1` and the canvas was removed from display.
- The fallback status message remained readable.
- Keyboard controls, visible focus treatment, semantic buttons, a skip link, and a generated-audio opt-in are present.

## Defects caught during verification

Testing found and corrected these issues before publication:

1. Fragment-shader declaration error during an early build.
2. A blank/compositor race at the original finale transition.
3. A mobile pointer-capture exception.
4. Excessive emissive brightness on the artifact rings.
5. An overly faceted and flat final sun.
6. Software-renderer load that required lower geometry and resolution tiers.
