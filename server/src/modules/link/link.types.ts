export type BundleItem = { id: string; label: string; url: string };
export type Destination = {
  mappedUrl: string;
  contentType: "Post" | "File";
  contentSubType: string | null;
  fileSecureURL: string | null;
  filePublicId: string | null;
  fileResourceType: "image" | "video" | "raw" | null;
  bundleItems?: BundleItem[];
};
