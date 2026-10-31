import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Link2,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Create your link.",
    text: "Give your project a name. Get a shareable URL before the final work is ready.",
  },
  {
    number: "02",
    title: "Put it out there.",
    text: "Add it to your application, submission, or message. Your audience has a place to return to.",
  },
  {
    number: "03",
    title: "Connect the finished work.",
    text: "Add your destination URL or upload a file. The link you shared now takes visitors to your work.",
  },
];
const questions = [
  {
    title: "What does someone see before my work is ready?",
    text: "A simple holding page with your project name and a pending status. Once you connect a destination, visitors are redirected to your work.",
  },
  {
    title: "Can I share a file instead of a website?",
    text: "Yes. You can connect an existing URL or upload a supported file from your link’s management page.",
  },
  {
    title: "Who can change the destination?",
    text: "Only the signed-in account that created the link can manage its destination. Visitors do not need an account to open your public link.",
  },
  {
    title: "How long does a link stay available?",
    text: "Links are currently valid for 30 days from creation. Create your link when you are ready to share, and connect your work within that window.",
  },
];

function ProductPreview() {
  const [connected, setConnected] = useState(false);
  return (
    <div className="preview-enter relative mx-auto mt-16 w-full max-w-4xl sm:mt-20">
      <div
        className="mb-4 flex items-center justify-center gap-1"
        role="group"
        aria-label="Explore the link lifecycle"
      >
        <button
          onClick={() => setConnected(false)}
          aria-pressed={!connected}
          className={`rounded-full px-4 py-2 text-xs transition-colors ${!connected ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
        >
          Before it’s ready
        </button>
        <ChevronRight size={13} className="text-zinc-500" />
        <button
          onClick={() => setConnected(true)}
          aria-pressed={connected}
          className={`rounded-full px-4 py-2 text-xs transition-colors ${connected ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}
        >
          When it’s ready
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-[0_20px_80px_-25px_#00000020]">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-zinc-300" />
            <span className="size-2 rounded-full bg-zinc-300" />
            <span className="size-2 rounded-full bg-zinc-300" />
          </div>
          <span className="flex items-center gap-2 text-[11px] text-zinc-500">
            <LockKeyhole size={10} /> Your workspace
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            Preview
          </span>
        </div>
        <div className="grid sm:grid-cols-[180px_1fr]">
          <div className="hidden border-r border-zinc-100 bg-zinc-50/40 p-5 sm:block">
            <div className="mb-8 flex items-center gap-2 text-sm font-semibold">
              <Link2 size={16} /> deadlink
            </div>
            <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium">
              <Link2 size={13} /> My links{" "}
              <span className="ml-auto text-zinc-500">1</span>
            </div>
            <div className="mt-24 border-t border-zinc-200 pt-4 text-[11px] leading-relaxed text-zinc-500">
              One link.
              <br />
              Room to finish.
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                My links <span className="mx-2">/</span> Portfolio 2026
              </p>
              <span className="text-[10px] text-zinc-500">Example project</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                  Project
                </p>
                <h3 className="text-xl font-medium tracking-tight">
                  Portfolio 2026
                </h3>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] font-medium">
                {connected ? (
                  <Check size={11} />
                ) : (
                  <span className="size-1.5 rounded-full bg-zinc-400" />
                )}
                {connected ? "Connected" : "Awaiting destination"}
              </span>
            </div>
            <div className="mt-6 rounded-lg border border-zinc-200 px-4 py-3">
              <p className="mb-1 text-[10px] text-zinc-500">Your public link</p>
              <p className="flex items-center gap-2 break-all font-mono text-xs sm:text-sm">
                <Link2 size={13} className="shrink-0 text-zinc-500" />{" "}
                deadlink.app/l/portfolio-2026
              </p>
            </div>
            <div className="my-3 ml-6 h-5 border-l border-dashed border-zinc-300" />
            <div
              key={connected ? "connected" : "pending"}
              className={`destination-enter flex min-h-18 items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${connected ? "border-zinc-900 bg-zinc-900 text-white" : "border-dashed border-zinc-200 bg-zinc-50"}`}
              aria-live="polite"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${connected ? "bg-white/10" : "bg-white border border-zinc-200"}`}
              >
                {connected ? (
                  <Globe size={16} />
                ) : (
                  <FileText size={16} className="text-zinc-500" />
                )}
              </span>
              <div>
                <p className="text-xs font-medium">
                  {connected ? "portfolio.example.com" : "Your work goes here"}
                </p>
                <p
                  className={`mt-1 text-[10px] ${connected ? "text-zinc-300" : "text-zinc-500"}`}
                >
                  {connected
                    ? "Visitors now go directly to your work."
                    : "Connect a URL or file when you’re ready."}
                </p>
              </div>
              {connected && (
                <ArrowUpRight size={15} className="ml-auto shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <RefreshCw size={12} /> The destination changes. The shared link stays
        the same.
      </p>
    </div>
  );
}

export default function Homepage() {
  return (
    <main>
      <section className="page-container pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
        <div className="hero-enter mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-500">
          <span className="size-1.5 rounded-full bg-zinc-800" /> A little more
          room to finish.
        </div>
        <h1 className="hero-enter mx-auto max-w-4xl text-[clamp(2.9rem,7.8vw,6.2rem)] font-medium leading-[1.04] tracking-[-0.065em]">
          Share the link.
          <br />
          <span className="text-zinc-500">Finish the work.</span>
        </h1>
        <p className="hero-enter mx-auto mt-7 max-w-md text-base leading-7 text-zinc-500 sm:text-lg">
          Your next project deserves a link before it’s ready. Create it now.
          Connect your finished work later.
        </p>
        <div className="hero-enter mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link to="/create-link">
              Create your first link <ArrowUpRight size={16} />
            </Link>
          </Button>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-600 hover:text-black"
          >
            See how it works <ArrowDown size={14} />
          </a>
        </div>
        <ProductPreview />
      </section>
      <section className="border-y border-zinc-200 bg-zinc-50/60">
        <div className="page-container flex flex-col items-center justify-between gap-5 py-7 sm:flex-row">
          <p className="text-xs text-zinc-500">
            For the work that’s still in progress.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-medium tracking-wide text-zinc-600">
            <span>Applications</span>
            <span>Project submissions</span>
            <span>Portfolios</span>
            <span>Client handoffs</span>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="page-container py-20 sm:py-28">
        <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              The process
            </p>
            <h2 className="max-w-lg text-3xl font-medium leading-tight sm:text-4xl">
              One less thing between
              <br />
              you and your deadline.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-zinc-500">
            Separate the moment you share from the moment you’re ready. Three
            steps. One consistent link.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {steps.map((step) => (
            <Reveal
              key={step.number}
              delay={Number(step.number) * 75}
              className="border-t border-zinc-200 pt-6"
            >
              <span className="font-mono text-xs text-zinc-500">
                {step.number}
              </span>
              <h3 className="mb-3 mt-8 text-lg font-medium">{step.title}</h3>
              <p className="max-w-xs text-sm leading-6 text-zinc-500">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="page-container pb-20 sm:pb-28">
        <Reveal className="grid overflow-hidden rounded-2xl border border-zinc-200 md:grid-cols-2">
          <div className="bg-zinc-50 p-8 sm:p-12">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Made for the in-between
            </span>
            <h2 className="mt-5 max-w-sm text-3xl font-medium leading-tight sm:text-4xl">
              The same link.
              <br />A new destination.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-500">
              A portfolio you’re polishing. A proposal awaiting the final edit.
              A project with one more detail to get right. Give it a place now,
              and connect the result later.
            </p>
            <Link
              to="/create-link"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium"
            >
              Make room for your next project <ArrowRight size={15} />
            </Link>
          </div>
          <div className="flex flex-col justify-center divide-y divide-zinc-100 px-8 sm:px-12">
            {[
              {
                icon: Link2,
                title: "Share once",
                text: "Keep the URL you’ve already sent while you update what it points to.",
              },
              {
                icon: FileText,
                title: "URLs and files welcome",
                text: "Connect a web page or upload your finished document.",
              },
              {
                icon: LockKeyhole,
                title: "Your link. Your control.",
                text: "Public to open. Yours alone to manage.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 py-7">
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className="mt-1 shrink-0 text-zinc-500"
                />
                <div>
                  <h3 className="text-sm font-medium tracking-normal">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="page-container pb-20 sm:pb-28">
        <Reveal className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              A few details
            </p>
            <h2 className="text-3xl font-medium">
              Good questions.
              <br />
              Clear answers.
            </h2>
          </div>
          <div className="border-t border-zinc-200">
            {questions.map((q) => (
              <details
                key={q.title}
                className="group border-b border-zinc-200 py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {q.title}
                  <span
                    className="text-lg font-normal text-zinc-500 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-lg pr-6 text-sm leading-7 text-zinc-500">
                  {q.text}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="border-t border-zinc-200 bg-zinc-950 text-white">
        <div className="page-container flex flex-col items-start justify-between gap-8 py-16 sm:flex-row sm:items-center sm:py-20">
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Ready when you are
            </p>
            <h2 className="text-3xl font-medium sm:text-4xl">
              The link is the easy part.
            </h2>
            <p className="mt-4 text-sm text-zinc-400">
              Create a place for your next piece of work.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-white px-7 text-zinc-900 hover:bg-zinc-200"
          >
            <Link to="/create-link">
              Create a link <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
