/* Public-page enhancement. Original game state and React DOM stay untouched. */
export function bindNotesPanelDrag(panel, getPos, setPos) {
  const head = panel.querySelector('.jia-notes-head');
  if (!head || head.dataset.jiaDragBound) return;
  head.dataset.jiaDragBound = '1';
  let drag = null;
  const clamp = (left, top) => {
    const width = panel.offsetWidth || 320;
    const height = panel.offsetHeight || 240;
    return {
      left: Math.max(8, Math.min(window.innerWidth - Math.min(width, 80), left)),
      top: Math.max(8, Math.min(window.innerHeight - Math.min(height, 80), top)),
    };
  };
  const apply = (pos) => {
    if (!pos || !Number.isFinite(pos.left) || !Number.isFinite(pos.top)) return;
    const next = clamp(pos.left, pos.top);
    panel.style.left = `${next.left}px`;
    panel.style.top = `${next.top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  };
  apply(getPos?.());
  head.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, input, textarea, select, a')) return;
    const rect = panel.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    panel.classList.add('is-dragging');
    head.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  head.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    apply({
      left: drag.left + event.clientX - drag.x,
      top: drag.top + event.clientY - drag.y,
    });
  });
  const end = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    panel.classList.remove('is-dragging');
    const rect = panel.getBoundingClientRect();
    const pos = clamp(rect.left, rect.top);
    apply(pos);
    setPos?.(pos);
  };
  head.addEventListener('pointerup', end);
  head.addEventListener('pointercancel', end);
  window.addEventListener('resize', () => {
    if (!panel.hidden && panel.style.left) {
      apply({
        left: parseFloat(panel.style.left),
        top: parseFloat(panel.style.top),
      });
    }
  });
  return apply;
}

export function initInteraction() {
  if (typeof document === 'undefined' || window.__jiaInteractionInit) return;
  window.__jiaInteractionInit = true;

  'use strict';
  const KEY = 'jia-click-notes-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const makeId = () => crypto.randomUUID();
  const cleanHTML = html => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const walk = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        if (['SCRIPT','STYLE','IFRAME','OBJECT'].includes(child.tagName)) { child.remove(); continue; }
        walk(child);
        if (!['DIV','P','BR','S','STRIKE','DEL','B','STRONG','I','EM'].includes(child.tagName)) child.replaceWith(...child.childNodes);
        else for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
      }
    };
    walk(template.content);
    return template.innerHTML;
  };
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  if (!state || !Array.isArray(state.notes) || !Array.isArray(state.highlights)) state = { notes:[], highlights:[] };
  state.notes = state.notes.filter(n => n && typeof n.id === 'string').map(n => ({
    id:n.id,
    title:String(n.title || '推断').replace(/^推理便签/, '推断'),
    html:cleanHTML(String(n.html || '')),
  }));
  state.highlights = state.highlights.filter(h => h && typeof h.doc === 'string' && Number.isInteger(h.p) && Number.isInteger(h.start) && Number.isInteger(h.end) && h.start >= 0 && h.end > h.start);
  const isGardenDoc = doc => /^G/i.test(String(doc || ''));
  const normalizeExcerpt = e => ({
    id: typeof e.id === 'string' ? e.id : makeId(),
    doc: e.doc,
    text: e.text,
    source: typeof e.source === 'string' ? e.source : '',
    createdAt: e.createdAt || '',
  });
  const dedupeExcerpts = list => {
    const keys = new Set();
    return (Array.isArray(list) ? list : []).filter(e => {
      if (!e || typeof e.doc !== 'string' || typeof e.text !== 'string') return false;
      const key = JSON.stringify([e.doc, e.text]);
      if (keys.has(key)) return false;
      keys.add(key);
      return true;
    }).map(normalizeExcerpt);
  };
  const legacyExcerpts = dedupeExcerpts(state.excerpts);
  const legacyGarden = dedupeExcerpts(state.gardenExcerpts);
  // Migrate: old saves mixed both cases in `excerpts`; split by doc id (G* = garden).
  state.excerpts = [
    ...legacyExcerpts.filter(e => !isGardenDoc(e.doc)),
    ...legacyGarden.filter(e => !isGardenDoc(e.doc)),
  ];
  state.gardenExcerpts = [
    ...legacyGarden.filter(e => isGardenDoc(e.doc)),
    ...legacyExcerpts.filter(e => isGardenDoc(e.doc)),
  ];
  const excerptKeys = new Set();
  state.excerpts = state.excerpts.filter(e => {
    const key = JSON.stringify([e.doc, e.text]);
    if (excerptKeys.has(key)) return false;
    excerptKeys.add(key);
    return true;
  });
  const gardenExcerptKeys = new Set();
  state.gardenExcerpts = state.gardenExcerpts.filter(e => {
    const key = JSON.stringify([e.doc, e.text]);
    if (gardenExcerptKeys.has(key)) return false;
    gardenExcerptKeys.add(key);
    return true;
  });
  delete state.copiedTexts;
  if (!state.notes.length) state.notes.push({ id:makeId(), title:'推断 1', html:'' });
  if (!state.panelPos || typeof state.panelPos !== 'object') state.panelPos = {};
  let activeId = state.notes[0].id, captured = null, readerSelection = null, editorRange = null, deleted = null;
  let isOpen = false, excerptsOpen = false, hasOpened = false, toastTimer, pointerStart=null, pointerDragged=false;
  let clearedMainExcerpts = null, clearedGardenExcerpts = null;
  const inGardenCase = () => Boolean(window.jiaCaseActions?.inGarden);
  const excerptList = (doc) => {
    if (doc != null && doc !== '') return isGardenDoc(doc) ? state.gardenExcerpts : state.excerpts;
    return inGardenCase() ? state.gardenExcerpts : state.excerpts;
  };
  const getCleared = () => (inGardenCase() ? clearedGardenExcerpts : clearedMainExcerpts);
  const setCleared = (list) => {
    if (inGardenCase()) clearedGardenExcerpts = list;
    else clearedMainExcerpts = list;
  };
  const aside = document.createElement('aside');
  aside.className = 'jia-notes'; aside.hidden = true;
  aside.setAttribute('role','dialog'); aside.setAttribute('aria-label','推断');
  aside.innerHTML = `<div class="jia-notes-head"><h2>推断</h2><button data-action="new">＋ 新页</button><button class="jia-icon" data-action="close" aria-label="收起推断">✕</button></div>
    <p class="jia-help">写自己的疑问、假设和结论。<br>案卷原话请放在「摘录」；需要对照时再「插入摘录」。</p>
    <div class="jia-note-list"></div><div class="jia-notes-footer"><span role="status" aria-live="polite">保存在此浏览器</span><button data-action="restore" hidden>撤销删除</button></div>`;
  const toggle = document.createElement('button'); toggle.className='jia-toggle'; toggle.textContent='✎ 推断'; toggle.hidden=true;
  const excerpts = document.createElement('aside'); excerpts.className='jia-notes jia-excerpts'; excerpts.hidden=true;
  excerpts.setAttribute('role','dialog'); excerpts.setAttribute('aria-label','摘录');
  excerpts.innerHTML='<div class="jia-notes-head"><h2>摘录</h2><button data-excerpt-action="clear">清空</button><button class="jia-icon" data-excerpt-action="close" aria-label="收起摘录">✕</button></div><p class="jia-help">收藏案卷原话备查。点关键字可带到档册；不必抄进推断。</p><div class="jia-excerpt-list"></div><div class="jia-notes-footer"><span>保存在此浏览器</span><button data-excerpt-action="restore" hidden>撤销清空</button></div>';
  const excerptToggle=document.createElement('button'); excerptToggle.className='jia-toggle jia-excerpt-toggle'; excerptToggle.hidden=true;
  const toolbar = document.createElement('div'); toolbar.className='jia-selection'; toolbar.hidden=true; toolbar.setAttribute('role','toolbar'); toolbar.setAttribute('aria-label','文字操作');
  const toast = document.createElement('div'); toast.className='jia-toast'; toast.hidden=true; toast.setAttribute('role','status');
  document.body.append(aside,toggle,excerpts,excerptToggle,toolbar,toast);
  const say = message => { clearTimeout(toastTimer); toast.textContent=message; toast.hidden=false; toastTimer=setTimeout(()=>toast.hidden=true,2300); };
  const save = () => {
    try { localStorage.setItem(KEY,JSON.stringify(state)); for(const panel of [aside,excerpts]) $('.jia-notes-footer span',panel).textContent='已自动保存 · 此浏览器'; }
    catch { for(const panel of [aside,excerpts]) $('.jia-notes-footer span',panel).textContent='保存失败，请保留此页面'; }
  };
  const applyNotesPos = bindNotesPanelDrag(
    aside,
    () => state.panelPos.notes,
    (pos) => { state.panelPos.notes = pos; save(); },
  );
  const applyExcerptsPos = bindNotesPanelDrag(
    excerpts,
    () => state.panelPos.excerpts,
    (pos) => { state.panelPos.excerpts = pos; save(); },
  );
  const updatePanels = () => {
    const inGame=!!$('#root nav.tabs');
    aside.hidden=!inGame || !isOpen; excerpts.hidden=!inGame || !excerptsOpen;
    toggle.hidden=!inGame || isOpen; excerptToggle.hidden=!inGame || excerptsOpen;
    if (inGame && isOpen) applyNotesPos?.(state.panelPos.notes);
    if (inGame && excerptsOpen) applyExcerptsPos?.(state.panelPos.excerpts);
  };
  const setOpen = open => { isOpen=open; if(open) {excerptsOpen=false;window.dispatchEvent(new Event('jia-close-mentions'));} updatePanels(); toolbar.hidden=true; };
  const setExcerptsOpen = open => { excerptsOpen=open; if(open) {isOpen=false;window.dispatchEvent(new Event('jia-close-mentions'));} updatePanels(); toolbar.hidden=true; };
  window.addEventListener('jia-close-tools',()=>{isOpen=false;excerptsOpen=false;updatePanels();toolbar.hidden=true;});
  const editor = id => $(`[data-note-id="${CSS.escape(id || activeId)}"] .jia-note-editor`,aside);
  const rememberCaret = () => {
    const selection=window.getSelection();
    if (!selection.rangeCount) return;
    const range=selection.getRangeAt(0), element=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
    const note=element.closest?.('.jia-note');
    if (note) { activeId=note.dataset.noteId; editorRange=range.cloneRange(); }
  };
  const activate = id => {
    activeId=id;
    for (const note of aside.querySelectorAll('.jia-note')) note.classList.toggle('is-active',note.dataset.noteId===id);
  };
  function renderNotes() {
    const list=$('.jia-note-list',aside); list.replaceChildren(); editorRange=null;
    for (const note of state.notes) {
      const card=document.createElement('section'); card.className='jia-note'; card.dataset.noteId=note.id;
      card.innerHTML='<div class="jia-note-header"><input class="jia-note-title" aria-label="推断标题"><button data-action="strike" title="选中文字后加／取消删除线（Ctrl+Shift+X）" aria-label="添加或取消删除线"><s>划去</s></button><button data-action="delete" aria-label="删除此页">✕</button></div><div class="jia-note-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="推断内容" data-placeholder="写下疑问、假设、结论，以及还要核对什么…"></div>';
      $('.jia-note-title',card).value=note.title; $('.jia-note-editor',card).innerHTML=note.html;
      list.append(card);
    }
    activate(activeId);
  }
  function sourceTitle(item) {
    return window.jiaCaseActions?.titleFor(item.doc) || item.source || `案卷 ${item.doc}`;
  }
  function record(text,doc,source) {
    captured={text,doc:doc || $('.document')?.dataset.jiaDoc || '',source:source || $('.document h2')?.textContent || ''};
  }
  function renderExcerpts() {
    const listItems = excerptList();
    const garden = inGardenCase();
    const title = garden ? '园案摘录' : '摘录';
    excerpts.setAttribute('aria-label', title);
    const heading = $('h2', excerpts);
    if (heading) heading.textContent = title;
    const focusedId=excerpts.contains(document.activeElement)?document.activeElement.closest('[data-excerpt-id]')?.dataset.excerptId:null;
    excerptToggle.textContent=`${title} ${listItems.length}`;
    $('[data-excerpt-action="clear"]',excerpts).disabled=!listItems.length;
    $('[data-excerpt-action="restore"]',excerpts).hidden=!getCleared();
    const list=$('.jia-excerpt-list',excerpts); list.replaceChildren();
    if(!listItems.length) { const empty=document.createElement('p'); empty.className='jia-excerpt-empty'; empty.textContent='暂无摘录'; list.append(empty); }
    const groups=new Map();
    for(const item of [...listItems].reverse()) {
      if(!groups.has(item.doc)) groups.set(item.doc,[]);
      groups.get(item.doc).push(item);
    }
    for(const [doc,items] of groups) {
      const card=document.createElement('section'); card.className='jia-excerpt-card jia-excerpt-file'; card.dataset.excerptDoc=doc;
      const fileTitle=document.createElement('h3'); fileTitle.className='jia-excerpt-file-title'; fileTitle.textContent=sourceTitle(items[0]);
      const words=document.createElement('div'); words.className='jia-excerpt-words';
      for(const item of items) {
        const chip=document.createElement('span'); chip.className='jia-excerpt-chip'; chip.dataset.excerptId=item.id;
        const word=document.createElement('button'); word.type='button'; word.className='jia-excerpt-word';
        word.dataset.excerptAction='archive'; word.textContent=item.text;
        word.title='点击带到档册检索';
        word.setAttribute('aria-label',`带到档册：${item.text}`);
        const remove=document.createElement('button'); remove.type='button'; remove.className='jia-excerpt-remove';
        remove.dataset.excerptAction='remove'; remove.textContent='×';
        remove.title='删除这条摘录';
        remove.setAttribute('aria-label',`删除摘录：${item.text}`);
        chip.append(word,remove); words.append(chip);
      }
      const actions=document.createElement('div'); actions.className='jia-excerpt-actions';
      const cite=document.createElement('button'); cite.dataset.excerptAction='cite-file'; cite.textContent='插入摘录';
      cite.title='把本卷摘录插入当前推断页，便于对照，不是代替推断';
      actions.append(cite); card.append(fileTitle,words,actions); list.append(card);
    }
    if(focusedId) list.querySelector(`[data-excerpt-id="${CSS.escape(focusedId)}"] .jia-excerpt-word`)?.focus({preventScroll:true});
  }
  function addExcerpt(text,doc,source) {
    record(text,doc,source);
    const bucket = excerptList(captured.doc);
    const existing=bucket.find(e=>e.doc===captured.doc && e.text===text);
    if(!existing) bucket.push({id:makeId(),doc:captured.doc,text,source:captured.source,createdAt:new Date().toISOString()});
    renderExcerpts(); save(); paintTerms(); setExcerptsOpen(true);
    say(existing?'这条原话已在摘录中':`「${text.length>24?text.slice(0,24)+'…':text}」已加入摘录`);
  }
  function isExcerpted(doc,text) { return excerptList(doc).some(e=>e.doc===doc && e.text===text); }
  async function copyText(text) {
    let copied=false;
    try { await navigator.clipboard.writeText(text); copied=true; }
    catch {
      const focus=document.activeElement, input=document.createElement('textarea');
      input.value=text; input.setAttribute('aria-hidden','true'); input.style.cssText='position:fixed;left:-9999px;top:0;';
      (document.querySelector('.jia-document-dialog[open]') || excerpts.closest('dialog[open]') || document.body).append(input);
      input.select();
      try { copied=document.execCommand('copy'); } catch {}
      input.remove(); if(focus?.isConnected) focus.focus({preventScroll:true});
    }
    say(copied?`已复制「${text.length>24?text.slice(0,24)+'…':text}」`:'复制未成功，请选中文字后按 Ctrl+C');
    return copied;
  }
  function paintTerms() {
    for(const article of document.querySelectorAll('.document[data-jia-doc]')) {
      for(const term of article.querySelectorAll('.term')) {
        const done=isExcerpted(article.dataset.jiaDoc,term.textContent);
        term.classList.toggle('is-excerpted',done);
        term.classList.remove('is-copied');
        const filed=term.classList.contains('is-filed');
        term.title=`${filed?'已入档 · ':''}单击带到档册；悬停可加入摘录`;
      }
    }
  }
  window.jiaEnhancer={ isExcerpted, isDragging:event=>!!event && pointerDragged && event.detail!==0, hideToolbar(){ toolbar.hidden=true; }, capture(text,doc,event,source) {
    if (event && pointerDragged && event.detail!==0) return;
    addExcerpt(text,doc,source);
  }};
  const selectionInto = range => { const selection=window.getSelection(); selection.removeAllRanges(); selection.addRange(range); };
  function insert() {
    if (!captured) { say('请先点击词语，或选中正文'); return; }
    const target=editor(); target.focus();
    if (editorRange && target.contains(editorRange.commonAncestorContainer)) selectionInto(editorRange);
    else { const range=document.createRange(); range.selectNodeContents(target); range.collapse(false); selectionInto(range); }
    document.execCommand('insertText',false,`${target.textContent.trim()?'\n':''}“${captured.text}”\n——${sourceTitle(captured)}\n`);
    rememberCaret(); syncEditor(target); toolbar.hidden=true; say('已插入摘录，可继续写推断');
  }
  function syncEditor(target) {
    const note=state.notes.find(n=>n.id===target.closest('.jia-note').dataset.noteId);
    if (note) { note.html=cleanHTML(target.innerHTML); save(); }
  }
  async function copyNoteSelection() {
    rememberCaret();
    const target=editor();
    if(!editorRange || editorRange.collapsed || !target.contains(editorRange.commonAncestorContainer)) { say('请先选中推断里要复制的文字'); return; }
    const range=editorRange.cloneRange();
    target.focus(); selectionInto(range);
    const text=window.getSelection().toString();
    if(!text) { say('请先选中推断里要复制的文字'); return; }
    let copied=false;
    try { await navigator.clipboard.writeText(text); copied=true; }
    catch {
      if(target.isConnected) { target.focus(); selectionInto(range); copied=document.execCommand('copy'); }
    }
    say(copied?'已复制选中文字':'请按 Ctrl+C 复制选中文字');
  }
  function strike(id) {
    rememberCaret();
    activate(id || activeId); const target=editor();
    if (!editorRange || editorRange.collapsed || !target.contains(editorRange.commonAncestorContainer)) { say('先选中推断里要划去的文字'); return; }
    const prefix=document.createRange(); prefix.selectNodeContents(target); prefix.setEnd(editorRange.startContainer,editorRange.startOffset);
    const start=prefix.toString().length;
    prefix.setEnd(editorRange.endContainer,editorRange.endOffset); const end=prefix.toString().length;
    const clone=target.cloneNode(true), originals=[], copies=[];
    const walk=document.createTreeWalker(target,NodeFilter.SHOW_TEXT), copyWalk=document.createTreeWalker(clone,NodeFilter.SHOW_TEXT);
    let node,offset=0;
    while((node=walk.nextNode())) { originals.push({text:node.data,start:offset,end:offset+node.length,struck:!!node.parentElement.closest('s,strike,del')}); offset+=node.length; }
    while((node=copyWalk.nextNode())) copies.push(node);
    const selected=originals.filter(n=>n.end>start && n.start<end);
    if(!selected.length) return;
    const apply=!selected.every(n=>n.struck);
    for(const old of [...clone.querySelectorAll('s,strike,del,font,span')]) old.replaceWith(...old.childNodes);
    originals.forEach((item,index)=>{
      const fragment=document.createDocumentFragment();
      const append=(text,struck)=>{ if(!text) return; if(struck) { const s=document.createElement('s'); s.textContent=text; fragment.append(s); } else fragment.append(document.createTextNode(text)); };
      if(item.end<=start || item.start>=end) append(item.text,item.struck);
      else {
        const a=Math.max(0,start-item.start),b=Math.min(item.text.length,end-item.start);
        append(item.text.slice(0,a),item.struck); append(item.text.slice(a,b),apply); append(item.text.slice(b),item.struck);
      }
      copies[index].replaceWith(fragment);
    });
    target.replaceChildren(...clone.childNodes); target.focus();
    const restored=document.createRange(); restored.setStart(...pointAt(target,start)); restored.setEnd(...pointAt(target,end)); selectionInto(restored);
    editorRange=restored.cloneRange(); syncEditor(target); toolbar.hidden=true;
  }
  aside.addEventListener('pointerdown',event=>{ if(event.target.closest('button')) { rememberCaret(); event.preventDefault(); } });
  aside.addEventListener('focusin',event=>{ const card=event.target.closest('.jia-note'); if(card) activate(card.dataset.noteId); });
  aside.addEventListener('input',event=>{
    if(event.target.matches('.jia-note-editor')) { syncEditor(event.target); rememberCaret(); }
    if(event.target.matches('.jia-note-title')) { const note=state.notes.find(n=>n.id===event.target.closest('.jia-note').dataset.noteId); note.title=event.target.value; save(); }
  });
  aside.addEventListener('paste',event=>{
    if(!event.target.closest('.jia-note-editor')) return;
    event.preventDefault(); document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));
    syncEditor(event.target.closest('.jia-note-editor'));
  });
  aside.addEventListener('drop',event=>{ if(event.target.closest('.jia-note-editor')) event.preventDefault(); });
  aside.addEventListener('contextmenu',event=>{
    const target=event.target.closest('.jia-note-editor'); if(!target || !captured) return;
    const selection=window.getSelection();
    if(!selection.isCollapsed && target.contains(selection.anchorNode) && target.contains(selection.focusNode)) return;
    event.preventDefault(); activate(target.closest('.jia-note').dataset.noteId);
    const caret=document.caretRangeFromPoint?.(event.clientX,event.clientY);
    if(caret && target.contains(caret.startContainer)) editorRange=caret.cloneRange();
    else if(!editorRange || !target.contains(editorRange.commonAncestorContainer)) editorRange=null;
    insert();
  });
  aside.addEventListener('keydown',event=>{
    if(event.ctrlKey && event.shiftKey && event.key.toLowerCase()==='x' && event.target.matches('.jia-note-editor')) { event.preventDefault(); rememberCaret(); strike(); }
  });
  aside.addEventListener('click',event=>{
    const button=event.target.closest('button'); if(!button) return;
    const id=button.closest('.jia-note')?.dataset.noteId;
    switch(button.dataset.action) {
      case 'close': setOpen(false); break;
      case 'new': { const note={id:makeId(),title:`推断 ${state.notes.length+1}`,html:''}; state.notes.push(note); activeId=note.id; renderNotes(); save(); editor().focus(); break; }
      case 'insert': insert(); break;
      case 'strike': strike(id); break;
      case 'delete': {
        const index=state.notes.findIndex(n=>n.id===id); if(index<0) break;
        deleted={note:state.notes[index],index}; state.notes.splice(index,1);
        if(!state.notes.length) state.notes.push({id:makeId(),title:'推断 1',html:''});
        if(activeId===id) activeId=state.notes[0].id;
        renderNotes(); save(); $('[data-action="restore"]',aside).hidden=false; say('此页已删除，可撤销'); break;
      }
      case 'restore': if(deleted) { state.notes.splice(deleted.index,0,deleted.note); activeId=deleted.note.id; deleted=null; renderNotes(); save(); button.hidden=true; } break;
    }
  });
  toggle.addEventListener('click',()=>setOpen(true));
  excerptToggle.addEventListener('click',()=>{renderExcerpts();setExcerptsOpen(true);});
  window.addEventListener('jia-case-data',()=>{ renderExcerpts(); paintTerms(); });
  excerpts.addEventListener('click',event=>{
    const button=event.target.closest('[data-excerpt-action]'); if(!button) return;
    if(button.dataset.excerptAction==='close') { setExcerptsOpen(false); return; }
    if(button.dataset.excerptAction==='clear') {
      const bucket=excerptList();
      if(!bucket.length) return;
      setCleared(bucket.slice());
      if(inGardenCase()) state.gardenExcerpts=[];
      else state.excerpts=[];
      renderExcerpts(); save(); paintTerms(); say('摘录已清空，可撤销'); return;
    }
    if(button.dataset.excerptAction==='restore') {
      const cleared=getCleared();
      if(cleared) {
        const bucket=excerptList();
        const keys=new Set(bucket.map(e=>JSON.stringify([e.doc,e.text])));
        const restored=cleared.filter(e=>!keys.has(JSON.stringify([e.doc,e.text])));
        if(inGardenCase()) state.gardenExcerpts=[...bucket,...restored];
        else state.excerpts=[...bucket,...restored];
        setCleared(null); renderExcerpts(); save(); paintTerms();
      }
      return;
    }
    if(button.dataset.excerptAction==='cite-file') {
      const doc=button.closest('[data-excerpt-doc]')?.dataset.excerptDoc;
      const items=excerptList(doc).filter(e=>e.doc===doc);
      if(items.length) { captured={doc,text:items.map(e=>e.text).join('、'),source:sourceTitle(items[0])};setOpen(true);insert(); }
      return;
    }
    const itemId=button.closest('[data-excerpt-id]')?.dataset.excerptId;
    const item=excerptList().find(e=>e.id===itemId)
      || state.excerpts.find(e=>e.id===itemId)
      || state.gardenExcerpts.find(e=>e.id===itemId);
    if(!item) return;
    if(button.dataset.excerptAction==='remove') {
      if(isGardenDoc(item.doc)) state.gardenExcerpts=state.gardenExcerpts.filter(e=>e.id!==item.id);
      else state.excerpts=state.excerpts.filter(e=>e.id!==item.id);
      renderExcerpts(); save(); paintTerms();
      say(`已删除「${item.text.length>24?item.text.slice(0,24)+'…':item.text}」`);
      return;
    }
    if(button.dataset.excerptAction==='archive') {
      setExcerptsOpen(false);
      window.dispatchEvent(new CustomEvent('jia-bring-to-archive',{detail:{term:item.text,docId:item.doc}}));
      say(`已带到档册：「${item.text.length>24?item.text.slice(0,24)+'…':item.text}」`);
    }
  });
  function bodyParagraphs(article) { return [...article.querySelectorAll('[data-jia-paragraph]')]; }
  function pointAt(paragraph,offset) {
    const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT); let node;
    while((node=walker.nextNode())) { if(offset<=node.length) return [node,offset]; offset-=node.length; }
    return [paragraph,paragraph.childNodes.length];
  }
  function paintHighlights() {
    if(!window.CSS?.highlights || !window.Highlight) return;
    const ranges=[];
    for(const article of document.querySelectorAll('.document[data-jia-doc]')) {
      for(const h of state.highlights.filter(h=>h.doc===article.dataset.jiaDoc)) {
        const paragraph=bodyParagraphs(article)[h.p]; if(!paragraph || paragraph.textContent.length<h.end) continue;
        const range=document.createRange(); range.setStart(...pointAt(paragraph,h.start)); range.setEnd(...pointAt(paragraph,h.end)); ranges.push(range);
      }
    }
    CSS.highlights.set('jia-reader',new Highlight(...ranges));
  }
  function getReaderSelection(range) {
    const chunks=[];
    for(const article of document.querySelectorAll('.document[data-jia-doc]')) {
      bodyParagraphs(article).forEach((p,index)=>{
        if(!range.intersectsNode(p)) return;
        let start=0,end=p.textContent.length;
        if(p.contains(range.startContainer)) { const pre=document.createRange(); pre.selectNodeContents(p); pre.setEnd(range.startContainer,range.startOffset); start=pre.toString().length; }
        if(p.contains(range.endContainer)) { const pre=document.createRange(); pre.selectNodeContents(p); pre.setEnd(range.endContainer,range.endOffset); end=pre.toString().length; }
        if(end>start) chunks.push({doc:article.dataset.jiaDoc,p:index,start,end,text:p.textContent.slice(start,end)});
      });
    }
    return chunks;
  }
  function positionToolbar(rect,buttons) {
    toolbar.replaceChildren();
    for(const [label,handler] of buttons) { const button=document.createElement('button'); button.textContent=label; button.addEventListener('click',handler); toolbar.append(button); }
    toolbar.hidden=false; const width=toolbar.offsetWidth;
    toolbar.style.left=`${Math.max(8,Math.min(rect.left,window.innerWidth-width-8))}px`;
    toolbar.style.top=`${Math.max(8,Math.min(rect.bottom+8,window.innerHeight-toolbar.offsetHeight-8))}px`;
  }
  function annotate(remove) {
    if(!readerSelection?.length) return;
    if(!window.CSS?.highlights) { say('当前浏览器不支持文字高亮，请使用新版 Chrome 或 Edge'); return; }
    for(const chunk of readerSelection) {
      const next=[]; let start=chunk.start,end=chunk.end;
      for(const h of state.highlights) {
        if(h.doc!==chunk.doc || h.p!==chunk.p || h.end<chunk.start || h.start>chunk.end) { next.push(h); continue; }
        if(remove) {
          if(h.start<chunk.start) next.push({...h,end:chunk.start});
          if(h.end>chunk.end) next.push({...h,start:chunk.end});
        } else { start=Math.min(start,h.start); end=Math.max(end,h.end); }
      }
      if(!remove) next.push({doc:chunk.doc,p:chunk.p,start,end});
      state.highlights=next;
    }
    save(); paintHighlights(); toolbar.hidden=true; window.getSelection().removeAllRanges(); say(remove?'已取消高亮':'已添加高亮');
  }
  function selectionChanged() {
    const selection=window.getSelection(); if(!selection.rangeCount || selection.isCollapsed) { toolbar.hidden=true; return; }
    const range=selection.getRangeAt(0); const element=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
    // Keyword excerpt uses hover menu; don't also show the selection bar on a lone term.
    const termEl=element?.closest?.('.term');
    if(termEl && termEl.contains(range.startContainer) && termEl.contains(range.endContainer)) {
      toolbar.hidden=true; return;
    }
    const target=element.closest?.('.jia-note-editor');
    if(target) { rememberCaret(); positionToolbar(range.getBoundingClientRect(),[['复制',()=>copyNoteSelection()],['添加／取消删除线',()=>strike()]]); return; }
    readerSelection=getReaderSelection(range);
    if(!readerSelection.length) { toolbar.hidden=true; return; }
    record(readerSelection.map(c=>c.text).join('\n'),readerSelection[0].doc);
    const copyValue=range.toString();
    positionToolbar(range.getBoundingClientRect(),[['复制',()=>{copyText(copyValue);toolbar.hidden=true;}],['高亮',()=>annotate(false)],['取消高亮',()=>annotate(true)]]);
  }
  toolbar.addEventListener('pointerdown',event=>event.preventDefault());
  document.addEventListener('pointerdown',event=>{ pointerStart=[event.clientX,event.clientY]; pointerDragged=false; });
  document.addEventListener('pointerup',event=>{ pointerDragged=!!pointerStart && Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1])>4; if(!event.target.closest('.jia-selection, .jia-notes button')) setTimeout(selectionChanged,0); });
  document.addEventListener('keyup',event=>{ if(['Shift','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='a')) selectionChanged(); });
  document.addEventListener('selectionchange',rememberCaret);
  document.addEventListener('keydown',event=>{ if(event.key==='Escape') toolbar.hidden=true; });
  window.addEventListener('resize',()=>toolbar.hidden=true);
  document.addEventListener('scroll',()=>toolbar.hidden=true,true);
  const observer=new MutationObserver(()=>{
    const inGame=!!$('#root nav.tabs');
    if(inGame && !hasOpened) { hasOpened=true; setOpen(false); }
    updatePanels();
    paintHighlights(); paintTerms();
  });
  const root = $('#root');
  if (root) observer.observe(root,{childList:true,subtree:true});
  renderNotes(); renderExcerpts(); paintHighlights(); save();
}
