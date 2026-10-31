import { useNavigate } from "react-router-dom";
import { Show, UserButton, SignInButton } from '@clerk/react'
import { Link } from 'lucide-react';


const Header = () => {

  const navigate = useNavigate()
  return (
    <header className="w-full border-4 border-border bg-secondary-background px-4 py-4 shadow-shadow">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <h1 onClick={() => navigate("/")} className="cursor-pointer border-2 border-border bg-main px-3 py-2 text-lg font-heading shadow-shadow sm:text-2xl">
            deadlink-ap
          </h1>

          <p className="border-2 border-border bg-main px-3 py-2 text-center text-sm shadow-shadow sm:text-base">
            deadline-safe placeholder links
          </p>
        </div>

        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/get-all")}
              className="flex h-10 items-center gap-2 border-2 border-border bg-main px-3 font-heading shadow-shadow transition-transform hover:-translate-x-1 hover:-translate-y-1"
            >
              <Link size={16} />
              Links
            </button>

            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Manage Active Links"
                  labelIcon={<Link size={15} />}
                  onClick={() => navigate("/get-all")}
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </Show>

        <Show when="signed-out">
          <div className="border-2 border-border bg-main px-3 py-2 font-heading shadow-shadow">
            <SignInButton />
          </div>
        </Show>
      </div>

    </header>
  );
};

export default Header;
