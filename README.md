# SENTINEL — The Temple Remembers

**Live experience:** https://cinematic-two-ecru.vercel.app

SENTINEL is a fixed-viewport, real-time WebGL journey through a monolithic temple. It is not a scrolling page and it does not play background footage: wheel, drag, touch, keyboard, and chapter controls move an authored camera through one continuous 3D world.

## Experience

1. **Approach** — enter a cold, repeating stone passage.
2. **Threshold** — cross the illuminated gate as the architecture closes around the camera.
3. **Sanctum** — orbit a responsive artifact at the center of the temple.
4. **Awakening** — the artifact opens into rings, shards, and warm light.
5. **Dawn** — the corridor releases into a transformed horizon.

## Controls

- Mouse wheel: move forward or backward through the world
- Pointer drag: travel through the world
- Pointer movement: look around
- Touch drag: move through the world on mobile
- Arrow keys / Page Up / Page Down / Space: step through the journey
- Home / End: jump to the beginning or ending
- M: toggle the generated score
- Chapter rail: jump to an authored camera point

## Technical direction

- One self-contained `index.html`
- Hand-authored WebGL 2 raster renderer
- Real 3D geometry, perspective camera, lighting, fog, particles, procedural materials, and an animated artifact
- Generated Web Audio score with chapter impacts
- No images, video files, model files, external fonts, runtime libraries, package manager, or build step
- Adaptive internal resolution and geometry quality
- Software-renderer detection and lower-cost fallback tier
- Dedicated mobile composition and touch controls
- Reduced-motion mode
- CSS fallback when WebGL 2 is unavailable

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Verification

The complete test matrix and captured evidence are documented in [`QA.md`](QA.md). Testing covers real WebGL rendering, sampled visual states, wheel/drag/touch/keyboard interaction, sound activation, desktop/mobile bounds, zero page scrolling, the finale, reduced motion, and the no-WebGL fallback.

## License

MIT
