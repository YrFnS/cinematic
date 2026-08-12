# BEYOND / FILM_03

A scroll-directed cinematic website built around real space imagery rather than abstract shader wallpaper.

## Experience

Four chapters are time-remapped against scroll position:

1. Departure — Earth rising over the Moon.
2. Transformation — a flight through the Orion Nebula.
3. Gravity — a simulated plunge toward a supermassive black hole.
4. Home — Earth rotating as seen by NASA's EPIC camera.

The interface adds custom pacing, crossfades, color treatment, film grain, velocity response, a generated Web Audio score, chapter navigation, mobile-specific source selection, reduced-motion handling, and source fallbacks.

## Run

Serve the repository root with any static server:

```bash
python3 -m http.server 4173
```

## Media credits and licenses

- Earthrise and EPIC footage: NASA Scientific Visualization Studio / NASA Goddard.
- Black-hole footage: NASA Scientific Visualization Studio. NASA-created material is public domain in the United States unless otherwise noted.
- Orion footage: ESA/Hubble, licensed CC BY 4.0. The site crops, mutes, color-grades, and time-remaps the source.

No NASA or ESA endorsement is implied. Agency logos are not used.
