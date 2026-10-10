/* Desktop pedigree navigation; compact touch navigation remains native. */
export function initTreePan() {
  if (typeof document === 'undefined' || window.__jiaTreePanInit) return;
  window.__jiaTreePanInit = true;

  'use strict';
  let held=false, drag=null, suppressClickUntil=0;
  const canvas=()=>document.querySelector('.tree-panel .pedigree-wrap');
  const editing=target=>target?.closest?.('input,textarea,select,[contenteditable="true"]');
  const space=event=>event.code==='Space' || event.key===' ';
  function endDrag() {
    if(!drag) return;
    const {viewport,id}=drag;
    drag=null; suppressClickUntil=Date.now()+250;
    viewport.classList.remove('is-space-panning');
    if(viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
  }
  function reset() {
    held=false; endDrag(); document.body.classList.remove('jia-space-pan');
  }
  document.addEventListener('keydown',event=>{
    if(!space(event) || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || editing(event.target) || !canvas()) return;
    event.preventDefault(); held=true; document.body.classList.add('jia-space-pan');
  },true);
  document.addEventListener('keyup',event=>{if(space(event) && held) {event.preventDefault();reset();}},true);
  document.addEventListener('pointerdown',event=>{
    const viewport=canvas();
    if(!held || !viewport || event.button!==0 || !viewport.contains(event.target)) return;
    event.preventDefault(); event.stopPropagation();
    window.getSelection()?.removeAllRanges();
    drag={viewport,id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
    viewport.classList.add('is-space-panning'); viewport.setPointerCapture(event.pointerId);
  },true);
  document.addEventListener('pointermove',event=>{
    if(!drag || drag.id!==event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    drag.viewport.scrollLeft=drag.left+drag.x-event.clientX;
    drag.viewport.scrollTop=drag.top+drag.y-event.clientY;
  },true);
  const finish=event=>{if(drag && drag.id===event.pointerId) {event.preventDefault();event.stopPropagation();endDrag();}};
  document.addEventListener('pointerup',finish,true);
  document.addEventListener('pointercancel',finish,true);
  document.addEventListener('lostpointercapture',event=>{if(drag?.id===event.pointerId) endDrag();},true);
  document.addEventListener('click',event=>{
    if(Date.now()<suppressClickUntil && canvas()?.contains(event.target)) {event.preventDefault();event.stopPropagation();}
  },true);
  document.addEventListener('focusin',event=>{if(editing(event.target)) reset();},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) reset();});
  window.addEventListener('blur',reset);
  window.addEventListener('resize',reset);
  const root=document.getElementById('root');
  if(root) new MutationObserver(()=>{if(!canvas()) reset();}).observe(root,{childList:true,subtree:true});
}
