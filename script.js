const content = window.PORTFOLIO_CONTENT;
const currentPage = document.body.dataset.page;
const metaDescription = document.querySelector('meta[name="description"]');
const langButtons = document.querySelectorAll("[data-lang-trigger]");
const textNodes = document.querySelectorAll("[data-i18n]");
const htmlNodes = document.querySelectorAll("[data-i18n-html]");
const altNodes = document.querySelectorAll("[data-i18n-alt]");
const ariaNodes = document.querySelectorAll("[data-i18n-aria-label]");
const yearNode = document.getElementById("year");
const fiizyArchiveGrid = document.getElementById("fiizy-archive-grid");
const fiizyArchiveEmpty = document.getElementById("fiizy-archive-empty");
const archiveLightbox = document.getElementById("archive-lightbox");
const archiveLightboxImage = document.getElementById("archive-lightbox-image");
const archiveLightboxCaption = document.getElementById("archive-lightbox-caption");
const archiveLightboxClose = document.getElementById("archive-lightbox-close");
const archiveLightboxBackdrop = document.getElementById("archive-lightbox-backdrop");
const langStorageKey = content.site.localStorageKey;
const defaultLang = content.site.defaultLang;
const fiizyArchiveItems = content.pages?.work?.archiveItems ?? [];
const motionPreferenceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let fiizyArchiveRenderToken = 0;
let activeLang = defaultLang;
let scrollMeter = null;
let scrollMeterValue = null;

function hasGsapMotion() {
  return typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
}

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function getLocalized(path, lang) {
  const value = readPath(content, path);

  if (value && typeof value === "object" && lang in value) {
    return value[lang];
  }

  return value;
}

function applyMeta(lang) {
  const pageContent = content.pages[currentPage];

  if (!pageContent?.meta) {
    return;
  }

  document.title = pageContent.meta.title[lang];

  if (metaDescription) {
    metaDescription.setAttribute("content", pageContent.meta.description[lang]);
  }
}

function applyLanguage(lang) {
  activeLang = lang;
  document.documentElement.lang = lang;

  textNodes.forEach((node) => {
    const translated = getLocalized(node.dataset.i18n, lang);

    if (typeof translated === "string") {
      node.textContent = translated;
    }
  });

  htmlNodes.forEach((node) => {
    const translated = getLocalized(node.dataset.i18nHtml, lang);

    if (typeof translated === "string") {
      node.innerHTML = translated;
    }
  });

  altNodes.forEach((node) => {
    const translated = getLocalized(node.dataset.i18nAlt, lang);

    if (typeof translated === "string") {
      node.setAttribute("alt", translated);
    }
  });

  ariaNodes.forEach((node) => {
    const translated = getLocalized(node.dataset.i18nAriaLabel, lang);

    if (typeof translated === "string") {
      node.setAttribute("aria-label", translated);
    }
  });

  langButtons.forEach((button) => {
    const isActive = button.dataset.langTrigger === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  applyMeta(lang);
  decorateMotionText();
  renderFiizyArchive(lang);

  if (hasGsapMotion()) {
    window.requestAnimationFrame(() => {
      window.ScrollTrigger?.refresh();
    });
  }

  localStorage.setItem(langStorageKey, lang);
}

function resolveInitialLanguage() {
  const savedLang = localStorage.getItem(langStorageKey);

  if (savedLang === "et" || savedLang === "en") {
    return savedLang;
  }

  return defaultLang;
}

function initializeLanguage() {
  const initialLang = resolveInitialLanguage();

  applyLanguage(initialLang);

  langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(button.dataset.langTrigger);
    });
  });
}

function decorateMotionText() {
  const targets = document.querySelectorAll(".hero-title, .page-title, .section-title, .hero-focus-title");

  targets.forEach((node) => {
    const source = node.textContent.trim();

    if (!source) {
      return;
    }

    const mode = node.classList.contains("hero-title") ? "chars" : "words";
    const fragment = document.createDocumentFragment();
    const words = source.split(/\s+/);
    let unitIndex = 0;

    node.textContent = "";
    node.classList.add("motion-split");
    node.classList.toggle("motion-split-chars", mode === "chars");
    node.classList.toggle("motion-split-words", mode === "words");
    node.setAttribute("aria-label", source);

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "split-word";
      wordSpan.setAttribute("aria-hidden", "true");

      if (mode === "chars") {
        Array.from(word).forEach((character) => {
          const charSpan = document.createElement("span");
          charSpan.className = "split-char";
          charSpan.textContent = character;
          charSpan.style.setProperty("--unit-index", unitIndex++);
          wordSpan.append(charSpan);
        });
      } else {
        const unitSpan = document.createElement("span");
        unitSpan.className = "split-char";
        unitSpan.textContent = word;
        unitSpan.style.setProperty("--unit-index", unitIndex++);
        wordSpan.append(unitSpan);
      }

      fragment.append(wordSpan);

      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement("span");
        spaceSpan.className = "split-space";
        spaceSpan.textContent = " ";
        spaceSpan.setAttribute("aria-hidden", "true");
        fragment.append(spaceSpan);
      }
    });

    node.append(fragment);
  });
}

function initializeHeaderState() {
  const syncHeader = () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

function updateScrollMeter() {
  if (!scrollMeter || !scrollMeterValue) {
    return;
  }

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const displayValue = Math.round(clampedProgress * 100);

  document.documentElement.style.setProperty("--scroll-progress", clampedProgress.toFixed(4));
  scrollMeterValue.textContent = String(displayValue).padStart(2, "0");
}

function initializeScrollMeter() {
  scrollMeter = document.createElement("div");
  scrollMeter.className = "scroll-meter";
  scrollMeter.setAttribute("aria-hidden", "true");
  scrollMeter.innerHTML = `
    <span class="scroll-meter-label">Scroll</span>
    <span class="scroll-meter-track"><span class="scroll-meter-fill"></span></span>
    <span class="scroll-meter-value">00</span>
  `;

  document.body.append(scrollMeter);
  scrollMeterValue = scrollMeter.querySelector(".scroll-meter-value");

  updateScrollMeter();
  window.addEventListener("scroll", updateScrollMeter, { passive: true });
  window.addEventListener("resize", updateScrollMeter);
}

function initializePointerAura() {
  if (motionPreferenceQuery.matches) {
    return;
  }

  const root = document.documentElement;
  const setPointer = (x, y) => {
    root.style.setProperty("--pointer-x", `${x}px`);
    root.style.setProperty("--pointer-y", `${y}px`);
  };

  setPointer(window.innerWidth * 0.5, window.innerHeight * 0.22);

  window.addEventListener(
    "pointermove",
    (event) => {
      setPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );
}

function openArchiveLightbox(src, label) {
  if (!archiveLightbox || !archiveLightboxImage || !archiveLightboxCaption) {
    return;
  }

  archiveLightboxImage.src = src;
  archiveLightboxImage.alt = label;
  archiveLightboxCaption.textContent = label;
  archiveLightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeArchiveLightbox() {
  if (!archiveLightbox || !archiveLightboxImage || !archiveLightboxCaption) {
    return;
  }

  archiveLightbox.hidden = true;
  archiveLightboxImage.removeAttribute("src");
  archiveLightboxImage.alt = "";
  archiveLightboxCaption.textContent = "";
  document.body.style.overflow = "";
}

function getArchiveDisplayName(src) {
  const fileName = src.split("/").pop() ?? src;
  const baseName = fileName.replace(/\.[^.]+$/, "");

  return baseName
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^[A-Z0-9]+$/.test(token)) {
        return token;
      }

      if (/^v\d+$/i.test(token) || /^[a-z]{1,3}$/.test(token)) {
        return token.toUpperCase();
      }

      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join(" ");
}

function createArchiveCard(src) {
  const label = getArchiveDisplayName(src);
  const article = document.createElement("article");
  const button = document.createElement("button");
  const image = document.createElement("img");
  const copy = document.createElement("div");
  const title = document.createElement("p");

  article.className = "archive-card";
  button.className = "archive-button";
  button.type = "button";

  image.className = "archive-image";
  image.src = src;
  image.alt = label;
  image.loading = "lazy";

  copy.className = "archive-card-copy";
  title.className = "archive-card-title";
  title.textContent = label;

  copy.append(title);
  button.append(image, copy);
  article.append(button);

  button.addEventListener("click", () => openArchiveLightbox(src, label));

  return article;
}

function initializeMediaIntegrity() {
  const mediaNodes = document.querySelectorAll(
    ".hero-focus-image, .hero-primary-image, .hero-mini-image, .project-image, .case-hero-image, .case-layout-image, .archive-image, .photo-card img"
  );

  const handleFailure = (image) => {
    image.hidden = true;
    image.classList.add("is-missing-media");
    image.removeAttribute("alt");
    image
      .closest(".hero-focus, .hero-primary-card, .hero-mini-card, .project-card, .case-study, .email-gallery-card, .archive-card, .photo-card")
      ?.classList.add("has-missing-media");
  };

  mediaNodes.forEach((image) => {
    if (image.complete && image.naturalWidth === 0) {
      handleFailure(image);
      return;
    }

    if (!image.complete) {
      image.addEventListener("error", () => handleFailure(image), { once: true });
    }
  });
}

function renderFiizyArchive(lang) {
  if (!fiizyArchiveGrid) {
    return;
  }

  const renderToken = ++fiizyArchiveRenderToken;
  const visibleItems = fiizyArchiveItems
    .map((src, itemIndex) => ({ src, index: itemIndex + 1 }))
    .filter((item) => typeof item.src === "string" && item.src.length > 0);

  if (renderToken !== fiizyArchiveRenderToken) {
    return;
  }

  fiizyArchiveGrid.innerHTML = "";
  visibleItems.forEach((item) => {
    fiizyArchiveGrid.append(createArchiveCard(item.src));
  });

  fiizyArchiveGrid.classList.toggle("has-items", visibleItems.length > 0);

  if (fiizyArchiveEmpty) {
    fiizyArchiveEmpty.hidden = visibleItems.length > 0;
  }
}

function initializeRevealSequence() {
  const sequences = document.querySelectorAll(
    ".hero-section, .page-intro, .proof-strip, .featured-section, .tools-section, .case-study-list, .email-gallery-section, .detail-grid, .photo-section, .contact-grid"
  );

  sequences.forEach((sequence) => {
    sequence.querySelectorAll(".reveal").forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index * 90, 420)}ms`);
    });
  });
}

function initializeReveal() {
  const revealItems = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.24,
      rootMargin: "0px 0px -12% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initializeGsapMotion() {
  if (!hasGsapMotion()) {
    return false;
  }

  const { gsap, ScrollTrigger } = window;
  const revealStagger = motionPreferenceQuery.matches ? 0.04 : 0.12;
  const heroStagger = motionPreferenceQuery.matches ? 0.05 : 0.11;
  const initialGroups = document.querySelectorAll(".hero-section, .page-intro");
  const scrollGroups = document.querySelectorAll(
    ".proof-strip, .featured-section, .tools-section, .case-study-list, .email-gallery-section, .detail-grid, .photo-section, .contact-grid"
  );

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    ignoreMobileResize: true,
  });

  const staggerReveal = (items, step) => {
    items.forEach((item, index) => {
      gsap.delayedCall(index * step, () => {
        item.classList.add("is-visible");
      });
    });
  };

  initialGroups.forEach((group) => {
    const items = group.querySelectorAll(".reveal");

    if (!items.length) {
      return;
    }

    staggerReveal(items, heroStagger);
  });

  scrollGroups.forEach((group) => {
    const items = group.querySelectorAll(".reveal");

    if (!items.length) {
      return;
    }

    ScrollTrigger.create({
      trigger: group,
      start: "top 78%",
      once: true,
      onEnter: () => {
        staggerReveal(items, revealStagger);
      },
    });
  });

  ScrollTrigger.refresh();

  return true;
}

function initializeTilt() {
  if (motionPreferenceQuery.matches) {
    return;
  }

  const tiltTargets = document.querySelectorAll(
    ".hero-focus, .hero-primary-card, .hero-mini-card, .project-card, .tool-panel"
  );

  tiltTargets.forEach((target) => {
    const resetTilt = () => {
      target.style.setProperty("--tilt-x", "0deg");
      target.style.setProperty("--tilt-y", "0deg");
    };

    target.addEventListener("pointermove", (event) => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 6;
      const rotateX = (0.5 - y) * 6;

      target.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      target.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
    });

    target.addEventListener("pointerleave", resetTilt);
    target.addEventListener("pointercancel", resetTilt);
    target.addEventListener("blur", resetTilt, true);
  });
}

function initializeMediaParallax() {
  const motionTargets = document.querySelectorAll(
    ".hero-focus-image, .hero-primary-image, .hero-mini-image, .project-image, .case-hero-image, .case-layout-image, .photo-card img"
  );

  if (!motionTargets.length) {
    return;
  }

  let ticking = false;

  const updateMotion = () => {
    const viewportCenter = window.innerHeight / 2;
    const maxShift = motionPreferenceQuery.matches ? 10 : 28;
    const shiftStrength = motionPreferenceQuery.matches ? -10 : -22;

    motionTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }

      const elementCenter = rect.top + rect.height / 2;
      const distance = (elementCenter - viewportCenter) / viewportCenter;
      const shift = Math.max(-maxShift, Math.min(maxShift, distance * shiftStrength));

      target.style.setProperty("--media-shift", `${shift.toFixed(2)}px`);
    });

    ticking = false;
  };

  const requestTick = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updateMotion);
  };

  updateMotion();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
}

function initializeArchiveLightbox() {
  if (!archiveLightbox) {
    return;
  }

  archiveLightboxClose?.addEventListener("click", closeArchiveLightbox);
  archiveLightboxBackdrop?.addEventListener("click", closeArchiveLightbox);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !archiveLightbox.hidden) {
      closeArchiveLightbox();
    }
  });
}

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

initializeArchiveLightbox();
initializeLanguage();
initializeHeaderState();
initializeScrollMeter();
initializePointerAura();
initializeRevealSequence();
if (!initializeGsapMotion()) {
  initializeReveal();
}
initializeTilt();
initializeMediaParallax();
initializeMediaIntegrity();
