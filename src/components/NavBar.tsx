import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface NavBarProps {
  conflictId?: string | null;
}

const GITHUB_URL =
  "https://github.com/kyronsatt/open-geopolitical-intelligence";

const NavBar = ({ conflictId }: NavBarProps) => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(8,8,16,0.8)",
        borderBottom: "1px solid hsl(var(--border-subtle))",
      }}
    >
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <span className="font-mono uppercase text-xl font-extrabold tracking-tight text-foreground">
          Open Geopolitical Intelligence
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-og-green animate-pulse-glow" />
          <span className="font-mono-label text-og-green">LIVE</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/manifest")}
          className="font-mono-label px-4 py-2 rounded-lg border border-border text-foreground hover:bg-[hsl(var(--bg-glass-hover))] transition-all"
        >
          MANIFEST
        </button>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono-label px-4 py-2 rounded-lg border border-border text-foreground hover:bg-[hsl(var(--bg-glass-hover))] transition-all"
        >
          CONTRIBUTE
        </a>
      </div>
    </motion.nav>
  );
};

export default NavBar;
