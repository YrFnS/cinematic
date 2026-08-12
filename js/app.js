import { AmbientScore } from "./audio.js";
import { CinematicRenderer } from "./renderer.js";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0, edge1, value) => {
  const normalized = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
};

document.documentElement.classList.add("has-js");

const body = document.body;
const root = document.documentElement;
const canvas = document.querySelector("#world");
const boot = document.querySelector(".boot");
const progressChapter = document.querySelector(".progress__chapter");
const progressValue = document.querySelector(".progress__value");
const scrollCue = document.querySelector(".scroll-cue");
const pointerAura = document.querySelector(".pointer-aura");
const soundToggle = document.querySelector(".sound-toggle");
const soundLabel = document.querySelector(".sound-toggle__label");
const replayButton = document.querySelector(".replay");
const webglMessage = document.querySelector(".webgl-message");
const chapters = [...document.querySelectorAll(".chapter")];
const navigationButtons = [...document.querySelectorAll(".chapter-nav button")];
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = reducedMotionQuery.matches;

if (reducedMotion) body.classList.add("reduced-motion");

let renderer;
let ready = false;
let layout = [];
let maximumScroll = 1;
let lastScrollY = window.scrollY;
let lastScrollTime = performance.now();
let activeChapter = -1;
let scrollFrame = 0;
let resizeTimer = 0;
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;

const score = new AmbientScore();

function revealExperience() {
  if (ready) return;
  ready = true;
  body.classList.add("is-ready");
  boot?.setAttribute("aria-hidden", "true");
  window.setTimeout(() => boot?.remove(), 1000);
}

function handleRendererFailure(error) {
  body.classList.add("no-webgl");
  webglMessage.hidden = false;
  webglMessage.textContent = error?.message?.includes("WebGL")
    ? "Your browser is showing the lightweight visual edition. Every chapter and control remains available."
    : "The live visual field could not initialize, so the lightweight edition is active.";
  revealExperience();
}

renderer = new CinematicRenderer(canvas, {
  reducedMotion,
  onReady: revealExperience,
  onFailure: handleRendererFailure,
});

// Never trap the visitor behind an initialization screen.
window.setTimeout(revealExperience, 2200);

function measureLayout() {
  layout = chapters.map((chapter) => ({
    chapter,
    top: chapter.offsetTop,
    height: chapter.offsetHeight,
    center: chapter.offsetTop + chapter.offsetHeight * 0.5,
    alignment: chapter.dataset.align || "left",
  }));
  maximumScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  updateScrollState(true);
}

function chapterOpacity(index, localProgress) {
  if (index === 0) {
    return 1 - smoothstep(0.57, 0.92, localProgress);
  }

  if (index === chapters.length - 1) {
    return smoothstep(0.02, 0.34, localProgress);
  }

  const enter = smoothstep(0.02, 0.30, localProgress);
  const leave = 1 - smoothstep(0.68, 0.98, localProgress);
  return Math.min(enter, leave);
}

function updateActiveChapter(viewportCenter) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  layout.forEach((entry, index) => {
    const distance = Math.abs(entry.center - viewportCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  if (nearestIndex === activeChapter) return;
  activeChapter = nearestIndex;
  const chapterNumber = String(activeChapter).padStart(2, "0");
  progressChapter.textContent = chapterNumber;
  body.dataset.chapter = chapterNumber;

  navigationButtons.forEach((button, index) => {
    const selected = index === activeChapter;
    button.classList.toggle("is-active", selected);
    if (selected) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function updateScrollState(force = false) {
  scrollFrame = 0;
  const now = performance.now();
  const scrollY = window.scrollY || window.pageYOffset;
  const elapsed = Math.max(16, now - lastScrollTime);
  const rawVelocity = (scrollY - lastScrollY) / elapsed / 1.15;
  const velocity = clamp(rawVelocity, -2.5, 2.5);
  const progress = clamp(scrollY / maximumScroll);
  const viewportCenter = scrollY + window.innerHeight * 0.52;

  root.style.setProperty("--global-progress", progress.toFixed(5));
  progressValue.textContent = String(Math.round(progress * 999)).padStart(3, "0");

  if (scrollCue) {
    const hintOpacity = 1 - smoothstep(0.0, 0.065, progress);
    scrollCue.style.setProperty("--scroll-hint-opacity", hintOpacity.toFixed(3));
  }

  layout.forEach((entry, index) => {
    const localProgress = (viewportCenter - entry.top) / Math.max(1, entry.height);
    const opacity = clamp(chapterOpacity(index, localProgress));
    const centered = clamp(localProgress, 0, 1) - 0.5;
    const shift = centered * -82;
    const horizontalDirection = entry.alignment === "right" ? -1 : 1;
    const horizontalShift = centered * 24 * horizontalDirection;
    const blur = (1 - opacity) * (reducedMotion ? 0 : 13);
    const scale = 0.965 + opacity * 0.035;

    entry.chapter.style.setProperty("--chapter-opacity", opacity.toFixed(4));
    entry.chapter.style.setProperty("--chapter-shift", `${shift.toFixed(2)}px`);
    entry.chapter.style.setProperty("--chapter-x", `${horizontalShift.toFixed(2)}px`);
    entry.chapter.style.setProperty("--chapter-blur", `${blur.toFixed(2)}px`);
    entry.chapter.style.setProperty("--chapter-scale", scale.toFixed(4));
  });

  updateActiveChapter(viewportCenter);
  renderer?.setProgress(progress, force ? 0 : velocity);
  score.setProgress(progress, force ? 0 : velocity);

  lastScrollY = scrollY;
  lastScrollTime = now;
}

function scheduleScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => updateScrollState(false));
}

window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });

function scheduleResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const widthChanged = window.innerWidth !== lastViewportWidth;
    const heightChanged = Math.abs(window.innerHeight - lastViewportHeight) > 100;

    // Ignore mobile browser toolbar height jitters unless they materially alter layout.
    if (widthChanged || heightChanged) {
      lastViewportWidth = window.innerWidth;
      lastViewportHeight = window.innerHeight;
      measureLayout();
    }
  }, 120);
}

window.addEventListener("resize", scheduleResize, { passive: true });
window.addEventListener("orientationchange", () => window.setTimeout(measureLayout, 180));
window.addEventListener("load", measureLayout, { once: true });

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });
});

replayButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

let soundBusy = false;
async function toggleSound() {
  if (soundBusy) return;
  soundBusy = true;
  soundToggle.disabled = true;

  try {
    const active = await score.toggle();
    soundToggle.setAttribute("aria-pressed", String(active));
    soundLabel.textContent = active ? "SOUND / ON" : "SOUND / OFF";
  } catch (error) {
    console.warn("AETHER audio could not start:", error);
    soundToggle.setAttribute("aria-pressed", "false");
    soundLabel.textContent = "SOUND / N/A";
    soundToggle.title = "Web Audio is unavailable in this browser.";
  } finally {
    soundToggle.disabled = false;
    soundBusy = false;
  }
}

soundToggle?.addEventListener("click", toggleSound);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "m" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    toggleSound();
  }
});

let pointerTargetX = window.innerWidth * 0.5;
let pointerTargetY = window.innerHeight * 0.5;
let pointerCurrentX = pointerTargetX;
let pointerCurrentY = pointerTargetY;
let pointerFrame = 0;

function animatePointer() {
  pointerFrame = requestAnimationFrame(animatePointer);
  if (!finePointerQuery.matches || reducedMotion) return;

  pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.12;
  pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.12;
  pointerAura.style.transform = `translate3d(${(pointerCurrentX - 120).toFixed(2)}px, ${(pointerCurrentY - 120).toFixed(2)}px, 0)`;
}

if (finePointerQuery.matches && !reducedMotion) {
  pointerFrame = requestAnimationFrame(animatePointer);
}

window.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  pointerTargetX = event.clientX;
  pointerTargetY = event.clientY;
  body.classList.add("has-pointer");

  const normalizedX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
  const normalizedY = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
  renderer?.setPointer(normalizedX, normalizedY);
}, { passive: true });

window.addEventListener("pointerleave", () => {
  body.classList.remove("has-pointer");
  renderer?.setPointer(0, 0);
}, { passive: true });

window.addEventListener("touchstart", () => renderer?.setPointer(0, 0), { passive: true });
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(pointerFrame);
  renderer?.destroy();
});

measureLayout();
