/**
 * Scroll-scrubbed hero — pinned <canvas> frame sequence driven by scroll.
 *
 * This is the Apple-style technique: preload a sequence of frames, and draw the
 * frame that matches scroll progress. It stays smooth on iOS/Safari (unlike
 * scrubbing a raw <video> element).
 *
 * ── Swapping in the real clip ─────────────────────────────────────────────
 * When the generated video is ready, split it to frames and point FRAMES at them:
 *
 *   ffmpeg -i hero.mp4 -vf fps=30 assets/hero-frames/frame_%04d.jpg
 *
 *   const FRAME_COUNT = 90; // however many the split produced
 *   const FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) =>
 *     `assets/hero-frames/frame_${String(i + 1).padStart(4, "0")}.jpg`
 *   );
 *
 * Then set CROSSFADE = false (dense frames don't need it) and you're done.
 * ──────────────────────────────────────────────────────────────────────────
 */

// PLACEHOLDER frames: the 6 curated campaign heroes, so the mechanism is
// visible with real assets. A real clip would be ~60–150 frames.
const FRAMES = [
  "assets/heros/Cozmo_v3.png",
  "assets/heros/Credito365_Hero.png",
  "assets/heros/dineromon_summer_v1.png",
  "assets/heros/Slana.png",
  "assets/heros/SolcreditoREM.png",
  "assets/heros/Vivus.png",
];

// Crossfade between sparse placeholder frames so 6 images look like a sequence.
// Set to false once you have a dense (video-split) frame set.
const CROSSFADE = true;

const canvas = document.getElementById("scrollhero-canvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".scrollhero__stage");
const overlay = document.querySelector(".scrollhero__overlay");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const images = [];
let imagesReady = 0;
let currentProgress = 0;

function loadImages() {
  return Promise.all(
    FRAMES.map(
      (src, index) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            imagesReady += 1;
            resolve();
          };
          img.onerror = () => resolve(); // Never block on a missing frame.
          img.src = src;
          images[index] = img;
        })
    )
  );
}

/** Draw one image to fill the canvas like `background-size: cover`. */
function drawCover(img, alpha) {
  if (!img || !img.naturalWidth) {
    return;
  }

  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.globalAlpha = alpha;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}

function render(progress) {
  currentProgress = progress;

  const clamped = Math.max(0, Math.min(1, progress));
  const position = clamped * (FRAMES.length - 1);
  const index = Math.floor(position);
  const frac = position - index;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (CROSSFADE) {
    drawCover(images[index], 1);
    if (frac > 0 && images[index + 1]) {
      drawCover(images[index + 1], frac);
    }
  } else {
    drawCover(images[Math.round(position)], 1);
  }
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = stage.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  render(currentProgress);
}

function initStatic() {
  // Reduced motion (or no GSAP): show a single poster frame, no scrubbing.
  resizeCanvas();
  render(0);
  overlay?.classList.add("is-visible");
}

function initScrollScrub() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  resizeCanvas();
  render(0);

  ScrollTrigger.create({
    trigger: ".scrollhero",
    start: "top top",
    end: "bottom bottom",
    pin: stage,
    pinSpacing: false,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
  });

  // Headline fades + lifts as the sequence plays; hint fades out early.
  gsap.to(".scrollhero__title", {
    yPercent: -18,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".scrollhero",
      start: "top top",
      end: "40% top",
      scrub: true,
    },
  });

  gsap.to(".scrollhero__hint", {
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".scrollhero",
      start: "top top",
      end: "12% top",
      scrub: true,
    },
  });

  overlay?.classList.add("is-visible");
  window.addEventListener("resize", resizeCanvas);
  ScrollTrigger.refresh();
}

const hasGsap = () =>
  typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

loadImages().then(() => {
  if (reduceMotion.matches || !hasGsap()) {
    initStatic();
    return;
  }

  initScrollScrub();
});

window.addEventListener("resize", resizeCanvas);
