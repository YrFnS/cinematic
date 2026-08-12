# MIRAGE — A Real-Time Cinematic World

MIRAGE is an interactive WebGL 2 journey through one continuous generated environment. It is not a background video, image sequence, or vertically scrolling article: the document stays fixed while wheel, swipe, keyboard, and chapter controls move a live camera through the world.

## Journey

1. **Arrival** — reflective dunes, an eclipse, and distant monoliths.
2. **The Gate** — a repeating obsidian corridor with emissive slits.
3. **Orrery** — a reactive iridescent core surrounded by moving orbital sculptures.
4. **The Veil** — a continuous ring tunnel that bends toward another world.
5. **The Other Side** — a pointer-controlled orbit around a procedural gas giant.

Everything visible in the world is rendered from signed-distance geometry, procedural materials, ray-marched lighting, atmosphere, and a real-time camera. The optional soundtrack is synthesized with the Web Audio API.

## Controls

- **Wheel / swipe / Arrow keys / Page Up / Page Down** — move the camera.
- **Pointer** — look around.
- **Click / tap** — disturb the energy field.
- **Chapter rail** — jump to a location.
- **M** — toggle the generative soundtrack.
- **Home / End** — return to the opening or jump to the final orbit.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in a current browser with WebGL 2 enabled.

## Architecture

The production experience is deliberately self-contained:

```text
index.html     UI, interaction, WebGL renderer, GLSL world, and Web Audio score
vercel.json    Static deployment and security headers
QA.md          Browser verification evidence and known test environment
```

There are no runtime packages, remote media files, model downloads, or third-party script requests.

## Verification

The exact production file was tested in Chromium on desktop and phone-sized viewports. The matrix covers shader compilation, all five locations, camera continuity, wheel and touch controls, chapter navigation, sound, reduced motion, WebGL failure fallback, layout overflow, and both low- and high-quality shader paths. See [QA.md](./QA.md).

## License

MIT
