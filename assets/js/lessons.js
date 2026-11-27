/* СилаВолія — уроки школи «ШляхдоМрій» як міні-ігри.
   Сторінка уроку: lesson.html?id=<id>. Прогрес (зірки) — у localStorage. Дані канону — window.SAGA. */
(function () {
  "use strict";
  const SV = window.SV;
  if (!SV) return;
  const { C, D, $, esc, byId, story, readable, store } = SV;
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Ігровий таймер: рахує лише час, коли сторінку видно (вкладка у фоні — гра на паузі). */
  function gameClock(seconds, onTick, onEnd) {
    let elapsed = 0, last = null, stopped = false;
    function frame(now) {
      if (stopped) return;
      if (last !== null && !document.hidden) elapsed += Math.min(now - last, 100);
      last = now;
      const left = Math.max(0, 1 - elapsed / (seconds * 1000));
      onTick(left);
      if (left <= 0) { stopped = true; onEnd(); } else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { stop() { stopped = true; } };
  }

  /* ---------- звук (синтез, без файлів) ---------- */
  let ac = null;
  const muted = () => store.get("mute", false);
  function tone(freq, dur = 0.25, type = "sine", vol = 0.18, when = 0) {
    if (muted()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* без звуку */ }
  }
  const sfx = {
    bell: () => { tone(1318, 0.5, "sine", 0.15); tone(1976, 0.4, "sine", 0.06, 0.02); },
    good: () => { tone(784, 0.15, "triangle"); tone(1046, 0.25, "triangle", 0.18, 0.12); },
    soft: () => tone(220, 0.25, "sine", 0.12),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, "triangle", 0.16, i * 0.12)),
    note: (i) => tone([523, 659, 784, 988, 1175][i % 5], 0.35, "sine", 0.18),
  };

  /* ---------- вчителі (анімовані портрети з «Пригоди Фіна/персони») і картинки ---------- */
  const IMG = "assets/img/";
  const TEACH = {
    owl: { name: "Сова-Всезнайка", talk: IMG + "school/owl-talk.gif", happy: IMG + "school/owl-happy.gif" },
    aria: { name: "Професорка Арія", talk: IMG + "school/aria-talk.gif", happy: IMG + "school/aria-happy.gif" },
    founder: { name: "Засновник школи", talk: IMG + "school/founder-talk.gif", happy: IMG + "school/founder-happy.gif" },
    fin: { name: "Фін", talk: IMG + "heroes/fin.jpg", happy: IMG + "heroes/fin.jpg", still: true },
    crash: { name: "Краш", talk: IMG + "heroes/crash.jpg", happy: IMG + "heroes/crash.jpg", still: true },
    luna: { name: "Луна", talk: IMG + "heroes/luna.jpg", happy: IMG + "heroes/luna.jpg", still: true },
  };
  const artImg = (id, gif) => `${IMG}artifacts/${id}${gif ? ".gif" : "-s.jpg"}`;
  const vImg = (id, after) => `${IMG}villains/${id}-${after ? "after" : "before"}-s.jpg`;
  /* вчитель говорить: анімований портрет + бульбашка */
  function teacherSay(who, text, mood = "talk", cls = "") {
    const t = TEACH[who] || TEACH.owl;
    return `<div class="tsay ${cls}${t.still ? " still" : ""}"><img class="tsay-pic" src="${mood === "happy" ? t.happy : t.talk}" alt="${esc(t.name)}"><div class="tsay-bubble"><b>${esc(t.name)}</b><span>${text}</span></div></div>`;
  }
  /* банер уроку — ілюстрація з казки, за якою урок */
  function lessonBanner(les) {
    const s = story(les.story);
    if (!s || !readable(s)) return "";
    const p = s.pages.find((x, k) => k >= (les.page || 1) && x.img) || s.pages[0];
    return p && p.img ? (p.img_s || p.img) : "";
  }

  /* ---------- прогрес ---------- */
  const stars = () => store.get("stars", {});
  const giveStar = (id) => { const s = stars(); s[id] = true; store.set("stars", s); if (SV.refreshCounters) { SV.refreshCounters(); SV.checkBadges(); } };

  /* ---------- уроки ---------- */
  const LESSONS = [];
  const L = (o) => LESSONS.push(o);

  /* 1. Заклинання Радості — розфарбуй сірі хмаринки дзвіночком Краша */
  L({
    id: "joy", guide: "owl", art: "", page: 1, icon: "☀️", title: "Заклинання Радості", teacher: "Сова-Всезнайка та Краш", story: "B00",
    skill: "Уважність і швидкість",
    intro: "Над школою пливуть сірі сумні хмаринки. Торкайся їх — і Дзвіночок Радості Краша перетворить сум на веселку! Розфарбуй 15 хмаринок, поки сяє сонце.",
    moral: "Навіть найменша радість перемагає найбільший смуток.",
    run(area, done) {
      const GOAL = 15, TIME = 40;
      area.innerHTML = `<div class="hud"><span>🌈 <b id="sc">0</b> / ${GOAL}</span><div class="timer"><i id="tm"></i></div></div><div class="sky" id="sky"></div>`;
      const sky = $("#sky", area), sc = $("#sc", area), tm = $("#tm", area);
      let score = 0, over = false, clock = null, spawnEvery = 1000;
      const JOY = ["🌈", "⭐", "🌸", "🦋", "🌻", "✨"];
      function spawn() {
        if (over) return;
        if (document.hidden) { setTimeout(spawn, 500); return; }   // у фоні нові хмаринки не з'являються
        const c = document.createElement("button");
        c.className = "cloud"; c.type = "button"; c.setAttribute("aria-label", "Сіра хмаринка");
        c.innerHTML = "<span>😟</span>";
        c.style.left = 3 + rnd(72) + "%";
        const dur = 5200 - Math.min(2600, score * 160);
        c.style.animationDuration = dur + "ms";
        setTimeout(() => c.remove(), dur + 300);      // запасне прибирання, якщо animationend не прийде
        c.addEventListener("pointerdown", () => {
          if (c.classList.contains("happy") || over) return;
          c.classList.add("happy"); c.innerHTML = `<span>${JOY[rnd(JOY.length)]}</span>`; sfx.bell();
          score++; sc.textContent = score;
          setTimeout(() => c.remove(), 600);
          if (score >= GOAL) finish(true);
        });
        c.addEventListener("animationend", () => c.remove());
        sky.append(c);
        spawnEvery = Math.max(450, spawnEvery - 25);
        setTimeout(spawn, spawnEvery);
      }
      function finish(ok) {
        if (over) return;
        over = true; clock && clock.stop();
        done(ok, ok ? `Усі ${GOAL} хмаринок сяють веселкою!` : `Розфарбовано ${score} з ${GOAL}. Спробуй ще — у тебе вийде!`);
      }
      spawn();
      clock = gameClock(TIME, (left) => { tm.style.width = left * 100 + "%"; }, () => finish(false));
    },
  });

  /* 2. Зілля Зоряного Сяйва — запам'ятай порядок інгредієнтів */
  L({
    id: "potion", guide: "aria", art: "", page: 2, icon: "🧪", title: "Зілля Зоряного Сяйва", teacher: "Професорка Арія та Луна", story: "B05",
    skill: "Пам'ять",
    intro: "Медальйон Луни показує, у якому порядку кидати інгредієнти в казанок. Подивись, запам'ятай і повтори! Зілля буде готове після п'яти вдалих спроб.",
    moral: "Знання народжуються у сміливості, доброті та дружбі.",
    run(area, done) {
      const ING = [["⭐", "Зоряний пил"], ["🌙", "Місячна роса"], ["🌸", "Пелюстка мрії"], ["🍯", "Сонячний мед"]];
      area.innerHTML = `<div class="hud"><span>Крок <b id="rd">1</b> / 5</span><span id="msg">Дивись уважно…</span></div>
        <div class="potion"><div class="cauldron" id="cd">🫕</div>
        <div class="ings">${ING.map(([e, n], i) => `<button class="ing" data-i="${i}" type="button" aria-label="${n}"><span>${e}</span><small>${n}</small></button>`).join("")}</div></div>`;
      const btns = [...area.querySelectorAll(".ing")], msg = $("#msg", area), rd = $("#rd", area), cd = $("#cd", area);
      let round = 1, seq = [], pos = 0, input = false;
      const flash = async (i) => { btns[i].classList.add("lit"); sfx.note(i); await wait(450); btns[i].classList.remove("lit"); await wait(180); };
      async function show() {
        input = false; msg.textContent = "Дивись уважно…"; btns.forEach((b) => (b.disabled = true));
        await wait(600);
        for (const i of seq) await flash(i);
        input = true; pos = 0; msg.textContent = "Твоя черга!"; btns.forEach((b) => (b.disabled = false));
      }
      function next() { seq.push(rnd(4)); rd.textContent = round; show(); }
      btns.forEach((b) => b.addEventListener("click", async () => {
        if (!input) return;
        const i = +b.dataset.i;
        b.classList.add("lit"); setTimeout(() => b.classList.remove("lit"), 200);
        if (i !== seq[pos]) { sfx.soft(); input = false; msg.textContent = "Ой! Луна покаже ще раз 🌙"; area.querySelector(".potion").classList.add("shake"); await wait(500); area.querySelector(".potion").classList.remove("shake"); return show(); }
        sfx.note(i); pos++;
        if (pos === seq.length) {
          input = false; cd.classList.add("bubble"); sfx.good(); msg.textContent = "Чудово!";
          await wait(700); cd.classList.remove("bubble");
          if (round === 5) return done(true, "Зілля Зоряного Сяйва готове — воно сяє, як ціле небо!");
          round++; next();
        }
      }));
      seq = [rnd(4)]; next();
    },
  });

  /* 3. Мова Дружби — зрозумій серцем, що допоможе */
  const FRIEND = [
    ["tinsum", "Сіра тінь краде радісні мрії у мішок.", "Показати, що радість можна створювати самому, і дати їй крейду", ["Відібрати мішок і прогнати", "Сховатися й нічого не робити"]],
    ["spider", "Павук обплутав Дерево Кольорових Мрій: «Вони всі мої!»", "Показати, як сумують діти без мрій", ["Порвати павутину й насварити Павука", "Віддати йому всі мрії"]],
    ["sleepy_bugs", "Сонні Жучки забрали світло зірок для теплих подушок.", "Пояснити, що зорі потрібні дітям, і навчити робити подушки з хмар", ["Розбудити й насварити", "Забрати подушки силою"]],
    ["zabuvaka", "Маленький Забувака обійняв шкільний дзвін, і всі забувають уроки.", "Зігріти його й показати, що він не один", ["Прогнати з вежі", "Розбити дзвін"]],
    ["hurry_ghost", "Привид-Поспішайко змушує весь світ бігти швидше.", "Зробити разом щось нове й веселе — і навчити вчасно зупинятися", ["Бігти ще швидше за ним", "Наказати йому зникнути"]],
    ["jester", "Блазень Хихотун жартує так, що всі сміються без упину.", "Тихо розповісти лагідну історію", ["Сміятися ще голосніше", "Накричати на нього"]],
    ["storm", "Морські Коники бояться говорити, і з невимовлених слів росте Шторм Образи.", "Підтримати їх, щоб вони наважилися сказати «Дякую» і «Пробач»", ["Говорити замість них", "Сховатися від шторму назавжди"]],
    ["nyukhokrad", "НюхоКрад зібрав усі запахи міста в баночки, бо втратив свій.", "Створити для нього новий «Запах Дружби»", ["Відібрати всі баночки", "Замкнути його печеру"]],
    ["crooked_mirror", "Криве Дзеркало висміює найменшу помилку.", "Не боятися помилок і бути собою", ["Ховати всі свої помилки", "Розбити дзеркало"]],
    ["fear_shadows", "З Дзеркального Озера встали Тіні Страху — у кожного своя.", "Допомогти друзям подолати їхні страхи", ["Втекти від озера", "Битися зі своєю тінню самому"]],
  ];
  L({
    id: "friendship", guide: "owl", art: "friendship_scent", page: 1, icon: "💞", title: "Мова Дружби", teacher: "Сова-Всезнайка", story: "C08",
    skill: "Емпатія",
    intro: "У СилаВолії ворогів не проганяють — їх розуміють. Прочитай, що сталося, і обери, що допоможе по-справжньому. Відповідай серцем!",
    moral: "Кожна «темна» істота стає світлішою, коли її зрозуміють.",
    run(area, done) { quiz(area, done, pick(FRIEND, 8).map(([vid, sit, ok, bad]) => {
      const v = byId(C.villains, vid);
      const name = v ? v.name : "";
      const named = name.split(/[\s-]+/).some((w) => w.length > 3 && sit.includes(w));
      const head = name && !named ? `<b>${esc(name)}</b>. ` : "";   // не повторювати ім'я двічі
      return { q: `${head}${esc(sit)}<br><b>Що допоможе?</b>`, ok, bad, after: v && v.became ? `Так і сталося в казці: ${v.name} → ${v.became}.` : "", sid: v && v.story,
        img: vImg(vid), imgOk: `${IMG}villains/${vid}.gif`, imgCls: "morph-gif" };
    }), 6, "Ти відповідаєш серцем!"); },
  });

  /* 4. ДодайСил — камінь реагує на почуття */
  const FAITH = [
    ["Камінь ДодайСил у лапках Фіна холодний. Що зробити?", "Згадати, як Краш учив ловити сонячних зайчиків", ["Стиснути камінь щосили", "Сказати: «Я невдаха»"]],
    ["Друзі втомилися, допомагаючи Фіну.", "Подякувати їм і міцно обійняти", ["Сховатися, щоб нікому не заважати", "Попросити ще більше допомоги"]],
    ["Луна читає казку на ніч під зоряним небом.", "Відчути тепло і радість поруч із подругою", ["Думати тільки про силу", "Позіхати й не слухати"]],
    ["У Краша не виходить заклинання.", "Підбадьорити: «У тебе вийде, я поруч!»", ["Посміятися з нього", "Відвернутися"]],
    ["Фін помилився на уроці, і всі засміялися.", "Посміятися разом і спробувати знову", ["Розсердитися на всіх", "Більше ніколи не пробувати"]],
    ["То що ж насправді живить ДодайСил?", "Любов до друзів", ["Сила м'язів", "Найскладніші закляття"]],
  ];
  L({
    id: "faith", guide: "owl", art: "dodaysyl", page: 1, icon: "🔮", title: "Камінь «ДодайСил»", teacher: "Сова-Всезнайка", story: "B02",
    skill: "Віра в себе",
    intro: "Камінь ДодайСил світиться не від сили, а від щирих почуттів. Допоможи Фіну: обирай теплі думки — і камінь розгориться золотом!",
    moral: "Наймогутніша магія — нерозривний зв'язок дружби.",
    run(area, done) {
      let k = 0;
      area.innerHTML = `<div class="stone-wrap"><div class="stone stone-img" id="st" style="--g:0"><img src="${artImg("dodaysyl")}" alt="Камінь ДодайСил"></div><div class="glow-meter"><i id="gm"></i></div></div><div id="qa"></div>`;
      const st = $("#st", area), gm = $("#gm", area), qa = $("#qa", area);
      function ask() {
        const [q, ok, bad] = FAITH[k];
        const opts = shuffle([ok, ...bad]);
        qa.innerHTML = `<p class="question">${esc(q)}</p><p class="hint" style="text-align:center;margin-top:-8px">Обери теплу думку 💛 · ${k} / ${FAITH.length}</p>
          <div class="answers">${opts.map((o) => `<button class="answer" type="button">${esc(o)}</button>`).join("")}</div><p class="feedback" id="fb"></p>`;
        qa.querySelectorAll(".answer").forEach((b) => b.addEventListener("click", async () => {
          if (b.textContent === ok) {
            qa.querySelectorAll(".answer").forEach((x) => (x.disabled = true));   // захист від подвійного натискання
            b.classList.add("right"); sfx.good(); k++;
            st.style.setProperty("--g", k / FAITH.length); gm.style.width = (k / FAITH.length) * 100 + "%";
            st.classList.add("pulse"); await wait(700); st.classList.remove("pulse");
            if (k === FAITH.length) { st.querySelector("img").src = artImg("dodaysyl", true); sfx.win(); await wait(900); return done(true, "Камінь спалахнув золотою веселкою!"); }
            ask();
          } else { b.classList.add("wrong"); b.disabled = true; sfx.soft(); $("#fb", qa).textContent = "Камінь лишився холодним… Спробуй тепліше 💛"; }
        }));
      }
      ask();
    },
  });

  /* 5. Книга «ЗбирайЗнань» — вікторина з казок (питання генеруються з каталогу і канону) */
  function knowledgeQuestions() {
    const S = D.stories.filter((s) => readable(s) && s.lesson && s.status !== "draft" && "ABC".includes(s.series));
    const qs = [];
    for (const s of pick(S, 4)) qs.push({ q: `Яка мораль казки <b>«${esc(s.title)}»</b>?`, ok: s.lesson, bad: pick(S.filter((x) => x.lesson !== s.lesson), 2).map((x) => x.lesson), sid: s.id });
    const V = C.villains.filter((v) => v.became);
    for (const v of pick(V, 2)) qs.push({ q: `Що сталося з «<b>${esc(v.name)}</b>» наприкінці казки?`, ok: v.became, bad: pick(V.filter((x) => x !== v), 2).map((x) => x.became), sid: v.story, img: v.img ? vImg(v.id) : "", imgOk: v.img ? vImg(v.id, true) : "" });
    const A = C.artifacts.filter((a) => a.stories.length);
    for (const a of pick(A, 2)) { const s = story(a.stories[0]); if (s) qs.push({ q: `У якій казці з'являється <b>${esc(a.name)}</b>?`, ok: s.title, bad: pick(S.filter((x) => !a.stories.includes(x.id)), 2).map((x) => x.title), sid: s.id, img: a.img ? artImg(a.id) : "", imgCls: "tall" }); }
    for (const h of pick(C.heroes, 2)) qs.push({ q: `Чия це сила: «${esc(h.power.split(":")[0].replace(/\(.*?\)/g, ""))}»?`, ok: h.name, bad: C.heroes.filter((x) => x !== h).map((x) => x.name), imgOk: `${IMG}heroes/${h.id}.jpg` });
    return shuffle(qs);
  }
  L({
    id: "knowledge", guide: "aria", art: "zbyrayznan", page: 1, icon: "📖", title: "Книга «ЗбирайЗнань»", teacher: "Професорка Арія", story: "B03",
    skill: "Знання казок",
    intro: "Легендарна книга не дає відповідей — вона ставить загадки про казки СилаВолії. Відповідай правильно на 7 з 10 запитань, і книга розкриє свої сторінки!",
    moral: "Довіра і цікавість відкривають найцінніші книги.",
    run(area, done) { quiz(area, done, knowledgeQuestions(), 7, "Книга розкрила тобі свої сторінки!"); },
  });

  /* 6. Іспит «СловоСтріл» — лови добрі слова, оминай пікселі НаноПута */
  L({
    id: "exam", guide: "owl", art: "crystal", page: 1, icon: "💎", title: "Іспит «СловоСтріл»", teacher: "Сова-Всезнайка", story: "B04",
    skill: "Добрі слова",
    intro: "Наповни Магічний Кристал добрими словами! Торкайся слів, що падають згори. Але обережно: сірі пікселі 👾 — це підступи НаноПута, їх не чіпай.",
    moral: "Найсильніша магія — любов, довіра та єдність.",
    run(area, done) {
      const GOAL = 12, TIME = 45;
      const WORDS = ["Дякую", "Пробач", "Люблю", "Радість", "Дружба", "Разом", "Мрія", "Надія", "Сміх", "Допоможу", "Обійми", "Ти зможеш", "Доброта", "Будь ласка"];
      area.innerHTML = `<div class="hud"><span>💎 <b id="sc">0</b> / ${GOAL}</span><div class="timer"><i id="tm"></i></div></div>
        <div class="sky words" id="sky"><div class="crystal crystal-img" id="cr"><img src="${artImg("crystal")}" alt="Магічний Кристал"></div></div>`;
      const sky = $("#sky", area), sc = $("#sc", area), tm = $("#tm", area), cr = $("#cr", area);
      let score = 0, over = false, clock = null, every = 1100;
      function spawn() {
        if (over) return;
        if (document.hidden) { setTimeout(spawn, 500); return; }
        const bad = Math.random() < 0.3;
        const w = document.createElement("button");
        w.type = "button"; w.className = "word" + (bad ? " pixel" : "");
        w.textContent = bad ? "👾" : WORDS[rnd(WORDS.length)];
        w.style.left = 4 + rnd(76) + "%";
        w.style.animationDuration = Math.max(3200, 6000 - score * 180) + "ms";
        w.addEventListener("pointerdown", () => {
          if (over || w.dataset.hit) return;
          w.dataset.hit = 1;
          if (bad) { sfx.soft(); score = Math.max(0, score - 1); cr.classList.add("dim"); setTimeout(() => cr.classList.remove("dim"), 500); w.classList.add("poof"); }
          else { sfx.good(); score++; w.classList.add("fly"); cr.style.setProperty("--f", score / GOAL); cr.classList.add("pulse"); setTimeout(() => cr.classList.remove("pulse"), 300); }
          sc.textContent = score;
          setTimeout(() => w.remove(), 450);
          if (score >= GOAL) { over = true; clock && clock.stop(); sfx.win(); done(true, "«Ні! Занадто багато доброти!» — НаноПут розсипався на нешкідливі пікселі."); }
        });
        w.addEventListener("animationend", () => w.remove());
        sky.append(w);
        every = Math.max(550, every - 20);
        setTimeout(spawn, every);
      }
      spawn();
      clock = gameClock(TIME, (left) => { tm.style.width = left * 100 + "%"; }, () => {
        if (over) return;
        over = true; done(false, `Кристал наповнено на ${score} з ${GOAL}. Ще трішки добрих слів!`);
      });
    },
  });

  /* 7. Щоденник Радості — три хороші речі сьогоднішнього дня */
  L({
    id: "journal", guide: "crash", art: "", page: 1, icon: "📔", title: "Щоденник Радості", teacher: "Краш", story: "A03",
    skill: "Вдячність",
    intro: "Краш знає секрет: радість росте, коли її помічаєш. Згадай три хороші речі, що сталися сьогодні, — навіть найменші. Записи бачиш лише ти: вони зберігаються тільки в цьому браузері.",
    moral: "Щастям не можна володіти, ним можна лише ділитися.",
    run(area, done) {
      const list = store.get("journal", []);
      const HINTS = ["Наприклад: смачний сніданок", "Наприклад: хтось усміхнувся мені", "Наприклад: я допоміг(-ла) другові"];
      area.innerHTML = `<form class="journal" id="jf">
        <p class="question">Що хорошого сталося сьогодні? ☀️</p>
        ${[0, 1, 2].map((k) => `<label class="jline"><span>${["🌈", "⭐", "🌸"][k]}</span><input name="g${k}" maxlength="80" required minlength="2" placeholder="${HINTS[k]}" autocomplete="off"></label>`).join("")}
        <p style="text-align:center"><button class="btn" type="submit">🔔 Записати в щоденник</button></p>
        ${list.length ? `<details class="jpast"><summary>Мої попередні записи (${list.length})</summary>${list.slice().reverse().map((e) => `<p><b>${esc(e.d)}</b> — ${e.g.map(esc).join(" · ")}</p>`).join("")}</details>` : ""}
      </form>`;
      $("#jf", area).addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const g = [0, 1, 2].map((k) => String(f.get("g" + k)).trim()).filter((x) => x.length > 1);
        if (g.length < 3) return;
        const d = new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
        const next = list.concat([{ d, g }]).slice(-30);
        store.set("journal", next);
        sfx.bell();
        done(true, `Три промінчики радості записано! У щоденнику вже ${next.length} ${next.length === 1 ? "сторінка" : next.length < 5 ? "сторінки" : "сторінок"}.`);
      });
    },
  });

  /* 8. Кристал Мудрості — логічні загадки Бібліотеки загадок */
  const RIDDLES = [
    ["Фін, Краш і Луна стали в чергу. Краш — не перший. Луна стоїть одразу за Фіном. Хто перший?", "Фін", ["Краш", "Луна"], "Якщо Краш не перший, а Луна — одразу за Фіном, то черга така: Фін, Луна, Краш."],
    ["У Краша 3 дзвіночки, а в Луни — на 2 більше. Скільки дзвіночків у Луни?", "5", ["6", "1"], "3 + 2 = 5."],
    ["Що важче: кілограм пір'я чи кілограм сиру?", "Однаково", ["Сир", "Пір'я"], "Кілограм — завжди кілограм!"],
    ["Сирних гір три, і на кожній сидить по дві хмаринки. Скільки всього хмаринок?", "6", ["5", "3"], "Тричі по дві — шість."],
    ["Яке число пропущене: 2, 4, 6, ?, 10", "8", ["7", "9"], "Числа зростають на 2."],
    ["Синя рибка більша за червону, а червона — більша за зелену. Яка рибка найменша?", "Зелена", ["Червона", "Синя"], "Зелена менша за червону, а червона — за синю."],
    ["Фін видихнув веселку з 7 кольорів, а вітер розвіяв 2 кольори. Скільки кольорів лишилося?", "5", ["9", "4"], "7 − 2 = 5."],
    ["Що можна побачити із заплющеними очима?", "Сон", ["Веселку", "Зірки"], "Сни бачимо із заплющеними очима."],
    ["Що стає тим більшим, чим більше з нього забираєш?", "Яма", ["Гора", "Хмаринка"], "Чим більше землі забираєш, тим більша яма."],
    ["У кімнаті 4 кути, у кожному куті сидить кіт, а навпроти кожного кота — 3 коти. Скільки всього котів?", "4", ["16", "12"], "Ті самі чотири коти бачать одне одного."],
    ["На першому дроті Абакуса 3 кристали, а на другому — удвічі більше. Скільки кристалів на другому дроті?", "6", ["5", "9"], "Удвічі більше за 3 — це 6."],
    ["Півень зніс яйце на гребені даху. У який бік воно покотиться?", "Півні не несуть яєць", ["Ліворуч", "Праворуч"], "Яйця несуть кури, а не півні!"],
  ];
  L({
    id: "riddles", guide: "aria", art: "abacus", page: 1, icon: "🔮", title: "Кристал Мудрості", teacher: "Професорка Арія та Луна", story: "B07",
    skill: "Логіка",
    intro: "У Бібліотеці загадок книги розмовляють — і загадують загадки! Розгадай щонайменше 5 із 6, і Кристал Мудрості засвітиться. Не поспішай: медальйон Луни світиться, коли думаєш.",
    moral: "Головний код СилаВолії — не числа, а наші таланти, об'єднані разом.",
    run(area, done) {
      quiz(area, done, pick(RIDDLES, 6).map(([q, ok, bad, why]) => ({ q: esc(q), ok, bad, after: why })), 5, "Кристал Мудрості сяє — загадки тобі під силу!");
    },
  });

  /* 9. Лабораторія Емоцій — упізнай почуття і дізнайся, що допомагає */
  const FEEL = { joy: "😊 Радість", sad: "😢 Сум", fear: "😨 Страх", anger: "😠 Злість", wow: "😮 Здивування", shame: "😳 Сором" };
  const EMO = [
    ["Друг подарував малюнок, який малював спеціально для тебе.", "joy", "Скажи «дякую» — від цього радість стає подвійною."],
    ["Улюблена іграшка загубилася, і її ніде немає.", "sad", "Розкажи комусь близькому — разом легше і шукати, і сумувати."],
    ["Уночі за вікном щось зашурхотіло.", "fear", "Увімкни світло й поклич дорослого — страх меншає, коли поруч хтось є."],
    ["Хтось без дозволу зламав твою вежу з кубиків.", "anger", "Тричі глибоко вдихни і скажи словами: «Мені це неприємно»."],
    ["У коробці, яку принесли додому, — справжнє кошеня!", "wow", "Здивування — це двері до нового. Роздивись усе уважно!"],
    ["Сік випадково розлився на святковий стіл, і всі подивилися на тебе.", "shame", "Помилки бувають у всіх. Допоможи прибрати — і все минеться."],
    ["Найкращий друг переїжджає в інше місто.", "sad", "Домовтеся писати листи чи дзвонити — дружба не має кордонів."],
    ["Перед виступом на святі тремтять коліна.", "fear", "Уяви поруч Фіна, Краша і Луну — і почни з усмішки."],
    ["Молодший брат знову забрав твої олівці без дозволу.", "anger", "Поясни спокійно, як тобі важливо, — і запропонуй малювати разом."],
    ["Посеред зими на підвіконні раптом розквітла квітка.", "wow", "Світ повний маленьких чудес — їх видно тим, хто вміє дивуватися."],
    ["Ти забув(-ла) привітати подругу з днем народження.", "shame", "Ніколи не пізно привітати й обійняти — подруга зрадіє."],
    ["Учитель похвалив твою казку перед усім класом.", "joy", "Поділися радістю вдома — хай світиться ще яскравіше!"],
  ];
  L({
    id: "emotions", guide: "luna", art: "emotion_clock", page: 1, icon: "💗", title: "Великий Емоційний Годинник", teacher: "Луна та Фін", story: "C11",
    skill: "Розуміння почуттів",
    intro: "У Місті Перевернутих Емоцій Великий Емоційний Годинник збився, і почуття переплуталися. Допоможи розставити їх на місця: прочитай, що сталося, і назви почуття. Упізнай правильно 5 із 7!",
    moral: "Хоробрість, світло і мудрість разом лагодять навіть почуття.",
    run(area, done) {
      const keys = Object.keys(FEEL);
      quiz(area, done, pick(EMO, 7).map(([sit, k, tip]) => ({
        q: `${esc(sit)}<br><b>Яке це почуття?</b>`, ok: FEEL[k], bad: pick(keys.filter((x) => x !== k), 2).map((x) => FEEL[x]), after: "Що допомагає: " + tip, big: FEEL[k].split(" ")[0],
      })), 5, "Почуття знову на своїх місцях — ти чудово їх розумієш!");
    },
  });

  /* 10. Майстерня Артефактів — створи власний чарівний предмет (стиль «Royal Fantasy Magic», SV.crafts) */
  L({
    id: "workshop", guide: "fin", art: "farbosvit", page: 1, icon: "🎨", title: "Майстерня Артефактів", teacher: "Фін і Олівець «ФарбоСвіт»", story: "B06",
    skill: "Творчість",
    intro: "Олівець «ФарбоСвіт» втілює не бажання, а почуття. Обери форму, колір сяйва і чарівну силу, дай артефакту ім'я — а потім Олівець намалює йому справжню чарівну ілюстрацію! Він житиме в «Моїх скарбах».",
    moral: "Творчість — це відповідальність за те, як твої мрії вплинуть на інших.",
    run(area, done) {
      const K = SV.crafts;
      let f = 0, h = 1, p = 0, touched = false;
      area.innerHTML = `<div class="workshop ws-royal">
        <div class="ws-stage"><div id="pv"></div><p class="hint" style="text-align:center">Так виглядатиме твоя картка</p></div>
        <div class="ws-controls">
          <p class="ws-label">1. Форма</p><div class="ws-row" id="wf">${K.SHAPES.map((x, k) => `<button type="button" class="ws-opt" data-k="${k}" aria-label="${x.n}" title="${x.n}">${x.icon}</button>`).join("")}</div>
          <p class="ws-label">2. Колір сяйва</p><div class="ws-row" id="wh">${K.HUES.map((x, k) => `<button type="button" class="ws-opt ws-color" data-k="${k}" style="--hc:${x.hex}" aria-label="${x.label}" title="${x.label}"></button>`).join("")}</div>
          <p class="ws-label">3. Чарівна сила</p><div class="ws-row" id="wp">${K.POWERS.map((x, k) => `<button type="button" class="ws-opt ws-text" data-k="${k}">${x.label}</button>`).join("")}</div>
          <label class="ws-label" for="wn">4. Ім'я артефакту</label><input id="wn" maxlength="40" autocomplete="off">
          <p style="margin-top:14px"><button class="btn gold" id="ws" type="button">✨ Створити артефакт</button></p>
        </div></div>`;
      const nm = $("#wn", area);
      function draw() {
        area.querySelectorAll("#wf .ws-opt").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.k === f)));
        area.querySelectorAll("#wh .ws-opt").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.k === h)));
        area.querySelectorAll("#wp .ws-opt").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.k === p)));
        if (!touched) nm.value = K.autoName(K.SHAPES[f], K.HUES[h]);
        $("#pv", area).innerHTML = K.card(K.make(f, h, p, nm.value), -1);
      }
      const bind = (sel, set) => area.querySelectorAll(sel + " .ws-opt").forEach((b) => b.addEventListener("click", () => { set(+b.dataset.k); sfx.note(+b.dataset.k); draw(); }));
      bind("#wf", (k) => (f = k)); bind("#wh", (k) => (h = k)); bind("#wp", (k) => (p = k));
      nm.addEventListener("input", () => { touched = true; draw(); });
      $("#ws", area).addEventListener("click", () => {
        const item = K.make(f, h, p, nm.value);
        const all = K.list().concat([item]).slice(-12);
        K.save(all); sfx.win();
        const idx = all.length - 1;
        // створено: показуємо картку й пропонуємо намалювати ілюстрацію
        area.innerHTML = `<div class="ws-done">
          ${teacherSay("fin", `«${esc(item.name)}» створено! ${esc(item.power)}. Тепер Олівець «ФарбоСвіт» може намалювати йому справжню ілюстрацію — натисни на картку!`, "happy", "big")}
          <div class="ws-made" id="made">${K.card(item, idx)}</div>
          <p class="qnext"><button class="btn gold" id="paint" type="button">🪄 Намалювати ілюстрацію</button><button class="btn" id="fin" type="button">Завершити урок ⭐</button></p></div>`;
        const refresh = () => { const a = K.list(); $("#made", area).innerHTML = K.card(a[idx], idx); K.bind($("#made", area), refresh); };
        K.bind($("#made", area), refresh);
        $("#paint", area).addEventListener("click", () => K.open(idx, refresh));
        $("#fin", area).addEventListener("click", () => done(true, `«${item.name}» живе у твоїх скарбах. ${item.desc}`));
      });
      draw();
    },
  });

  /* ---------- спільна вікторина ---------- */
  const PRAISE = ["Правильно!", "Чудово!", "Так тримати!", "Блискуче!", "Саме так!"];
  const CHEER = ["Не зовсім — але ти вже ближче!", "Нічого страшного, помилки вчать!", "Майже! Подивись, яка відповідь правильна."];
  function quiz(area, done, items, need, how) {
    let i = 0, right = 0, streak = 0;
    const guide = area.dataset.guide || "owl";
    function ask() {
      const it = items[i];
      const opts = shuffle([it.ok, ...it.bad]);
      area.innerHTML = `<div class="hud"><span>Запитання <b>${i + 1}</b> / ${items.length}</span>
          <span class="qpath" aria-hidden="true">${items.map((_, k) => `<i class="${k < i ? "done" : k === i ? "now" : ""}"></i>`).join("")}</span>
          <span>✅ ${right}${streak >= 2 ? ` <b class="streak">🔥 ${streak}</b>` : ""}</span></div>
        <div class="qcard">${it.img ? `<div class="qimg ${it.imgCls || ""}"><img src="${it.img}" alt=""></div>` : it.big ? `<div class="qbig" aria-hidden="true">❓</div>` : ""}
          <p class="question">${it.q}</p><div class="answers">${opts.map((o) => `<button class="answer" type="button">${esc(o)}</button>`).join("")}</div>
        <div id="fb" aria-live="polite"></div><div class="qnext" id="nx"></div></div>`;
      const fb = $("#fb", area), nx = $("#nx", area);
      area.querySelectorAll(".answer").forEach((b) => b.addEventListener("click", () => {
        if (nx.childElementCount) return;
        const ok = b.textContent === it.ok;
        area.querySelectorAll(".answer").forEach((x) => { x.disabled = true; if (x.textContent === it.ok) x.classList.add("right"); });
        if (ok) {
          right++; streak++; sfx.good();
          if (it.imgOk) { const q = $(".qimg img", area); if (q) { q.src = it.imgOk; q.parentElement.classList.add("ok"); } else $(".qcard", area).insertAdjacentHTML("afterbegin", `<div class="qimg ok"><img src="${it.imgOk}" alt=""></div>`); }
          if (it.big) { const bg = $(".qbig", area); if (bg) { bg.textContent = it.big; bg.classList.add("ok"); } }
          fb.innerHTML = teacherSay(guide, `${PRAISE[rnd(PRAISE.length)]}${streak >= 3 ? ` Уже ${streak} поспіль! 🔥` : ""} ${esc(it.after || "")}`, "happy", "fb-ok");
        } else {
          streak = 0; b.classList.add("wrong"); sfx.soft();
          fb.innerHTML = teacherSay(guide, `${CHEER[rnd(CHEER.length)]} ${esc(it.after || "")}`, "talk", "fb-no");
        }
        const s = it.sid && story(it.sid);
        nx.innerHTML = `${s && readable(s) ? `<a class="btn ghost" href="read.html?id=${s.id}" target="_blank">📖 «${esc(s.title)}»</a>` : ""}<button class="btn" type="button">${i + 1 < items.length ? "Далі →" : "Результат"}</button>`;
        nx.querySelector("button").addEventListener("click", (e) => { e.currentTarget.disabled = true; i++; i < items.length ? ask() : done(right >= need, `Правильних відповідей: ${right} з ${items.length}.` + (right >= need ? ` ${how}` : ` Потрібно ${need} — спробуй ще раз!`)); });
      }));
    }
    ask();
  }

  /* ---------- сторінка уроку ---------- */
  SV.pages.lesson = function (main) {
    const id = new URLSearchParams(location.search).get("id");
    const les = LESSONS.find((l) => l.id === id);
    if (!les) { main.innerHTML = `<section class="section wrap"><h1>Урок не знайдено</h1><p><a class="btn" href="school.html#lessons">До школи</a></p></section>`; return; }
    document.title = les.title + " — Школа «ШляхдоМрій»";
    const s = story(les.story);
    main.innerHTML = `<section class="section wrap lesson">
      <div class="lesson-top"><a class="btn ghost" href="school.html#lessons">← До школи</a>
        <button class="icon-btn" id="mute" type="button" aria-pressed="${muted()}" title="Звук">${muted() ? "🔇" : "🔊"}</button></div>
      <div class="lesson-box card" id="box"></div></section>`;
    const box = $("#box", main);
    const mb = $("#mute", main);
    mb.addEventListener("click", () => { store.set("mute", !muted()); mb.textContent = muted() ? "🔇" : "🔊"; mb.setAttribute("aria-pressed", String(muted())); });
    const banner = lessonBanner(les);
    function intro() {
      box.innerHTML = `${banner ? `<div class="lesson-banner"><img src="${banner}" alt=""><div class="lb-title"><span class="lb-ico">${les.icon}</span><h1>${esc(les.title)}</h1></div></div>` : ""}
        <div class="body lesson-intro">
        ${banner ? "" : `<div class="lesson-icon">${les.icon}</div><h1>${esc(les.title)}</h1>`}
        <div class="chips" style="justify-content:center"><span class="chip">👩‍🏫 ${esc(les.teacher)}</span><span class="chip crash">🎯 ${esc(les.skill)}</span>${stars()[les.id] ? '<span class="chip fin">⭐ Зірку здобуто</span>' : ""}</div>
        ${teacherSay(les.guide, esc(les.intro), "talk", "big")}
        ${les.art ? `<div class="prize-hint"><img src="${artImg(les.art)}" alt=""><span>Нагорода за урок: <b>${esc((byId(C.artifacts, les.art) || {}).name || "")}</b> оживе!</span></div>` : ""}
        <button class="btn gold big-go" id="go" type="button">Почати урок ▶</button>
        ${s && readable(s) ? `<p class="hint">За казкою <a href="read.html?id=${s.id}">«${esc(s.title)}»</a></p>` : ""}</div>`;
      $("#go", box).addEventListener("click", play);
    }
    function play() {
      box.innerHTML = `<div class="play" id="area" data-guide="${les.guide}"></div>`;
      les.run($("#area", box), finish);
    }
    function finish(ok, text) {
      if (ok) { giveStar(les.id); sfx.win(); }
      const all = LESSONS.every((l) => stars()[l.id]);
      const nextL = LESSONS.find((l) => !stars()[l.id]);
      setTimeout(() => {
        const art = ok && les.art && byId(C.artifacts, les.art);
        box.innerHTML = `<div class="body lesson-intro">
          ${art ? `<div class="prize"><img src="${artImg(les.art, true)}" alt="${esc(art.name)}"><span class="prize-star">⭐</span></div><p class="kicker" style="margin:10px 0 0">Артефакт ожив: ${esc(art.name)}</p>` : `<div class="lesson-icon">${ok ? "⭐" : "🌱"}</div>`}
          <h1>${ok ? "Урок пройдено!" : "Майже вийшло!"}</h1>
          ${teacherSay(les.guide, esc(text), ok ? "happy" : "talk", "big")}
          ${ok ? `<div class="moral"><b>Урок:</b> ${esc(les.moral)}</div>` : ""}
          <div class="chips" style="justify-content:center;gap:12px">
            <button class="btn ${ok ? "ghost" : ""}" id="again" type="button">↺ ${ok ? "Ще раз" : "Спробувати знову"}</button>
            ${ok && nextL ? `<a class="btn" href="lesson.html?id=${nextL.id}">Далі: ${esc(nextL.title)} →</a>` : ""}
            ${ok && all ? `<a class="btn" href="school.html#diploma">🎓 Отримати диплом</a>` : ""}
            <a class="btn ghost" href="school.html#lessons">До школи</a>
          </div></div>`;
        $("#again", box).addEventListener("click", play);
      }, ok ? 500 : 200);
    }
    intro();
  };

  /* зони школи: кожен урок живе у своїй залі */
  const ZONES = [
    { icon: "☀️", name: "Академія Радості", desc: "Тут учаться помічати хороше й ділитися радістю — як Краш зі своїм дзвіночком.", c: "var(--crash)", ids: ["joy", "journal"] },
    { icon: "🌙", name: "Клас мудрості Луни", desc: "Пам'ять і знання казок. Медальйон Луни світиться, коли ти думаєш.", c: "var(--luna)", ids: ["potion", "knowledge"] },
    { icon: "📚", name: "Бібліотека загадок", desc: "Книги тут розмовляють — і загадують загадки.", c: "var(--magic)", ids: ["riddles"] },
    { icon: "💗", name: "Лабораторія емоцій", desc: "Вчимося розуміти почуття — свої й чужі.", c: "var(--pink)", ids: ["emotions", "friendship"] },
    { icon: "🎨", name: "Майстерня творчості", desc: "Олівець «ФарбоСвіт» втілює почуття в кольори й чарівні речі.", c: "var(--mint)", ids: ["workshop"] },
    { icon: "🏆", name: "Зала випробувань", desc: "Камінь «ДодайСил» і великий іспит «СловоСтріл» — для найсміливіших.", c: "var(--fin)", ids: ["faith", "exam"] },
  ];

  /* ---------- розділ уроків і диплом на сторінці школи ---------- */
  function schoolSection(el) {
    const st = stars();
    const n = LESSONS.filter((l) => st[l.id]).length;
    const all = n === LESSONS.length;
    const name = store.get("pupil", "");
    const lessonCard = (l) => { const b = lessonBanner(l), t = TEACH[l.guide]; return `<a class="card lesson-card${st[l.id] ? " done" : ""}" href="lesson.html?id=${l.id}">
        ${b ? `<div class="lc-pic"><img src="${b}" alt="" loading="lazy"><span class="lc-ico">${l.icon}</span>${t ? `<img class="lc-teacher${t.still ? " still" : ""}" src="${t.talk}" alt="" loading="lazy">` : ""}</div>` : ""}
        <div class="body">${b ? "" : `<div class="lesson-icon">${l.icon}</div>`}<h3>${esc(l.title)}</h3><p>${esc(l.skill)} · ${esc(l.teacher)}</p>
        <span class="badge">${st[l.id] ? "⭐ Пройдено" : "Почати →"}</span></div></a>`; };
    el.innerHTML = `<h2>Зали школи</h2>
      <p class="lead">Школа «ШляхдоМрій» — це шість чарівних зал. У кожній — уроки-ігри. Пройди всі ${LESSONS.length}, збери зірки — і Сова-Всезнайка вручить тобі диплом!</p>
      <div class="star-row" aria-label="Зібрано зірок: ${n} з ${LESSONS.length}">${LESSONS.map((l) => `<span class="${st[l.id] ? "on" : ""}" title="${esc(l.title)}">⭐</span>`).join("")} <b>${n} / ${LESSONS.length}</b></div>
      <div class="zones">${ZONES.map((z) => {
        const ls = z.ids.map((id) => LESSONS.find((l) => l.id === id)).filter(Boolean);
        const k = ls.filter((l) => st[l.id]).length;
        return `<section class="zone${k === ls.length ? " complete" : ""}" style="--zc:${z.c}">
          <header class="zone-head"><span class="zone-ico">${z.icon}</span><div><h3>${esc(z.name)}</h3><p>${esc(z.desc)}</p></div>
            <span class="zone-count">${k === ls.length ? "✓ " : ""}${k} / ${ls.length} ⭐</span></header>
          <div class="grid lessons-grid">${ls.map(lessonCard).join("")}</div></section>`; }).join("")}</div>
      <div id="diploma" class="diploma-wrap">${all ? `
        <div class="diploma card"><div class="body">
          <img class="diploma-founder no-print" src="${TEACH.founder.happy}" alt="Засновник школи"><div class="lesson-icon">🎓</div><h2>Диплом</h2>
          <p>Школа чарівництва «ШляхдоМрій» засвідчує, що</p>
          <input id="pupil" class="pupil" type="text" maxlength="40" placeholder="Твоє ім'я" value="${esc(name)}" aria-label="Ім'я учня">
          <p>пройшов(-ла) всі ${LESSONS.length} уроків у шести залах школи і довів(-ла), що наймогутніша магія — це радість, дружба та доброта.</p>
          <p class="sign">🦉 Сова-Всезнайка · 🐉 Фін · 🐶 Краш · 🐩 Луна</p>
          <button class="btn ghost no-print" id="print" type="button">🖨 Надрукувати</button>
        </div></div>` : `<p class="hint">🎓 Диплом відкриється, коли збереш усі ${LESSONS.length} зірок. Лишилося: ${LESSONS.length - n}.</p>`}</div>`;
    const inp = $("#pupil", el);
    if (inp) inp.addEventListener("input", () => store.set("pupil", inp.value));
    const pr = $("#print", el);
    if (pr) pr.addEventListener("click", () => { document.body.classList.add("print-diploma"); window.print(); setTimeout(() => document.body.classList.remove("print-diploma"), 500); });
  }

  window.SVLessons = { LESSONS, schoolSection };
})();
