/* ELMORA catalogue — the behaviour a static site still needs.
   Every product, every price and every photograph is already in the HTML when
   the page arrives; nothing here is required for the page to be readable. */

const INDEX = JSON.parse(document.getElementById("elmora-index").textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ── show more ─────────────────────────────────────────────────────────────
   A listing page ships every one of its products in the HTML and hides the
   ones past the first batch, so "Show more" costs nothing and a search engine
   still sees them all. */
document.querySelectorAll("[data-more]").forEach(btn => {
  btn.addEventListener("click", () => {
    const grid = document.getElementById(btn.dataset.more);
    if (!grid) return;
    grid.querySelectorAll(".card[hidden]").forEach((c, i) => { if (i < 24) c.hidden = false; });
    const left = grid.querySelectorAll(".card[hidden]").length;
    if (!left) btn.remove();
    else btn.querySelector(".n").textContent = left;
  });
});

/* ── the photograph, full screen ───────────────────────────────────────── */
const viewer = $("viewer");
let shots = [], shotNo = 0, shotTitle = "";

function paint() {
  const img = $("vimg");
  delete img.dataset.retry;
  img.src = shots[shotNo];
  img.alt = shotTitle;
  $("vtitle").textContent = shotTitle;
  $("vcount").textContent = shots.length > 1 ? (shotNo + 1) + " / " + shots.length : "";
  viewer.classList.toggle("single", shots.length < 2);
}
function openViewer(list, n, title) {
  if (!list.length) return;
  shots = list; shotNo = n; shotTitle = title;
  paint();
  viewer.hidden = false;
  document.body.style.overflow = "hidden";
  $("vclose").focus();
}
function closeViewer() { viewer.hidden = true; document.body.style.overflow = ""; }
function step(d) { shotNo = (shotNo + d + shots.length) % shots.length; paint(); }

if (viewer) {
  $("vclose").addEventListener("click", closeViewer);
  $("vprev").addEventListener("click", () => step(-1));
  $("vnext").addEventListener("click", () => step(1));
  viewer.addEventListener("click", e => {
    if (!e.target.closest(".vbtn") && !e.target.closest("#vimg")) closeViewer();
  });
  let sx = null, sy = null;
  viewer.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  viewer.addEventListener("touchend", e => {
    if (sx == null || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* the product page hands its photographs over */
const gal = document.getElementById("gallery");
if (gal) {
  const large = JSON.parse(gal.dataset.large || "[]");
  const title = gal.dataset.title || "";
  const lead = document.getElementById("lead");
  const setLead = n => {
    shotNo = n;
    const img = lead.querySelector("img");
    if (img) { delete img.dataset.retry; img.src = large[n]; }
    gal.querySelectorAll("[data-shot]").forEach(b =>
      b.setAttribute("aria-current", String(+b.dataset.shot === n)));
  };
  gal.addEventListener("click", e => {
    const t = e.target.closest("[data-shot]");
    if (t) { setLead(+t.dataset.shot); return; }
    if (e.target.closest("#lead")) openViewer(large, shotNo, title);
  });
}

/* ── search ────────────────────────────────────────────────────────────── */
const search = $("search");
if (search) {
  const open = () => {
    search.hidden = false;
    document.body.style.overflow = "hidden";
    $("q").focus();
  };
  const shut = () => { search.hidden = true; document.body.style.overflow = ""; };
  $("findbtn").addEventListener("click", open);
  $("sclose").addEventListener("click", shut);
  search.addEventListener("click", e => { if (e.target === search) shut(); });

  $("q").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    const box = $("sresults");
    if (q.length < 2) { box.innerHTML = ""; return; }
    const hits = INDEX.p.filter(p =>
      (p.t + " " + (p.c || "") + " " + p.g + " " + p.k + " " + (p.m || "")).toLowerCase().includes(q)).slice(0, 40);
    box.innerHTML = hits.length
      ? hits.map(p => `<a class="shit" href="${esc(INDEX.base)}${esc(p.u)}">
          <span class="sshot">${p.i ? `<img src="${esc(INDEX.base)}${esc(p.i)}" alt="" loading="lazy">` : ""}</span>
          <span class="smeta"><span class="sc">${esc(p.c || p.g)}</span>
          <span class="st">${esc(p.t)}</span>
          <span class="sp">${p.r ? esc(p.r) : "Price on request"}</span></span></a>`).join("")
      : `<div class="snone">Nothing matches “${esc(q)}”.</div>`;
  });
}

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (viewer && !viewer.hidden) { closeViewer(); return; }
  if (search && !search.hidden) { search.hidden = true; document.body.style.overflow = ""; }
});

/* ── cards arrive as you reach them ────────────────────────────────────── */
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const seen = new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); seen.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".card, .rtile, .ktile").forEach(c => { c.classList.add("rise"); seen.observe(c); });
}
