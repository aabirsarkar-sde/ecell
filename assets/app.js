/* SUBSTRATE — interaction: the index matrix, sector filters, search, and the deal button. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = { sector: null, query: "" };

const cardId = (code) => `e-${code.replace(".", "-")}`;

/* ── build the catalogue ─────────────────────────────── */
function buildCatalogue() {
  const html = SECTORS.map((s) => {
    const cards = s.ideas
      .map((idea, i) => {
        const code = `${s.code}.${String(i + 1).padStart(2, "0")}`;
        return `
      <article class="card" id="${cardId(code)}" style="--c:${s.ink}"
               data-sector="${s.id}" data-search="${searchBlob(idea, s)}">
        <div class="card__top">
          <span class="card__code">${code}</span>
        </div>
        <h3 class="card__name">${idea.name}</h3>
        <p class="card__what">${idea.what}</p>
        <p class="card__note"><b>Why India, why now</b>${idea.why}</p>
        <p class="card__note card__note--hard"><b>The hard part</b>${idea.hard}</p>
        <div class="card__spec">
          <span><i>Buyer</i>${idea.buyer}</span>
          <span><i>Capex</i>${idea.capex}</span>
          <span><i>Horizon</i>${idea.horizon}</span>
        </div>
      </article>`;
      })
      .join("");

    return `
    <section class="sector" id="s-${s.id}" data-sector="${s.id}" style="--c:${s.ink}">
      <div class="sector__head">
        <div>
          <span class="sector__num">Sector ${s.code}</span>
          <h2 class="sector__name">${s.name}</h2>
        </div>
        <p class="sector__thesis">${s.thesis}</p>
      </div>
      <div class="grid">${cards}</div>
    </section>`;
  }).join("");

  $("#catalogue").innerHTML = html;
}

function searchBlob(idea, s) {
  return [idea.name, idea.what, idea.why, idea.hard, idea.buyer, s.name, s.short]
    .join(" ")
    .toLowerCase()
    .replace(/"/g, "");
}

/* ── the 10 × 10 index ───────────────────────────────── */
function buildMatrix() {
  const frag = document.createDocumentFragment();

  SECTORS.forEach((s) => {
    const label = document.createElement("span");
    label.className = "m-label";
    label.dataset.sector = s.id;
    label.style.setProperty("--c", s.ink);
    label.textContent = s.code;
    label.setAttribute("aria-hidden", "true");
    frag.appendChild(label);

    IDEAS.filter((i) => i.sectorId === s.id).forEach((idea) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `cell cap-${idea.capex.toLowerCase()}`;
      b.style.setProperty("--c", idea.ink);
      b.dataset.code = idea.code;
      b.dataset.sector = idea.sectorId;
      b.setAttribute("aria-label", `${idea.code} — ${idea.name}, ${idea.sectorName}`);

      const show = () => paintReadout(idea);
      b.addEventListener("mouseenter", show);
      b.addEventListener("focus", show);
      b.addEventListener("click", () => jumpTo(idea.code));
      frag.appendChild(b);
    });
  });

  $("#matrix").appendChild(frag);
}

function paintReadout(idea) {
  $(".readout__code").textContent = idea.code;
  $(".readout__name").textContent = idea.name;
  $(".readout__sector").textContent = `${idea.sectorName} · ${idea.buyer}`;
  $(".readout__code").style.color = idea.ink;
}

function jumpTo(code) {
  const el = document.getElementById(cardId(code));
  if (!el) return;
  if (state.sector && String(state.sector) !== el.dataset.sector) setSector(null);
  if (state.query) {
    $("#search").value = "";
    state.query = "";
    applyFilters();
  }
  el.scrollIntoView({ behavior: prefersMotion() ? "smooth" : "auto", block: "center" });
  $$(".card.is-dealt").forEach((c) => c.classList.remove("is-dealt"));
  el.classList.add("is-dealt");
}

const prefersMotion = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── filters ─────────────────────────────────────────── */
function buildChips() {
  const wrap = $("#chips");
  const all = document.createElement("button");
  all.type = "button";
  all.className = "chip chip--all";
  all.textContent = "All 100";
  all.dataset.sector = "";
  wrap.appendChild(all);

  SECTORS.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.style.setProperty("--c", s.ink);
    b.textContent = s.short;
    b.dataset.sector = s.id;
    b.title = s.name;
    wrap.appendChild(b);
  });

  wrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const id = chip.dataset.sector ? Number(chip.dataset.sector) : null;
    setSector(state.sector === id ? null : id);
  });
}

function setSector(id) {
  state.sector = id;
  $$("#chips .chip").forEach((c) => {
    const cid = c.dataset.sector ? Number(c.dataset.sector) : null;
    c.setAttribute("aria-pressed", String(cid === id || (id === null && cid === null)));
  });
  $$(".cell").forEach((c) => {
    c.classList.toggle("is-dim", id !== null && Number(c.dataset.sector) !== id);
  });
  $$(".m-label").forEach((l) => l.classList.toggle("is-on", Number(l.dataset.sector) === id));
  applyFilters();
}

function applyFilters() {
  const q = state.query.trim().toLowerCase();
  let visible = 0;

  $$(".sector").forEach((sec) => {
    let shown = 0;
    $$(".card", sec).forEach((card) => {
      const okSector = state.sector === null || Number(card.dataset.sector) === state.sector;
      const okQuery = !q || card.dataset.search.includes(q);
      const ok = okSector && okQuery;
      card.hidden = !ok;
      if (ok) shown++;
    });
    sec.hidden = shown === 0;
    visible += shown;
  });

  $("#count").textContent = `${visible} / 100`;
  $("#empty").hidden = visible !== 0;

  const hits = new Set();
  if (q) IDEAS.forEach((i) => { if (searchBlob(i, { name: i.sectorName, short: i.sectorShort }).includes(q)) hits.add(i.code); });
  $$(".cell").forEach((c) => c.classList.toggle("is-hit", q ? hits.has(c.dataset.code) : false));
}

/* ── deal one ────────────────────────────────────────── */
function deal() {
  const pool = $$(".card:not([hidden])");
  const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  if (!pick) return;
  $$(".card.is-dealt").forEach((c) => c.classList.remove("is-dealt"));
  pick.classList.add("is-dealt");
  pick.scrollIntoView({ behavior: prefersMotion() ? "smooth" : "auto", block: "center" });
  const idea = IDEAS.find((i) => cardId(i.code) === pick.id);
  if (idea) paintReadout(idea);
}

/* ── boot ────────────────────────────────────────────── */
buildCatalogue();
buildMatrix();
buildChips();
setSector(null);

$("#search").addEventListener("input", (e) => {
  state.query = e.target.value;
  applyFilters();
});
$("#deal").addEventListener("click", deal);
$("#clear").addEventListener("click", () => {
  $("#search").value = "";
  state.query = "";
  setSector(null);
});
