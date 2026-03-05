import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import NavBar from "@/components/NavBar";
import { ArrowLeft } from "lucide-react";

const ManifestPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/MANIFEST.md")
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <NavBar />
        <div className="pt-24 px-4 md:px-8 max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-surface rounded w-1/3" />
          <div className="h-4 bg-surface rounded w-full" />
          <div className="h-4 bg-surface rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <NavBar />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-24 px-4 md:px-8 max-w-3xl mx-auto pb-24"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-og-secondary hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono-label text-xs tracking-widest uppercase">
            Back to Globe
          </span>
        </button>

        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight mt-12 mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight mt-12 mb-4 pb-2 border-b border-white/10">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="font-display text-lg font-semibold text-accent-color mt-8 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-og-secondary text-base leading-7 mb-5">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="text-foreground font-semibold">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="text-og-secondary italic">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="my-4 space-y-2 pl-0">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-3 text-og-secondary text-base leading-7">
                <span className="mt-2.5 w-1 h-1 rounded-full bg-accent-color shrink-0" />
                <span>{children}</span>
              </li>
            ),
            hr: () => <hr className="my-10 border-white/10" />,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-accent-color pl-5 my-6 text-og-secondary italic">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-accent-color underline underline-offset-4 hover:opacity-80 transition-opacity"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </motion.div>
    </div>
  );
};

export default ManifestPage;
