import { useEffect, useRef, type RefObject } from 'react';

interface SpaceDragOptions {
  trackRef: RefObject<HTMLElement | null>;
  sliderRef: RefObject<HTMLElement | null>;
  index: number;
  count: number;
  enabled: boolean;
  onStart: () => void;
  onSettle: () => void;
  onChange: (delta: -1 | 1) => void;
}

const MOVE_THRESHOLD = 6;
const COMMIT_RATIO = 0.25;
const RELEASE_RATIO = 0.12;
const FLICK_RATIO = 0.08;
const FLICK_SPEED = 0.45;
const EDGE_RESISTANCE = 0.3;
const WHEEL_QUIET_MS = 140;
const STILL_MS = 80;
const SETTLE_MS = 450;

const INTERACTIVE =
  'button, a, input, textarea, select, label, summary, [role="button"], [contenteditable="true"], [draggable="true"], .card, .context-menu';

export const useSpaceDrag = (options: SpaceDragOptions) => {
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const track = latest.current.trackRef.current;
    const slider = latest.current.sliderRef.current;
    if (!track || !slider) return;

    const root = document.documentElement;
    let settleTimer: number | undefined;

    const width = () => track.clientWidth || 1;

    const setOffset = (px: number) => {
      slider.classList.add('is-dragging');
      slider.style.setProperty('--drag-offset', `${px}px`);
    };

    const limit = (px: number) => {
      const { index, count } = latest.current;
      let value = Math.max(-width(), Math.min(width(), px));
      if ((value > 0 && index === 0) || (value < 0 && index === count - 1)) {
        value *= EDGE_RESISTANCE;
      }
      return value;
    };

    const landing = (offset: number, speed: number, ratio: number): -1 | 0 | 1 => {
      const { index, count } = latest.current;
      const direction = offset < 0 ? 1 : -1;
      const next = index + direction;
      if (next < 0 || next >= count) return 0;

      const far = Math.abs(offset) >= width() * ratio;
      const flick = Math.abs(speed) >= FLICK_SPEED && Math.abs(offset) >= width() * FLICK_RATIO;
      return far || flick ? direction : 0;
    };

    const finish = (delta: -1 | 0 | 1) => {
      if (delta !== 0) latest.current.onChange(delta);

      slider.classList.remove('is-dragging');
      slider.style.removeProperty('--drag-offset');

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => latest.current.onSettle(), SETTLE_MS);
    };

    interface Press {
      id: number;
      x: number;
      y: number;
      lastX: number;
      lastTime: number;
      speed: number;
      active: boolean;
    }
    let press: Press | null = null;

    const isEmptyArea = (target: EventTarget | null, event: PointerEvent) => {
      if (!(target instanceof Element) || !track.contains(target)) return false;
      if (target.closest(INTERACTIVE)) return false;

      if (target instanceof HTMLElement && target.classList.contains('space-scroll')) {
        const rtl = root.dir === 'rtl';
        const rect = target.getBoundingClientRect();
        const bar = target.offsetWidth - target.clientWidth;
        if (rtl ? event.clientX < rect.left + bar : event.clientX > rect.right - bar) {
          return false;
        }
      }

      return true;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!latest.current.enabled || !event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (!isEmptyArea(event.target, event)) return;

      press = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        speed: 0,
        active: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.id) return;

      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;

      if (!press.active) {
        if (Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

        if (Math.abs(dy) > Math.abs(dx)) {
          press = null;
          return;
        }

        press.active = true;
        try {
          track.setPointerCapture(event.pointerId);
        } catch {

        }
        latest.current.onStart();
        root.classList.add('is-space-dragging');
        window.getSelection()?.removeAllRanges();
      }

      const elapsed = event.timeStamp - press.lastTime;
      if (elapsed > 0) press.speed = (event.clientX - press.lastX) / elapsed;
      press.lastX = event.clientX;
      press.lastTime = event.timeStamp;

      setOffset(limit(dx));
    };

    const endPress = (event: PointerEvent, cancelled: boolean) => {
      if (!press || event.pointerId !== press.id) return;

      const finished = press;
      press = null;
      if (!finished.active) return;

      root.classList.remove('is-space-dragging');
      const offset = limit(event.clientX - finished.x);
      const speed = event.timeStamp - finished.lastTime > STILL_MS ? 0 : finished.speed;
      finish(cancelled ? 0 : landing(offset, speed, COMMIT_RATIO));
    };

    const onPointerUp = (event: PointerEvent) => endPress(event, false);
    const onPointerCancel = (event: PointerEvent) => endPress(event, true);

    const wheel = { active: false, committed: false, offset: 0, events: 0, timer: 0, lastDeltaX: 0 };

    const endWheel = () => {
      if (!wheel.active) return;
      wheel.active = false;
      if (wheel.committed) return;

      const offset = limit(wheel.offset);
      let delta = landing(offset, 0, RELEASE_RATIO);

      if (delta === 0 && wheel.events === 1 && Math.abs(wheel.offset) >= 40) {
        delta = landing(Math.sign(wheel.offset) * width(), 0, COMMIT_RATIO);
      }

      finish(delta);
    };

    const resetWheel = () => {
      Object.assign(wheel, { active: false, committed: false, offset: 0, events: 0 });
    };

    const onWheel = (event: WheelEvent) => {
      if (!latest.current.enabled || event.ctrlKey) return;

      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (wheel.committed) {
        const sameDirection = Math.sign(event.deltaX) === Math.sign(wheel.lastDeltaX);
        if (horizontal && sameDirection) {
          event.preventDefault();
          return;
        }
        resetWheel();
      }

      if (!wheel.active && !horizontal) return;

      event.preventDefault();

      if (!wheel.active) {
        Object.assign(wheel, { active: true, committed: false, offset: 0, events: 0 });
        latest.current.onStart();
      }

      window.clearTimeout(wheel.timer);
      wheel.timer = window.setTimeout(endWheel, WHEEL_QUIET_MS);

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width() : 1;
      wheel.offset -= event.deltaX * unit;
      wheel.events += 1;
      wheel.lastDeltaX = event.deltaX;

      const offset = limit(wheel.offset);
      setOffset(offset);

      const delta = landing(offset, 0, COMMIT_RATIO);
      if (delta !== 0) {
        wheel.committed = true;
        wheel.active = false;
        window.clearTimeout(wheel.timer);
        finish(delta);
      }
    };

    track.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('wheel', onWheel);
      window.clearTimeout(settleTimer);
      window.clearTimeout(wheel.timer);
      root.classList.remove('is-space-dragging');
      slider.classList.remove('is-dragging');
      slider.style.removeProperty('--drag-offset');
    };
  }, []);
};