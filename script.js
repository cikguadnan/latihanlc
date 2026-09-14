(() => {
  const data = window.QUIZ_DATA || [];
  const startCard = document.getElementById('startCard');
  const quizArea = document.getElementById('quizArea');
  const finalCard = document.getElementById('finalCard');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const liveScore = document.getElementById('liveScore');
  const template = document.getElementById('sectionTemplate');
  const state = { checkedSections: new Set(), score: 0 };

  const groups = data.reduce((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push(q);
    return acc;
  }, {});

  function encodePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function renderQuiz() {
    quizArea.innerHTML = '';
    Object.entries(groups).forEach(([sectionName, questions], sectionIndex) => {
      const node = template.content.cloneNode(true);
      const article = node.querySelector('.quiz-section');
      article.dataset.section = sectionName;
      node.querySelector('.section-label').textContent = `Bahagian ${sectionIndex + 1}`;
      node.querySelector('.section-title').textContent = sectionName;
      const audio = node.querySelector('.track-player');
      audio.src = encodePath(`audio/${questions[0].track}`);

      const list = node.querySelector('.question-list');
      questions.forEach(q => {
        const card = document.createElement('section');
        card.className = 'question-card';
        card.dataset.questionId = q.id;
        card.innerHTML = `
          <div class="question-number">Soalan ${q.id}</div>
          <div class="question-text">${q.question}</div>
          <div class="options">
            ${q.options.map((opt, i) => `
              <label class="option">
                <input type="radio" name="q${q.id}" value="${i}">
                <span class="option-letter">${String.fromCharCode(65+i)}</span>
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
          <div class="feedback" aria-live="polite"></div>`;
        list.appendChild(card);
      });

      node.querySelector('.check-section').addEventListener('click', () => checkSection(article, questions));
      quizArea.appendChild(node);
    });
  }

  function checkSection(article, questions) {
    if (state.checkedSections.has(article.dataset.section)) return;
    const unanswered = questions.filter(q => !article.querySelector(`input[name="q${q.id}"]:checked`));
    const alert = article.querySelector('.section-alert');

    if (unanswered.length) {
      alert.textContent = `Jawab semua soalan dalam petikan ini dahulu. Soalan belum dijawab: ${unanswered.map(q => q.id).join(', ')}.`;
      return;
    }

    alert.textContent = '';
    let sectionScore = 0;

    questions.forEach(q => {
      const card = article.querySelector(`[data-question-id="${q.id}"]`);
      const selected = Number(card.querySelector(`input[name="q${q.id}"]:checked`).value);
      const labels = [...card.querySelectorAll('.option')];
      labels.forEach((label, index) => {
        label.querySelector('input').disabled = true;
        if (index === q.answer) label.classList.add('correct');
        if (index === selected && selected !== q.answer) label.classList.add('incorrect');
      });

      const feedback = card.querySelector('.feedback');
      const isCorrect = selected === q.answer;
      if (isCorrect) {
        sectionScore++;
        state.score++;
        feedback.className = 'feedback show good';
        feedback.textContent = `Betul. ${q.explanation}`;
      } else {
        feedback.className = 'feedback show bad';
        feedback.textContent = `Jawapan yang tepat ialah ${String.fromCharCode(65 + q.answer)}. ${q.explanation}`;
      }
    });

    state.checkedSections.add(article.dataset.section);
    const status = article.querySelector('.section-status');
    status.textContent = `${sectionScore} / ${questions.length} betul`;
    status.classList.add('done');
    article.querySelector('.check-section').disabled = true;
    article.querySelector('.check-section').textContent = 'Petikan Disemak';
    liveScore.textContent = `${state.score} / ${data.length}`;

    if (state.checkedSections.size === Object.keys(groups).length) showFinal();
    else {
      const next = article.nextElementSibling;
      if (next) next.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }

  function showFinal() {
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
    document.getElementById('finalTitle').textContent = title;
    document.getElementById('finalMessage').textContent = message;
    finalCard.classList.remove('hidden');
    finalCard.scrollIntoView({behavior:'smooth', block:'start'});
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
    startCard.classList.add('hidden');
    quizArea.classList.remove('hidden');
    quizArea.scrollIntoView({behavior:'smooth', block:'start'});
  });

  retryBtn.addEventListener('click', () => location.reload());

  renderQuiz();
})();
