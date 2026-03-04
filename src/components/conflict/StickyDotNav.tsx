import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StickyDotNavProps {
  sections: string[];
}

const StickyDotNav = ({ sections }: StickyDotNavProps) => {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((s) =>
        document.getElementById(`section-${s}`),
      );

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(i);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (i: number) => {
    setActiveSection(i);
    const el = document.getElementById(`section-${sections[i]}`);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className="fixed left-4 top-1/4 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2"
      style={{ paddingTop: "80px" }}
    >
      <div className="flex flex-col gap-1">
        {sections.map((s, i) => (
          <button
            key={s}
            onClick={() => scrollTo(i)}
            className="group flex items-center gap-3"
            title={s}
          >
            {/* Active indicator bar */}
            <motion.div
              className="w-1 h-6 rounded-full"
              animate={{
                backgroundColor:
                  activeSection === i ? "hsl(46,76%,59%)" : "transparent",
                height: activeSection === i ? 24 : 8,
              }}
              transition={{ duration: 0.2 }}
            />
            {/* Label button */}
            <motion.div
              className={`px-3 py-1.5 rounded-md text-xs font-mono-label transition-all ${
                activeSection === i
                  ? "bg-og-accent/20 text-og-accent border border-og-accent/30"
                  : "text-og-secondary/60 hover:text-og-secondary hover:bg-white/5"
              }`}
              animate={{
                scale: activeSection === i ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {s}
            </motion.div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StickyDotNav;
