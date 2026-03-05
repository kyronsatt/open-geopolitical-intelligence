import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  onWheel?: (e: React.WheelEvent) => void;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, onClick, style, onWheel }, ref) => (
    <div
      ref={ref}
      className={cn("glass-card p-5", className)}
      onClick={onClick}
      style={style}
      onWheel={onWheel}
    >
      {children}
    </div>
  )
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
