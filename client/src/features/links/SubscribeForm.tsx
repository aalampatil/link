import { useState } from "react";
import { publicAxiosApi } from "@/config/axiosApi";
import { Button } from "@/components/ui/button";

export default function SubscribeForm({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await publicAxiosApi.post(
        `/link/public/${slug}/subscribe`,
        {
          email: form.get("email"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        },
      );
      setMessage(response.data.message);
    } catch {
      setError(
        "Could not subscribe. Please check your email address or try again later.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel mt-8 p-5 text-left">
      <h2 className="text-base">Notify me when it’s ready</h2>
      {message ? (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="field-label" htmlFor="notification-email">
              Email address
            </label>
            <input
              className="field"
              id="notification-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={320}
              required
            />
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="notification-website">Website</label>
            <input
              id="notification-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <label className="flex items-start gap-2 text-xs leading-5">
            <input className="mt-1" name="consent" type="checkbox" required />
            Email me once when this work is available. I can unsubscribe using
            the link in the email.
          </label>
          {error && (
            <p className="text-sm" role="alert">
              {error}
            </p>
          )}
          <Button disabled={busy}>{busy ? "Subscribing…" : "Notify me"}</Button>
        </form>
      )}
    </section>
  );
}
