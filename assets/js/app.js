/* СилаВолія — спільна логіка сторінок. Дані — window.SAGA з data.js (генерує tools/build.py). */
(function () {
  "use strict";
  const D = window.SAGA;
  const C = D.canon;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const byId = (list, id) => list.find((x) => x.id === id);
  const story = (id) => byId(D.stories, id);
  const readable = (s) => s.pages.length > 0;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("sv:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("sv:" + k, JSON.stringify(v)); } catch (e) { /* без пам'яті */ } },
  };
  const HERO_STYLE = {
    fin: { c: "var(--fin)", cs: "var(--fin-soft)", icon: "🐉", sym: "❤️", chip: "fin" },
    crash: { c: "var(--crash)", cs: "var(--crash-soft)", icon: "🐶", sym: "☀️", chip: "crash" },
    luna: { c: "var(--luna)", cs: "var(--luna-soft)", icon: "🐩", sym: "🌙", chip: "luna" },
  };
  const seriesName = (id) => (byId(D.series, id) || {}).name || id;
  const storyLink = (id) => {
    const s = story(id);
    if (!s) return "";
    return readable(s) ? `<a class="chip" href="read.html?id=${s.id}">${esc(s.title)}</a>` : `<span class="chip">${esc(s.title)} · скоро</span>`;
  };

  /* картки артефактів: готові ілюстровані картки з assets/img/artifacts (назва й опис — в alt) */
  const artImg = (a, cls = "") => a.img ? `<img class="art-img${cls ? " " + cls : ""}" src="${a.img}-s.jpg" srcset="${a.img}-s.jpg 320w, ${a.img}.jpg 640w" sizes="(max-width: 560px) 88vw, 300px" alt="${esc(a.name)}: ${esc(a.desc)}" loading="lazy" width="320" height="388">` : "";
  function artCard(a, extra = "") {
    return a.img
      ? `<div class="card art-card">${artImg(a)}${extra ? `<div class="body">${extra}</div>` : ""}</div>`
      : `<div class="card art-card no-img"><div class="body"><div class="tc-ico">✨</div><h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p>${extra}</div></div>`;
  }

  /* «до / після»: перетворення персонажа (assets/img/villains/<id>-before|-after) */
  function transform(v) {
    if (!v.img) return "";
    const im = (k, alt) => `<img class="ba-${k}" src="${v.img}-${k}-s.jpg" srcset="${v.img}-${k}-s.jpg 320w, ${v.img}-${k}.jpg 640w" sizes="(max-width: 560px) 90vw, 340px" alt="${alt}"${k === "before" ? ' loading="lazy"' : ""} width="320" height="310">`;
    return `<div class="ba" style="--p:0%">
      ${im("before", `${esc(v.name)} до перетворення: ${esc(v.essence)}`)}
      ${im("after", v.became || v.fate ? `${esc(v.name)} після перетворення: ${esc(v.became || v.fate)}` : "")}
      <span class="ba-line" aria-hidden="true"></span>
      <span class="ba-tag t-before" aria-hidden="true">До</span><span class="ba-tag t-after" aria-hidden="true">Після</span>
      <input class="ba-range" type="range" min="0" max="100" value="0" aria-label="${esc(v.name)}: порівняти до і після перетворення">
    </div>`;
  }
  /* повзунок і кнопка «Зрозуміти» для всіх карток .ba на сторінці */
  function bindTransforms(root) {
    root.addEventListener("input", (e) => {
      if (!e.target.classList.contains("ba-range")) return;
      const ba = e.target.closest(".ba");
      ba.classList.add("dragging"); ba.style.setProperty("--p", e.target.value + "%");
      ba.classList.toggle("shown", +e.target.value > 50);
    });
    root.addEventListener("change", (e) => { if (e.target.classList.contains("ba-range")) e.target.closest(".ba").classList.remove("dragging"); });
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".ba-btn");
      if (!b) return;
      const ba = b.closest(".card").querySelector(".ba"), r = ba.querySelector(".ba-range");
      const on = +r.value < 50;
      ba.classList.remove("dragging");
      r.value = on ? 100 : 0; ba.style.setProperty("--p", r.value + "%");
      ba.classList.toggle("glow", on);
      ba.classList.toggle("shown", on);
      b.textContent = on ? "↺ Як було спочатку" : "✨ Зрозуміти";
      b.setAttribute("aria-pressed", String(on));
    });
  }

  /* друзі СилаВолії: поза ⇄ реакція (assets/img/friends/<id>-pose|-react) */
  function friendPic(c) {
    if (!c.img) return "";
    const im = (k, alt) => `<img class="fr-${k}" src="${c.img}-${k}-s.jpg" srcset="${c.img}-${k}-s.jpg 240w, ${c.img}-${k}.jpg 480w" sizes="(max-width: 560px) 90vw, 260px" alt="${alt}"${k === "pose" ? ' loading="lazy"' : ""} width="240" height="240">`;
    return `<button class="fr-pic" type="button" aria-pressed="false" aria-label="${esc(c.name)}: показати реакцію">
      ${im("pose", esc(c.name))}${im("react", `${esc(c.name)} радіє`)}<span class="fr-hint" aria-hidden="true">✨</span></button>`;
  }
  function bindFriends(root) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".fr-pic");
      if (b) b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    });
  }

  /* ---------- шапка і підвал ---------- */
  const NAV = [["index.html", "Головна"], ["world.html", "Світ"], ["heroes.html", "Герої"], ["library.html", "Пригоди"], ["school.html", "Школа"], ["treasures.html", "Скарби"]];
  if (D.shop) NAV.push(["shop.html", "Крамниця"]);
  /* нижнє меню на телефоні: 5 головних розділів */
  const TABS = [["index.html", "🏠", "Головна"], ["world.html", "🗺️", "Світ"], ["heroes.html", "🐉", "Герої"], ["library.html", "📚", "Пригоди"], ["school.html", "🏰", "Школа"]];
  function chrome(page) {
    let here = location.pathname.split("/").pop() || "index.html";
    if (here === "lesson.html") here = "school.html";        // урок — частина Школи
    const cur = (h) => (h === here ? ' aria-current="page"' : "");
    const n = progress().total;
    const top = document.createElement("header");
    top.className = "top";
    top.innerHTML = `<div class="wrap">
      <a class="brand" href="index.html"><img src="assets/img/logo.png" alt=""><span>${esc(C.world.name)}</span></a>
      <nav class="nav" aria-label="Розділи">${NAV.map(([h, t]) => `<a href="${h}"${cur(h)}>${t}${h === "treasures.html" ? ` <small class="sc">⭐<span data-sc>${n}</span></small>` : ""}</a>`).join("")}</nav>
      <div class="top-mini">
        <a href="treasures.html" aria-label="Мої скарби: зірок ${n}"${cur("treasures.html")}>⭐ <small data-sc>${n}</small></a>
        ${D.shop ? `<a href="shop.html" aria-label="Крамниця"${cur("shop.html")}>🛒</a>` : ""}
      </div>
    </div>`;
    document.body.prepend(top);
    const tabs = document.createElement("nav");
    tabs.className = "tabbar";
    tabs.setAttribute("aria-label", "Головні розділи");
    tabs.innerHTML = TABS.map(([h, i, t]) => `<a href="${h}"${cur(h)}><span>${i}</span>${t}</a>`).join("");
    document.body.append(tabs);
    const foot = document.createElement("footer");
    foot.className = "foot";
    foot.innerHTML = `<div class="wrap">${esc(C.world.tagline)}<br>© ${new Date().getFullYear()} ${esc(C.world.name)}</div>`;
    document.body.insertBefore(foot, tabs);
  }

  /* ---------- секрети СилаВолії: маленькі знахідки на сторінках ---------- */
  const SECRETS = [
    { id: "star", page: "index", where: ".portal", x: "8%", y: "14%", icon: "⭐", name: "Зірка Доброти",
      msg: "У СилаВолії є правило: навіть найменший добрий вчинок здатний освітити цілий світ.", hint: "Головна — придивись до нічного неба" },
    { id: "smoke", page: "heroes", where: "main .section", x: "92%", y: "18px", icon: "🌈", name: "Веселковий Дим Фіна",
      msg: "Фін видихає не вогонь, а веселковий дим — і будь-який сум розвіюється.", hint: "Герої — поруч із заголовком" },
    { id: "nanoput", page: "world", where: ".map-wrap", x: "56%", y: "6%", icon: "☁️", name: "Сіра хмаринка НаноПута",
      msg: "НаноПут ховається в сірих хмаринках і змінює форму. Але веселка дружби завжди сильніша!", hint: "Світ — десь у небі над картою" },
    { id: "key", page: "world", where: "main .section:last-of-type", x: "96%", y: "22px", icon: "🗝️", name: "Ключ Відчуттів",
      msg: "Кришталевий ключ змінює форму від щирих почуттів. Відчини ним серце — і знайдеш друга.", hint: "Світ — біля чарівних артефактів" },
    { id: "page", page: "library", where: "main .section", x: "94%", y: "20px", icon: "📜", name: "Загублена сторінка",
      msg: "Кожна казка — це двері. Відчини їх — і на тебе чекатимуть нові друзі.", hint: "Пригоди — на верхній полиці" },
    { id: "bell", page: "school", where: "main .section", x: "95%", y: "16px", icon: "🔔", name: "Дзвіночок Радості",
      msg: "Дзень-дзелень! Дзвіночок Краша розганяє темряву і дарує сміливість не здаватися.", hint: "Школа — під самим дахом сторінки" },
    { id: "crystal", page: "lesson", where: "main .section", x: "97%", y: "8px", icon: "💎", name: "Кристал Абакуса",
      msg: "Кристали Абакуса — це уламки зірок. Кожен колір співає свою ноту.", hint: "Будь-який урок школи" },
    { id: "medallion", page: "shop", where: "main .section", x: "94%", y: "18px", icon: "💛", name: "Сяючий Медальйон Луни",
      msg: "Медальйон Луни світиться, коли ти думаєш над загадкою. Розум — теж магія!", hint: "Крамниця — біля назви" },
  ];
  const PAGE_NAMES = { index: "Головна", heroes: "Герої", world: "Світ", library: "Пригоди", school: "Школа", lesson: "Урок", shop: "Крамниця" };
  function secretsFound() { return store.get("secrets", {}); }

  function placeSecrets(page) {
    const found = secretsFound();
    SECRETS.filter((s) => s.page === page && !found[s.id]).forEach((s) => {
      const host = document.querySelector(s.where);
      if (!host) return;
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "secret";
      b.style.left = s.x; b.style.top = s.y;
      b.setAttribute("aria-label", "Щось блищить…");
      b.textContent = s.icon;
      b.addEventListener("click", (e) => { e.stopPropagation(); collect(s, b); });
      host.append(b);
    });
  }

  function collect(s, el) {
    const found = secretsFound();
    found[s.id] = Date.now();
    store.set("secrets", found);
    const n = Object.keys(found).length;
    refreshCounters();
    el.classList.add("got");
    setTimeout(() => el.remove(), 600);
    const all = n === SECRETS.length;
    celebrate(s.icon, "Нова знахідка!", s.name, s.msg,
      all ? "🎉 Усі знахідки зібрано! Таємниць СилаВолії від тебе більше не сховати." : `+1 ⭐ · знахідок ${n} з ${SECRETS.length}`,
      ["treasures.html#secrets", "До колекції"]);
    checkBadges();
  }

  /* =====================================================================
     Гейміфікація: зірки СилаВолії, значки, колекції (усе — у цьому браузері)
     ===================================================================== */
  const LOCS_ON_MAP = () => C.locations.filter((l) => l.map);
  const LESSON_IDS = ["joy", "potion", "friendship", "faith", "knowledge", "exam", "journal", "riddles", "emotions", "workshop"];   // як у lessons.js
  function progress() {
    const read = store.get("read", {}), quiz = store.get("quiz", {}), stamps = store.get("stamps", {});
    const stars = store.get("stars", {}), secrets = secretsFound();
    const order = ORDER();
    const p = {
      read: order.filter((s) => read[s.id]).length, readMax: order.length,
      quiz: order.filter((s) => quiz[s.id]).length,
      stamps: LOCS_ON_MAP().filter((l) => stamps[l.id]).length, stampsMax: LOCS_ON_MAP().length,
      lessons: LESSON_IDS.filter((id) => stars[id]).length, lessonsMax: LESSON_IDS.length,
      secrets: SECRETS.filter((s) => secrets[s.id]).length, secretsMax: SECRETS.length,
      readSet: read,
    };
    p.total = p.read + p.quiz + p.stamps + p.lessons + p.secrets;
    return p;
  }
  /* хто/що з'являється в казці → відкривається, щойно казку прочитано */
  const appearsIn = (v) => new Set([...(v.stories || []), ...(v.story ? [v.story] : []), ...D.stories.filter((s) => s.villain === v.id).map((s) => s.id)]);
  const unlockedBy = (v, read) => [...appearsIn(v)].find((id) => read[id]);
  const firstReadable = (v) => [...appearsIn(v)].map(story).find((s) => s && readable(s));

  const BADGES = [
    { id: "reader1", icon: "📖", name: "Перша казка", desc: "Прочитай першу казку до кінця", ok: (p) => p.read >= 1 },
    { id: "reader10", icon: "📚", name: "Книголюб", desc: "Прочитай 10 казок", ok: (p) => p.read >= 10 },
    { id: "readerAll", icon: "🏛️", name: "Хранитель бібліотеки", desc: "Прочитай усі казки", ok: (p) => p.read >= p.readMax },
    { id: "quiz5", icon: "🦉", name: "Мудрий читач", desc: "Виконай 5 завдань після казок", ok: (p) => p.quiz >= 5 },
    { id: "stamp1", icon: "🧭", name: "Перший крок", desc: "Знайди першу печатку місця на карті", ok: (p) => p.stamps >= 1 },
    { id: "stamp8", icon: "🎒", name: "Мандрівник", desc: "Збери 8 печаток місць", ok: (p) => p.stamps >= 8 },
    { id: "stampAll", icon: "🗺️", name: "Дослідник СилаВолії", desc: "Збери печатки всіх місць", ok: (p) => p.stamps >= p.stampsMax },
    { id: "lesson1", icon: "🎓", name: "Учень школи", desc: "Пройди перший урок у школі «ШляхдоМрій»", ok: (p) => p.lessons >= 1 },
    { id: "lessonAll", icon: "📜", name: "Випускник", desc: "Пройди всі уроки школи", ok: (p) => p.lessons >= p.lessonsMax },
    { id: "secret1", icon: "🔍", name: "Шукач секретів", desc: "Знайди першу заховану знахідку", ok: (p) => p.secrets >= 1 },
    { id: "secretAll", icon: "💎", name: "Мисливець за таємницями", desc: "Знайди всі заховані знахідки", ok: (p) => p.secrets >= p.secretsMax },
    { id: "trio", icon: "🌈", name: "Серце, Світло і Розум", desc: "Прочитай казку, пройди урок і знайди печатку місця", ok: (p) => p.read && p.lessons && p.stamps },
  ];
  const earned = (p = progress()) => BADGES.filter((b) => b.ok(p));

  function refreshCounters() {
    const t = progress().total;
    document.querySelectorAll("[data-sc]").forEach((x) => { x.textContent = t; });
  }

  /* сповіщення про новий значок (після того, як закриється вікно-нагорода) */
  function checkBadges() {
    const seen = store.get("badges", null);
    const now = earned().map((b) => b.id);
    if (seen === null) { store.set("badges", now); return; }      // перший візит: без «залпу» сповіщень
    const fresh = BADGES.filter((b) => now.includes(b.id) && !seen.includes(b.id));
    if (!fresh.length) return;
    store.set("badges", now);
    const show = () => fresh.forEach((b, k) => setTimeout(() => toast(b), k * 2600));
    const dlg = document.getElementById("secretDlg");
    if (dlg && dlg.open) dlg.addEventListener("close", show, { once: true }); else show();
  }
  function toast(b) {
    const t = document.createElement("a");
    t.className = "badge-toast";
    t.href = "treasures.html#badges";
    t.setAttribute("role", "status");
    t.innerHTML = `<span class="bt-ico">${b.icon}</span><span><small>Новий значок!</small><b>${esc(b.name)}</b></span>`;
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 500); }, 4200);
  }

  function treasuresPage(main) {
    bindTransforms(main);
    bindFriends(main);
    const render = () => {
      const p = progress();
      const read = p.readSet;
      const got = new Set(earned(p).map((b) => b.id));
      const found = secretsFound();
      const stamps = store.get("stamps", {});
      const villains = C.villains, friends = C.characters;
      const lockCard = (v, extra = "") => {
        const s = firstReadable(v);
        return `<div class="card tcard locked"><div class="body"><div class="tc-ico">?</div><h3>${esc(v.name)}</h3>
          <p>${s ? `Прочитай «<a href="read.html?id=${s.id}">${esc(s.title)}</a>», щоб відкрити картку.` : "Відкриється згодом."}</p>${extra}</div></div>`;
      };
      const bar = (n, max) => `<div class="collect-progress" role="img" aria-label="${n} з ${max}"><i style="width:${max ? n / max * 100 : 0}%"></i></div>`;
      const heroOpen = p.read > 0;
      const vOpen = villains.filter((v) => unlockedBy(v, read)).length;
      const fOpen = friends.filter((v) => unlockedBy(v, read)).length;
      const aOpen = C.artifacts.filter((a) => a.stories.some((id) => read[id])).length;

      main.innerHTML = `
        <section class="section wrap"><p class="kicker">Скарби</p><h1>Мої скарби</h1>
          <p class="lead">Тут збирається все, що ти здобуваєш у СилаВолії: зірки, значки, картки героїв і друзів, артефакти та секрети. Усе зберігається лише в цьому браузері — без реєстрації.</p>
          <div class="star-total card"><div class="body">
            <div class="st-big">⭐ ${p.total}</div><div><b>Зірки СилаВолії</b><p>Кожна прочитана казка, виконане завдання, печатка місця, урок і знахідка дають зірку.</p></div>
          </div></div>
          <div class="grid stat-grid">
            <a class="card stat" href="library.html"><div class="body"><span>📜</span><b>${p.read} / ${p.readMax}</b><small>казок прочитано</small>${bar(p.read, p.readMax)}</div></a>
            <a class="card stat" href="library.html"><div class="body"><span>🦉</span><b>${p.quiz}</b><small>завдань після казок</small></div></a>
            <a class="card stat" href="world.html"><div class="body"><span>🧭</span><b>${p.stamps} / ${p.stampsMax}</b><small>печаток місць</small>${bar(p.stamps, p.stampsMax)}</div></a>
            <a class="card stat" href="school.html#lessons"><div class="body"><span>🎓</span><b>${p.lessons} / ${p.lessonsMax}</b><small>уроків пройдено</small>${bar(p.lessons, p.lessonsMax)}</div></a>
            <a class="card stat" href="#secrets"><div class="body"><span>✨</span><b>${p.secrets} / ${p.secretsMax}</b><small>секретів знайдено</small>${bar(p.secrets, p.secretsMax)}</div></a>
          </div>
        </section>

        <section class="section wrap" id="badges"><h2>Магічні значки · ${got.size} з ${BADGES.length}</h2>
          <div class="badge-grid">${BADGES.map((b) => `<div class="mbadge${got.has(b.id) ? " on" : ""}" title="${esc(b.desc)}">
            <span class="mb-ico">${got.has(b.id) ? b.icon : "🔒"}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join("")}</div>
          ${p.lessons >= p.lessonsMax ? `<p style="margin-top:16px"><a class="btn gold" href="school.html#lessons">🎓 Мій диплом школи «ШляхдоМрій»</a></p>` : ""}
        </section>

        <section class="section wrap" id="cards"><h2>Картки героїв</h2>
          <p class="lead">${heroOpen ? "Тріо відкрито! Переверни картку на сторінці героїв, щоб побачити артефакт." : "Прочитай будь-яку казку — і картки Фіна, Краша і Луни стануть твоїми."}</p>
          <div class="grid tgrid">${C.heroes.map((h) => heroOpen
            ? `<a class="card tcard hero-t" href="heroes.html#${h.id}" style="--c:${HERO_STYLE[h.id].c}"><img src="assets/img/heroes/${h.id}.jpg" alt="${esc(h.name)}" loading="lazy"><div class="body"><h3>${esc(h.name)}</h3><p>${esc(h.symbol)} · ${esc(h.virtue)}</p></div></a>`
            : lockCard({ ...h, stories: ["A01"] })).join("")}</div>
        </section>

        <section class="section wrap"><h2>Ті, кого зрозуміли · ${vOpen} з ${villains.length}</h2>
          <p class="lead">Картка відкривається, щойно ти дочитаєш казку, де з'являється цей персонаж.</p>
          <div class="grid tgrid">${villains.map((v) => unlockedBy(v, read)
            ? (v.img
              ? `<div class="card tcard villain-card">${transform(v)}<div class="body"><h3>${esc(v.name)}</h3><p><span class="arrow">${v.became ? "→ став:" : "→ у фіналі:"}</span> ${esc(v.became || v.fate || "")}</p><p><button class="btn ghost ba-btn" type="button" aria-pressed="false">✨ Зрозуміти</button></p></div></div>`
              : `<div class="card tcard"><div class="body"><div class="tc-ico">🌗</div><h3>${esc(v.name)}</h3><p>${esc(v.essence)}</p>${v.became ? `<p><span class="arrow">→ став:</span> ${esc(v.became)}</p>` : ""}</div></div>`)
            : v.img
              ? (() => { const s0 = firstReadable(v); return `<div class="card tcard art-card locked"><img class="art-img veiled" src="${v.img}-before-s.jpg" alt="Закрита картка персонажа" loading="lazy"><span class="art-lock" aria-hidden="true">?</span><div class="body"><h3>${esc(v.name)}</h3><p>${s0 ? `Прочитай «<a href="read.html?id=${s0.id}">${esc(s0.title)}</a>», щоб відкрити картку.` : "Відкриється згодом."}</p></div></div>`; })()
              : lockCard(v)).join("")}</div>
        </section>

        <section class="section wrap"><h2>Друзі СилаВолії · ${fOpen} з ${friends.length}</h2>
          <div class="grid tgrid">${friends.map((v) => unlockedBy(v, read)
            ? (v.img
              ? `<div class="card tcard friend-card">${friendPic(v)}<div class="body"><h3>${esc(v.name)}</h3><p>${esc(v.who)}</p></div></div>`
              : `<div class="card tcard"><div class="body"><div class="tc-ico">💛</div><h3>${esc(v.name)}</h3><p>${esc(v.who)}</p></div></div>`)
            : v.img
              ? (() => { const s0 = firstReadable(v); return `<div class="card tcard friend-card locked"><div class="fr-pic"><img class="fr-pose veiled" src="${v.img}-pose-s.jpg" alt="Закрита картка друга" loading="lazy"><span class="art-lock" aria-hidden="true">?</span></div><div class="body"><h3>${esc(v.name)}</h3><p>${s0 ? `Прочитай «<a href="read.html?id=${s0.id}">${esc(s0.title)}</a>», щоб відкрити картку.` : "Відкриється згодом."}</p></div></div>`; })()
              : lockCard(v)).join("")}</div>
        </section>

        <section class="section wrap"><h2>Чарівні артефакти · ${aOpen} з ${C.artifacts.length}</h2>
          <div class="grid art-grid">${C.artifacts.map((a) => {
            if (a.stories.some((id) => read[id])) return artCard(a);
            if (!a.img) return lockCard(a);
            const s = firstReadable(a);
            return `<div class="card art-card locked">${artImg(a, "veiled").replace(/alt="[^"]*"/, 'alt="Закрита картка артефакту"')}<span class="art-lock" aria-hidden="true">?</span>
              <div class="body"><p>${s ? `Прочитай «<a href="read.html?id=${s.id}">${esc(s.title)}</a>», щоб відкрити картку.` : "Відкриється згодом."}</p></div></div>`;
          }).join("")}</div>
        </section>

        ${(() => { const cr = store.get("crafts", []); return `<section class="section wrap" id="crafts"><h2>Мої витвори · ${cr.length}</h2>
          ${cr.length ? `<div class="grid tgrid">${cr.slice().reverse().map((c) => `<div class="card tcard"><div class="body"><div class="craft-ico" style="--hc:${esc(c.color)}">${esc(c.icon)}</div><h3>${esc(c.name)}</h3><p>${esc(c.power)}</p></div></div>`).join("")}</div>`
            : `<p class="lead">Тут житимуть артефакти, які ти створиш у <a href="lesson.html?id=workshop">Майстерні Артефактів</a>.</p>`}</section>`; })()}

        <section class="section wrap" id="secrets"><h2>Секрети СилаВолії · ${p.secrets} з ${SECRETS.length}</h2>
          <p class="lead">На сторінках сайту сховано ${SECRETS.length} чарівних знахідок. Вони маленькі й ледь помітні — придивляйся до кутків, неба і заголовків.</p>
          <div class="grid collection">${SECRETS.map((s) => found[s.id]
            ? `<div class="card got"><div class="body"><div class="secret-big">${s.icon}</div><h3>${esc(s.name)}</h3><p>${esc(s.msg)}</p><span class="chip">знайдено: ${PAGE_NAMES[s.page]}</span></div></div>`
            : `<div class="card unknown"><div class="body"><div class="secret-big">?</div><h3>Ще не знайдено</h3><p>Підказка: ${esc(s.hint)}.</p></div></div>`).join("")}</div>
        </section>

        <section class="section wrap"><h2>Печатки місць · ${p.stamps} з ${p.stampsMax}</h2>
          <div class="chips">${LOCS_ON_MAP().map((l) => stamps[l.id]
            ? `<a class="chip crash" href="world.html#${l.id}">${l.map.icon} ${esc(l.name)}</a>`
            : `<a class="chip ghost-chip" href="world.html#${l.id}">🔒 ${esc(l.name)}</a>`).join("")}</div>
          <p style="margin-top:28px"><button class="btn ghost" id="resetAll" type="button">↺ Почати все спочатку</button></p>
        </section>`;
      $("#resetAll", main).addEventListener("click", () => {
        if (!confirm("Стерти всі зірки, значки, печатки, прочитані казки, знахідки, витвори і щоденник у цьому браузері? Це не можна скасувати.")) return;
        ["secrets", "stamps", "read", "quiz", "stars", "badges", "crafts", "journal"].forEach((k) => store.set(k, ["badges", "crafts", "journal"].includes(k) ? [] : {}));
        refreshCounters(); render();
      });
      if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    };
    render();
  }

  /* бібліотека пригод: порядок, короткий опис, прогрес читання */
  const ORDER = () => D.stories.filter((x) => readable(x) && x.status !== "draft");
  const advNo = (s) => ORDER().indexOf(s) + 1;
  function teaser(s, max = 150) {
    const p = s.pages.find((x) => x.text.length);
    if (!p) return "";
    const t = p.text.join(" ");
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]\s*$/, "") + "…";
  }
  /* стан читання: 0..1 і чи дочитано */
  function readState(s) {
    if (!readable(s)) return { pct: 0, done: false, started: false };
    const done = !!store.get("read", {})[s.id];
    const pos = store.get("pos:" + s.id, 0);
    const pct = done ? 1 : Math.min(1, pos / s.pages.length);
    return { pct, done, started: !done && pos > 0 };
  }
  function storyCard(s) {
    const st = readState(s);
    const cover = s.cover ? `<img class="cover" src="${s.cover}" alt="" loading="lazy">` : `<div class="cover empty">${s.status === "no_text" ? "⏳" : "📜"}</div>`;
    const n = readable(s) ? advNo(s) : 0;
    const badge = s.status === "no_text" ? "Скоро" : s.status === "manuscript" ? "Без ілюстрацій · " + seriesName(s.series) : seriesName(s.series);
    const tags = [s.conflict && `<span class="chip luna">${esc(s.conflict)}</span>`,
      readable(s) && `<span class="chip">⏱ ≈ ${readMinutes(s)} хв</span>`,
      readable(s) && `<span class="chip crash">📄 ${s.pages.length} стор.</span>`].filter(Boolean).join("");
    const inner = `<div class="adv-cover">${cover}
        ${st.done ? `<span class="adv-flag done">✓ Прочитано</span>` : st.started ? `<span class="adv-flag">📖 Читаю</span>` : ""}
        ${st.started ? `<span class="adv-progress"><i style="width:${Math.round(st.pct * 100)}%"></i></span>` : ""}</div>
      <div class="body"><span class="badge">${n ? `Пригода № ${String(n).padStart(2, "0")} · ` : ""}${esc(badge)}</span><h3>${esc(s.title)}</h3>
        ${readable(s) ? `<p class="adv-teaser">${esc(teaser(s))}</p>` : ""}
        ${s.lesson ? `<p class="lesson">${esc(s.lesson)}</p>` : ""}
        ${tags ? `<div class="chips">${tags}</div>` : ""}</div>`;
    return readable(s) ? `<a class="card adv-card${st.done ? " is-done" : ""}" href="read.html?id=${s.id}">${inner}</a>` : `<div class="card adv-card" aria-disabled="true">${inner}</div>`;
  }

  /* ---------- сторінки ---------- */
  const pages = {};
  pages.secrets = treasuresPage;
  pages.treasures = treasuresPage;

  /* хвилини читання: ~80 слів за хвилину (читання дитині вголос) */
  const readMinutes = (s) => Math.max(1, Math.round(s.pages.reduce((n, p) => n + p.text.join(" ").split(/\s+/).length, 0) / 80));

  /* казкова сцена першого екрана (SVG, без зовнішніх картинок) */
  /* казкова сцена першого екрана: ілюстрація + м'яке затемнення для тексту + іскорки */
  const PORTAL_SCENE = `
    <div class="portal-scene" aria-hidden="true">
      <img class="portal-bg" src="assets/img/home-bg.jpg" alt="">
      <div class="portal-shade"></div>
      <div class="sparkles">${Array.from({ length: 14 }, (_, k) =>
        `<i style="left:${(k * 37 + 7) % 96}%;top:${(k * 53 + 11) % 60}%;animation-delay:${(k % 7) * 0.7}s"></i>`).join("")}</div>
    </div>`;

  /* вхідні точки на сцені → місця на карті (там, де вони на ілюстрації) */
  const PORTAL_SPOTS = [
    { href: "world.html#cheese_mountains", x: 13, y: 46, icon: "🧀", t: "Сирні гори" },
    { href: "world.html#sweet_dreams_city", x: 84, y: 54, icon: "🍭", t: "Місто Солодких Мрій" },
    { href: "world.html#whisper_forest", x: 9, y: 74, icon: "🌳", t: "Ліс Шепотів" },
    { href: "world.html#lemonade_river", x: 60, y: 88, icon: "🍋", t: "Лимонадна річка" },
  ];

  pages.index = function (main) {
    const last = store.get("last", null);
    const lastS = last && story(last.id);
    const L = (window.SVLessons && window.SVLessons.LESSONS) || [];
    const stars = store.get("stars", {});
    const pool = D.stories.filter((s) => readable(s) && s.cover && s.series !== "D");
    const month = pool[new Date().getMonth() % pool.length];
    const found = secretsFound();
    const books = (D.shop ? D.shop.books : []).filter((b) => b.cover).slice(0, 4);
    const MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

    main.innerHTML = `
      <section class="portal">
        ${PORTAL_SCENE}
        ${PORTAL_SPOTS.map((p) => `<a class="spot" href="${p.href}" style="left:${p.x}%;top:${p.y}%"><span class="spot-ico">${p.icon}</span><span class="spot-t">${esc(p.t)}</span></a>`).join("")}
        <div class="portal-inner wrap">
          <p class="portal-name">${esc(C.world.name)}</p>
          <h1>Світ, де добро має силу</h1>
          <p class="portal-sub">Три друзі. Безліч пригод. Магія, що живе в кожному серці.</p>
          <div class="portal-cta">
            <a class="btn gold" href="${lastS ? `read.html?id=${lastS.id}` : "read.html?id=A01"}">${lastS ? `📖 Продовжити «${esc(lastS.title)}»` : "✨ Почати пригоду"}</a>
            <a class="btn glass" href="world.html">🗺️ Дослідити світ</a>
          </div>
          <div class="portal-heroes">${C.heroes.map((h, k) => `
            <a class="ph" href="heroes.html#${h.id}" style="--c:${HERO_STYLE[h.id].c};animation-delay:${k * 0.5}s">
              <img src="assets/img/heroes/${h.id}.jpg" alt="${esc(h.name)}"><span>${esc(h.name)}</span></a>`).join("")}</div>
        </div>
      </section>

      <section class="section wrap">
        <p class="kicker">Знайомство</p>
        <h2>Фін, Краш і Луна</h2>
        <p class="lead">Три герої, три магічні сили, одна дружба. ${esc(C.world.core_idea)}</p>
        <div class="trio">${C.heroes.map((h) => { const st = HERO_STYLE[h.id];
          return `<a class="card trio-card" href="heroes.html#${h.id}" style="--c:${st.c};--cs:${st.cs}">
            <img class="cover" src="assets/img/heroes/${h.id}.jpg" alt="" loading="lazy">
            <div class="body"><span class="chip ${st.chip}">${st.sym} ${esc(h.symbol)}</span><h3>${esc(h.name)}</h3>
              <p>${esc(h.virtue)}. Артефакт: ${esc(h.artifact.replace(/\s*\(.*\)$/, ""))}.</p></div></a>`; }).join("")}</div>
      </section>

      <section class="section band">
        <div class="wrap">
          <p class="kicker">Карта</p>
          <h2>Досліджуй СилаВолію</h2>
          <p class="lead">${esc(C.world.description)}</p>
          <a class="mini-map" href="world.html" aria-label="Відкрити карту світу">
            <svg viewBox="0 0 1000 700" aria-hidden="true">${MAP_TERRAIN.replace(/ filter="url\(#mSoft\)"/g, "")}
              ${C.locations.filter((l) => l.map).map((l) => `<g transform="translate(${l.map.x} ${l.map.y})"><circle r="24" fill="#fff" stroke="#6746A1" stroke-width="3"/><text y="9" text-anchor="middle" font-size="26">${l.map.icon}</text></g>`).join("")}
            </svg>
            <span class="btn">Відкрити карту — ${C.locations.length} чарівних місць →</span>
          </a>
        </div>
      </section>

      ${month ? `<section class="section wrap">
        <p class="kicker">Історія ${MONTHS[new Date().getMonth()]}</p>
        <div class="month card">
          <img src="${month.cover}" alt="Обкладинка «${esc(month.title)}»">
          <div class="body">
            <span class="badge">${esc(seriesName(month.series))}</span>
            <h2>${esc(month.title)}</h2>
            ${month.conflict ? `<p>${esc(month.conflict)}</p>` : ""}
            ${month.lesson ? `<p class="lesson">${esc(month.lesson)}</p>` : ""}
            <div class="chips"><span class="chip">⏱ ≈ ${readMinutes(month)} хв</span><span class="chip luna">📄 ${month.pages.length} стор.</span></div>
            <p><a class="btn" href="read.html?id=${month.id}">Читати історію</a></p>
          </div>
        </div>
      </section>` : ""}

      ${L.length ? `<section class="section wrap">
        <p class="kicker">Магія</p>
        <h2>Спробуй магію сам</h2>
        <p class="lead">Уроки школи «ШляхдоМрій» — це міні-ігри. За кожен пройдений урок — зірка. Зібрано: <b>${L.filter((l) => stars[l.id]).length} з ${L.length}</b> ⭐</p>
        <div class="grid">${L.slice(0, 3).map((l) => `<a class="card magic-card${stars[l.id] ? " done" : ""}" href="lesson.html?id=${l.id}"><div class="body">
          <div class="magic-ico">${l.icon}</div><h3>${esc(l.title)}</h3><p>${esc(l.teacher)}</p></div></a>`).join("")}</div>
        <p style="margin-top:18px"><a class="btn ghost" href="school.html#lessons">Усі уроки →</a></p>
      </section>` : ""}

      <section class="section wrap">
        <div class="secret-teaser card">
          <div class="body">
            <p class="kicker">Секрет</p>
            <h2>Щось заховано у світі…</h2>
            <p>На сторінках СилаВолії сховано ${SECRETS.length} чарівних знахідок. Придивляйся до дрібниць — і збирай колекцію!</p>
            <div class="secret-row">${SECRETS.map((s) => `<span class="${found[s.id] ? "on" : ""}" title="${found[s.id] ? esc(s.name) : "Ще не знайдено"}">${found[s.id] ? s.icon : "?"}</span>`).join("")}</div>
            <p><a class="btn gold" href="treasures.html#secrets">Моя колекція · ${Object.keys(found).length} / ${SECRETS.length}</a></p>
          </div>
        </div>
      </section>

      ${books.length ? `<section class="section wrap">
        <p class="kicker">Книги</p>
        <h2>Пригоди, які можна взяти в руки</h2>
        <div class="shelf">${books.map((b) => `<a class="book" href="shop.html"><img src="${b.cover}" alt="${esc(b.title)}" loading="lazy"><span>${esc(b.title)}</span></a>`).join("")}</div>
        <p style="margin-top:18px"><a class="btn ghost" href="shop.html">До крамниці →</a></p>
      </section>` : ""}

      <section class="finale">
        <div class="wrap">
          <p class="finale-big">${esc(C.world.tagline)}</p>
          <p>Ворога в СилаВолії не перемагають силою — його розуміють, і він змінюється.</p>
          <a class="btn gold" href="library.html">До бібліотеки казок</a>
        </div>
      </section>`;
    const portal = $(".portal", main);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => portal.classList.toggle("paused", !e.isIntersecting)).observe(portal);
    }
  };

  pages.heroes = function (main) {
    const hero = (h) => { const st = HERO_STYLE[h.id];
      const art = h.artifact.replace(/\s*\(.*\)$/, "");
      return `<article class="card hero-card" id="${h.id}" style="--c:${st.c};--cs:${st.cs}">
        <button class="flip-scene" type="button" aria-pressed="false" aria-label="${esc(h.name)}: показати артефакт «${esc(art)}»">
          <span class="flipper">
            <img class="face front" src="assets/img/heroes/${h.id}.jpg" alt="${esc(h.name)}" loading="lazy">
            <span class="face back"><img src="assets/img/heroes/${h.id}-artifact.jpg" alt="${esc(art)}" loading="lazy"><b>${esc(art)}</b></span>
          </span>
        </button>
        <button class="flip-bar" type="button"><span class="to-art">✨ Показати артефакт</span><span class="to-hero">${st.icon} Показати героя</span></button>
        <div class="body">
        <div class="head"><div class="avatar">${st.icon}</div><div><h2 style="margin:0">${esc(h.name)}</h2>
          <span class="chip ${st.chip}">${st.sym} ${esc(h.symbol)} · ${esc(h.virtue)}</span></div></div>
        <div class="facts">
          <div><b>Хто:</b> ${esc(h.species)}</div>
          <div><b>Походження:</b> ${esc(h.origin)}</div>
          <div><b>Вигляд:</b> ${esc(h.look)}</div>
          <div><b>Сила:</b> ${esc(h.power)}</div>
          <div><b>Артефакт:</b> ${esc(h.artifact)}</div>
          ${h.likes ? `<div><b>Любить:</b> ${esc(h.likes.join(", "))}</div>` : ""}
          <div><b>Над чим працює:</b> ${esc(h.weakness)}</div>
        </div></div></article>`; };
    const villain = (v) => `<div class="card villain-card">${transform(v)}<div class="body">
        <h3>${esc(v.name)}</h3><p>${esc(v.essence)}</p>
        ${v.became ? `<p><span class="arrow">→ став:</span> ${esc(v.became)}</p>` : ""}
        ${v.img ? `<p><button class="btn ghost ba-btn" type="button" aria-pressed="false">✨ Зрозуміти</button></p>` : ""}
        <div class="chips">${(v.stories || (v.story ? [v.story] : [])).map(storyLink).join("")}</div></div></div>`;
    const np = byId(C.villains, "nanoput");
    const lc = (t) => t ? t[0].toLowerCase() + t.slice(1) : "";
    main.innerHTML = `
      <section class="section wrap"><h1>Герої СилаВолії</h1>
        <p class="lead">Кожен із трьох друзів уособлює одну з сил: Серце, Світло і Розум. Окремо їм важко, разом — вони непереможні.</p>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${C.heroes.map(hero).join("")}</div></section>
      <section class="section wrap"><h2>Головний антагоніст — ${esc(np.name)}</h2>
        <div class="card villain-card nanoput-card">${transform(np)}<div class="body"><p>${esc(np.essence)}. ${esc(np.action)}.</p>
          <p><b>Подоби:</b> ${np.forms.map((f) => { const m = f.match(/^(.*?)\s*\(([A-D]\d+)\)$/); const st = m && story(m[2]);
            return st && readable(st) ? `<a href="read.html?id=${st.id}" title="Казка «${esc(st.title)}»">${esc(m[1])}</a>` : esc(m ? m[1] : f); }).join(", ")}.
            <b>Лігво:</b> ${esc(lc(np.lair))}. <b>Слабке місце:</b> ${esc(lc(np.weakness))}.</p>
          ${np.fate ? `<p><span class="arrow">→ у фіналі:</span> ${esc(np.fate)}</p>` : ""}
          ${np.img ? `<p><button class="btn ghost ba-btn" type="button" aria-pressed="false">✨ Зрозуміти</button></p>` : ""}</div></div></section>
      <section class="section wrap"><h2>Ті, кого вони зрозуміли</h2>
        <p class="lead">У СилаВолії ворогів не знищують. Кожна «темна» істота виявляється самотньою або не розуміє, що шкодить, — і змінюється.</p>
        <p class="hint">Потягни повзунок на картинці або натисни «Зрозуміти» — і побачиш, ким став кожен із них.</p>
        <div class="grid villain-grid">${C.villains.filter((v) => v.id !== "nanoput").map(villain).join("")}</div></section>
      <section class="section wrap"><h2>Друзі та мешканці</h2>
        <p class="hint">Наведи на друга або торкнися картки — і побачиш, як він радіє.</p>
        <div class="grid friend-grid">${C.characters.map((c) => `<div class="card friend-card">${friendPic(c)}<div class="body"><h3>${esc(c.name)}</h3><p>${esc(c.who)}</p>
          <div class="chips">${c.stories.map(storyLink).join("")}</div></div></div>`).join("")}</div></section>`;
    bindTransforms(main);
    bindFriends(main);
    // перевертання картки: герой ⇄ його артефакт (як у першому сайті SAGA)
    main.addEventListener("click", (e) => {
      const btn = e.target.closest(".flip-scene, .flip-bar");
      if (!btn) return;
      const card = btn.closest(".hero-card");
      const on = card.classList.toggle("flipped");
      card.querySelector(".flip-scene").setAttribute("aria-pressed", String(on));
    });
  };

  /* ---------- карта світу ---------- */
  const MAP_TERRAIN = `
    <defs>
      <radialGradient id="mSea" cx="80%" cy="70%" r="60%"><stop offset="0" stop-color="#bfe6f7"/><stop offset="1" stop-color="#8fcdea"/></radialGradient>
      <linearGradient id="mCheese" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe082"/><stop offset="1" stop-color="#f5b942"/></linearGradient>
      <filter id="mSoft"><feGaussianBlur stdDeviation="6"/></filter>
      <pattern id="mDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#d9c49a" opacity=".45"/></pattern>
    </defs>
    <rect width="1000" height="700" rx="28" fill="#fbf1dc"/>
    <rect width="1000" height="700" rx="28" fill="url(#mDots)"/>
    <!-- море і острови -->
    <path d="M1000 210 C 930 230 900 290 905 340 C 912 410 860 450 830 500 C 800 545 790 600 760 640 C 740 668 735 690 730 700 L 972 700 Q 1000 700 1000 672 Z" fill="url(#mSea)"/>
    <path d="M905 340 C 912 410 860 450 830 500 C 800 545 790 600 760 640" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" opacity=".8"/>
    <g fill="#e9d6ae" stroke="#cdb37f" stroke-width="2"><ellipse cx="905" cy="612" rx="44" ry="20"/><ellipse cx="955" cy="560" rx="22" ry="11"/><ellipse cx="860" cy="660" rx="26" ry="12"/></g>
    <g fill="#fff" opacity=".55" filter="url(#mSoft)"><ellipse cx="930" cy="590" rx="70" ry="22"/><ellipse cx="880" cy="640" rx="60" ry="18"/></g>
    <!-- пустеля -->
    <path d="M0 28 Q0 0 28 0 L250 0 C 240 60 230 120 180 175 C 130 225 60 215 0 230 Z" fill="#f6dca4"/>
    <g fill="none" stroke="#e6bf73" stroke-width="3" stroke-linecap="round"><path d="M30 70 q25 -14 50 0 t50 0"/><path d="M90 150 q25 -14 50 0 t50 0"/><path d="M20 190 q20 -10 40 0"/></g>
    <!-- пагорби -->
    <g fill="#d8efb8"><ellipse cx="560" cy="300" rx="230" ry="130"/><ellipse cx="420" cy="470" rx="250" ry="120"/><ellipse cx="640" cy="560" rx="200" ry="110"/><ellipse cx="300" cy="610" rx="220" ry="90"/></g>
    <g fill="#c6e5a0" opacity=".8"><ellipse cx="700" cy="420" rx="120" ry="60"/><ellipse cx="300" cy="420" rx="110" ry="50"/></g>
    <!-- Неонова Долина -->
    <ellipse cx="660" cy="625" rx="95" ry="42" fill="#e7d4ff" opacity=".9"/>
    <!-- Країна Срібних Сльозинок -->
    <ellipse cx="135" cy="470" rx="115" ry="80" fill="#e5f2fb"/><g fill="#fff">${[[100, 440], [160, 500], [70, 500], [180, 440]].map(([x, y]) => `<path d="M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z"/>`).join("")}</g>
    <!-- Ліс Шепотів -->
    <g>${[[170, 270], [205, 240], [245, 265], [290, 290], [215, 300], [260, 345], [180, 330], [310, 340], [140, 215], [230, 205], [120, 290], [285, 240]].map(([x, y], k) =>
      `<circle cx="${x}" cy="${y}" r="${24 + (k % 3) * 4}" fill="${k % 2 ? "#7cc27a" : "#5fae6a"}"/><rect x="${x - 3}" y="${y + 18}" width="6" height="12" rx="2" fill="#8a6a45"/>`).join("")}</g>
    <!-- Сирні гори -->
    <g stroke="#d99a2b" stroke-width="3" stroke-linejoin="round">
      <path d="M320 225 L390 85 L455 225 Z" fill="url(#mCheese)"/><path d="M400 225 L470 60 L545 225 Z" fill="url(#mCheese)"/><path d="M490 225 L545 120 L600 225 Z" fill="url(#mCheese)"/>
    </g>
    <g fill="#f0a830" opacity=".75"><circle cx="380" cy="180" r="9"/><circle cx="470" cy="130" r="8"/><circle cx="490" cy="190" r="11"/><circle cx="548" cy="185" r="7"/><circle cx="420" cy="205" r="6"/></g>
    <!-- Небесні Хмари -->
    <g fill="#fff" stroke="#e3ecf5" stroke-width="2">
      <path d="M770 105 a28 28 0 0 1 40 -30 a34 34 0 0 1 62 6 a26 26 0 0 1 22 44 h-112 a22 22 0 0 1 -12 -20 Z"/>
      <path d="M880 170 a18 18 0 0 1 26 -18 a22 22 0 0 1 40 4 a16 16 0 0 1 14 28 h-72 a14 14 0 0 1 -8 -14 Z" opacity=".9"/>
    </g>
    <!-- Лимонадна річка -->
    <path d="M470 228 C 480 290 540 300 560 360 C 585 430 560 470 620 515 C 680 560 740 560 790 600" fill="none" stroke="#fff3a6" stroke-width="16" stroke-linecap="round"/>
    <path d="M470 228 C 480 290 540 300 560 360 C 585 430 560 470 620 515 C 680 560 740 560 790 600" fill="none" stroke="#ffe066" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 16"/>
    <!-- Дзеркальне Озеро -->
    <ellipse cx="720" cy="472" rx="52" ry="26" fill="#dfe8f3" stroke="#a9b8cc" stroke-width="3"/><ellipse cx="708" cy="466" rx="18" ry="5" fill="#fff" opacity=".8"/>
    <!-- троянда вітрів -->
    <g transform="translate(962 60) scale(.8)" fill="#c9a86a"><path d="M0 -34 L7 0 L0 34 L-7 0 Z"/><path d="M-34 0 L0 -7 L34 0 L0 7 Z" opacity=".6"/><text y="-40" text-anchor="middle" font-size="15" font-weight="800" fill="#a0824c">Пн</text></g>`;

  /* ---------- сцени локацій ---------- */
  const SCENE_GUIDES = {
    fin: (n) => `Ласкаво просимо: це ${n}! Тут так гарно, що аж хочеться видихнути веселку.`,
    crash: (n) => `Дзень-дзелень! Це ${n}. Біжімо скоріше дивитися, що тут цікавого!`,
    luna: (n) => `Це ${n}. Придивися уважно: у кожному місці СилаВолії ховається загадка.`,
  };
  const hashNum = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function sceneArt(l) {
    // ілюстрація з казки, що відбувається тут: спершу сторінка, де згадано назву місця
    const ss = l.stories.map(story).filter((s) => s && readable(s));
    const words = l.name.replace(/[«»"]/g, "").split(/\s+/).filter((w) => w.length > 3);
    const stems = words.map((w) => w.toLowerCase().slice(0, Math.max(4, w.length - 2)));
    for (const s of ss) {
      for (let k = 1; k < s.pages.length; k++) {
        const p = s.pages[k];
        if (p.img && stems.some((st) => p.text.join(" ").toLowerCase().includes(st))) return { src: p.img, small: p.img_s, from: s };
      }
    }
    const s = ss[0];
    if (!s) return null;
    const p = s.pages.find((x, k) => k > 0 && x.img) || s.pages[0];
    return p && p.img ? { src: p.img, small: p.img_s, from: s } : null;
  }

  pages.world = function (main) {
    const LOCS = C.locations.filter((l) => l.map);
    const storiesOf = (l) => l.stories.map(story).filter(Boolean);
    const series = (l) => new Set(storiesOf(l).map((s) => s.series));
    const stamps = () => store.get("stamps", {});
    let filter = "all";
    let current = null;

    main.innerHTML = `
      <section class="section wrap" id="mapView"><h1>Карта СилаВолії</h1>
        <p class="lead">Натисни на місце на карті — і ти потрапиш усередину. У кожному місці захована печатка дослідника.</p>
        <div class="filters" role="group" aria-label="Показати місця серії">
          <button data-f="all">Усі місця</button>${D.series.map((s) => `<button data-f="${s.id}">${esc(s.name)}</button>`).join("")}
        </div>
        <div class="map-layout">
          <figure class="map-wrap">
            <svg class="map" viewBox="0 0 1000 700" role="group" aria-label="Карта СилаВолії">
              ${MAP_TERRAIN}
              <g id="pins">${LOCS.map((l) => `
                <g class="pin" data-id="${l.id}" transform="translate(${l.map.x} ${l.map.y})" tabindex="0" role="button" aria-label="${esc(l.name)}">
                  <circle class="halo" r="34"/><circle class="dot" r="25"/>
                  <text class="ico" y="9" text-anchor="middle">${l.map.icon}</text>
                  <g class="stamp-badge"><circle cx="20" cy="-20" r="11"/><text x="20" y="-15" text-anchor="middle">✓</text></g>
                  <text class="lbl" y="${l.map.y > 640 ? -38 : 46}" text-anchor="middle">${esc(l.name)}</text>
                </g>`).join("")}</g>
            </svg>
          </figure>
          <aside class="map-panel card" id="panel" aria-live="polite"></aside>
        </div>
      </section>
      <section class="scene-view" id="scene" hidden></section>
      <section class="section wrap" id="artifacts"><h2>Чарівні артефакти</h2><div class="grid art-grid">${C.artifacts.map((a) => artCard(a, `<div class="chips">${a.stories.map(storyLink).join("")}</div>`)).join("")}</div></section>`;

    const panel = $("#panel", main), scene = $("#scene", main), mapView = $("#mapView", main);

    function markStamps() {
      const st = stamps();
      main.querySelectorAll(".pin").forEach((p) => p.classList.toggle("stamped", !!st[p.dataset.id]));
    }
    function intro() {
      const st = stamps();
      const n = LOCS.filter((l) => st[l.id]).length;
      panel.innerHTML = `<div class="body"><h2>Куди вирушимо?</h2>
        <p>У СилаВолії ${LOCS.length} чарівних місць. Обери будь-яке на карті — і зазирни всередину.</p>
        <h3>Печатки дослідника</h3>
        <div class="collect-progress" role="img" aria-label="Зібрано ${n} з ${LOCS.length}"><i style="width:${n / LOCS.length * 100}%"></i></div>
        <p><b>${n} з ${LOCS.length}</b>${n === LOCS.length ? " — 🎉 печатки всіх місць зібрано! СилаВолію досліджено." : " — у кожному місці на ілюстрації сховано чарівну іскорку."}</p>
        ${n ? `<div class="chips">${LOCS.filter((l) => st[l.id]).map((l) => `<a class="chip crash" href="#${l.id}">${l.map.icon} ${esc(l.name)}</a>`).join("")}</div>` : ""}
        <p class="hint">Підказка: Лимонадна річка тече від Сирних гір через усю країну до моря.</p></div>`;
    }
    function showMap(focusId) {
      current = null;
      scene.hidden = true; scene.innerHTML = "";
      mapView.hidden = false;
      main.querySelectorAll(".pin").forEach((p) => p.classList.toggle("on", p.dataset.id === focusId));
      markStamps(); intro();
    }

    function openScene(id, push = true) {
      const l = byId(LOCS, id);
      if (!l) return showMap();
      current = id;
      const idx = LOCS.indexOf(l);
      const prev = LOCS[(idx - 1 + LOCS.length) % LOCS.length], next = LOCS[(idx + 1) % LOCS.length];
      const ss = storiesOf(l);
      const sids = new Set(l.stories);
      const appears = (v) => new Set([...(v.stories || []), ...(v.story ? [v.story] : []), ...D.stories.filter((s) => s.villain === v.id).map((s) => s.id)]);
      const who = [...C.villains, ...C.characters].filter((v) => [...appears(v)].some((x) => sids.has(x)));
      const arts = C.artifacts.filter((a) => a.stories.some((x) => sids.has(x)));
      const guide = C.heroes[hashNum(l.id) % C.heroes.length];
      const art = sceneArt(l);
      const h = hashNum(l.id + "spark");
      const sx = 12 + (h % 76), sy = 14 + ((h >> 8) % 52);   // місце іскорки на ілюстрації, %
      const got = !!stamps()[l.id];
      const firstRead = ss.find(readable);

      scene.innerHTML = `
        <div class="scene-hero">
          ${art ? `<img src="${art.small || art.src}" ${art.small ? `srcset="${art.small} 700w, ${art.src} 1400w" sizes="100vw"` : ""} alt="Ілюстрація: ${esc(l.name)}">`
                : `<div class="scene-fallback">${l.map.icon}</div>`}
          <div class="scene-shade"></div>
          ${got ? "" : `<button class="spark" type="button" style="left:${sx}%;top:${sy}%" aria-label="Чарівна іскорка — печатка місця «${esc(l.name)}»">✨</button>`}
          <div class="scene-title wrap">
            <p class="kicker">Місце ${idx + 1} з ${LOCS.length}${got ? " · ✓ печатку отримано" : ""}</p>
            <h1><span>${l.map.icon}</span> ${esc(l.name)}</h1>
          </div>
        </div>
        <div class="wrap scene-body">
          <div class="scene-top">
            <a class="btn ghost" href="#" data-back>← На карту</a>
            <div class="scene-pager">
              <a class="btn ghost" href="#${prev.id}" aria-label="Попереднє місце: ${esc(prev.name)}">← ${prev.map.icon}</a>
              <a class="btn ghost" href="#${next.id}" aria-label="Наступне місце: ${esc(next.name)}">${next.map.icon} →</a>
            </div>
          </div>
          <div class="guide" style="--c:${HERO_STYLE[guide.id].c};--cs:${HERO_STYLE[guide.id].cs}">
            <img src="assets/img/heroes/${guide.id}.jpg" alt="${esc(guide.name)}">
            <p class="bubble"><b>${esc(guide.name)}:</b> ${esc(SCENE_GUIDES[guide.id](l.name))}</p>
          </div>
          <div class="scene-grid">
            <div class="scene-main">
              <p class="scene-desc">${esc(l.desc)}.</p>
              ${l.places ? `<p><b>Тут є:</b> ${esc(l.places.join(", "))}.</p>` : ""}
              ${art && art.from ? `<p class="hint">Ілюстрація з казки «<a href="read.html?id=${art.from.id}">${esc(art.from.title)}</a>».</p>` : ""}
              ${ss.length ? `<h2>Пригоди тут</h2><div class="mini-list scene-stories">${ss.map((s) => `
                <a class="mini" ${readable(s) ? `href="read.html?id=${s.id}"` : ""}>${s.cover ? `<img src="${s.cover}" alt="" loading="lazy">` : `<span class="mini-empty">📜</span>`}
                  <span><b>${esc(s.title)}</b>${s.lesson ? `<small>${esc(s.lesson)}</small>` : ""}${readable(s) ? `<small>⏱ ≈ ${readMinutes(s)} хв</small>` : "<small>скоро</small>"}</span></a>`).join("")}</div>` : ""}
            </div>
            <aside class="scene-side">
              <div class="card task${got ? " done" : ""}"><div class="body">
                <p class="kicker">Завдання дослідника</p>
                ${got ? `<h3>✓ Печатку знайдено!</h3><p>Ти вже знайшов(-ла) чарівну іскорку в цьому місці.</p>`
                      : `<h3>Знайди іскорку ✨</h3><p>Десь на ілюстрації вгорі ледь блищить чарівна іскорка. Знайди її — і отримаєш печатку місця.</p>`}
                ${firstRead ? `<p><a class="btn" href="read.html?id=${firstRead.id}">📖 Читати «${esc(firstRead.title)}»</a></p>` : ""}
              </div></div>
              ${who.length ? `<div class="card"><div class="body"><h3>Кого тут зустріти</h3><div class="chips">${who.map((v) => `<span class="chip luna">${esc(v.name)}</span>`).join("")}</div></div></div>` : ""}
              ${arts.length ? `<div class="card"><div class="body"><h3>Артефакти</h3><div class="art-thumbs">${arts.map((a) => a.img
                ? `<a class="art-thumb" href="${a.img}.jpg" data-art="${a.id}">${artImg(a)}<span>${esc(a.name)}</span></a>`
                : `<span class="chip crash">✨ ${esc(a.name)}</span>`).join("")}</div></div></div>` : ""}
            </aside>
          </div>
          <p class="scene-back"><a class="btn gold" href="#" data-back>🗺️ Повернутися на карту</a></p>
        </div>`;

      mapView.hidden = true;
      scene.hidden = false;
      scene.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); back(); }));
      scene.querySelectorAll("[data-art]").forEach((t) => t.addEventListener("click", (e) => {   // велика картка артефакту
        e.preventDefault();
        const art = byId(C.artifacts, t.dataset.art);
        let dlg = document.getElementById("artDlg");
        if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "artDlg"; dlg.className = "art-dlg"; document.body.append(dlg); dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); }); }
        dlg.innerHTML = `<form method="dialog"><img src="${art.img}.jpg" alt="${esc(art.name)}: ${esc(art.desc)}"><button class="btn gold" value="close">Закрити</button></form>`;
        dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
      }));
      const sp = $(".spark", scene);
      if (sp) sp.addEventListener("click", () => {
        const st = stamps(); st[l.id] = Date.now(); store.set("stamps", st);
        sp.classList.add("got");
        const n = LOCS.filter((x) => st[x.id]).length;
        celebrate(l.map.icon, "Печатка дослідника!", l.name,
          n === LOCS.length ? "🎉 Ти зібрав(-ла) печатки всіх місць СилаВолії!" : `Печатка місця «${l.name}» тепер у твоїй колекції.`,
          `${n} з ${LOCS.length} печаток`);
        refreshCounters(); checkBadges();
        setTimeout(() => openScene(l.id, false), 650);
      });
      if (push && location.hash.slice(1) !== id) history.pushState(null, "", "#" + id);
      document.title = l.name + " — СилаВолія";
      window.scrollTo({ top: 0 });
    }
    function back() {
      const was = current;
      history.pushState(null, "", location.pathname);
      document.title = "Світ — СилаВолія";
      showMap(was);
      const pin = was && main.querySelector(`.pin[data-id="${was}"]`);
      (pin || mapView).scrollIntoView({ block: "center" });
    }
    function applyFilter() {
      main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
      main.querySelectorAll(".pin").forEach((p) => {
        const l = byId(C.locations, p.dataset.id);
        p.classList.toggle("dim", filter !== "all" && !series(l).has(filter));
      });
    }
    main.querySelectorAll(".pin").forEach((p) => {
      p.addEventListener("click", () => openScene(p.dataset.id));
      p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openScene(p.dataset.id); } });
    });
    main.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; applyFilter(); }));
    applyFilter();
    const route = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h && byId(LOCS, h)) { if (h !== current) openScene(h, false); }
      else if (current) showMap(current);
    };
    window.addEventListener("hashchange", route);
    window.addEventListener("popstate", route);
    showMap();
    route();
  };

  /* спільне вікно-нагорода (секрети, печатки) */
  function celebrate(icon, kicker, title, msg, count, link) {
    let dlg = document.getElementById("secretDlg");
    if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "secretDlg"; dlg.className = "secret-dlg"; document.body.append(dlg); }
    dlg.innerHTML = `<form method="dialog" class="body">
      <div class="secret-big">${icon}</div><p class="kicker">${esc(kicker)}</p><h2>${esc(title)}</h2><p>${esc(msg)}</p>
      <p class="secret-count">${esc(count)}</p>
      <div class="chips" style="justify-content:center;gap:10px">${link ? `<a class="btn gold" href="${link[0]}">${esc(link[1])}</a>` : ""}<button class="btn ${link ? "ghost" : "gold"}" value="close">${link ? "Шукати далі" : "Чудово!"}</button></div>
    </form>`;
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  }

  pages.library = function (main) {
    let filter = store.get("libFilter", "all");
    let q = "";
    const all = ORDER();
    const readMap = store.get("read", {});
    const nRead = all.filter((s) => readMap[s.id]).length;
    const reading = all.filter((s) => readState(s).started);
    const nextUp = all.find((s) => !readMap[s.id]);
    main.innerHTML = `<section class="section wrap"><p class="kicker">Пригоди</p><h1>Бібліотека пригод</h1>
      <p class="lead">Усі казки про Фіна, Краша і Луну. Читай, слухай, виконуй завдання після казки — і збирай печатки читача.</p>
      <div class="lib-progress card"><div class="body">
        <div class="lib-progress-row"><b>📜 Печатки читача: ${nRead} з ${all.length}</b>
          ${nextUp ? `<a class="btn${reading.length ? " ghost" : ""}" href="read.html?id=${nextUp.id}">${nRead ? "Наступна непрочитана" : "Почати з першої"}: «${esc(nextUp.title)}» →</a>` : `<span class="chip crash">🎉 Усі казки прочитано!</span>`}</div>
        <div class="collect-progress" role="img" aria-label="Прочитано ${nRead} з ${all.length}"><i style="width:${nRead / all.length * 100}%"></i></div>
      </div></div>
      ${reading.length ? `<h2 class="series-title">Продовжити читання</h2><div class="grid">${reading.map(storyCard).join("")}</div>` : ""}
      <div class="filters" role="group" aria-label="Серії">
        <button data-f="all">Усі</button>${D.series.map((s) => `<button data-f="${s.id}">${esc(s.name)}</button>`).join("")}<button data-f="unread">Непрочитані</button>
        <input type="search" placeholder="Пошук: назва, мораль, почуття…" aria-label="Пошук">
      </div><div id="shelves"></div></section>`;
    const shelves = $("#shelves", main);
    function render() {
      const match = (s) => (filter !== "unread" || (readable(s) && !readMap[s.id])) &&
        (!q || (s.title + " " + (s.lesson || "") + " " + (s.conflict || "")).toLowerCase().includes(q));
      const html = D.series.filter((se) => filter === "all" || filter === "unread" || filter === se.id).map((se) => {
        const list = D.stories.filter((s) => s.series === se.id && match(s));
        return list.length ? `<h2 class="series-title">${esc(se.name)}</h2><div class="grid">${list.map(storyCard).join("")}</div>` : "";
      }).join("");
      shelves.innerHTML = html || `<p class="empty-note">Нічого не знайдено.</p>`;
      main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
    }
    main.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; store.set("libFilter", filter); render(); }));
    $("input", main).addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); render(); });
    render();
  };

  const gameCards = (group) => D.games.filter((g) => (g.group || "adventure") === group).map((g) =>
    `<a class="card" href="${g.file}"><div class="cover empty game">${g.icon || "🎮"}</div><div class="body"><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p></div></a>`).join("");

  /* ---------- крамниця ---------- */
  pages.shop = function (main) {
    const S = D.shop;
    if (!S) { main.innerHTML = `<section class="section wrap"><h1>Крамниця скоро відкриється</h1></section>`; return; }
    const books = S.books.filter((b) => b.cover || b.title);
    let cart = store.get("cart", {});
    let filter = "all";
    const price = (n) => n.toLocaleString("uk-UA") + " ₴";
    main.innerHTML = `
      <section class="section wrap shop-hero"><h1>Книжкова Крамниця</h1>
        <p class="lead">Друковані книжки серії СилаВолія — яскраві ілюстрації, якісний папір і казковий світ, який можна тримати в долонях. Замовляй — і Фін, Краш та Луна прийдуть до тебе додому!</p>
        <div class="filters" role="group" aria-label="Показати">
          <button data-f="all">Усі книжки</button><button data-f="yes">В наявності</button><button data-f="soon">Незабаром</button>
          <button class="btn cart-btn" id="openCart" type="button">🛒 Кошик <b id="cartN">0</b></button>
        </div>
        <div class="grid" id="books"></div></section>
      <section class="section wrap"><div class="grid perks">${S.perks.map(([i, t, d]) => `<div class="card"><div class="body"><div class="lesson-icon">${i}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></div>`).join("")}</div>
        <p class="hint" style="text-align:center">Питання: <a href="mailto:${esc(S.contacts.email)}">${esc(S.contacts.email)}</a></p></section>
      <dialog class="cart-dlg" id="cart"><form method="dialog" class="body" id="cartForm"></form></dialog>`;
    const grid = $("#books", main), dlg = $("#cart", main), form = $("#cartForm", main);
    const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
    const total = () => books.reduce((a, b) => a + (cart[b.story] || 0) * b.price, 0);
    function save() { store.set("cart", cart); $("#cartN", main).textContent = count(); }
    function render() {
      main.querySelectorAll(".filters button[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
      grid.innerHTML = books.filter((b) => filter === "all" || (filter === "yes") === b.available).map((b) => {
        const q = cart[b.story] || 0;
        const s = story(b.story);
        return `<div class="card book-card">
          ${b.cover ? `<img class="cover tall" src="${b.cover}" alt="Обкладинка «${esc(b.title)}»" loading="lazy">` : `<div class="cover empty">📕</div>`}
          ${b.badge || !b.available ? `<span class="ribbon${b.available ? "" : " soon"}">${esc(b.available ? b.badge : "Незабаром")}</span>` : ""}
          <div class="body"><h3>${esc(b.title)}</h3><p>${esc(b.desc)}</p>
            ${b.moral ? `<p class="lesson">${esc(b.moral)}</p>` : ""}
            <div class="chips"><span class="chip">📄 ${b.pages} стор.</span><span class="chip crash">👧 ${esc(b.age)} років</span>
              ${s && readable(s) ? `<a class="chip luna" href="read.html?id=${s.id}">📖 Читати онлайн</a>` : ""}</div>
            <div class="buy">${b.available
              ? `<b class="price">${price(b.price)}</b>${q
                ? `<span class="qty"><button type="button" data-d="-1" data-id="${b.story}" aria-label="Менше">−</button><b>${q}</b><button type="button" data-d="1" data-id="${b.story}" aria-label="Більше">+</button></span>`
                : `<button class="btn" type="button" data-d="1" data-id="${b.story}">У кошик</button>`}`
              : `<span class="price soon">Незабаром</span>`}</div>
          </div></div>`;
      }).join("");
      grid.querySelectorAll("[data-d]").forEach((x) => x.addEventListener("click", () => {
        const id = x.dataset.id; cart[id] = Math.max(0, (cart[id] || 0) + +x.dataset.d); if (!cart[id]) delete cart[id];
        save(); render();
      }));
    }
    function orderText(f) {
      const lines = books.filter((b) => cart[b.story]).map((b) => `• ${b.title} × ${cart[b.story]} = ${price(b.price * cart[b.story])}`);
      return [`Замовлення книжок СилаВолія`, ...lines, `Разом: ${price(total())}`, ``, `Ім'я: ${f.name}`, `Телефон: ${f.phone}`,
        `Доставка: ${f.delivery}${f.city ? ", " + f.city : ""}`, f.comment ? `Коментар: ${f.comment}` : ""].filter((x) => x !== null).join("\n").trim();
    }
    function openCart() {
      const items = books.filter((b) => cart[b.story]);
      form.innerHTML = `<div class="dlg-head"><h2>🛒 Кошик</h2><button class="icon-btn" value="close" aria-label="Закрити">✕</button></div>
        ${items.length ? `<ul class="cart-list">${items.map((b) => `<li><span>${esc(b.title)} × ${cart[b.story]}</span><b>${price(b.price * cart[b.story])}</b></li>`).join("")}</ul>
          <p class="cart-total">Разом: <b>${price(total())}</b></p><p class="hint">💡 ${esc(S.payment_note)}</p>
          <label>Ім'я *<input name="name" required autocomplete="name"></label>
          <label>Телефон *<input name="phone" required type="tel" autocomplete="tel"></label>
          <label>Спосіб доставки<select name="delivery"><option>Нова Пошта</option><option>Укрпошта</option><option>Самовивіз</option></select></label>
          <label>Місто та відділення<input name="city"></label>
          <label>Коментар / побажання<textarea name="comment" rows="2"></textarea></label>
          <p class="hint">Натисни зручний месенджер — відкриється чат із готовим текстом замовлення. Сайт нікуди сам дані не надсилає.</p>
          <div class="chips" style="gap:10px">
            ${S.contacts.telegram ? `<button class="btn" type="button" data-m="tg">✈️ Telegram</button>` : ""}
            ${S.contacts.viber ? `<button class="btn" type="button" data-m="viber">📲 Viber</button>` : ""}
            ${S.contacts.email ? `<button class="btn ghost" type="button" data-m="mail">✉️ Пошта</button>` : ""}
          </div>`
        : `<p>Кошик порожній. Обери книжку, яка «в наявності».</p>`}`;
      form.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => {
        if (!form.reportValidity()) return;
        const f = Object.fromEntries(new FormData(form));
        const text = encodeURIComponent(orderText(f));
        const url = { tg: `https://t.me/${S.contacts.telegram}?text=${text}`, viber: `viber://chat?number=%2B${S.contacts.viber}&text=${text}`,
          mail: `mailto:${S.contacts.email}?subject=${encodeURIComponent("Замовлення книжок СилаВолія")}&body=${text}` }[b.dataset.m];
        window.open(url, "_blank");
      }));
      dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    }
    $("#openCart", main).addEventListener("click", openCart);
    main.querySelectorAll(".filters button[data-f]").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; render(); }));
    save(); render();
  };

  pages.school = function (main) {
    const sch = byId(C.locations, "school");
    const list = D.stories.filter((s) => s.location === "school");
    main.innerHTML = `
      <section class="section wrap"><h1>Школа «ШляхдоМрій»</h1><p class="lead">${esc(sch.desc)}.</p>
        <p><b>У школі є:</b> ${esc(sch.places.join(", "))}.</p></section>
      <section class="section wrap" id="lessons"></section>
      <section class="section wrap"><h2>Шкільні історії</h2><div class="grid">${list.map(storyCard).join("")}</div></section>
      <section class="section wrap" id="math"><h2>Ментальна арифметика</h2>
        <p class="lead">Абакус СилаВолії приховує шлях до таємних кімнат — а ці тренажери допоможуть рахувати швидко, як Луна.
          ${story("B07") && readable(story("B07")) ? ` Спершу прочитай казку <a href="read.html?id=B07">«${esc(story("B07").title)}»</a>.` : ""}</p>
        <div class="grid">${gameCards("math")}</div></section>
      <section class="section wrap"><h2>Ігри</h2><p class="lead">Чарівні випробування для майбутніх учнів школи.</p>
        <div class="grid">${gameCards("adventure")}</div></section>`;
    if (window.SVLessons) window.SVLessons.schoolSection($("#lessons", main));
  };

  /* ---------- читалка ---------- */
  function reader() {
    const id = new URLSearchParams(location.search).get("id");
    const s = story(id);
    const root = $("#book");
    if (!s || !readable(s)) {
      root.innerHTML = `<div class="the-end"><h1>Книжку не знайдено</h1><p><a class="btn" href="library.html">До бібліотеки</a></p></div>`;
      return;
    }
    document.title = s.title + " — СилаВолія";
    $("#title").textContent = s.title;
    const total = s.pages.length + 1;          // + сторінка «Кінець»
    const saved = store.get("pos:" + s.id, 0);
    let i = Math.min(saved, total - 1);
    let fs = store.get("fs", 1.2);
    const order = D.stories.filter((x) => readable(x) && x.status !== "draft");
    const next = order[order.indexOf(s) + 1];

    const villain = s.villain && byId(C.villains, s.villain);
    const guide = C.heroes[[...s.id].reduce((a, c) => a + c.charCodeAt(0), 0) % C.heroes.length];
    const SAY = {
      fin: "Мені аж тепло на серці стало. Ця казка про те, що доброта сильніша за будь-яку темряву.",
      crash: "Дзень-дзелень! От це пригода! Я б зараз пострибав від радості — а ти?",
      luna: "Цікаво, що ти запам'ятаєш з цієї казки? Давай перевіримо одним запитанням.",
    };
    const loc = s.location && byId(C.locations, s.location) || C.locations.find((l) => l.map && l.stories.includes(s.id));
    // завдання після казки: обрати мораль цієї казки серед трьох
    const others = order.filter((x) => x !== s && x.lesson && x.lesson !== s.lesson);
    const seed = [...s.id].reduce((a, c) => a * 7 + c.charCodeAt(0), 3);
    const quiz = s.lesson && others.length >= 2
      ? [s.lesson, others[seed % others.length].lesson, others[(seed * 13 + 5) % others.length].lesson]
        .filter((v, k, a) => a.indexOf(v) === k).sort((a, b) => ((a.length * seed) % 7) - ((b.length * seed) % 7))
      : null;
    function endPage() {
      const readMap = store.get("read", {});
      const nRead = order.filter((x) => readMap[x.id]).length;
      const solved = !!store.get("quiz", {})[s.id];
      return `<div class="the-end page-enter"><h1>Кінець 🌈</h1>
        <div class="reward"><span class="reward-seal">📜</span><div><b>Печатка читача!</b><br>Прочитано казок: ${nRead} з ${order.length}</div></div>
        <div class="guide" style="--c:${HERO_STYLE[guide.id].c}"><img src="assets/img/heroes/${guide.id}.jpg" alt="${esc(guide.name)}">
          <p class="bubble"><b>${esc(guide.name)}:</b> ${esc(SAY[guide.id])}</p></div>
        ${villain && villain.became ? `<p>${esc(villain.name)} → ${esc(villain.became)}</p>` : ""}
        ${quiz && quiz.length > 1 ? `<div class="end-task card${solved ? " solved" : ""}"><div class="body">
          <p class="kicker">Завдання після казки</p><h3>Яка мораль цієї казки?</h3>
          <div class="end-opts">${quiz.map((o) => `<button type="button" class="answer${solved && o === s.lesson ? " right" : ""}" ${solved ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
          <p class="end-fb" aria-live="polite">${solved ? "⭐ Завдання виконано!" : ""}</p></div></div>`
        : s.lesson ? `<div class="moral"><b>Мораль:</b> ${esc(s.lesson)}</div>` : ""}
        ${loc ? `<p><a class="chip crash" href="world.html#${loc.id}">${loc.map ? loc.map.icon : "🗺️"} Побувати в місці: ${esc(loc.name)}</a></p>` : ""}
        <div class="actions">
          <button class="btn ghost" id="again">↺ Читати знову</button>
          ${next ? `<a class="btn" href="read.html?id=${next.id}">Далі: «${esc(next.title)}» →</a>` : ""}
          <a class="btn ghost" href="library.html">До бібліотеки</a>
        </div></div>`;
    }
    function render(dir) {
      stopSpeech();
      const prog = $(".progress i");
      prog.style.width = ((i + 1) / total * 100) + "%";
      $("#count").textContent = `${Math.min(i + 1, total - 1)} / ${total - 1}`;
      $("#prev").disabled = i === 0;
      $("#next").disabled = i === total - 1;
      if (i === total - 1) {
        const rm = store.get("read", {});
        if (!rm[s.id]) { rm[s.id] = Date.now(); store.set("read", rm); checkBadges(); }
        root.innerHTML = endPage();
        $("#again").addEventListener("click", () => go(-i));
        root.querySelectorAll(".end-opts .answer").forEach((b) => b.addEventListener("click", () => {
          const ok = b.textContent === s.lesson;
          const fb = $(".end-fb", root);
          if (ok) {
            root.querySelectorAll(".end-opts .answer").forEach((x) => { x.disabled = true; x.classList.toggle("right", x === b); });
            const q = store.get("quiz", {}); q[s.id] = Date.now(); store.set("quiz", q);
            $(".end-task", root).classList.add("solved");
            fb.textContent = "⭐ Правильно! Завдання виконано.";
            checkBadges();
          } else {
            b.disabled = true; b.classList.add("wrong");
            fb.textContent = "Майже! Згадай, чого навчилися герої, — і спробуй ще.";
          }
        }));
      } else {
        const p = s.pages[i];
        const cls = ["page", "page-enter", p.img ? "has-img" : "text-only", p.text.length ? "has-text" : "cover-only"].join(" ");
        root.innerHTML = `<div class="${cls}" style="--dir:${dir < 0 ? "-30px" : "30px"}">
          ${p.img ? `<div class="pic"><img src="${p.img_s || p.img}" ${p.img_s ? `srcset="${p.img_s} 700w, ${p.img} 1400w" sizes="(max-width: 760px) 92vw, 50vw"` : ""} alt="${i === 0 ? "Обкладинка" : "Ілюстрація, сторінка " + i}"></div>` : ""}
          ${p.text.length ? `<div class="txt" style="--fs:${fs}rem">${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}
        </div>`;
        const np = s.pages[i + 1];
        const pic = $(".pic img", root);
        if (np && np.img && pic) {                  // підвантажити наступну ілюстрацію того ж розміру
          const pre = new Image();
          if (np.img_s) { pre.sizes = pic.sizes; pre.srcset = `${np.img_s} 700w, ${np.img} 1400w`; }
          pre.src = np.img_s || np.img;
        }
      }
      store.set("pos:" + s.id, i);
      store.set("last", { id: s.id });
      window.scrollTo({ top: 0 });
    }
    function go(d) {
      const n = Math.max(0, Math.min(total - 1, i + d));
      if (n !== i) { i = n; render(d); }
    }
    $("#prev").addEventListener("click", () => go(-1));
    $("#next").addEventListener("click", () => go(1));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    });
    let x0 = null;
    root.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      x0 = null;
    });
    function setFs(d) {
      fs = Math.max(1, Math.min(1.8, Math.round((fs + d) * 10) / 10));
      store.set("fs", fs);
      const t = $(".txt", root);
      if (t) t.style.setProperty("--fs", fs + "rem");
    }
    /* нічне читання без відволікань */
    const focusBtn = $("#focus");
    function setFocus(on) {
      document.body.classList.toggle("focus", on);
      if (focusBtn) { focusBtn.setAttribute("aria-pressed", String(on)); focusBtn.textContent = on ? "☀️" : "🌙"; }
      store.set("focus", on);
    }
    if (focusBtn) { focusBtn.addEventListener("click", () => setFocus(!document.body.classList.contains("focus"))); setFocus(store.get("focus", false)); }
    $("#smaller").addEventListener("click", () => setFs(-0.1));
    $("#bigger").addEventListener("click", () => setFs(0.1));

    /* читання вголос (голос браузера, якщо є українська) */
    const synth = window.speechSynthesis;
    const speakBtn = $("#speak");
    let voice = null, speaking = false;
    function pickVoice() {
      if (!synth) return;
      voice = synth.getVoices().find((v) => /^uk/i.test(v.lang)) || null;
      speakBtn.hidden = !voice;
    }
    function stopSpeech() {
      if (synth && speaking) synth.cancel();
      speaking = false;
      speakBtn.setAttribute("aria-pressed", "false");
      root.querySelectorAll(".speaking").forEach((p) => p.classList.remove("speaking"));
    }
    if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener("voiceschanged", pickVoice); } else speakBtn.hidden = true;
    speakBtn.addEventListener("click", () => {
      if (speaking) return stopSpeech();
      const ps = [...root.querySelectorAll(".txt p")];
      if (!ps.length || !voice) return;
      speaking = true;
      speakBtn.setAttribute("aria-pressed", "true");
      let k = 0;
      const say = () => {
        if (!speaking) return;
        ps.forEach((p) => p.classList.remove("speaking"));
        if (k >= ps.length) { stopSpeech(); return; }
        ps[k].classList.add("speaking");
        const u = new SpeechSynthesisUtterance(ps[k].textContent);
        u.voice = voice; u.lang = voice.lang; u.rate = 0.92;
        u.onend = () => { k++; say(); };
        synth.speak(u);
      };
      say();
    });
    render(1);
  }

  /* спільні засоби для інших скриптів (lessons.js) */
  window.SV = { D, C, $, esc, byId, story, readable, store, pages, storyCard, HERO_STYLE, checkBadges, refreshCounters };

  /* ---------- запуск ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "read") return reader();
    chrome(page);
    const main = $("main");
    if (pages[page]) pages[page](main);
    placeSecrets(page);
    checkBadges();
  });
})();
