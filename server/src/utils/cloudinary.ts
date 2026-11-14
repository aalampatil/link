import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import fs from "fs";
import { env } from "../env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string,
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    const uploadResponse: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto",
      },
    );

    fs.unlinkSync(localFilePath);

    return uploadResponse;
  } catch (error: unknown) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.error("Upload on Cloudinary failed:", error);

    return null;
  }
};

const deleteFromCloudinary = async (public_id: string, resourceType: "image" | "video" | "raw" = "image") => {
  try {
    if (!public_id) {
      throw new Error("Missing public_id for Cloudinary deletion");
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    return result;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Cloudinary deletion error:", message);
    throw error;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
