import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { publicAxiosApi } from "@/config/axiosApi";
import { Button } from "@/components/ui/button";

export default function NotificationPage() {
  const { action } = useParams();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = params.get("token") ?? "";
  const valid =
    ["confirm", "unsubscribe"].includes(action ?? "") &&
    /^[a-f0-9]{64}$/.test(token);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await publicAxiosApi.post(
        `/link/public/subscriptions/${action}`,
        { token },
      );
      setMessage(response.data.message);
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      setError(
        "This link is invalid or has expired. Return to the project page to subscribe again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="workspace max-w-lg">
      <meta name="referrer" content="no-referrer" />
      <section className="panel p-8" aria-live="polite">
        <h1 className="text-2xl">
          {action === "unsubscribe"
            ? "Remove notification request"
            : "Confirm your notification"}
        </h1>
        <p className="my-5 text-sm leading-6">
          {message ||
            (valid
              ? action === "unsubscribe"
                ? "Stop emails about this project."
                : "Confirm to receive one email when this project is ready."
              : "This notification link is invalid.")}
        </p>
        {error && (
          <p className="mb-4 text-sm" role="alert">
            {error}
          </p>
        )}
        {valid && !message && (
          <Button onClick={submit} disabled={busy}>
            {busy
              ? "Updating…"
              : action === "unsubscribe"
                ? "Unsubscribe"
                : "Confirm notification"}
          </Button>
        )}
      </section>
    </main>
  );
}
