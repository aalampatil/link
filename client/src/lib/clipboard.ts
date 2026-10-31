import { toast } from "react-toastify";

export async function copyLink(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied");
  } catch {
    toast.error("Could not copy. Please select and copy the link manually.");
  }
}
