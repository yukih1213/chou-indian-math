(() => {
  "use strict";

  const STORAGE_KEYS = {
    stats: "chouIndianMath.stats.v1",
    mistakes: "chouIndianMath.mistakes.v1",
    ordered: "chouIndianMath.ordered.v1"
  };

  const MODE_DEFINITIONS = [
    {
      id: "random",
      name: "完全ランダム",
      icon: "ALL",
      description: "10×10〜99×99を全範囲から出題。適用できる最短解法を解説します。",
      skill: "総合",
      predicate: () => true,
      strategy: "recommended"
    },
    {
      id: "universal",
      name: "万能クロス法",
      icon: "×",
      description: "すべての二桁同士に使える、右縦→クロス→左縦を反復します。",
      skill: "基本型",
      predicate: () => true,
      strategy: "universal"
    },
    {
      id: "sameTensComplement",
      name: "十の位同じ・和10",
      icon: "43·47",
      description: "十の位が同じで、一の位の和が10になる問題だけを出題します。",
      skill: "高速",
      predicate: (x, y) => tens(x) === tens(y) && ones(x) + ones(y) === 10,
      strategy: "sameTensComplement"
    },
    {
      id: "sameOnesComplement",
      name: "一の位同じ・和10",
      icon: "29·89",
      description: "一の位が同じで、十の位の和が10になる問題だけを出題します。",
      skill: "高速",
      predicate: (x, y) => ones(x) === ones(y) && tens(x) + tens(y) === 10,
      strategy: "sameOnesComplement"
    },
    {
      id: "near100",
      name: "100に近い数",
      icon: "≈100",
      description: "90〜99同士を、100からの不足分を使って計算します。",
      skill: "基準数",
      predicate: (x, y) => x >= 90 && y >= 90,
      strategy: "near100"
    },
    {
      id: "roundCenter",
      name: "キリのよい中心",
      icon: "±d",
      description: "50±3のように、10の倍数を挟む組み合わせを平方差で解きます。",
      skill: "平方差",
      predicate: (x, y) => x !== y && (x + y) % 20 === 0 && Math.abs(x - y) <= 18,
      strategy: "roundCenter"
    },
    {
      id: "ending5Square",
      name: "末尾5の平方",
      icon: "65²",
      description: "15²〜95²を、左側a(a+1)と末尾25に分けて練習します。",
      skill: "平方",
      predicate: (x, y) => x === y && ones(x) === 5,
      strategy: "ending5Square"
    },
    {
      id: "times11",
      name: "11倍",
      icon: "×11",
      description: "二桁×11を、外側の数字と中央の和で処理します。",
      skill: "桁操作",
      predicate: (x, y) => x === 11 || y === 11,
      strategy: "times11"
    },
    {
      id: "sameTensBase",
      name: "同じ十の位・基準数",
      icon: "40+",
      description: "同じ十の位を基準数に置き、基準数×和＋一の位同士で解きます。",
      skill: "基準数",
      predicate: (x, y) => tens(x) === tens(y),
      strategy: "sameTensBase"
    },
    {
      id: "review",
      name: "苦手問題",
      icon: "RE",
      description: "これまでに間違えた組み合わせだけを再出題します。",
      skill: "復習",
      predicate: () => false,
      strategy: "recommended",
      dynamic: true
    }
  ];

  const LESSON_DEFINITIONS = [
    {
      modeId: "universal",
      strategy: "universal",
      number: "01",
      kicker: "まず覚える型",
      icon: "×",
      title: "万能クロス法",
      summary: "どんな二桁同士にも使える基本形。右縦・クロス・左縦の順で、答えを右から完成させます。",
      condition: "すべての二桁 × 二桁",
      reason: "分配法則で4つの積に分け、同じ位をまとめて繰り上げている。",
      example: { x: 47, y: 36 }
    },
    {
      modeId: "sameTensComplement",
      strategy: "sameTensComplement",
      number: "02",
      kicker: "最優先で見つけたい型",
      icon: "+10",
      title: "十の位が同じ・一の位の和が10",
      summary: "左側は共通する十の位と次の数、右側は一の位同士の積。2ブロックで答えが出ます。",
      condition: "43×47のように、十の位が同じで一の位の和が10",
      reason: "(10a+b)(10a+d) は b+d=10 なら 100a(a+1)+bd になる。",
      example: { x: 43, y: 47 }
    },
    {
      modeId: "sameOnesComplement",
      strategy: "sameOnesComplement",
      number: "03",
      kicker: "共通する一の位を見る型",
      icon: "=1",
      title: "一の位が同じ・十の位の和が10",
      summary: "十の位同士の積に共通の一の位を足し、その一の位の平方を末尾に置きます。",
      condition: "29×89のように、一の位が同じで十の位の和が10",
      reason: "(10a+b)(10c+b) は a+c=10 なら 100(ac+b)+b² になる。",
      example: { x: 29, y: 89 }
    },
    {
      modeId: "near100",
      strategy: "near100",
      number: "04",
      kicker: "100との差を使う型",
      icon: "100",
      title: "100に近い数",
      summary: "100からいくつ足りないかに置き換え、左側は交差して引き、右側は不足分同士を掛けます。",
      condition: "90〜99同士など、両方が100に近い",
      reason: "(100−p)(100−q) = 100(100−p−q)+pq。",
      example: { x: 96, y: 93 }
    },
    {
      modeId: "roundCenter",
      strategy: "roundCenter",
      number: "05",
      kicker: "真ん中の数を使う型",
      icon: "±",
      title: "キリのよい中心・平方差",
      summary: "2つの数がキリのよい数から同じ距離なら、中心の平方から距離の平方を引けます。",
      condition: "47×53のように、キリのよい中心から±同じ距離",
      reason: "(m−d)(m+d) = m²−d²。クロス項が打ち消し合う。",
      example: { x: 47, y: 53 }
    },
    {
      modeId: "ending5Square",
      strategy: "ending5Square",
      number: "06",
      kicker: "平方の定番型",
      icon: "5²",
      title: "末尾5の平方",
      summary: "5の前の数とその次の数を掛け、末尾に25を付けるだけの高速な平方計算です。",
      condition: "15²、25²、…、95²のように末尾が5の平方",
      reason: "(10a+5)² = 100a(a+1)+25。",
      example: { x: 65, y: 65 }
    },
    {
      modeId: "times11",
      strategy: "times11",
      number: "07",
      kicker: "桁を並べる型",
      icon: "11",
      title: "二桁の11倍",
      summary: "元の二桁を外側に残し、2つの数字の和を中央へ入れます。和が10以上なら繰り上げます。",
      condition: "11×二桁、または二桁×11",
      reason: "(10a+b)×11 = 100a+10(a+b)+b。",
      example: { x: 47, y: 11 }
    },
    {
      modeId: "sameTensBase",
      strategy: "sameTensBase",
      number: "08",
      kicker: "共通部分をまとめる型",
      icon: "B+",
      title: "同じ十の位・基準数法",
      summary: "共通する10の倍数を基準にして大きな部分をまとめ、最後に一の位同士の積を足します。",
      condition: "43×46のように、十の位が同じ",
      reason: "(B+b)(B+d) = B(B+b+d)+bd。",
      example: { x: 43, y: 46 }
    }
  ];

  const elements = {
    lessonGrid: document.getElementById("lesson-grid"),
    openStudy: document.getElementById("open-study"),
    studySection: document.getElementById("study"),
    trainingSection: document.getElementById("training"),
    studyModal: document.getElementById("study-modal"),
    lessonNumber: document.getElementById("lesson-number"),
    lessonProgress: document.getElementById("lesson-progress"),
    lessonKicker: document.getElementById("lesson-kicker"),
    lessonTitle: document.getElementById("lesson-title"),
    lessonSummary: document.getElementById("lesson-summary"),
    lessonCondition: document.getElementById("lesson-condition"),
    lessonReason: document.getElementById("lesson-reason"),
    lessonExample: document.getElementById("lesson-example"),
    lessonExplanation: document.getElementById("lesson-explanation"),
    lessonCheckProgress: document.getElementById("lesson-check-progress"),
    lessonCheckQuestion: document.getElementById("lesson-check-question"),
    lessonCheckX: document.getElementById("lesson-check-x"),
    lessonCheckY: document.getElementById("lesson-check-y"),
    lessonCheckForm: document.getElementById("lesson-check-form"),
    lessonCheckInput: document.getElementById("lesson-check-input"),
    lessonCheckSubmitRow: document.getElementById("lesson-check-submit-row"),
    lessonCheckDontKnow: document.getElementById("lesson-check-dont-know"),
    lessonCheckFeedback: document.getElementById("lesson-check-feedback"),
    lessonCheckNext: document.getElementById("lesson-check-next"),
    lessonCheckComplete: document.getElementById("lesson-check-complete"),
    lessonCheckScore: document.getElementById("lesson-check-score"),
    lessonCheckMessage: document.getElementById("lesson-check-message"),
    lessonCheckRetry: document.getElementById("lesson-check-retry"),
    lessonPrev: document.getElementById("lesson-prev"),
    lessonNext: document.getElementById("lesson-next"),
    lessonPractice: document.getElementById("lesson-practice"),
    modeGrid: document.getElementById("mode-grid"),
    orderedToggle: document.getElementById("ordered-toggle"),
    selectedModeName: document.getElementById("selected-mode-name"),
    selectedModeCount: document.getElementById("selected-mode-count"),
    startButton: document.getElementById("start-button"),
    quizModal: document.getElementById("quiz-modal"),
    quizDialog: document.querySelector(".quiz-dialog"),
    quizHeader: document.querySelector(".quiz-header"),
    helpModal: document.getElementById("help-modal"),
    openHelp: document.getElementById("open-help"),
    quizModeLabel: document.getElementById("quiz-mode-label"),
    quizProgress: document.getElementById("quiz-progress"),
    operandX: document.getElementById("operand-x"),
    operandY: document.getElementById("operand-y"),
    timerValue: document.getElementById("timer-value"),
    answerForm: document.getElementById("answer-form"),
    answerInput: document.getElementById("answer-input"),
    answerSubmitRow: document.getElementById("answer-submit-row"),
    dontKnowButton: document.getElementById("dont-know-button"),
    submitAnswer: document.getElementById("submit-answer"),
    feedback: document.getElementById("feedback"),
    answeredActions: document.getElementById("answered-actions"),
    explanationButton: document.getElementById("explanation-button"),
    nextButton: document.getElementById("next-button"),
    explanationPanel: document.getElementById("explanation-panel"),
    questionScreen: document.getElementById("question-screen"),
    summaryScreen: document.getElementById("summary-screen"),
    restartButton: document.getElementById("restart-button"),
    summaryAttempts: document.getElementById("summary-attempts"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryAverage: document.getElementById("summary-average"),
    summaryBestStreak: document.getElementById("summary-best-streak"),
    allAttempts: document.getElementById("all-attempts"),
    allAccuracy: document.getElementById("all-accuracy"),
    allAverage: document.getElementById("all-average"),
    mistakeCount: document.getElementById("mistake-count"),
    resetStats: document.getElementById("reset-stats")
  };

  const state = {
    selectedModeId: "random",
    lessonIndex: 0,
    lessonCheck: { pairs: [], index: 0, correct: 0, answered: false },
    ordered: loadBoolean(STORAGE_KEYS.ordered, true),
    allStats: loadStats(),
    mistakes: loadMistakes(),
    pool: [],
    index: 0,
    current: null,
    answered: false,
    explanationOpen: false,
    questionStartedAt: 0,
    timerId: null,
    session: blankSession()
  };

  function blankSession() {
    return { attempts: 0, correct: 0, totalMs: 0, streak: 0, bestStreak: 0 };
  }

  function tens(n) { return Math.floor(n / 10); }
  function ones(n) { return n % 10; }
  function formatNumber(n) { return new Intl.NumberFormat("ja-JP").format(n); }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function canonicalKey(x, y) { return x <= y ? `${x}-${y}` : `${y}-${x}`; }

  function loadBoolean(key, fallback) {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  }

  function loadStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats));
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      return {
        attempts: Number(parsed.attempts) || 0,
        correct: Number(parsed.correct) || 0,
        totalMs: Number(parsed.totalMs) || 0
      };
    } catch {
      return { attempts: 0, correct: 0, totalMs: 0 };
    }
  }

  function loadMistakes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.mistakes));
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((item) => /^\d{2}-\d{2}$/.test(item)));
    } catch {
      return new Set();
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.allStats));
    localStorage.setItem(STORAGE_KEYS.mistakes, JSON.stringify([...state.mistakes]));
    localStorage.setItem(STORAGE_KEYS.ordered, String(state.ordered));
  }

  function buildBasePairs() {
    const pairs = [];
    for (let x = 10; x <= 99; x += 1) {
      const yStart = state.ordered ? 10 : x;
      for (let y = yStart; y <= 99; y += 1) {
        pairs.push({ x, y });
      }
    }
    return pairs;
  }

  function getMode(id) {
    return MODE_DEFINITIONS.find((mode) => mode.id === id) || MODE_DEFINITIONS[0];
  }

  function buildPool(modeId) {
    const mode = getMode(modeId);
    if (mode.id === "review") {
      return [...state.mistakes].map((key) => {
        const [x, y] = key.split("-").map(Number);
        return { x, y };
      });
    }
    return buildBasePairs().filter(({ x, y }) => mode.predicate(x, y));
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function renderModes() {
    elements.modeGrid.innerHTML = "";
    MODE_DEFINITIONS.forEach((mode) => {
      const poolCount = buildPool(mode.id).length;
      const disabled = poolCount === 0;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `mode-card${disabled ? " is-disabled" : ""}`;
      card.dataset.modeId = mode.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", String(state.selectedModeId === mode.id));
      card.setAttribute("aria-disabled", String(disabled));
      card.disabled = disabled;
      card.innerHTML = `
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <h3>${mode.name}</h3>
        <p>${mode.description}</p>
        <span class="mode-meta"><span>${formatNumber(poolCount)}問</span><span>${mode.skill}</span></span>
      `;
      card.addEventListener("click", () => selectMode(mode.id));
      elements.modeGrid.appendChild(card);
    });
    updateSelectedModeSummary();
  }

  function renderLessons() {
    elements.lessonGrid.innerHTML = "";
    LESSON_DEFINITIONS.forEach((lesson, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "lesson-card";
      card.setAttribute("aria-label", `${lesson.number} ${lesson.title}を学ぶ`);
      card.innerHTML = `
        <span class="lesson-card-top">
          <span class="lesson-index">${lesson.number}</span>
          <span class="lesson-card-icon" aria-hidden="true">${lesson.icon}</span>
        </span>
        <strong>${lesson.title}</strong>
        <small>${lesson.summary}</small>
        <span class="lesson-card-example">例題　${lesson.example.x} × ${lesson.example.y}</span>
        <span class="lesson-card-link">解説を見る <span aria-hidden="true">→</span></span>
      `;
      card.addEventListener("click", () => openLesson(index));
      elements.lessonGrid.appendChild(card);
    });
  }

  function openLesson(index) {
    state.lessonIndex = Math.max(0, Math.min(index, LESSON_DEFINITIONS.length - 1));
    const lesson = LESSON_DEFINITIONS[state.lessonIndex];
    elements.lessonNumber.textContent = `LESSON ${lesson.number}`;
    elements.lessonProgress.textContent = `${state.lessonIndex + 1} / ${LESSON_DEFINITIONS.length}`;
    elements.lessonKicker.textContent = lesson.kicker;
    elements.lessonTitle.textContent = lesson.title;
    elements.lessonSummary.textContent = lesson.summary;
    elements.lessonCondition.textContent = lesson.condition;
    elements.lessonReason.textContent = lesson.reason;
    elements.lessonExample.textContent = `${lesson.example.x} × ${lesson.example.y}`;
    elements.lessonExplanation.innerHTML = buildExplanation(lesson.example.x, lesson.example.y, lesson.strategy);
    elements.lessonPrev.disabled = state.lessonIndex === 0;
    elements.lessonNext.disabled = state.lessonIndex === LESSON_DEFINITIONS.length - 1;
    startLessonCheck();
    openModal(elements.studyModal);
    elements.studyModal.querySelector(".study-dialog").scrollTop = 0;
    window.setTimeout(() => elements.studyModal.querySelector("[data-close-study]").focus(), 60);
  }

  function moveLesson(offset) {
    const nextIndex = state.lessonIndex + offset;
    if (nextIndex < 0 || nextIndex >= LESSON_DEFINITIONS.length) return;
    openLesson(nextIndex);
  }

  function practiceLesson() {
    const lesson = LESSON_DEFINITIONS[state.lessonIndex];
    selectMode(lesson.modeId);
    closeModal(elements.studyModal);
    elements.trainingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elements.startButton.focus(), 450);
  }

  function startLessonCheck() {
    const lesson = LESSON_DEFINITIONS[state.lessonIndex];
    state.lessonCheck = {
      pairs: shuffle(buildPool(lesson.modeId)).slice(0, 3),
      index: 0,
      correct: 0,
      answered: false
    };
    elements.lessonCheckQuestion.hidden = false;
    elements.lessonCheckComplete.hidden = true;
    showLessonCheckQuestion();
  }

  function showLessonCheckQuestion() {
    const check = state.lessonCheck;
    const pair = check.pairs[check.index];
    if (!pair) {
      showLessonCheckComplete();
      return;
    }
    check.answered = false;
    elements.lessonCheckProgress.textContent = `${check.index + 1} / ${check.pairs.length}`;
    elements.lessonCheckX.textContent = pair.x;
    elements.lessonCheckY.textContent = pair.y;
    elements.lessonCheckInput.value = "";
    elements.lessonCheckInput.disabled = false;
    elements.lessonCheckSubmitRow.hidden = false;
    elements.lessonCheckFeedback.hidden = true;
    elements.lessonCheckFeedback.className = "feedback";
    elements.lessonCheckNext.hidden = true;
  }

  function submitLessonCheck(event) {
    event.preventDefault();
    if (state.lessonCheck.answered) return;
    const answer = normalizeAnswer(elements.lessonCheckInput.value);
    if (answer === null) {
      elements.lessonCheckInput.setCustomValidity("数字で答えを入力してください");
      elements.lessonCheckInput.reportValidity();
      elements.lessonCheckInput.setCustomValidity("");
      return;
    }
    gradeLessonCheck(answer, false);
  }

  function gradeLessonCheck(answer, skipped) {
    const check = state.lessonCheck;
    const pair = check.pairs[check.index];
    if (!pair || check.answered) return;
    const correctAnswer = pair.x * pair.y;
    const isCorrect = !skipped && answer === correctAnswer;
    check.answered = true;
    if (isCorrect) {
      check.correct += 1;
    } else {
      state.mistakes.add(canonicalKey(pair.x, pair.y));
      saveProgress();
      renderAllStats();
      renderModes();
    }
    elements.lessonCheckInput.disabled = true;
    elements.lessonCheckSubmitRow.hidden = true;
    elements.lessonCheckFeedback.hidden = false;
    elements.lessonCheckFeedback.classList.add(isCorrect ? "correct" : "incorrect");
    elements.lessonCheckFeedback.innerHTML = isCorrect
      ? "<strong>正解</strong><span>その調子です。</span>"
      : `<strong>正解は ${formatNumber(correctAnswer)}</strong><span>${skipped ? "大丈夫。" : "惜しい。"}上の解説でもう一度型を確認できます。</span>`;
    elements.lessonCheckNext.textContent = check.index === check.pairs.length - 1 ? "結果を見る →" : "次の問題 →";
    elements.lessonCheckNext.hidden = false;
    elements.lessonCheckNext.focus();
  }

  function nextLessonCheckQuestion() {
    if (!state.lessonCheck.answered) return;
    state.lessonCheck.index += 1;
    if (state.lessonCheck.index >= state.lessonCheck.pairs.length) showLessonCheckComplete();
    else showLessonCheckQuestion();
  }

  function showLessonCheckComplete() {
    const { correct, pairs } = state.lessonCheck;
    elements.lessonCheckQuestion.hidden = true;
    elements.lessonCheckComplete.hidden = false;
    elements.lessonCheckProgress.textContent = "完了";
    elements.lessonCheckScore.textContent = `${pairs.length}問中${correct}問正解`;
    elements.lessonCheckMessage.textContent = correct === pairs.length
      ? "この型はばっちりです。本トレーニングで速度を上げましょう。"
      : correct >= 2
        ? "あと少しです。もう3問か、本トレーニングで定着させましょう。"
        : "上の例題をもう一度見てから、別の3問に挑戦してみましょう。";
    elements.lessonCheckRetry.focus();
  }

  function selectMode(modeId) {
    if (buildPool(modeId).length === 0) return;
    state.selectedModeId = modeId;
    document.querySelectorAll(".mode-card").forEach((card) => {
      card.setAttribute("aria-checked", String(card.dataset.modeId === modeId));
    });
    updateSelectedModeSummary();
  }

  function updateSelectedModeSummary() {
    const mode = getMode(state.selectedModeId);
    const count = buildPool(mode.id).length;
    elements.selectedModeName.textContent = mode.name;
    elements.selectedModeCount.textContent = `${formatNumber(count)}問`;
    elements.startButton.disabled = count === 0;
  }

  function renderAllStats() {
    const { attempts, correct, totalMs } = state.allStats;
    elements.allAttempts.textContent = formatNumber(attempts);
    elements.allAccuracy.textContent = attempts ? `${Math.round((correct / attempts) * 100)}%` : "—";
    elements.allAverage.textContent = attempts ? (totalMs / attempts / 1000).toFixed(1) : "—";
    elements.mistakeCount.textContent = formatNumber(state.mistakes.size);
  }

  function openModal(modal) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (elements.quizModal.hidden && elements.helpModal.hidden && elements.studyModal.hidden) {
      document.body.classList.remove("modal-open");
    }
  }

  function closeQuiz() {
    stopTimer();
    closeModal(elements.quizModal);
    renderModes();
    renderAllStats();
  }

  function startSession() {
    const pool = buildPool(state.selectedModeId);
    if (pool.length === 0) return;
    state.pool = shuffle(pool);
    state.index = 0;
    state.session = blankSession();
    elements.questionScreen.hidden = false;
    elements.summaryScreen.hidden = true;
    openModal(elements.quizModal);
    showQuestion();
  }

  function showQuestion() {
    stopTimer();
    state.current = state.pool[state.index];
    state.answered = false;
    state.explanationOpen = false;
    const mode = getMode(state.selectedModeId);

    elements.quizModeLabel.textContent = mode.name;
    elements.quizProgress.textContent = `${formatNumber(state.index + 1)} / ${formatNumber(state.pool.length)}`;
    elements.operandX.textContent = state.current.x;
    elements.operandY.textContent = state.current.y;
    elements.answerInput.value = "";
    elements.answerInput.disabled = false;
    elements.answerSubmitRow.hidden = false;
    elements.feedback.hidden = true;
    elements.feedback.className = "feedback";
    elements.answeredActions.hidden = true;
    elements.explanationPanel.hidden = true;
    elements.explanationPanel.innerHTML = "";
    elements.explanationButton.textContent = "解説を見る";

    state.questionStartedAt = performance.now();
    elements.timerValue.textContent = "0.0";
    state.timerId = window.setInterval(updateTimer, 100);
    window.setTimeout(() => elements.answerInput.focus(), 60);
  }

  function updateTimer() {
    if (state.answered) return;
    const elapsed = (performance.now() - state.questionStartedAt) / 1000;
    elements.timerValue.textContent = elapsed.toFixed(1);
  }

  function stopTimer() {
    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function normalizeAnswer(raw) {
    const normalized = String(raw).replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xfee0)).replace(/[,\s]/g, "");
    if (!/^\d+$/.test(normalized)) return null;
    return Number(normalized);
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (state.answered || !state.current) return;
    const answer = normalizeAnswer(elements.answerInput.value);
    if (answer === null) {
      elements.answerInput.setCustomValidity("数字で答えを入力してください");
      elements.answerInput.reportValidity();
      elements.answerInput.setCustomValidity("");
      return;
    }

    gradeAnswer(answer, false);
  }

  function submitDontKnow() {
    if (state.answered || !state.current) return;
    gradeAnswer(null, true);
  }

  function gradeAnswer(answer, skipped) {
    const elapsedMs = performance.now() - state.questionStartedAt;
    const correctAnswer = state.current.x * state.current.y;
    const isCorrect = !skipped && answer === correctAnswer;
    state.answered = true;
    stopTimer();
    elements.timerValue.textContent = (elapsedMs / 1000).toFixed(1);

    state.session.attempts += 1;
    state.session.totalMs += elapsedMs;
    state.allStats.attempts += 1;
    state.allStats.totalMs += elapsedMs;

    if (isCorrect) {
      state.session.correct += 1;
      state.session.streak += 1;
      state.session.bestStreak = Math.max(state.session.bestStreak, state.session.streak);
      state.allStats.correct += 1;
    } else {
      state.session.streak = 0;
      state.mistakes.add(canonicalKey(state.current.x, state.current.y));
    }

    saveProgress();
    renderAllStats();

    elements.answerInput.disabled = true;
    elements.answerSubmitRow.hidden = true;
    elements.feedback.hidden = false;
    elements.feedback.classList.add(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      elements.feedback.innerHTML = `<strong>正解</strong><span>${(elapsedMs / 1000).toFixed(1)}秒・連続${state.session.streak}問正解。下の図で計算の流れを確認できます。</span>`;
    } else if (skipped) {
      elements.feedback.innerHTML = `<strong>正解は ${formatNumber(correctAnswer)}</strong><span>大丈夫。この問題は苦手問題に追加しました。下の図で数字の出どころを確認しましょう。</span>`;
    } else {
      elements.feedback.innerHTML = `<strong>不正解　正解は ${formatNumber(correctAnswer)}</strong><span>下の図で数字の出どころを確認しましょう。</span>`;
    }
    elements.answeredActions.hidden = false;
    toggleExplanation();
    elements.nextButton.focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.index >= state.pool.length - 1) {
      showSummary();
      return;
    }
    state.index += 1;
    showQuestion();
  }

  function showSummary() {
    stopTimer();
    const s = state.session;
    elements.questionScreen.hidden = true;
    elements.summaryScreen.hidden = false;
    elements.summaryAttempts.textContent = formatNumber(s.attempts);
    elements.summaryAccuracy.textContent = s.attempts ? `${Math.round((s.correct / s.attempts) * 100)}%` : "0%";
    elements.summaryAverage.textContent = s.attempts ? `${(s.totalMs / s.attempts / 1000).toFixed(1)}秒` : "0.0秒";
    elements.summaryBestStreak.textContent = formatNumber(s.bestStreak);
    elements.restartButton.focus();
  }

  function toggleExplanation() {
    if (!state.answered || !state.current) return;
    state.explanationOpen = !state.explanationOpen;
    elements.explanationPanel.hidden = !state.explanationOpen;
    elements.explanationButton.textContent = state.explanationOpen ? "解説を閉じる" : "解説を見る";
    if (state.explanationOpen && !elements.explanationPanel.innerHTML) {
      const mode = getMode(state.selectedModeId);
      const strategy = mode.strategy === "recommended"
        ? chooseRecommendedStrategy(state.current.x, state.current.y)
        : mode.strategy;
      elements.explanationPanel.innerHTML = buildExplanation(state.current.x, state.current.y, strategy);
      window.requestAnimationFrame(() => {
        const dialogRect = elements.quizDialog.getBoundingClientRect();
        const panelRect = elements.explanationPanel.getBoundingClientRect();
        const headerHeight = elements.quizHeader.offsetHeight;
        const targetTop = elements.quizDialog.scrollTop
          + panelRect.top
          - dialogRect.top
          - headerHeight
          - 16;
        elements.quizDialog.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      });
    }
  }

  function chooseRecommendedStrategy(x, y) {
    if (x === y && ones(x) === 5) return "ending5Square";
    if (tens(x) === tens(y) && ones(x) + ones(y) === 10) return "sameTensComplement";
    if (ones(x) === ones(y) && tens(x) + tens(y) === 10) return "sameOnesComplement";
    if (x >= 90 && y >= 90) return "near100";
    if (x === 11 || y === 11) return "times11";
    if (x !== y && (x + y) % 20 === 0 && Math.abs(x - y) <= 18) return "roundCenter";
    if (tens(x) === tens(y)) return "sameTensBase";
    return "universal";
  }

  function explanationShell(title, subtitle, tag, steps, result, secondary = "", visual = "") {
    const stepHtml = steps.map((step, index) => `
      <li>
        <span>${index + 1}</span>
        <div><strong>${step.main}</strong>${step.note ? `<small>${step.note}</small>` : ""}</div>
      </li>
    `).join("");
    return `
      <div class="explanation-heading">
        <div><h3>${title}</h3><p>${subtitle}</p></div>
        <span class="strategy-tag">${tag}</span>
      </div>
      ${visual}
      <ol class="calc-steps">${stepHtml}</ol>
      <p class="result-line">答え：${formatNumber(result)}</p>
      ${secondary}
    `;
  }

  function multiplicationMap(x, y, active) {
    const a = tens(x), b = ones(x), c = tens(y), d = ones(y);
    return `
      <div class="multiplication-map is-${active}" role="img" aria-label="${x}かける${y}の${active === "right" ? "一の位同士" : active === "cross" ? "交差する組" : "十の位同士"}を結ぶ図">
        <span class="map-place map-place-tens">十の位</span>
        <span class="map-place map-place-ones">一の位</span>
        <span class="map-operator">×</span>
        <span class="map-digit map-xt">${a}</span>
        <span class="map-digit map-xu">${b}</span>
        <span class="map-digit map-yt">${c}</span>
        <span class="map-digit map-yu">${d}</span>
        <svg viewBox="0 0 260 150" aria-hidden="true">
          <path class="map-line line-left" d="M92 60 L92 119" />
          <path class="map-line line-cross-a" d="M92 60 C112 78 153 98 172 119" />
          <path class="map-line line-cross-b" d="M172 60 C153 78 112 98 92 119" />
          <path class="map-line line-right" d="M172 60 L172 119" />
        </svg>
      </div>
    `;
  }

  function placeValueGuide(x, y) {
    return `
      <div class="place-value-guide">
        <div>
          <span>${x}</span><b>=</b><strong>${tens(x)}0</strong><b>+</b><strong>${ones(x)}</strong>
          <small><em>${tens(x)}</em>は十の位なので${tens(x)}0、<em>${ones(x)}</em>は一の位</small>
        </div>
        <div>
          <span>${y}</span><b>=</b><strong>${tens(y)}0</strong><b>+</b><strong>${ones(y)}</strong>
          <small><em>${tens(y)}</em>は十の位なので${tens(y)}0、<em>${ones(y)}</em>は一の位</small>
        </div>
      </div>
    `;
  }

  function answerRail(left, finalTens, finalOnes, active) {
    return `
      <div class="answer-rail" aria-label="答えの桁">
        <span class="answer-label">答え</span>
        <span class="answer-slot${active >= 3 ? " is-filled is-new" : ""}">${active >= 3 ? left : "?"}</span>
        <span class="answer-slot${active >= 2 ? " is-filled is-new" : ""}">${active >= 2 ? finalTens : "?"}</span>
        <span class="answer-slot${active >= 1 ? " is-filled is-new" : ""}">${finalOnes}</span>
      </div>
    `;
  }

  function buildUniversalVisual(x, y) {
    const a = tens(x), b = ones(x), c = tens(y), d = ones(y);
    const rightRaw = b * d;
    const carry1 = Math.floor(rightRaw / 10);
    const finalOnes = rightRaw % 10;
    const crossA = a * d;
    const crossB = b * c;
    const crossRaw = crossA + crossB + carry1;
    const carry2 = Math.floor(crossRaw / 10);
    const finalTens = crossRaw % 10;
    const leftRaw = a * c;
    const left = leftRaw + carry2;
    return `
      <div class="visual-explanation">
        <section class="origin-guide">
          <span class="visual-kicker">数字の出どころ</span>
          <h4>まず、二桁を「十の位」と「一の位」に分ける</h4>
          <p>ここで使う${a}や${c}は、単なる${a}・${c}ではなく、それぞれ${a}0・${c}0を表す十の位の数字です。</p>
          ${placeValueGuide(x, y)}
        </section>

        <section class="visual-calc-step">
          <div class="visual-step-heading"><span>1</span><div><strong>右の縦線</strong><small>答えの一の位を決める</small></div></div>
          <div class="visual-step-grid">
            ${multiplicationMap(x, y, "right")}
            <div class="source-calculation">
              <div class="source-chip"><small>${x}の一の位</small><b>${b}</b></div>
              <span>×</span>
              <div class="source-chip"><small>${y}の一の位</small><b>${d}</b></div>
              <span>=</span><strong>${rightRaw}</strong>
              <div class="split-result"><span><b>${finalOnes}</b>を一の位へ</span><span><b>${carry1}</b>を次へ繰り上げ</span></div>
            </div>
          </div>
          ${answerRail(left, finalTens, finalOnes, 1)}
        </section>

        <section class="visual-calc-step">
          <div class="visual-step-heading"><span>2</span><div><strong>クロスを2本</strong><small>答えの十の位を決める</small></div></div>
          <div class="visual-step-grid">
            ${multiplicationMap(x, y, "cross")}
            <div class="cross-breakdown">
              <div><small>${x}の十の位 × ${y}の一の位</small><strong>${a} × ${d} = ${crossA}</strong></div>
              <div><small>${x}の一の位 × ${y}の十の位</small><strong>${b} × ${c} = ${crossB}</strong></div>
              <div class="carry-chip"><small>手順1から来た数</small><strong>繰り上がり ${carry1}</strong></div>
              <p>${crossA} + ${crossB} + ${carry1} = <b>${crossRaw}</b></p>
              <small class="place-value-note">実際の値は ${a * 10}×${d}=${a * 10 * d}、${b}×${c * 10}=${b * c * 10}、繰り上がりは${carry1 * 10}。合計${crossRaw * 10}を桁だけで${crossRaw}と扱っています。</small>
              <div class="split-result"><span><b>${finalTens}</b>を十の位へ</span><span><b>${carry2}</b>を次へ繰り上げ</span></div>
            </div>
          </div>
          ${answerRail(left, finalTens, finalOnes, 2)}
        </section>

        <section class="visual-calc-step">
          <div class="visual-step-heading"><span>3</span><div><strong>左の縦線</strong><small>残りの左側を完成する</small></div></div>
          <div class="visual-step-grid">
            ${multiplicationMap(x, y, "left")}
            <div class="cross-breakdown final-breakdown">
              <div><small>${x}の十の位 × ${y}の十の位</small><strong>${a} × ${c} = ${leftRaw}</strong></div>
              <div class="carry-chip"><small>手順2から来た数</small><strong>繰り上がり ${carry2}</strong></div>
              <p>${leftRaw} + ${carry2} = <b>${left}</b></p>
              <small class="left-note">${a}0×${c}0=${leftRaw * 100}は「${leftRaw}百」。繰り上がり${carry2}百を足すと${left}百なので、${left}が答えの左側になります。</small>
            </div>
          </div>
          ${answerRail(left, finalTens, finalOnes, 3)}
        </section>
      </div>
    `;
  }

  function buildShortcutVisual(x, y, strategy) {
    const lesson = LESSON_DEFINITIONS.find((item) => item.strategy === strategy);
    if (!lesson) return "";
    let facts = "";
    if (strategy === "sameTensComplement") facts = `<b>十の位：${tens(x)} = ${tens(y)}</b><b>一の位：${ones(x)} + ${ones(y)} = 10</b>`;
    if (strategy === "sameOnesComplement") facts = `<b>一の位：${ones(x)} = ${ones(y)}</b><b>十の位：${tens(x)} + ${tens(y)} = 10</b>`;
    if (strategy === "near100") facts = `<b>100 − ${x} = ${100 - x}</b><b>100 − ${y} = ${100 - y}</b>`;
    if (strategy === "roundCenter") facts = `<b>中心は ${(x + y) / 2}</b><b>中心からの距離は ${Math.abs(x - y) / 2}</b>`;
    if (strategy === "ending5Square") facts = `<b>${x} = ${tens(x)}0 + 5</b><b>末尾の5² = 25</b>`;
    if (strategy === "times11") facts = `<b>${x === 11 ? y : x} の両端を残す</b><b>中央は ${tens(x === 11 ? y : x)} + ${ones(x === 11 ? y : x)}</b>`;
    if (strategy === "sameTensBase") facts = `<b>共通の基準は ${tens(x) * 10}</b><b>残りは ${ones(x)} と ${ones(y)}</b>`;
    return `
      <div class="shortcut-visual">
        <span class="visual-kicker">見つけるポイント</span>
        <div class="shortcut-facts">${facts}</div>
        <p><strong>なぜ？</strong>${lesson.reason}</p>
      </div>
    `;
  }

  function universalSteps(x, y) {
    const a = tens(x), b = ones(x), c = tens(y), d = ones(y);
    const rightRaw = b * d;
    const carry1 = Math.floor(rightRaw / 10);
    const finalOnes = rightRaw % 10;
    const crossRaw = a * d + b * c + carry1;
    const carry2 = Math.floor(crossRaw / 10);
    const finalTens = crossRaw % 10;
    const left = a * c + carry2;
    return [
      {
        main: `右縦：${b} × ${d} = ${rightRaw}`,
        note: `${finalOnes}を1の位に置き、${carry1}を中央へ繰り上げる。`
      },
      {
        main: `クロス：${a} × ${d} + ${b} × ${c} + ${carry1} = ${crossRaw}`,
        note: `${finalTens}を10の位に置き、${carry2}を左へ繰り上げる。`
      },
      {
        main: `左縦：${a} × ${c} + ${carry2} = ${left}`,
        note: `${left}｜${finalTens}｜${finalOnes} と並べる。`
      }
    ];
  }

  function universalDetails(x, y) {
    return `<details><summary>万能クロス法でも図で確認する</summary>${buildUniversalVisual(x, y)}</details>`;
  }

  function buildExplanation(x, y, strategy) {
    const result = x * y;

    if (strategy === "sameTensComplement") {
      const a = tens(x), b = ones(x), d = ones(y);
      const left = a * (a + 1);
      const right = b * d;
      return explanationShell(
        "十の位が同じ・一の位の和が10",
        `${x}と${y}は、十の位が${a}で共通し、${b}+${d}=10です。`,
        "ショートカット",
        [
          { main: `左側：${a} × (${a} + 1) = ${left}`, note: "共通する十の位と、その次の数を掛ける。" },
          { main: `右側：${b} × ${d} = ${right}`, note: `右側は必ず2桁で書くので ${pad2(right)}。` },
          { main: `${left}｜${pad2(right)} = ${result}`, note: "左側と右側を連結する。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "sameTensComplement")
      );
    }

    if (strategy === "sameOnesComplement") {
      const a = tens(x), c = tens(y), b = ones(x);
      const left = a * c + b;
      const right = b * b;
      return explanationShell(
        "一の位が同じ・十の位の和が10",
        `${x}と${y}は、一の位が${b}で共通し、${a}+${c}=10です。`,
        "ショートカット",
        [
          { main: `左側：${a} × ${c} + ${b} = ${left}`, note: "十の位同士の積に、共通する一の位を足す。" },
          { main: `右側：${b}² = ${right}`, note: `右側は2桁で書くので ${pad2(right)}。` },
          { main: `${left}｜${pad2(right)} = ${result}`, note: "左側と右側を連結する。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "sameOnesComplement")
      );
    }

    if (strategy === "near100") {
      const p = 100 - x, q = 100 - y;
      const rawLeft = 100 - p - q;
      const rawRight = p * q;
      const carry = Math.floor(rawRight / 100);
      const left = rawLeft + carry;
      const right = rawRight % 100;
      return explanationShell(
        "100からの不足分を使う",
        `${x}=100−${p}、${y}=100−${q}として計算します。`,
        "基準数100",
        [
          { main: `左側：${x} − ${q} = ${rawLeft}`, note: `${y}−${p}でも同じ。これは100−(${p}+${q})。` },
          { main: `右側：${p} × ${q} = ${rawRight}`, note: rawRight >= 100 ? `${rawRight}は3桁なので、${carry}を左へ繰り上げる。` : `100基準なので右側は2桁で ${pad2(rawRight)}。` },
          { main: `${left}｜${pad2(right)} = ${result}`, note: "不足分の積を右側に置く。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "near100")
      );
    }

    if (strategy === "roundCenter") {
      const m = (x + y) / 2;
      const d = Math.abs(x - y) / 2;
      return explanationShell(
        "平方差：中心² − 差²",
        `${x}と${y}は、${m}を中心に±${d}の位置にあります。`,
        "平方差",
        [
          { main: `${x} × ${y} = (${m} − ${d})(${m} + ${d})`, note: "中心と中心からの距離に置き換える。" },
          { main: `= ${m}² − ${d}²`, note: `(a−b)(a+b)=a²−b² を使う。` },
          { main: `= ${m * m} − ${d * d} = ${result}`, note: "キリのよい中心の平方から、小さい平方を引く。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "roundCenter")
      );
    }

    if (strategy === "ending5Square") {
      const a = tens(x);
      const left = a * (a + 1);
      return explanationShell(
        "末尾5の平方",
        `${x}²では、5の前の数字${a}だけを使って左側を作ります。`,
        "平方",
        [
          { main: `左側：${a} × (${a} + 1) = ${left}`, note: "5の前の数と、その次の数を掛ける。" },
          { main: "右側：5² = 25", note: "末尾は必ず25になる。" },
          { main: `${left}｜25 = ${result}`, note: "左側に25を付ける。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "ending5Square")
      );
    }

    if (strategy === "times11") {
      const n = x === 11 ? y : x;
      const a = tens(n), b = ones(n), sum = a + b;
      const carry = Math.floor(sum / 10);
      const middle = sum % 10;
      const left = a + carry;
      return explanationShell(
        "二桁の11倍",
        `${n}の外側の数字を残し、中央に${a}+${b}を入れます。`,
        "11倍",
        [
          { main: `中央：${a} + ${b} = ${sum}`, note: sum >= 10 ? `${middle}を中央に置き、${carry}を左へ繰り上げる。` : "この和を中央の桁に置く。" },
          { main: `左：${a} + ${carry} = ${left}、右：${b}`, note: "元の十の位と一の位が外側になる。" },
          { main: `${left}｜${middle}｜${b} = ${result}`, note: "3ブロックを並べる。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "times11")
      );
    }

    if (strategy === "sameTensBase") {
      const base = tens(x) * 10;
      const b = ones(x), d = ones(y);
      const centerSum = base + b + d;
      const basePart = base * centerSum;
      const unitPart = b * d;
      return explanationShell(
        "共通する十の位を基準数にする",
        `${x}=${base}+${b}、${y}=${base}+${d}として展開します。`,
        "基準数法",
        [
          { main: `基準数側：${base} × (${base} + ${b} + ${d}) = ${basePart}`, note: `一方の数に、もう一方の一の位を足してから${base}倍してもよい。` },
          { main: `一の位側：${b} × ${d} = ${unitPart}`, note: "基準数からの増分同士を掛ける。" },
          { main: `${basePart} + ${unitPart} = ${result}`, note: "基準数側と増分側を足す。" }
        ],
        result,
        universalDetails(x, y),
        buildShortcutVisual(x, y, "sameTensBase")
      );
    }

    return explanationShell(
      "万能クロス法",
      `${x}=10×${tens(x)}+${ones(x)}、${y}=10×${tens(y)}+${ones(y)}に分解します。`,
      "全問題対応",
      [],
      result,
      "",
      buildUniversalVisual(x, y)
    );
  }

  elements.orderedToggle.checked = state.ordered;
  elements.orderedToggle.addEventListener("change", () => {
    state.ordered = elements.orderedToggle.checked;
    saveProgress();
    if (buildPool(state.selectedModeId).length === 0) state.selectedModeId = "random";
    renderModes();
  });

  elements.startButton.addEventListener("click", startSession);
  elements.answerForm.addEventListener("submit", submitAnswer);
  elements.dontKnowButton.addEventListener("click", submitDontKnow);
  elements.nextButton.addEventListener("click", nextQuestion);
  elements.explanationButton.addEventListener("click", toggleExplanation);
  elements.restartButton.addEventListener("click", startSession);
  elements.openStudy.addEventListener("click", () => elements.studySection.scrollIntoView({ behavior: "smooth", block: "start" }));
  elements.openHelp.addEventListener("click", () => openModal(elements.helpModal));
  elements.lessonPrev.addEventListener("click", () => moveLesson(-1));
  elements.lessonNext.addEventListener("click", () => moveLesson(1));
  elements.lessonPractice.addEventListener("click", practiceLesson);
  elements.lessonCheckForm.addEventListener("submit", submitLessonCheck);
  elements.lessonCheckDontKnow.addEventListener("click", () => gradeLessonCheck(null, true));
  elements.lessonCheckNext.addEventListener("click", nextLessonCheckQuestion);
  elements.lessonCheckRetry.addEventListener("click", startLessonCheck);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeQuiz);
  });

  document.querySelectorAll("[data-close-help]").forEach((button) => {
    button.addEventListener("click", () => closeModal(elements.helpModal));
  });

  document.querySelectorAll("[data-close-study]").forEach((button) => {
    button.addEventListener("click", () => closeModal(elements.studyModal));
  });

  elements.resetStats.addEventListener("click", () => {
    const confirmed = window.confirm("累計成績と苦手問題をすべて削除しますか？");
    if (!confirmed) return;
    state.allStats = { attempts: 0, correct: 0, totalMs: 0 };
    state.mistakes = new Set();
    saveProgress();
    renderAllStats();
    if (state.selectedModeId === "review") state.selectedModeId = "random";
    renderModes();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.helpModal.hidden) closeModal(elements.helpModal);
      else if (!elements.studyModal.hidden) closeModal(elements.studyModal);
      else if (!elements.quizModal.hidden) closeQuiz();
      return;
    }
    if (!elements.studyModal.hidden) {
      const isTyping = document.activeElement === elements.lessonCheckInput;
      if (!isTyping && event.key === "ArrowLeft") moveLesson(-1);
      if (!isTyping && event.key === "ArrowRight") moveLesson(1);
      return;
    }
    if (elements.quizModal.hidden || !elements.helpModal.hidden) return;
    if ((event.key === "e" || event.key === "E") && state.answered) {
      event.preventDefault();
      toggleExplanation();
      return;
    }
    if (event.key === "Enter" && state.answered && document.activeElement !== elements.explanationButton) {
      event.preventDefault();
      nextQuestion();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  renderLessons();
  renderModes();
  renderAllStats();
})();
