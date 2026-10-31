import { Link } from "react-router-dom";
import { Link2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="page-container flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 size={17} className="text-main" /> deadlink
          <span className="ml-2 font-normal text-muted-foreground">
            A link for what comes next.
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/get-all" className="hover:text-foreground">
            My links
          </Link>
          <span>© {new Date().getFullYear()} Deadlink</span>
        </div>
      </div>
    </footer>
  );
}
