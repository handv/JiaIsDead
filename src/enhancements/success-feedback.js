/* Only actual native lock callbacks call celebrate; loading a save never does. */
export function initSuccessFeedback() {
  if (typeof document === 'undefined' || window.__jiaSuccessInit) return;
  window.__jiaSuccessInit = true;

  'use strict';
  const KEY = 'jia-success-sound-v1';
  let sound = true, audio, hideTimer, frame, flashTimer, activeHighlights = [], lastChoice = -Infinity;
  try { sound = localStorage.getItem(KEY) !== 'off'; } catch {}
  const notice = document.createElement('div');
  notice.className = 'jia-success'; notice.hidden = true;
  notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
  notice.setAttribute('aria-atomic', 'true');
  const seal = document.createElement('span'); seal.className = 'jia-success-seal';
  seal.textContent = '核定'; seal.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('div');
  const title = document.createElement('strong');
  const progress = document.createElement('span'); progress.className = 'jia-success-progress';
  const reward = document.createElement('span'); reward.className = 'jia-success-reward';
  copy.append(title, progress, reward); notice.append(seal, copy); document.body.append(notice);

  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'jia-sound-toggle';
  toggle.setAttribute('aria-label', '游戏提示音');
  function updateToggle() {
    toggle.textContent = sound ? '提示音：开' : '提示音：关';
    toggle.setAttribute('aria-pressed', String(sound));
    toggle.title = sound ? '关闭核对与案卷提示音' : '开启核对与案卷提示音';
  }
  updateToggle();
  function stopAudio() {
    if (audio?.state === 'running') audio.suspend().catch(() => {});
  }
  function unlockAudio(event) {
    if (!sound || !event.isTrusted) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context && !audio) audio = new Context();
      if (audio?.state === 'suspended') audio.resume().catch(() => {});
    } catch { /* Animation and native game progress still work without sound. */ }
  }
  function chime() {
    if (!sound || !audio) return;
    const play = () => {
      if (!sound || audio.state !== 'running') return;
      try {
        // Quiet ascending bell notes; no downloads or background music.
        for (const [index, frequency] of [659.25, 830.61, 987.77].entries()) {
          const at = audio.currentTime + index * 0.09;
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(0.055, at + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.42);
          oscillator.connect(gain); gain.connect(audio.destination);
          oscillator.start(at); oscillator.stop(at + 0.44);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        }
      } catch { /* A device change must not interrupt a successful validation. */ }
    };
    if (audio.state === 'running') play();
    else audio.resume().then(play).catch(() => {});
  }
  function paperSound(kind) {
    if (!sound || !audio || !['choose','confirm','spread','pick','open','close'].includes(kind)) return;
    const play = () => {
      if (!sound || audio.state !== 'running') return;
      try {
        const at = audio.currentTime;
        if (['spread','open','close'].includes(kind)) {
          // Original filtered-paper texture; the source recording is not used.
          const duration = kind==='spread' ? .36 : kind==='open' ? .30 : .18;
          const length = Math.ceil(audio.sampleRate * duration);
          const buffer = audio.createBuffer(1, length, audio.sampleRate);
          const samples = buffer.getChannelData(0);
          let previous=0;
          for (let i=0; i<length; i++) {previous=.35*previous+.65*(Math.random()*2-1);samples[i]=previous;}
          const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
          source.buffer = buffer; filter.type = 'bandpass'; filter.Q.value = .7;
          filter.frequency.setValueAtTime(700,at);
          filter.frequency.exponentialRampToValueAtTime(2600,at+duration*.4);
          filter.frequency.exponentialRampToValueAtTime(900,at+duration);
          gain.gain.setValueAtTime(.0001,at);
          gain.gain.linearRampToValueAtTime(kind==='close' ? .025 : .07,at+duration*.28);
          gain.gain.exponentialRampToValueAtTime(.012,at+duration*.75);
          gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
          source.connect(filter); filter.connect(gain); gain.connect(audio.destination);
          source.start(at); source.stop(at+duration);
          source.onended = () => {source.disconnect();filter.disconnect();gain.disconnect();};
        } else {
          const choosing=kind==='choose';
          if(choosing && at-lastChoice<.09) return;
          if(choosing) lastChoice=at;
          const duration=choosing ? .035 : .055;
          const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);
          const samples=buffer.getChannelData(0);
          for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
          const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
          source.buffer=buffer;filter.type='bandpass';filter.frequency.value=choosing ? 2100 : 1100;filter.Q.value=1.2;
          gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(choosing ? .027 : .045,at+.002);
          gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
          source.connect(filter);filter.connect(gain);gain.connect(audio.destination);
          source.start(at);source.stop(at+duration);
          source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
          if(!choosing) {
            // A small, low resonance gives confirmation more weight than hover.
            const oscillator=audio.createOscillator(),body=audio.createGain();
            oscillator.type='sine';oscillator.frequency.setValueAtTime(180,at);
            oscillator.frequency.exponentialRampToValueAtTime(130,at+.075);
            body.gain.setValueAtTime(.0001,at);body.gain.linearRampToValueAtTime(.035,at+.003);
            body.gain.exponentialRampToValueAtTime(.0001,at+.08);
            oscillator.connect(body);body.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.085);
            oscillator.onended=()=>{oscillator.disconnect();body.disconnect();};
          }
        }
      } catch { /* Reading and the animation remain available without audio. */ }
    };
    if (audio.state === 'running') play(); else audio.resume().then(play).catch(() => {});
  }
  toggle.addEventListener('click', event => {
    sound = !sound; updateToggle();
    try { localStorage.setItem(KEY, sound ? 'on' : 'off'); } catch {}
    if (sound) { unlockAudio(event); chime(); } else stopAudio();
  });
  document.addEventListener('pointerdown', unlockAudio, {capture: true});
  document.addEventListener('keydown', unlockAudio, {capture: true});
  const controlFor=event=>event.target?.closest?.('button,select,input[type="radio"],input[type="checkbox"]');
  const usable=control=>control&&!control.disabled&&control.getAttribute('aria-disabled')!=='true'&&!control.classList.contains('jia-sound-toggle');
  const choiceSelector='.jia-archive-deck,.jia-fan-card,.tabs button,.jia-paper-status-filter button,.jia-workspace-mobile-tabs button,.source-options input,.home-actions button,.slot select';
  const chooseControl=event=>{
    const control=controlFor(event);
    if(!event.isTrusted||event.pointerType==='touch'||!usable(control)||!control.matches(choiceSelector)) return;
    if(event.relatedTarget&&control.contains(event.relatedTarget)) return;
    paperSound('choose');
  };
  document.addEventListener('pointerover',chooseControl,{capture:true});
  document.addEventListener('focusin',chooseControl,{capture:true});
  document.addEventListener('click',event=>{
    const control=controlFor(event);
    if(!event.isTrusted||!usable(control)) return;
    // These have their own paper gestures or play when the reader opens.
    if(control.matches('.jia-archive-deck,.jia-fan-card,.jia-document-close,.jia-deck-close,.result-list button,select')) return;
    paperSound('confirm');
  },{capture:true});
  document.addEventListener('change',event=>{
    unlockAudio(event);
    if(event.isTrusted&&event.target?.matches('select')&&usable(event.target)) paperSound('confirm');
  },{capture:true});
  const mountToggle = () => {
    const end = document.querySelector('#root nav.tabs .tabs-end');
    if (end && toggle.parentNode !== end) end.prepend(toggle);
  };
  const root = document.getElementById('root');
  if (root) new MutationObserver(mountToggle).observe(root, {childList: true, subtree: true});
  mountToggle();

  function clearHighlights() {
    clearTimeout(flashTimer);
    for (const element of activeHighlights) element.classList.remove('jia-newly-confirmed');
    activeHighlights = [];
  }
  function celebrate({kind = 'clan', ids = [], courtId, count = ids.length, total = 0,
    complete = false, rewardTitles = []} = {}) {
    if (!ids.length) return;
    clearTimeout(hideTimer); cancelAnimationFrame(frame); clearHighlights();
    title.textContent = complete ? (kind === 'garden' ? '园图核毕' : '族谱核毕') :
      (kind === 'garden' ? '此院核对成功' : `${count} 格核对成功`);
    progress.textContent = kind === 'garden' ? `已核 ${total} 院` : `族谱已核 ${total} 格`;
    reward.textContent = rewardTitles.length ? `新发：${rewardTitles.join('、')}` : '又一段线索对上了。';
    notice.hidden = false; notice.classList.remove('is-celebrating');
    // React commits the newly locked nodes before this frame.
    frame = requestAnimationFrame(() => {
      notice.classList.add('is-celebrating');
      for (const id of ids) {
        const element = document.querySelector(`[data-tree-id="${CSS.escape(id)}"]`);
        if (element) activeHighlights.push(element);
      }
      if (courtId) {
        const pin = document.querySelector(`[data-jia-court="${CSS.escape(courtId)}"]`);
        if (pin) activeHighlights.push(pin);
      }
      for (const element of activeHighlights) element.classList.add('jia-newly-confirmed');
      flashTimer = setTimeout(clearHighlights, 1700);
    });
    hideTimer = setTimeout(() => {notice.hidden = true; notice.classList.remove('is-celebrating');},
      rewardTitles.length ? 4200 : 3000);
    chime();
  }
  window.jiaSuccess = {celebrate,paperSound};
}
