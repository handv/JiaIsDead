// The caller supplies only documents already found in the current save.
function jiaFindPersonMentions(name, documents) {
  const query = String(name || '').trim();
  if (!query) return [];
  return documents.flatMap(doc => {
    const body = doc.body || [];
    const mentions = body.flatMap((text, paragraph) =>
      typeof text === 'string' && text.includes(query) ? [{text, paragraph,
        context:body.slice(Math.max(0,paragraph-1),paragraph+2).join('\n')}] : []);
    return mentions.length ? [{id:doc.id, title:doc.title, mentions}] : [];
  });
}

export { jiaFindPersonMentions };

export function initPersonMentions() {
  if (typeof document === 'undefined' || window.__jiaMentionsInit) return;
  window.__jiaMentionsInit = true;

  'use strict';
  let query='', isOpen=false, opener=null;
  const panel=document.createElement('aside');
  panel.className='jia-notes jia-mentions'; panel.hidden=true;
  panel.setAttribute('aria-label','人物提及');
  panel.innerHTML='<div class="jia-notes-head"><h2></h2><button class="jia-icon" aria-label="收起人物提及">✕</button></div><p class="jia-help">已找到案卷中提到这个名字的原文，保留相邻上下文。</p><div class="jia-mentions-count" role="status" aria-live="polite"></div><div class="jia-excerpt-list"></div>';
  document.body.append(panel);
  const list=panel.querySelector('.jia-excerpt-list');
  function close(restoreFocus=false) {
    isOpen=false; panel.hidden=true;
    if(restoreFocus && opener?.isConnected) opener.focus();
  }
  function render() {
    const results=jiaFindPersonMentions(query,window.jiaCaseActions?.foundDocuments() || []);
    panel.querySelector('h2').textContent=`「${query}」的提及`;
    panel.querySelector('.jia-mentions-count').textContent=`${results.length} 份案卷 · ${results.reduce((sum,doc)=>sum+doc.mentions.length,0)} 处原文`;
    list.replaceChildren();
    if(!results.length) {
      const empty=document.createElement('p'); empty.className='jia-excerpt-empty';
      empty.textContent='已找到的案卷里还没有这个名字的原文。其他称呼和未署名的线索，需要继续核对。'; list.append(empty);
    }
    for(const doc of results) {
      for(const mention of doc.mentions) {
        const card=document.createElement('section'); card.className='jia-excerpt-card';
        const quote=document.createElement('p'); quote.className='jia-excerpt-text';
        const context=mention.context;
        let offset=0, next;
        while((next=context.indexOf(query,offset))!==-1) {
          quote.append(document.createTextNode(context.slice(offset,next)));
          const mark=document.createElement('mark'); mark.textContent=query; quote.append(mark); offset=next+query.length;
        }
        quote.append(document.createTextNode(context.slice(offset)));
        const source=document.createElement('button'); source.className='jia-excerpt-source';
        source.textContent=`来源：${doc.title} ↗`; source.title='打开来源并定位这段原文';
        source.addEventListener('click',()=>{
          if(window.jiaCaseActions?.openDocument(doc.id,mention.paragraph)) close();
        });
        const actions=document.createElement('div'); actions.className='jia-excerpt-actions';
        const excerpt=document.createElement('button'); excerpt.textContent='加入摘录';
        excerpt.addEventListener('click',()=>{
          window.jiaEnhancer?.capture(context,doc.id,null,doc.title);
        });
        actions.append(excerpt); card.append(quote,source,actions); list.append(card);
      }
    }
  }
  window.jiaMentions={open(name,event) {
    if(window.jiaEnhancer?.isDragging(event)) return;
    query=String(name || '').trim(); if(!query) return;
    opener=event?.currentTarget || document.activeElement;
    window.dispatchEvent(new Event('jia-close-tools'));
    isOpen=true; render(); panel.hidden=false; list.scrollTop=0;
    panel.querySelector('button').focus();
  }};
  panel.querySelector('.jia-icon').addEventListener('click',()=>close(true));
  window.addEventListener('jia-close-mentions',()=>close());
  window.addEventListener('jia-case-data',()=>{if(isOpen) render();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && isOpen) {event.preventDefault();close(true);}});
  const root=document.getElementById('root');
  if(root) new MutationObserver(()=>{if(!document.querySelector('#root nav.tabs')) close();})
    .observe(root,{childList:true,subtree:true});
}
