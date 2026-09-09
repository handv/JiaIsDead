import { useEffect, useRef, useState } from "react";

const MIN = 0.28;
const MAX = 2.2;
const SLOP = 12;

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function isNarrowScreen() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 800px)").matches;
}

export function usePanZoom() {
  const viewportRef = useRef(null);
  const stageRef = useRef(null);
  const viewRef = useRef({ x: 16, y: 16, scale: 1 });
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const fitted = useRef(false);
  const [scaleLabel, setScaleLabel] = useState("100%");
  const [panning, setPanning] = useState(false);

  function paint(updateLabel) {
    const stage = stageRef.current;
    if (!stage) return;
    const { x, y, scale } = viewRef.current;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    if (updateLabel) setScaleLabel(`${Math.round(scale * 100)}%`);
  }

  function withIdentity(fn) {
    const stage = stageRef.current;
    const prev = stage?.style.transform ?? "";
    if (stage) stage.style.transform = "none";
    try {
      fn();
    } finally {
      if (stage) stage.style.transform = prev;
    }
  }

  function zoomAt(clientX, clientY, nextScale) {
    const vp = viewportRef.current;
    if (!vp) return;
    const scale = clamp(nextScale, MIN, MAX);
    const rect = vp.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { x, y, scale: current } = viewRef.current;
    const cx = (px - x) / current;
    const cy = (py - y) / current;
    viewRef.current = { x: px - cx * scale, y: py - cy * scale, scale };
    paint(true);
  }

  function fit(content) {
    const vp = viewportRef.current;
    if (!vp || !content) return;
    const pad = 20;
    const sw = Math.max(content.offsetWidth, 1);
    const sh = Math.max(content.offsetHeight, 1);
    const scale = clamp(
      Math.min((vp.clientWidth - pad * 2) / sw, (vp.clientHeight - pad * 2) / sh),
      MIN,
      1,
    );
    viewRef.current = {
      x: (vp.clientWidth - sw * scale) / 2,
      y: pad,
      scale,
    };
    fitted.current = true;
    paint(true);
  }

  function fitOnce(content) {
    if (fitted.current || !content?.offsetWidth) return;
    if (isNarrowScreen()) {
      viewRef.current = { x: 12, y: 12, scale: 1 };
      fitted.current = true;
      paint(true);
      return;
    }
    fit(content);
  }

  function bump(factor) {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, viewRef.current.scale * factor);
  }

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
      });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          scale: viewRef.current.scale,
        };
        setPanning(true);
      }
    }

    function onPointerMove(event) {
      const last = pointers.current.get(event.pointerId);
      if (!last) return;
      const next = {
        x: event.clientX,
        y: event.clientY,
        startX: last.startX,
        startY: last.startY,
      };
      pointers.current.set(event.pointerId, next);
      if (pointers.current.size >= 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.current.dist > 0) {
          zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.current.scale * (dist / pinch.current.dist));
        }
        return;
      }
      if (!vp.hasPointerCapture(event.pointerId)) {
        const dragged = Math.hypot(next.x - last.startX, next.y - last.startY);
        if (dragged < SLOP) return;
        vp.setPointerCapture(event.pointerId);
        setPanning(true);
      }
      viewRef.current = {
        ...viewRef.current,
        x: viewRef.current.x + (next.x - last.x),
        y: viewRef.current.y + (next.y - last.y),
      };
      paint(false);
    }

    function onPointerUp(event) {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) setPanning(false);
    }

    function onWheel(event) {
      event.preventDefault();
      zoomAt(event.clientX, event.clientY, viewRef.current.scale * (event.deltaY > 0 ? 0.9 : 1.1));
    }

    vp.addEventListener("pointerdown", onPointerDown);
    vp.addEventListener("pointermove", onPointerMove);
    vp.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("pointercancel", onPointerUp);
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      vp.removeEventListener("pointerdown", onPointerDown);
      vp.removeEventListener("pointermove", onPointerMove);
      vp.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("pointercancel", onPointerUp);
      vp.removeEventListener("wheel", onWheel);
    };
  }, []);

  return {
    viewportRef,
    stageRef,
    scaleLabel,
    panning,
    withIdentity,
    fit,
    fitOnce,
    zoomIn: () => bump(1.15),
    zoomOut: () => bump(1 / 1.15),
  };
}
