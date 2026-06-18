import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

interface FormulaTooltipProps {
  children: string;
}

interface TooltipPosition {
  left: number;
  top: number;
}

const TOOLTIP_WIDTH = 280;
const VIEWPORT_GAP = 12;

export function FormulaTooltip({ children }: FormulaTooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ left: VIEWPORT_GAP, top: VIEWPORT_GAP });

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const nextLeft = Math.min(
        Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, VIEWPORT_GAP),
        window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_GAP,
      );
      const nextTop = Math.max(rect.bottom + 8, VIEWPORT_GAP);
      setPosition({ left: nextLeft, top: nextTop });
    }

    function closeWhenPointerLeaves(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && triggerRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("pointermove", closeWhenPointerLeaves, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointermove", closeWhenPointerLeaves, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="formula-tooltip-trigger"
        aria-describedby={isOpen ? id : undefined}
        aria-label="計算根拠"
        onBlur={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onMouseMove={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onPointerEnter={() => setIsOpen(true)}
        onPointerMove={() => setIsOpen(true)}
        onPointerLeave={() => setIsOpen(false)}
      >
        <CircleHelp size={14} />
      </button>
      {isOpen
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className="formula-tooltip-bubble"
              style={{ left: position.left, top: position.top, width: TOOLTIP_WIDTH }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
