/* ELMORA — "Maison" design direction: behaviour.
   Every product, price and photograph is already in the HTML; nothing here is
   needed for a page to be readable. */

const INDEX = JSON.parse(document.getElementById("elmora-index").textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lock = on => { document.body.style.overflow = on ? "hidden" : ""; };

/* ── header: clear over the picture, solid once you scroll ──────────────── */
const head = $("top");
const solid = () => head.classList.toggle("solid", window.scrollY > 40);
window.addEventListener("scroll", solid, { passive: true });
solid();

/* ── menu: a small panel over the page, which stays where it is ───────── */
const menu = $("menu"), menubtn = $("menubtn"), scrim = $("scrim");
function setMenu(open) {
  menu.hidden = !open;
  scrim.hidden = !open;
  document.documentElement.classList.toggle("menuopen", open);
  menubtn.setAttribute("aria-expanded", String(open));
}
menubtn.addEventListener("click", () => setMenu(menu.hidden));
scrim.addEventListener("click", () => setMenu(false));

/* ── home: the opening pictures change on their own ─────────────────────── */
const hero = $("hero");
if (hero) {
  const slides = [...hero.querySelectorAll(".slide")];
  const dots = [...hero.querySelectorAll(".dot")];
  const cap = $("cap");
  let now = 0, timer = null;
  const load = n => {
    const img = slides[n] && slides[n].querySelector("img[data-src]");
    if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
  };
  function go(n) {
    n = (n + slides.length) % slides.length;
    load(n); load((n + 1) % slides.length);
    slides[now].classList.remove("on");
    slides[n].classList.add("on");
    dots.forEach((d, i) => { d.classList.toggle("on", i === n); d.classList.toggle("done", i < n); });
    cap.href = slides[n].dataset.href;
    cap.querySelector("span").textContent = slides[n].dataset.cap;
    now = n;
    clearTimeout(timer);
    if (!calm) timer = setTimeout(() => go(now + 1), 7000);
  }
  dots.forEach(d => d.addEventListener("click", () => go(+d.dataset.go)));
  // the second picture is fetched only after the first has been seen
  window.addEventListener("load", () => load(1));
  if (!calm) timer = setTimeout(() => go(1), 7000);
  let sx = null;
  hero.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) go(now + (dx < 0 ? 1 : -1));
  }, { passive: true });
}

/* ── rows that swipe sideways: arrows for a mouse ───────────────────────── */
function railState(rail) {
  const max = rail.scrollWidth - rail.clientWidth - 2;
  document.querySelectorAll(`[data-rail="${rail.id}"]`).forEach(b => {
    b.disabled = b.dataset.d < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max;
  });
}
document.querySelectorAll(".rail").forEach(rail => {
  rail.addEventListener("scroll", () => railState(rail), { passive: true });
  railState(rail);
});
document.querySelectorAll("[data-rail]").forEach(b => b.addEventListener("click", () => {
  const rail = $(b.dataset.rail);
  rail.scrollBy({ left: +b.dataset.d * rail.clientWidth * 0.8, behavior: "smooth" });
}));

/* ── listing: filter chips and "show more" ──────────────────────────────── */
const PAGE = 24;
function showFirst(grid, n) {
  const chip = document.querySelector(".chip.on");
  const want = chip ? chip.dataset.chip : "";
  let shown = 0, left = 0;
  grid.querySelectorAll(".card").forEach(c => {
    const match = !want || c.dataset.f.split("|").includes(want);
    const show = match && shown < n;
    c.hidden = !show;
    if (show) shown++; else if (match) left++;
  });
  const more = document.querySelector(`[data-more="${grid.id}"]`);
  if (more) {
    more.parentElement.hidden = !left;
    more.dataset.shown = shown;
  }
}
document.querySelectorAll("[data-more]").forEach(btn => btn.addEventListener("click", () => {
  showFirst($(btn.dataset.more), (+btn.dataset.shown || PAGE) + PAGE);
}));
document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === chip));
  const grid = document.querySelector(".grid");
  showFirst(grid, PAGE);
  const chips = document.querySelector(".chips");
  if (chips.getBoundingClientRect().top < 80)
    window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 150, behavior: "smooth" });
}));

/* ── the photograph, full screen ────────────────────────────────────────── */
const viewer = $("viewer");
let shots = [], shotNo = 0, shotTitle = "";
function paint() {
  const img = $("vimg");
  delete img.dataset.retry;
  img.style.visibility = "";
  img.src = shots[shotNo];
  img.alt = shotTitle;
  $("vtitle").textContent = shotTitle;
  $("vcount").textContent = shots.length > 1 ? (shotNo + 1) + " / " + shots.length : "";
  viewer.classList.toggle("single", shots.length < 2);
}
function openViewer(list, n, title) {
  if (!list.length) return;
  shots = list; shotNo = n; shotTitle = title;
  paint(); viewer.hidden = false; lock(true); $("vclose").focus();
}
function closeViewer() { viewer.hidden = true; lock(false); }
function step(d) { shotNo = (shotNo + d + shots.length) % shots.length; paint(); }
$("vclose").addEventListener("click", closeViewer);
$("vprev").addEventListener("click", () => step(-1));
$("vnext").addEventListener("click", () => step(1));
viewer.addEventListener("click", e => {
  if (!e.target.closest(".vbtn") && !e.target.closest("#vimg")) closeViewer();
});
{
  let sx = null, sy = null;
  viewer.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  viewer.addEventListener("touchend", e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ── product page: the gallery swipes; a tap opens it full screen ───────── */
const gal = $("gallery");
if (gal && gal.dataset.large) {
  const large = JSON.parse(gal.dataset.large);
  const track = $("gtrack");
  const slides = [...track.children];
  const current = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };
  const update = () => {
    const n = current();
    if ($("gnow")) $("gnow").textContent = n + 1;
    const prev = gal.querySelector(".garrow.prev"), next = gal.querySelector(".garrow.next");
    if (prev) prev.disabled = n === 0;
    if (next) next.disabled = n === slides.length - 1;
  };
  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  update();
  const goto = n => {
    const s = slides[Math.max(0, Math.min(slides.length - 1, n))];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2, behavior: "smooth" });
  };
  gal.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => goto(current() + +b.dataset.g)));
  track.addEventListener("click", e => {
    const s = e.target.closest(".gs");
    if (s) openViewer(large, +s.dataset.n, gal.dataset.title);
  });
  $("gzoom").addEventListener("click", () => openViewer(large, current(), gal.dataset.title));
}

/* ── search ─────────────────────────────────────────────────────────────── */
const search = $("search");
const openSearch = () => { setMenu(false); search.hidden = false; lock(true); $("q").focus(); };
const shutSearch = () => { search.hidden = true; lock(false); };
$("findbtn").addEventListener("click", openSearch);
$("sclose").addEventListener("click", shutSearch);
$("q").addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  const box = $("sresults");
  if (q.length < 2) { box.innerHTML = ""; return; }
  const hits = INDEX.p.filter(p =>
    (p.t + " " + (p.c || "") + " " + p.g + " " + p.k).toLowerCase().includes(q)).slice(0, 40);
  box.innerHTML = hits.length
    ? hits.map(p => `<a class="shit" href="${esc(INDEX.base)}${esc(p.u)}">
        <span class="sshot">${p.i ? `<img src="${esc(INDEX.pb)}${esc(p.i)}" alt="" loading="lazy">` : ""}</span>
        <span class="smeta"><span class="sc">${esc(p.c || p.g)}</span>
        <span class="st">${esc(p.t)}</span>
        <span class="sp">${p.r ? esc(p.r) : "Price on request"}</span></span></a>`).join("")
    : `<div class="snone">Nothing matches “${esc(q)}”.</div>`;
});

document.addEventListener("keydown", e => {
  if (!viewer.hidden) {
    if (e.key === "Escape") closeViewer();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    return;
  }
  if (e.key !== "Escape") return;
  if (!search.hidden) shutSearch();
  else if (!menu.hidden) setMenu(false);
});

/* ── things arrive as you reach them ────────────────────────────────────── */
if (!calm && "IntersectionObserver" in window) {
  const seen = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); seen.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".grid .card, .intro p, .ftext, .railhead, .irow, .bandin")
    .forEach(el => { el.classList.add("rise"); seen.observe(el); });
}
