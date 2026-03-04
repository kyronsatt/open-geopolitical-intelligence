import { useState } from "react";
import { motion } from "framer-motion";

interface StickyDotNavProps {
  sections: string[];
}

const StickyDotNav = ({ sections }: StickyDotNavProps) => {
  const [active, setActive] = useState(0);

  const scrollTo = (i: number) => {
    setActive(i);
    const el = document.getElementById(`section-${sections[i]}`);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
      {sections.map((s, i) => (
        <button
          key={s}
          onClick={() => scrollTo(i)}
          className="group flex items-center gap-2"
          title={s}
        >
          <span className="font-mono-label text-[9px] opacity-0 group-hover:opacity-100 transition-opacity text-og-secondary">
            {s}
          </span>
          <motion.div
            className="rounded-full"
            animate={{
              width: active === i ? 10 : 6,
              height: active === i ? 10 : 6,
              backgroundColor: active === i ? "hsl(46,76%,59%)" : "hsl(240,14%,31%)",
            }}
            transition={{ duration: 0.2 }}
          />
        </button>
      ))}
    </div>
  );
};

export default StickyDotNav;
