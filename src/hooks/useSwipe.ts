import { useEffect, useRef } from 'react';

type SwipeDirection = 'left' | 'right';

export const useSwipe = (
  onSwipe: (direction: SwipeDirection) => void
) => {
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.current) return;
    if (e.touches.length !== 1) return;

    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const startX = touchStartX.current;
    const endX = touchEndX.current;

    isSwiping.current = false;
    touchStartX.current = null;
    touchEndX.current = null;

    if (startX === null || endX === null) {
      return;
    }

    const diff = startX - endX;
    const threshold = 50;

    if (Math.abs(diff) < threshold) {
      return;
    }

    onSwipeRef.current(
      diff > 0 ? 'left' : 'right'
    );
  };

  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handleWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
      return;
    }

    e.preventDefault();

    if (wheelTimeout.current !== null) {
      return;
    }

    const threshold = 40;

    if (Math.abs(e.deltaX) < threshold) {
      return;
    }

    const direction: SwipeDirection =
      e.deltaX > 0 ? 'left' : 'right';

    onSwipeRef.current(direction);

    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 300);
  };

  useEffect(() => {
    window.addEventListener(
      'wheel',
      handleWheel,
      { passive: false }
    );

    window.addEventListener(
      'touchstart',
      handleTouchStart,
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      handleTouchMove,
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      handleTouchEnd,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        'wheel',
        handleWheel
      );

      window.removeEventListener(
        'touchstart',
        handleTouchStart
      );

      window.removeEventListener(
        'touchmove',
        handleTouchMove
      );

      window.removeEventListener(
        'touchend',
        handleTouchEnd
      );

      if (wheelTimeout.current !== null) {
        clearTimeout(wheelTimeout.current);
        wheelTimeout.current = null;
      }
    };
  }, []);
};