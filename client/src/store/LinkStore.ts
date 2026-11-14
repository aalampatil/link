import { create } from "zustand";
import { axiosApi, publicAxiosApi } from "@/config/axiosApi";
import { toast } from "react-toastify";
import { trackVisit } from "@/features/links/visits";

type AxiosErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export type BundleItem = { id: string; label: string; url: string };
export type LinkData = {
  id: string;
  displayTitle: string;
  slug: string;
  ownerId: string;
  publicUrl: string;
  manageUrl: string;
  mappedOn: string | null;
  mappedUrl: string | null;
  status: "pending" | "ready" | "paused";
  contentType: string | null;
  createdAt: string;
  updatedAt: string;
  linkValidity: string | null;
  holdingMessage: string;
  expectedAt: string | null;
  progress: number;
  paused: boolean;
  deadlineAt: string | null;
  reminderHours: number;
  remindersEnabled: boolean;
  capabilities?: { email: boolean };
  notificationsAvailable?: boolean;
  scheduledAt: string | null;
  scheduledDestination: { mappedUrl: string } | null;
  bundleItems: BundleItem[];
  shareTitle: string;
  shareDescription: string;
  shareImageUrl: string | null;
  healthEnabled: boolean;
  healthEmail: string | null;
  healthCheckedAt: string | null;
  healthResults: { url: string; status: string; statusCode: number | null }[];
};
type CreatedLink = Pick<
  LinkData,
  "slug" | "displayTitle" | "publicUrl" | "manageUrl"
>;
type PublicLink = Pick<
  LinkData,
  | "slug"
  | "displayTitle"
  | "status"
  | "mappedUrl"
  | "mappedOn"
  | "holdingMessage"
  | "expectedAt"
  | "progress"
  | "bundleItems"
  | "createdAt"
  | "updatedAt"
  | "notificationsAvailable"
>;
let manageController: AbortController | undefined;
let publicController: AbortController | undefined;
export const cancelManageRequest = () => manageController?.abort();
export const cancelPublicRequest = () => publicController?.abort();

//#region 1
type GenerateLinkStore = {
  displayTitle: string;
  data: CreatedLink | null;
  loading: boolean;
  setDisplayTitle: (title: string) => void;
  createLink: () => Promise<boolean>;
};

export const useGenerateLinkStore = create<GenerateLinkStore>((set, get) => ({
  displayTitle: "",
  data: null,
  loading: false,

  setDisplayTitle: (title) => set({ displayTitle: title }),

  createLink: async () => {
    if (get().loading) return false;
    set({ loading: true });
    try {
      const res = await axiosApi.post("/link/create", {
        displayTitle: get().displayTitle,
      });
      set({ data: res.data });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error && "response" in err
          ? (err as AxiosErrorResponse).response?.data?.message
          : "An error occurred while creating link";
      toast.error(message);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
//#endregion

//#region 2

type FetchLinksStore = {
  allLinks: LinkData[] | null;
  loading: boolean;
  setAllLinks: (allLinks: LinkData[]) => void;
  fetchAllLinks: () => Promise<void>;
};

const unwrapLinks = (data: unknown): LinkData[] => {
  if (Array.isArray(data)) return data;
  const obj = data as { links?: unknown; data?: unknown };
  if (Array.isArray(obj?.links)) return obj.links;
  if (Array.isArray(obj?.data)) return obj.data;
  return [];
};

export const useFetchLinksStore = create<FetchLinksStore>((set, get) => ({
  allLinks: null,
  loading: false,
  setAllLinks: (links) => set({ allLinks: links }),
  fetchAllLinks: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await axiosApi.get("/link/get-all");

      set({ allLinks: unwrapLinks(res.data) });
    } finally {
      set({ loading: false });
    }
  },
}));

//#endregion

//#region 3

type ManageLinkStore = {
  data: LinkData | null;
  contentType: string | null;
  file: File | null;
  targetUrl: string;
  scheduledAt: string;
  setScheduledAt: (value: string) => void;
  bundleItems: BundleItem[];
  setBundleItems: (items: BundleItem[]) => void;
  loading: boolean;
  fetching: boolean;

  setTargetUrl: (url: string) => void;
  setContentType: (type: string) => void;
  setFile: (file: File | null) => void;
  fetchLink: (slug: string) => Promise<void>;
  mapUrl: (slug: string) => Promise<boolean>;
};

export const useManageLinkStore = create<ManageLinkStore>((set, get) => ({
  data: null,
  targetUrl: "",
  scheduledAt: "",
  setScheduledAt: (value) => set({ scheduledAt: value }),
  bundleItems: [],
  setBundleItems: (items) => set({ bundleItems: items }),
  contentType: "Post",
  file: null,

  fetching: false,
  loading: false,

  setTargetUrl: (url) => {
    set({ targetUrl: url });
  },

  setContentType: (type) => {
    set({ contentType: type });
  },

  setFile: (file) => {
    set({ file: file });
  },

  fetchLink: async (slug) => {
    manageController?.abort();
    const controller = (manageController = new AbortController());
    try {
      set({
        fetching: true,
        data: null,
        targetUrl: "",
        file: null,
        contentType: "Post",
        scheduledAt: "",
      });
      const res = await axiosApi.get<LinkData>(`/link/manage/${slug}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      set({
        data: res.data,
        bundleItems: res.data.bundleItems ?? [],
        contentType: res.data.bundleItems?.length
          ? "Bundle"
          : (res.data.contentType ?? "Post"),
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error && "response" in err
          ? (err as AxiosErrorResponse).response?.data?.message
          : "An error occurred while fetching link";
      toast.error(message);
    } finally {
      if (!controller.signal.aborted) set({ fetching: false });
    }
  },

  mapUrl: async (slug) => {
    try {
      set({ loading: true });

      const { targetUrl, file, contentType } = get();

      if (!contentType) throw new Error("content type is missing");
      const formdata = new FormData();
      formdata.append("contentType", contentType);
      if (targetUrl) formdata.append("targetUrl", targetUrl);
      if (file) formdata.append("file", file);
      if (get().scheduledAt)
        formdata.append(
          "scheduledAt",
          new Date(get().scheduledAt).toISOString(),
        );
      if (contentType === "Bundle")
        formdata.append("bundleItems", JSON.stringify(get().bundleItems));

      const res = await axiosApi.post(`/link/${slug}/map`, formdata, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({
        data: { ...get().data!, ...res.data },
        targetUrl: "",
        file: null,
        scheduledAt: "",
      });
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error && "response" in err
          ? (err as AxiosErrorResponse).response?.data?.message
          : "An error occurred while mapping";
      toast.error(message);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));

//#endregion

//#region 4

type PublicLinkStore = {
  data: PublicLink | null;
  error: string | null;
  isLoading: boolean;
  fetchLink: (slug: string) => Promise<void>;
};

export const usePublicLinkStore = create<PublicLinkStore>((set) => ({
  data: null,
  error: null,
  isLoading: true,
  fetchLink: async (slug) => {
    publicController?.abort();
    const controller = (publicController = new AbortController());
    try {
      set({ isLoading: true, data: null, error: null });
      const res = await publicAxiosApi.get<PublicLink>(`/link/public/${slug}`, {
        signal: controller.signal,
      });
      await trackVisit(slug);
      if (controller.signal.aborted) return;
      const link = res.data.mappedUrl;
      if (link && !res.data.bundleItems?.length) {
        window.location.replace(link);
        return;
      }
      set({
        data: res.data,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error && "response" in err
          ? (err as AxiosErrorResponse).response?.data?.message
          : "An error occurred while redirecting";
      set({
        data: null,
        error: message || "We couldn’t open this link. Please try again.",
      });
    } finally {
      if (!controller.signal.aborted) set({ isLoading: false });
    }
  },
}));
//#endregion
