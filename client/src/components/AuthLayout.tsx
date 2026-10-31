import ThemeToggle from "@/components/ThemeToggle";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Link2 } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between inverse-surface p-12 lg:flex xl:p-16">
        <Link
          to="/"
          className="flex w-fit items-center gap-2.5 text-xl font-semibold tracking-tight"
        >
          <Link2 size={21} /> deadlink
        </Link>
        <div className="max-w-md">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            A little more room to finish
          </span>
          <h1 className="mt-6 text-6xl font-medium leading-[1.08] tracking-[-0.055em]">
            Share the link.
            <br />
            <span className="text-muted-foreground">Finish the work.</span>
          </h1>
          <p className="mt-7 max-w-xs text-sm leading-7 text-muted-foreground">
            Create a place for what you’re working on. Connect the result when
            you’re ready.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          A link for what comes next.
        </p>
      </section>
      <section className="relative flex flex-col items-center justify-center px-5 py-24 sm:px-10">
        <Link
          to="/"
          className="quiet-link absolute left-6 top-8 inline-flex items-center gap-2 sm:left-10"
        >
          <ArrowLeft size={14} /> Back to Deadlink
        </Link>
        <div className="absolute right-6 top-8 sm:right-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your work. Your links. Your space.
        </p>
      </section>
    </main>
  );
}
