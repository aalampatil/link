import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = { children: ReactNode; className?: string; delay?: number };

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.classList.add("reveal-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.classList.remove("reveal-ready", "reveal-visible");
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`scroll-reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
