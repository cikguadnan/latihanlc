(() => {
  const sets = window.QUIZ_SETS || {};
  let selectedSetKey = 'latihan1';
  let data = [];

  const welcomeCard = document.getElementById('welcomeCard');
  const quizApp = document.getElementById('quizApp');
  const resultCard = document.getElementById('resultCard');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const homeBtn = document.getElementById('homeBtn');
  const setPicker = document.getElementById('setPicker');
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
  const activeSetLabel = document.getElementById('activeSetLabel');
  const resultSetLabel = document.getElementById('resultSetLabel');
  const state = { current: 0, answers: {}, checked: {}, score: 0 };

  function resetState(){ state.current=0; state.answers={}; state.checked={}; state.score=0; }
  function encodePath(path){ return path.split('/').map(encodeURIComponent).join('/'); }
  function assetUrl(path, folder=''){
    if(!path) return '';
    if(/^(https?:|data:|blob:)/i.test(path)) return path;
    const cleanFolder=(folder||'').replace(/^\/+|\/+$/g,'');
    const cleanPath=path.replace(/^\/+/, '');
    return encodePath(cleanFolder ? `${cleanFolder}/${cleanPath}` : cleanPath);
  }
  function normalizeOption(option){
    if(typeof option==='string') return {text:option,image:'',alt:option};
    return {
      text: option?.text || '',
      image: option?.image || option?.src || '',
      alt: option?.alt || option?.text || 'Pilihan jawapan bergambar'
    };
  }
  function goHome(){ audioPlayer.pause(); audioPlayer.currentTime=0; quizApp.classList.add('hidden'); resultCard.classList.add('hidden'); welcomeCard.classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }
  function selectSet(key){
    selectedSetKey=key;
    [...setPicker.querySelectorAll('.set-card')].forEach(card=>{
      const chosen=card.dataset.set===key; card.classList.toggle('selected',chosen); card.setAttribute('aria-checked',String(chosen));
    });
    document.getElementById('startError').textContent='';
  }
  setPicker.addEventListener('click',e=>{ const card=e.target.closest('.set-card'); if(card) selectSet(card.dataset.set); });

  function buildNav(){
    questionNav.innerHTML='';
    data.forEach((q,index)=>{
      const btn=document.createElement('button'); btn.type='button'; btn.dataset.index=index;
      btn.innerHTML=`<span class="nav-number">${q.id}</span><span class="nav-label">${q.section} – Soalan ${q.id}</span>`;
      btn.addEventListener('click',()=>{state.current=index;renderQuestion();}); questionNav.appendChild(btn);
    });
  }
  function updateNav(){
    [...questionNav.children].forEach((btn,index)=>{
      btn.classList.toggle('active',index===state.current); btn.classList.toggle('answered',state.answers[index]!==undefined);
      btn.classList.toggle('correct',state.checked[index]===true&&state.answers[index]===data[index].answer);
      btn.classList.toggle('wrong',state.checked[index]===true&&state.answers[index]!==data[index].answer);
    });
  }
  function renderQuestion(){
    if(!data.length)return; const q=data[state.current]; const chosenSet=sets[selectedSetKey]; passageTitle.textContent=q.section;
    const folder=chosenSet.audioFolder||'audio'; const nextAudio=assetUrl(q.track,folder);
    const currentPath=decodeURIComponent(new URL(audioPlayer.src||location.href,location.href).pathname);
    const wantedPath=decodeURIComponent(new URL(nextAudio,location.href).pathname);
    if(currentPath!==wantedPath){audioPlayer.src=nextAudio;audioPlayer.load();}
    questionBadge.textContent=q.id; questionText.textContent=q.question; optionsList.innerHTML='';

    const normalizedOptions=q.options.map(normalizeOption);
    const hasImages=normalizedOptions.some(option=>option.image);
    optionsList.classList.toggle('image-options',hasImages);

    normalizedOptions.forEach((option,optionIndex)=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className=`option-row${option.image?' image-option':''}`;
      const letter=document.createElement('span'); letter.className='option-letter'; letter.textContent=String.fromCharCode(65+optionIndex); btn.appendChild(letter);
      const content=document.createElement('span'); content.className='option-content';
      if(option.image){
        const img=document.createElement('img');
        const imageFolder=q.imageFolder||chosenSet.imageFolder||'images';
        img.src=assetUrl(option.image,imageFolder); img.alt=option.alt; img.loading='lazy'; content.appendChild(img);
      }
      if(option.text){ const text=document.createElement('span'); text.className='option-text'; text.textContent=option.text; content.appendChild(text); }
      btn.appendChild(content);
      btn.setAttribute('aria-label',`Pilihan ${String.fromCharCode(65+optionIndex)}${option.alt?`: ${option.alt}`:''}`);
      if(state.answers[state.current]===optionIndex)btn.classList.add('selected');
      if(state.checked[state.current]){btn.disabled=true;if(optionIndex===q.answer)btn.classList.add('correct');if(optionIndex===state.answers[state.current]&&optionIndex!==q.answer)btn.classList.add('wrong');}
      btn.addEventListener('click',()=>{if(state.checked[state.current])return;state.answers[state.current]=optionIndex;questionAlert.textContent='';renderQuestion();}); optionsList.appendChild(btn);
    });
    if(state.checked[state.current]){const correct=state.answers[state.current]===q.answer;feedbackBox.className=`feedback-box ${correct?'good':'bad'}`;feedbackBox.textContent=correct?`Betul. ${q.explanation}`:`Jawapan yang tepat ialah ${String.fromCharCode(65+q.answer)}. ${q.explanation}`;}
    else{feedbackBox.className='feedback-box hidden';feedbackBox.textContent='';}
    questionCounter.textContent=`Soalan ${state.current+1} daripada ${data.length}`;progressBar.style.width=`${((state.current+1)/data.length)*100}%`;prevBtn.disabled=state.current===0;nextBtn.textContent=state.current===data.length-1?'Hantar Jawapan ✓':'Seterusnya ›';updateNav();
  }
  function markCurrent(){const index=state.current,q=data[index];if(state.answers[index]===undefined){questionAlert.textContent='Pilih satu jawapan sebelum meneruskan.';return false;}if(!state.checked[index]){state.checked[index]=true;if(state.answers[index]===q.answer)state.score++;}questionAlert.textContent='';return true;}
  function showResults(){
    const total=data.length,percent=Math.round((state.score/total)*100);document.getElementById('finalScore').textContent=`${state.score} / ${total}`;document.getElementById('correctCount').textContent=state.score;document.getElementById('wrongCount').textContent=total-state.score;document.getElementById('percentage').textContent=`${percent}%`;resultSetLabel.textContent=`${sets[selectedSetKey].title} selesai`;
    let title='Teruskan usaha!',message='Dengar semula petikan dan teliti maklum balas bagi setiap soalan.';if(percent>=80){title='Syabas!';message='Pencapaian yang sangat baik. Anda memahami kebanyakan maklumat penting dalam petikan.';}else if(percent>=60){title='Bagus!';message='Pencapaian yang baik. Semak semula soalan yang tersilap untuk memperkukuh kefahaman.';}
    document.getElementById('resultTitle').textContent=title;document.getElementById('resultMessage').textContent=message;quizApp.classList.add('hidden');resultCard.classList.remove('hidden');resultCard.scrollIntoView({behavior:'smooth',block:'start'});
  }
  startBtn.addEventListener('click',()=>{
    const name=document.getElementById('studentName').value.trim(),klass=document.getElementById('studentClass').value.trim(),error=document.getElementById('startError'),chosenSet=sets[selectedSetKey];
    if(!name||!klass){error.textContent='Masukkan nama dan kelas sebelum memulakan latihan.';return;}if(!chosenSet||!chosenSet.questions||!chosenSet.questions.length){error.textContent='Set latihan ini belum tersedia.';return;}
    data=chosenSet.questions;resetState();activeSetLabel.textContent=chosenSet.title;buildNav();error.textContent='';welcomeCard.classList.add('hidden');resultCard.classList.add('hidden');quizApp.classList.remove('hidden');renderQuestion();quizApp.scrollIntoView({behavior:'smooth',block:'start'});
  });
  prevBtn.addEventListener('click',()=>{if(state.current>0){state.current--;renderQuestion();}});
  nextBtn.addEventListener('click',()=>{if(!markCurrent())return;renderQuestion();if(state.current===data.length-1){const allAnswered=data.every((_,i)=>state.answers[i]!==undefined);if(!allAnswered){const firstMissing=data.findIndex((_,i)=>state.answers[i]===undefined);state.current=firstMissing;renderQuestion();questionAlert.textContent='Masih ada soalan yang belum dijawab.';return;}data.forEach((_,i)=>{if(!state.checked[i]){state.current=i;markCurrent();}});showResults();return;}state.current++;renderQuestion();});
  homeBtn.addEventListener('click',goHome);
  retryBtn.addEventListener('click',goHome);
})();
