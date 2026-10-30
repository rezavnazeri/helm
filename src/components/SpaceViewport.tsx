import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SpaceViewportProps {
  children?: React.ReactNode;
}

interface ClippedEdges {
  top: boolean;
  bottom: boolean;
}

const SpaceViewport: React.FC<SpaceViewportProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState<ClippedEdges>({ top: false, bottom: false });

  const measure = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const top = element.scrollTop > 1;
    const bottom =
      element.scrollTop + element.clientHeight < element.scrollHeight - 1;

    setClipped((previous) =>
      previous.top === top && previous.bottom === bottom
        ? previous
        : { top, bottom },
    );
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(measure);
    
    const observeChildren = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(element);
      for (const child of Array.from(element.children)) {
        resizeObserver.observe(child);
      }
    };

    const mutationObserver = new MutationObserver(observeChildren);
    mutationObserver.observe(element, { childList: true });

    observeChildren();
    element.addEventListener('scroll', measure, { passive: true });

    return () => {
      element.removeEventListener('scroll', measure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure]);

  return (
    <>
      <div ref={scrollRef} className="space-scroll">
        {children}
      </div>
      <div
        className={`space-clip-shadow space-clip-shadow--top${clipped.top ? ' is-visible' : ''}`}
        aria-hidden="true"
      />
      <div
        className={`space-clip-shadow space-clip-shadow--bottom${clipped.bottom ? ' is-visible' : ''}`}
        aria-hidden="true"
      />
    </>
  );
};

export default SpaceViewport;