import { Link, NavLink, useLocation } from "react-router-dom";
import { Show, UserButton } from "@clerk/react";
import { ArrowUpRight, Link2, Plus } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="page-container flex min-h-18 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4 sm:flex-nowrap sm:py-0">
        <Link
          to="/"
          aria-label="link home"
          className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-main text-main-foreground">
            <Link2 size={19} strokeWidth={2.2} />
          </span>
          link
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center justify-end gap-2 sm:gap-6"
        >
          {pathname === "/" && (
            <a href="#how-it-works" className="quiet-link hidden sm:block">
              How it works
            </a>
          )}
          <ThemeToggle />
          <Show when="signed-out">
            <Link to="/sign-in" className="quiet-link">
              Sign in
            </Link>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/create-link">
                Get started <ArrowUpRight size={15} />
              </Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <NavLink
              to="/get-all"
              className={({ isActive }) =>
                `text-sm ${isActive ? "font-medium text-main" : "quiet-link"}`
              }
            >
              My links
            </NavLink>
            <Button asChild size="sm">
              <Link to="/create-link">
                <Plus size={14} /> New link
              </Link>
            </Button>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My links"
                  labelIcon={<Link2 size={15} />}
                  href="/get-all"
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
