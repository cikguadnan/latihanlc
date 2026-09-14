(() => {
  const data = window.QUIZ_DATA || [];
  const welcomeCard = document.getElementById('welcomeCard');
  const quizApp = document.getElementById('quizApp');
  const resultCard = document.getElementById('resultCard');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const questionNav = document.getElementById('questionNav');
  const passageTitle = document.getElementById('passageTitle');
  const audioPlayer = document.getElementById('audioPlayer');
  const questionBadge = document.getElementById('questionBadge');
  const questionText = document.getElementById('questionText');
  const optionsList = document.getElementById('optionsList');
  const feedbackBox = document.getElementById('feedbackBox');
  const questionCounter = document.getElementById('questionCounter');
  const progressBar = document.getElementById('progressBar');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const questionAlert = document.getElementById('questionAlert');

  const state = {
    current: 0,
    answers: {},
    checked: {},
    score: 0
  };

  function encodePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function buildNav() {
    questionNav.innerHTML = '';
    data.forEach((q, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.index = index;
      btn.innerHTML = `<span class="nav-number">${q.id}</span><span class="nav-label">${q.section} – Soalan ${q.id}</span>`;
      btn.addEventListener('click', () => {
        state.current = index;
        renderQuestion();
      });
      questionNav.appendChild(btn);
    });
  }

  function updateNav() {
    [...questionNav.children].forEach((btn, index) => {
      btn.classList.toggle('active', index === state.current);
      btn.classList.toggle('answered', state.answers[index] !== undefined);
      btn.classList.toggle('correct', state.checked[index] === true && state.answers[index] === data[index].answer);
      btn.classList.toggle('wrong', state.checked[index] === true && state.answers[index] !== data[index].answer);
    });
  }

  function renderQuestion() {
    if (!data.length) return;
    const q = data[state.current];
    passageTitle.textContent = q.section;
    const nextAudio = encodePath(`audio/${q.track}`);
    if (!audioPlayer.src.endsWith(nextAudio)) {
      audioPlayer.src = nextAudio;
      audioPlayer.load();
    }

    questionBadge.textContent = q.id;
    questionText.textContent = q.question;
    optionsList.innerHTML = '';

    q.options.forEach((option, optionIndex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-row';
      btn.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + optionIndex)}</span><span>${option}</span>`;

      if (state.answers[state.current] === optionIndex) btn.classList.add('selected');
      if (state.checked[state.current]) {
        btn.disabled = true;
        if (optionIndex === q.answer) btn.classList.add('correct');
        if (optionIndex === state.answers[state.current] && optionIndex !== q.answer) btn.classList.add('wrong');
      }

      btn.addEventListener('click', () => {
        if (state.checked[state.current]) return;
        state.answers[state.current] = optionIndex;
        questionAlert.textContent = '';
        renderQuestion();
      });
      optionsList.appendChild(btn);
    });

    if (state.checked[state.current]) {
      const correct = state.answers[state.current] === q.answer;
      feedbackBox.className = `feedback-box ${correct ? 'good' : 'bad'}`;
      feedbackBox.textContent = correct
        ? `Betul. ${q.explanation}`
        : `Jawapan yang tepat ialah ${String.fromCharCode(65 + q.answer)}. ${q.explanation}`;
    } else {
      feedbackBox.className = 'feedback-box hidden';
      feedbackBox.textContent = '';
    }

    questionCounter.textContent = `Soalan ${state.current + 1} daripada ${data.length}`;
    progressBar.style.width = `${((state.current + 1) / data.length) * 100}%`;
    prevBtn.disabled = state.current === 0;
    nextBtn.textContent = state.current === data.length - 1 ? 'Hantar Jawapan ✓' : 'Seterusnya ›';
    updateNav();
  }

  function markCurrent() {
    const index = state.current;
    const q = data[index];
    if (state.answers[index] === undefined) {
      questionAlert.textContent = 'Pilih satu jawapan sebelum meneruskan.';
      return false;
    }

    if (!state.checked[index]) {
      state.checked[index] = true;
      if (state.answers[index] === q.answer) state.score += 1;
    }
    questionAlert.textContent = '';
    return true;
  }

  function showResults() {
    const total = data.length;
    const percent = Math.round((state.score / total) * 100);
    document.getElementById('finalScore').textContent = `${state.score} / ${total}`;
    document.getElementById('correctCount').textContent = state.score;
    document.getElementById('wrongCount').textContent = total - state.score;
    document.getElementById('percentage').textContent = `${percent}%`;

    let title = 'Teruskan usaha!';
    let message = 'Dengar semula petikan dan teliti maklum balas bagi setiap soalan.';
    if (percent >= 80) {
      title = 'Syabas!';
      message = 'Pencapaian yang sangat baik. Anda memahami kebanyakan maklumat penting dalam petikan.';
    } else if (percent >= 60) {
      title = 'Bagus!';
      message = 'Pencapaian yang baik. Semak semula soalan yang tersilap untuk memperkukuh kefahaman.';
    }

    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultMessage').textContent = message;
    quizApp.classList.add('hidden');
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({behavior:'smooth', block:'start'});
  }

  startBtn.addEventListener('click', () => {
    const name = document.getElementById('studentName').value.trim();
    const klass = document.getElementById('studentClass').value.trim();
    const error = document.getElementById('startError');
    if (!name || !klass) {
      error.textContent = 'Masukkan nama dan kelas sebelum memulakan latihan.';
      return;
    }
    error.textContent = '';
    welcomeCard.classList.add('hidden');
    quizApp.classList.remove('hidden');
    renderQuestion();
    quizApp.scrollIntoView({behavior:'smooth', block:'start'});
  });

  prevBtn.addEventListener('click', () => {
    if (state.current > 0) {
      state.current -= 1;
      renderQuestion();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!markCurrent()) return;
    renderQuestion();

    if (state.current === data.length - 1) {
      const allAnswered = data.every((_, index) => state.answers[index] !== undefined);
      if (!allAnswered) {
        const firstMissing = data.findIndex((_, index) => state.answers[index] === undefined);
        questionAlert.textContent = 'Masih ada soalan yang belum dijawab.';
        state.current = firstMissing;
        renderQuestion();
        return;
      }
      data.forEach((_, index) => {
        if (!state.checked[index]) {
          state.current = index;
          markCurrent();
        }
      });
      showResults();
      return;
    }

    state.current += 1;
    renderQuestion();
  });

  retryBtn.addEventListener('click', () => location.reload());

  buildNav();
})();
