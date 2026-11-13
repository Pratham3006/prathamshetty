/* ==========================================================
   Pratham Shetty — Portfolio
   Parallax, cursor, hover preview, reveals, form
   ========================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  root.classList.add("js");
  if (finePointer && !reduce) root.classList.add("has-cursor");

  /* ---------- footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- split headline into words for the reveal ---------- */
  $$("[data-words]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const wrap = document.createElement("span");
      wrap.className = "wm";
      wrap.style.setProperty("--w", i);
      const inner = document.createElement("span");
      inner.textContent = w;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealTargets = $$(".reveal, [data-words]");
  revealTargets.forEach((el, i) => {
    // light stagger for siblings revealed together
    if (el.classList.contains("reveal")) el.style.setProperty("--d", (i % 4) * 80);
  });

  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in"));
  }

  /* ---------- hero load-in + counters ---------- */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.body.classList.add("loaded");
      // hero content reveals on load, not on scroll
      $$(".hero .reveal").forEach((el, i) => {
        el.style.setProperty("--d", 500 + i * 120);
        el.classList.add("in");
      });
    })
  );

  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const pad = Number(el.dataset.pad || 0);
    const fmt = (n) => String(n).padStart(pad, "0");
    if (reduce) {
      el.textContent = fmt(target);
      return;
    }
    el.textContent = fmt(0);
    const start = performance.now() + 700;
    const dur = 1100;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- marquee: clone for a seamless loop ---------- */
  const marquees = $$("[data-marquee]");
  marquees.forEach((m) => {
    const track = $(".marquee-track", m);
    const clone = track.firstElementChild.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    // the duplicate is only there for the seamless loop, keep it out of the tab order
    $$("a", clone).forEach((a) => a.setAttribute("tabindex", "-1"));
    track.appendChild(clone);
  });

  /* ---------- logo fallback: show a wordmark if a logo file is missing ---------- */
  const logoFallback = (img) => {
    const inJourney = img.closest(".stop-logo");
    if (!inJourney && !img.closest(".logo-row")) return;
    const el = document.createElement("span");
    if (inJourney) {
      // journey cards fall back to a lime monogram
      el.className = "mono";
      el.textContent = img.dataset.initials || img.alt.slice(0, 2).toUpperCase();
    } else {
      el.className = "wordmark";
      el.textContent = img.alt;
    }
    img.replaceWith(el);
  };
  // error events don't bubble, so listen in the capture phase (also covers the cloned loop copy)
  document.addEventListener(
    "error",
    (e) => {
      if (e.target instanceof HTMLImageElement) logoFallback(e.target);
    },
    true
  );
  // catch anything that already failed before this script ran
  $$(".logo-row img, .stop-logo img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) logoFallback(img);
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const mobileNav = $("#mobileNav");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileNav.setAttribute("aria-hidden", String(!open));
    menuBtn.firstElementChild.textContent = open ? "Close" : "Menu";
  };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", mobileNav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------- active nav link ---------- */
  const navLinks = $$(".nav a[href^='#']");
  if ("IntersectionObserver" in window) {
    const sections = ["index", "notes", "toolkit", "journey", "why", "words", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navIO.observe(s));
  }

  /* ---------- testimonials controls ---------- */
  const wordsTrack = $(".words-track");
  // page scroll slides this track sideways (see the main loop); this pauses that while the visitor steers it
  let wordsLockUntil = 0;
  const lockWords = (ms) => {
    wordsLockUntil = performance.now() + ms;
  };
  $$(".ctrl").forEach((btn) =>
    btn.addEventListener("click", () => {
      lockWords(1100);
      const card = $(".word", wordsTrack);
      const step = card ? card.getBoundingClientRect().width + 20 : 400;
      wordsTrack.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: reduce ? "auto" : "smooth" });
    })
  );

  /* ---------- cursor + hover preview ---------- */
  const dot = $(".cur-dot");
  const ring = $(".cur-ring");
  const peek = $(".peek");
  const peekImg = $("img", peek);
  const peekEnabled = () => finePointer && !reduce && innerWidth > 900;

  let mouseX = innerWidth / 2;
  let mouseY = innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let peekX = mouseX;
  let peekY = mouseY;
  let nx = 0; // normalized mouse -0.5..0.5 for parallax
  let ny = 0;

  addEventListener(
    "pointermove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      nx = e.clientX / innerWidth - 0.5;
      ny = e.clientY / innerHeight - 0.5;
    },
    { passive: true }
  );

  if (finePointer && !reduce) {
    document.addEventListener("mouseover", (e) => {
      const row = e.target.closest("[data-img]");
      const link = e.target.closest("a, button, [data-hover]");
      ring.classList.toggle("is-view", Boolean(row) && peekEnabled());
      ring.classList.toggle("is-link", Boolean(link) && !row);
      if (row && peekEnabled()) {
        const src = row.dataset.img;
        if (peekImg.getAttribute("src") !== src) peekImg.src = src;
        peek.classList.add("on");
      } else {
        peek.classList.remove("on");
      }
    });
    document.addEventListener("mouseleave", () => {
      peek.classList.remove("on");
      ring.classList.remove("is-view", "is-link");
    });
  }

  /* ---------- toolkit: filter, tilt + spotlight, entrance ---------- */
  const toolGrid = $(".tools");
  const tools = $$(".tool");
  const chips = $$(".chip");
  const kitCount = $(".kit-count");

  tools.forEach((t, i) => t.style.setProperty("--i", i));

  // entrance: stagger tiles in once the grid scrolls into view
  if ("IntersectionObserver" in window && !reduce) {
    const gridIO = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          toolGrid.classList.add("in");
          gridIO.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    gridIO.observe(toolGrid);
  } else {
    toolGrid.classList.add("in");
  }

  // filter by discipline
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      let shown = 0;
      tools.forEach((t) => {
        const match = f === "all" || t.dataset.cat === f;
        t.classList.toggle("is-dim", !match);
        if (match) shown++;
      });
      kitCount.innerHTML = `<b>${shown}</b> / ${tools.length} specimens shown`;
    })
  );

  // cursor spotlight + 3D tilt
  if (finePointer && !reduce) {
    tools.forEach((t) => {
      t.addEventListener("pointermove", (e) => {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        t.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        t.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        t.style.setProperty("--ry", `${((px - 0.5) * 14).toFixed(2)}deg`);
        t.style.setProperty("--rx", `${((0.5 - py) * 14).toFixed(2)}deg`);
      });
      t.addEventListener("pointerleave", () => {
        t.style.setProperty("--rx", "0deg");
        t.style.setProperty("--ry", "0deg");
      });
    });
  }

  // staggered columns: neighbouring columns drift at different speeds on scroll
  const COL_SPEEDS = [0.07, -0.05, 0.02];
  let toolCols = [];
  const measureCols = () => {
    if (!tools.length) return;
    const first = tools[0];
    const step = first.offsetWidth + parseFloat(getComputedStyle(toolGrid).columnGap || 12);
    toolCols = tools.map((t) => Math.max(0, Math.round((t.offsetLeft - first.offsetLeft) / step)));
  };
  measureCols();
  addEventListener("resize", measureCols);
  addEventListener("load", measureCols);

  const strips = $$("[data-hscroll]");

  /* ---------- testimonials: page scroll slides the track sideways ---------- */
  const wordsSection = $("#words");
  const wordCards = $$(".word", wordsTrack);
  const WORD_SPEEDS = [0.1, -0.07, 0.12, -0.06, 0.09, -0.1]; // each card drifts at its own pace (up / down)
  let wordsHeld = false; // finger or mouse is on the track
  let wordsOffset = 0; // how far the visitor has nudged the track away from the scroll-driven position
  let wordsLast = 0; // scrollLeft we last set ourselves
  let wordsP = 0; // smoothed progress through the section

  // any scroll we didn't cause is the visitor steering: remember it as an offset so there's no snap-back
  wordsTrack.addEventListener(
    "scroll",
    () => {
      const delta = wordsTrack.scrollLeft - wordsLast;
      if (Math.abs(delta) > 1.5) {
        wordsOffset += delta;
        wordsLast = wordsTrack.scrollLeft;
      }
    },
    { passive: true }
  );
  ["pointerdown", "touchstart"].forEach((t) =>
    wordsTrack.addEventListener(t, () => (wordsHeld = true), { passive: true })
  );
  ["pointerup", "pointercancel", "touchend", "touchcancel"].forEach((t) =>
    addEventListener(
      t,
      () => {
        if (wordsHeld) {
          wordsHeld = false;
          lockWords(900); // let swipe momentum finish before the page takes over again
        }
      },
      { passive: true }
    )
  );
  wordsTrack.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) lockWords(800);
    },
    { passive: true }
  );
  wordsTrack.addEventListener("keydown", () => lockWords(1000));

  /* ---------- journey: scroll-driven roadmap ---------- */
  const journey = $("#journey");
  const canvas = $(".road-canvas", journey);
  const roadSvg = $(".road-svg", canvas);
  const roadPaths = $$(".road-svg path", canvas);
  const roadLit = $(".road-lit", canvas);
  const car = $(".car", canvas);
  const rstops = $$(".rstop", canvas);
  const pill = $(".road-pill", journey);
  const rpStep = $(".rp-step b", pill);
  const rpDate = $(".rp-date", pill);
  const rpPlace = $(".rp-place", pill);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = (v) => {
    if (v === "now") {
      const d = new Date();
      return d.getFullYear() * 12 + d.getMonth();
    }
    const [y, m] = v.split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const stopMonths = rstops.map((s) => monthIndex(s.dataset.date));
  const fmtMonth = (n) => {
    const r = Math.round(n);
    const y = Math.floor(r / 12);
    return `${MONTHS[r - y * 12]} ${y}`;
  };

  // geometry of the road, rebuilt on resize
  const road = { H: 0, L: 0, stopY: [], len: [], x: [], y: [] };
  let carY = 0;
  let carReady = false;
  let roadCur = -1;
  let roadDateText = "";

  const layoutRoad = () => {
    const vh = innerHeight;
    // decide from the viewport, not the canvas: the phone layout changes the canvas width (full-bleed),
    // so measuring first would give the wrong size and could flip-flop around the breakpoint
    const mobile = innerWidth < 760;
    const N = rstops.length;
    canvas.classList.toggle("is-mobile", mobile);
    const W = canvas.clientWidth;
    if (!W) return;
    // where cards start on phones (shared with the CSS so the road can never run under a card)
    const cardLeft = parseFloat(getComputedStyle(canvas).getPropertyValue("--card-left")) || 70;

    // spacing is driven by the tallest card so nothing ever overlaps
    const cards = rstops.map((s) => $(".rcard", s));
    const tallest = Math.max(...cards.map((c) => c.offsetHeight));
    const spacing = Math.max(tallest + (mobile ? 130 : 170), vh * 0.8);
    const y0 = Math.max(vh * 0.42, 280);
    const stopY = rstops.map((_, i) => y0 + i * spacing);
    const H = stopY[N - 1] + Math.max(vh * 0.6, 380);

    // desktop: road swings 70% <-> 30% and cards sit on the opposite side; mobile: hugs the left edge
    // phones use fixed pixel positions (a gentle 10px sway) so the road stays clear of the cards
    const xs = rstops.map((_, i) => (mobile ? 25 + (i % 2) * 10 : W * (i % 2 ? 0.3 : 0.7)));

    canvas.style.height = `${H}px`;
    canvas.style.setProperty("--x0", `${xs[0]}px`);
    roadSvg.setAttribute("width", W);
    roadSvg.setAttribute("height", H);
    roadSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // smooth S-curves between stops (vertical tangents at every stop)
    const pts = [{ x: xs[0], y: 0 }, ...xs.map((x, i) => ({ x, y: stopY[i] })), { x: xs[N - 1], y: H }];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      const m = (a.y + b.y) / 2;
      d += ` C ${a.x} ${m}, ${b.x} ${m}, ${b.x} ${b.y}`;
    }
    roadPaths.forEach((p) => p.setAttribute("d", d));

    // sample the path so the car can look up its position by scroll depth (y is monotonic along the path)
    const L = roadLit.getTotalLength();
    const n = Math.max(80, Math.ceil(L / 5));
    road.len = [];
    road.x = [];
    road.y = [];
    for (let i = 0; i <= n; i++) {
      const len = (L * i) / n;
      const p = roadLit.getPointAtLength(len);
      road.len.push(len);
      road.x.push(p.x);
      road.y.push(p.y);
    }
    road.H = H;
    road.L = L;
    road.stopY = stopY;
    roadLit.style.strokeDasharray = `${L}`;
    roadLit.style.strokeDashoffset = `${L}`;

    // place each destination, its pin and the dashed connector to its card
    rstops.forEach((s, i) => {
      s.style.setProperty("--y", `${stopY[i]}px`);
      s.style.setProperty("--x", `${xs[i]}px`);
      const conn = $(".conn", s);
      const card = cards[i];
      if (mobile) {
        // short dashed link from the pin to the card
        const start = xs[i] + 16;
        conn.style.left = `${start}px`;
        conn.style.width = `${Math.max(0, cardLeft - 4 - start)}px`;
        return;
      }
      if (s.dataset.side === "left") {
        const edge = card.offsetWidth + 4;
        conn.style.left = `${edge}px`;
        conn.style.width = `${Math.max(0, xs[i] - 21 - edge)}px`;
      } else {
        const edge = W - card.offsetWidth - 4;
        conn.style.left = `${xs[i] + 21}px`;
        conn.style.width = `${Math.max(0, edge - (xs[i] + 21))}px`;
      }
    });

    carReady = false; // snap to the current scroll position on the next frame
    if (reduce) rstops.forEach((s) => s.classList.add("is-in", "is-visited"));
  };

  let layoutQueued = false;
  const queueLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => {
      layoutQueued = false;
      layoutRoad();
    });
  };
  layoutRoad();
  addEventListener("resize", queueLayout);
  addEventListener("load", queueLayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueLayout);

  const updateRoad = (vh) => {
    const r = canvas.getBoundingClientRect();
    pill.classList.toggle("on", r.top < vh * 0.55 && r.bottom > vh * 0.45);
    if (r.bottom < -vh * 0.5 || r.top > vh * 1.5 || !road.y.length) return;

    // the car sits at the vertical centre of the screen; scrolling moves it down the road
    const target = clamp(vh * 0.5 - r.top, 0, road.H);
    if (!carReady) {
      carY = target;
      carReady = true;
    } else {
      carY += (target - carY) * 0.16;
      if (Math.abs(target - carY) < 0.2) carY = target;
    }

    // find the path sample at this depth (binary search on y)
    let lo = 0;
    let hi = road.y.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (road.y[mid] < carY) lo = mid + 1;
      else hi = mid;
    }
    const i0 = Math.max(0, lo - 1);
    const i1 = Math.min(road.y.length - 1, lo + 1);
    const angle = (Math.atan2(road.y[i1] - road.y[i0], road.x[i1] - road.x[i0]) * 180) / Math.PI - 90;
    car.setAttribute("transform", `translate(${road.x[lo].toFixed(1)} ${road.y[lo].toFixed(1)}) rotate(${angle.toFixed(1)})`);
    roadLit.style.strokeDashoffset = (road.L - road.len[lo]).toFixed(1);

    // destinations: reveal as the car approaches, light up once passed, highlight the nearest
    let cur = 0;
    let best = Infinity;
    rstops.forEach((s, i) => {
      const dy = road.stopY[i] - carY;
      if (Math.abs(dy) < best) {
        best = Math.abs(dy);
        cur = i;
      }
      s.classList.toggle("is-visited", carY >= road.stopY[i] - 6);
      if (dy < vh * 0.42) s.classList.add("is-in");
    });
    if (cur !== roadCur) {
      roadCur = cur;
      rstops.forEach((s, i) => s.classList.toggle("is-current", i === cur));
      rpStep.textContent = String(cur + 1).padStart(2, "0");
      rpPlace.textContent = rstops[cur].dataset.label;
    }

    // the pill's date ticks forward as the car travels between stops
    const ys = road.stopY;
    const last = ys.length - 1;
    let m = stopMonths[0];
    if (carY >= ys[last]) {
      m = stopMonths[last];
    } else if (carY > ys[0]) {
      let k = 0;
      while (k < last - 1 && carY >= ys[k + 1]) k++;
      const f = (carY - ys[k]) / (ys[k + 1] - ys[k]);
      m = stopMonths[k] + (stopMonths[k + 1] - stopMonths[k]) * f;
    }
    const text = fmtMonth(m);
    if (text !== roadDateText) {
      roadDateText = text;
      rpDate.textContent = text;
    }
  };

  /* ---------- main animation loop ---------- */
  const header = $("#siteHeader");
  const progress = $(".progress");
  const hero = $(".hero");
  const heroLayers = $$(".hero-bg [data-depth]");
  const speedEls = $$("[data-speed]");
  const parallaxImgs = $$("[data-img-parallax]");

  let smoothY = scrollY;
  let lastY = scrollY;
  let hx = 0; // smoothed mouse for hero layers
  let hy = 0;
  let skew = 0;
  let lastDir = 0;

  const onScrollState = () => {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 24);
    const dir = y > lastY ? 1 : y < lastY ? -1 : lastDir;
    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("hide", dir === 1 && y > 500);
    }
    lastDir = dir;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
  };

  const frame = () => {
    const y = scrollY;
    const vh = innerHeight;

    onScrollState();

    if (!reduce) {
      smoothY += (y - smoothY) * 0.1;
      hx += (nx - hx) * 0.06;
      hy += (ny - hy) * 0.06;

      /* hero layers: scroll depth + mouse depth */
      if (smoothY < vh * 1.4) {
        heroLayers.forEach((el) => {
          const depth = parseFloat(el.dataset.depth) || 0;
          const m = parseFloat(el.dataset.mouse) || 0;
          el.style.setProperty("--tx", `${(hx * m).toFixed(2)}px`);
          el.style.setProperty("--ty", `${(-smoothY * depth + hy * m).toFixed(2)}px`);
        });
      }

      /* generic vertical drift */
      speedEls.forEach((el) => {
        const host = el.parentElement.getBoundingClientRect();
        if (host.bottom < -200 || host.top > vh + 200) return;
        const offset = host.top + host.height / 2 - vh / 2;
        el.style.setProperty("--sy", `${(offset * parseFloat(el.dataset.speed)).toFixed(1)}px`);
      });

      /* images that drift inside their frames */
      parallaxImgs.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const p = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
        img.style.setProperty("--py", `${(p * -r.height * 0.07).toFixed(1)}px`);
      });

      /* journey timeline */
      updateRoad(vh);

      /* testimonials: slide sideways with page scroll, staggered depth, centre card comes forward */
      const wr = wordsSection.getBoundingClientRect();
      if (wr.bottom > -vh * 0.3 && wr.top < vh * 1.3) {
        const max = Math.max(0, wordsTrack.scrollWidth - wordsTrack.clientWidth);
        const p = clamp((vh * 0.95 - wr.top) / (wr.height + vh * 0.6), 0, 1);
        wordsP += (p - wordsP) * 0.12;
        if (!wordsHeld && performance.now() > wordsLockUntil && max > 0) {
          const target = clamp(wordsP * max + wordsOffset, 0, max);
          if (Math.abs(target - wordsTrack.scrollLeft) > 0.6) {
            wordsTrack.scrollLeft = target;
            wordsLast = wordsTrack.scrollLeft;
          }
        }
        const goff = wr.top + wr.height / 2 - vh / 2;
        const vw = innerWidth;
        wordCards.forEach((c, i) => {
          const cr = c.getBoundingClientRect();
          const d = clamp(Math.abs(cr.left + cr.width / 2 - vw / 2) / (vw * 0.65), 0, 1);
          const shift = clamp(goff * WORD_SPEEDS[i % WORD_SPEEDS.length], -46, 46);
          c.style.setProperty("--sy", `${shift.toFixed(1)}px`);
          c.style.setProperty("--sc", (1 - d * 0.07).toFixed(3));
          c.style.setProperty("--op", (1 - d * 0.5).toFixed(3));
        });
      }

      /* toolkit: scroll-driven type strips */
      strips.forEach((p) => {
        const host = p.parentElement.getBoundingClientRect();
        if (host.bottom < -200 || host.top > vh + 200) return;
        const offset = host.top + host.height / 2 - vh / 2;
        p.style.setProperty("--hx", `${(-500 + offset * 0.5 * Number(p.dataset.hscroll)).toFixed(1)}px`);
      });

      /* toolkit: staggered column drift */
      const gr = toolGrid.getBoundingClientRect();
      if (gr.bottom > -200 && gr.top < vh + 200) {
        const goff = gr.top + gr.height / 2 - vh / 2;
        tools.forEach((t, i) => {
          const shift = clamp(goff * COL_SPEEDS[toolCols[i] % COL_SPEEDS.length], -40, 40);
          t.style.setProperty("--sy", `${shift.toFixed(1)}px`);
        });
      }

      /* marquee skews with scroll velocity */
      const vel = y - lastY;
      skew += (clamp(vel * -0.12, -7, 7) - skew) * 0.12;
      marquees.forEach((m) => m.style.setProperty("--skew", `${skew.toFixed(2)}deg`));
    }

    lastY = y;

    /* cursor */
    if (finePointer && !reduce) {
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;

      if (peekEnabled()) {
        const w = peek.offsetWidth || 340;
        const h = peek.offsetHeight || 255;
        let tx = mouseX + 36;
        if (tx + w > innerWidth - 16) tx = mouseX - w - 36;
        const ty = clamp(mouseY - h / 2, 80, vh - h - 16);
        peekX += (tx - peekX) * 0.14;
        peekY += (ty - peekY) * 0.14;
        peek.style.transform = `translate3d(${peekX.toFixed(1)}px, ${peekY.toFixed(1)}px, 0) rotate(${clamp(
          (tx - peekX) * 0.05,
          -6,
          6
        ).toFixed(2)}deg)`;
      }
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- contact form: posts to the portfolio backend ---------- */
  const CONTACT_ENDPOINT = "https://portfolio-backend-ruddy-iota.vercel.app/send";
  const form = $(".form");
  const status = $(".form-status", form);
  let statusTimer;

  // type: "success" | "error" | "" (neutral, e.g. "Sending…")
  const showStatus = (message, type = "") => {
    clearTimeout(statusTimer);
    status.classList.toggle("ok", type === "success");
    status.classList.toggle("err", type === "error");
    status.textContent = message;
    if (type) {
      statusTimer = setTimeout(() => {
        status.textContent = "";
        status.classList.remove("ok", "err");
      }, 7000);
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fd = new FormData(form);

    // honeypot: real visitors never see this field, bots fill it. Pretend it worked and send nothing.
    if (fd.get("bot-field")) {
      form.reset();
      showStatus("Message sent successfully! I'll get back to you soon.", "success");
      return;
    }

    const data = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    };

    const btn = $("button[type='submit']", form);
    const originalLabel = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Sending…";
    showStatus("Sending your message…");

    // don't let a stalled request leave the button disabled forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      // the server answers { success: boolean, message?: string }; tolerate a non-JSON error page
      let result = null;
      try {
        result = await res.json();
      } catch (parseErr) {
        result = null;
      }

      if (result && result.success) {
        form.reset();
        showStatus("Message sent successfully! I'll get back to you soon.", "success");
      } else {
        showStatus((result && result.message) || "Failed to send message. Please try again.", "error");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      showStatus(
        err.name === "AbortError"
          ? "That took too long. Please try again."
          : "Network error. Please check your connection and try again.",
        "error"
      );
    } finally {
      clearTimeout(timeout);
      btn.disabled = false;
      btn.innerHTML = originalLabel;
    }
  });
})();
