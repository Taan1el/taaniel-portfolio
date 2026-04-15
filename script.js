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
let fiizyArchiveRenderToken = 0;
let activeLang = defaultLang;

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
  renderFiizyArchive(lang);
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

function initializeHeaderState() {
  const syncHeader = () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

function initializePointerAura() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

function formatArchiveIndex(index) {
  return String(index).padStart(2, "0");
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

function createArchiveCard(src, index, lang) {
  const labelRoot = getLocalized("pages.work.archiveImageLabel", lang);
  const label = `${labelRoot} ${formatArchiveIndex(index)}`;
  const article = document.createElement("article");
  const button = document.createElement("button");
  const image = document.createElement("img");
  const copy = document.createElement("div");
  const title = document.createElement("p");
  const slot = document.createElement("p");

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
  slot.className = "archive-card-index";
  slot.textContent = formatArchiveIndex(index);

  copy.append(title, slot);
  button.append(image, copy);
  article.append(button);

  button.addEventListener("click", () => openArchiveLightbox(src, label));

  return article;
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
    fiizyArchiveGrid.append(createArchiveCard(item.src, item.index, lang));
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

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

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
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initializeTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const motionTargets = document.querySelectorAll(
    ".hero-focus-image, .hero-primary-image, .hero-mini-image, .project-image, .case-hero-image, .case-layout-image, .photo-card img"
  );

  if (!motionTargets.length) {
    return;
  }

  let ticking = false;

  const updateMotion = () => {
    const viewportCenter = window.innerHeight / 2;

    motionTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }

      const elementCenter = rect.top + rect.height / 2;
      const distance = (elementCenter - viewportCenter) / viewportCenter;
      const shift = Math.max(-14, Math.min(14, distance * -10));

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
initializePointerAura();
initializeRevealSequence();
initializeReveal();
initializeTilt();
initializeMediaParallax();
