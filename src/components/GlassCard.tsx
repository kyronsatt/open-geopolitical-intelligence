import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const GlassCard = ({ children, className, onClick, style }: GlassCardProps) => (
  <div className={cn("glass-card p-5", className)} onClick={onClick} style={style}>
    {children}
  </div>
);

export default GlassCard;
