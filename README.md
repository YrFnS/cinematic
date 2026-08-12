# HELIOS — Wake the Machine

HELIOS is a full-screen playable cinematic world rendered live with WebGL 2.

It is deliberately **not** a scrolling landing page, an image sequence, or text over background footage. The visitor steers the camera, boosts through the world, fires pulses, absorbs three signal beacons, charges the machine, and reaches the final dawn.

## Journey

- **Void** — acquire the first signal above a dark planet.
- **Threshold** — fly through a rotating light tunnel.
- **Engine** — orbit and pulse a mechanical energy core.
- **City** — boost through a monolithic field of moving architecture.
- **Dawn** — wake the horizon and complete the machine.

## Controls

- Move the pointer or drag: steer
- Hold pointer / hold `Space`: boost
- Tap, click, or press `E`: pulse
- Absorb the three visible signal beacons: charge the machine
- Sound control: enable the generated Web Audio score
- Replay: return to the void

## Technical approach

- Small static bundle: HTML, CSS, shader, and interaction engine
- WebGL 2 procedural rendering
- No page scroll
- No `<img>` or `<video>` elements
- No remote runtime assets or packages
- No 3D model downloads
- Generated Web Audio soundtrack
- Capability-scaled desktop/mobile quality
- CSS fallback when WebGL 2 cannot initialize

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

See [`QA.md`](./QA.md) for the browser verification record used before deployment.
