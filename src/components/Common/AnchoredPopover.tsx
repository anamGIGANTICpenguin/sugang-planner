import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Portal from './Portal';

interface PopoverPosition {
  left: number;
  top: number;
  width: number;
  placement: 'top' | 'bottom';
}

interface AnchoredPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  ariaLabelledBy: string;
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onRequestClose: () => void;
  preferredWidth?: number;
}

const VIEWPORT_PADDING = 8;
const ANCHOR_GAP = 8;

const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  anchorRef,
  ariaLabelledBy,
  children,
  className = '',
  isOpen,
  onRequestClose,
  preferredWidth = 288,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const width = Math.min(preferredWidth, window.innerWidth - VIEWPORT_PADDING * 2);
    const popoverHeight = popoverRef.current?.offsetHeight ?? 0;
    const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
    const left = Math.min(
      Math.max(anchorRect.left, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, maxLeft)
    );

    let placement: PopoverPosition['placement'] = 'bottom';
    let top = anchorRect.bottom + ANCHOR_GAP;
    if (popoverHeight > 0 && top + popoverHeight > window.innerHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, anchorRect.top - popoverHeight - ANCHOR_GAP);
      placement = 'top';
    }

    setPosition({ left, top, width, placement });
  }, [anchorRef, preferredWidth]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      setPosition(null);
      return;
    }

    setIsVisible(false);
    updatePosition();

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        updatePosition();
        setIsVisible(true);
      });
    });

    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }

      onRequestClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onRequestClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, isOpen, onRequestClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal={false}
        aria-labelledby={ariaLabelledBy}
        data-placement={position?.placement ?? 'bottom'}
        className={`anchored-editor-popover ${isVisible ? 'is-open' : ''} ${className}`}
        style={{
          left: position?.left ?? VIEWPORT_PADDING,
          top: position?.top ?? VIEWPORT_PADDING,
          visibility: position ? 'visible' : 'hidden',
          width: position?.width ?? preferredWidth,
        }}
      >
        {children}
      </div>
    </Portal>
  );
};

export default AnchoredPopover;
