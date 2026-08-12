# AETHER — A Cinematic Web Experiment

**Live production experience:** https://cinematic-two-ecru.vercel.app

AETHER is a continuous, scroll-directed web experience generated entirely in the browser from code.

There are no stock images, videos, 3D model files, external fonts, runtime packages, or third-party rendering services. The world is created by one compiled WebGL 2 fragment shader assembled from focused scene modules, while the optional score is synthesized with the Web Audio API.

## The experience

The visitor directs six connected acts:

1. **Signal** — a distant pulse emerges from darkness.
2. **Awaken** — the signal becomes a living, iridescent object.
3. **Passage** — scroll turns into a camera flight through a generated tunnel.
4. **Memory** — the tunnel opens into a ray-marched procedural landscape.
5. **Direction** — luminous architecture forms around the journey.
6. **Horizon** — the world resolves into a final cinematic frame.

The visual timeline is tied to normalized page progress, so every frame can be scrubbed forward or backward with the scrollbar.

## Highlights

- Hand-authored WebGL 2 fragment shader with six continuously blended scenes
- Procedural stars, nebulae, iridescent matter, tunnel geometry, terrain, architecture, and light
- Scroll velocity influences the visual energy and synthesized soundtrack
- Pointer-responsive parallax on compatible devices
- Generative ambient score built with oscillators, filtered noise, LFOs, and dynamic mixing
- Adaptive render resolution and 30 FPS mode for lower-power devices
- Reduced-motion behavior with frozen shader time and motion-safe typography
- Semantic HTML content, keyboard-accessible chapter navigation, skip link, and WebGL fallback
- No build step and no runtime dependencies

## Run locally

Any static server works. From the repository root:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

Opening `index.html` directly with a `file://` URL is not recommended because browser module security rules can block the JavaScript imports.

## Deploy

The project is ready for static deployment on Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any conventional web server.

### Vercel

Import the repository and deploy with the default settings. `vercel.json` adds clean URLs, security headers, and caching for static assets.

### Netlify

Use the repository root as the publish directory. No build command is required.

## Project structure

```text
.
├── index.html                 Semantic story, controls, and chapter content
├── styles/
│   ├── base.css               Identity, canvas, chrome, loader, and sound UI
│   ├── experience.css         Chapters, typography, navigation, and actions
│   └── responsive.css         Mobile and reduced-motion adaptations
├── js/
│   ├── app.js                 Scroll direction, chapter choreography, UI, input
│   ├── audio.js               Procedural Web Audio soundtrack
│   ├── renderer.js            WebGL lifecycle, adaptive resolution, uniforms
│   ├── shaders.js             Shader assembly and fullscreen vertex shader
│   └── shader/
│       ├── core.js            Noise, stars, nebulae, palette, shared functions
│       ├── scenes-a.js        Signal, Awaken, and Passage
│       └── scenes-b.js        Memory, Direction, Horizon, and final composition
├── assets/
│   ├── favicon.svg            Original vector identity mark
│   └── og.jpg                 Original social preview artwork
├── site.webmanifest
├── robots.txt
└── vercel.json
```

## Controls

- **Scroll** — direct the timeline
- **Pointer** — bend the live visual field on desktop
- **Sound button** — start or stop the generative score
- **M key** — toggle sound
- **Chapter rail** — jump to a specific act
- **Replay Experience** — return to the opening signal

## Performance strategy

AETHER avoids large asset downloads and varies rendering pressure by device capability:

- Internal resolution is capped by a pixel budget rather than blindly following the device pixel ratio.
- Lower-power and coarse-pointer devices use a smaller render scale and a 30 FPS target.
- Hidden tabs stop rendering.
- Slow-frame detection can reduce internal resolution at runtime.
- `prefers-reduced-motion` freezes shader time, disables pointer drift, and removes text motion.
- A styled CSS fallback preserves the complete written journey when WebGL 2 is unavailable.

## Creative direction

The art direction is built around contrast: editorial typography over a dark procedural field, with violet, cyan, ember, and ivory used as light rather than decoration. The pacing deliberately alternates between spectacle and quiet so that the experience still communicates rather than becoming a graphics demo.

## License

MIT
