import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Homepage = () => {

  const navigate = useNavigate()
  return (
    <div className="min-h-screen w-full px-6 py-10">
      <main className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border-4 border-border bg-secondary-background p-6 shadow-shadow sm:p-10">
          <div className="mb-6 w-fit border-2 border-border bg-main px-3 py-2 font-heading shadow-shadow">
            deadlink workspace
          </div>

          <h1 className="max-w-3xl text-4xl leading-tight sm:text-6xl">
            Share before it is ready. Update when it is.
        </h1>

          <p className="mt-5 max-w-2xl text-lg sm:text-2xl">
            Create a placeholder link, share it before your deadline, and map
            your finished work to it when it is ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate("create-link")} size="lg" className="bg-main text-xl border-2 border-border shadow-shadow rounded-none font-heading">
              <Link2 size={20} />
              Create Link
            </Button>
          </div>
        </section>

        <section>
          <div className="border-4 border-border bg-main p-6 shadow-shadow">
            <h2 className="mb-4 w-fit border-2 border-border bg-secondary-background px-3 py-2 text-3xl font-heading shadow-shadow">
              Links
            </h2>
            <ol className="list-decimal space-y-2 pl-7 text-xl">
              <li>Create a placeholder URL</li>
              <li>Use it before your deadline</li>
              <li>Map your final work later</li>
              <li>Public link updates instantly</li>
            </ol>
          </div>

        </section>
      </main>

    </div>
  );
};

export default Homepage;
