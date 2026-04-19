import { v2 as cloudinary } from "cloudinary";
import { LogServerError } from "utils/serverErrorReporter";

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  resource_type: string;
  format: string;
  created_at: string;
  bytes: number;
  etag: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
}

interface AssetResult {
  public_id: string;
  secure_url: string;
  url: string;
  resource_type: string;
  format: string;
  created_at: string;
  bytes: number;
  etag: string;
  version: number;
  signature: string;
}

export class CloudinaryService {
  private folder: string = "sitemaps";

  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dtcmozf4d",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
  }

  /**
   * Upload a sitemap file to Cloudinary
   *
   * @param filePath Local path to the sitemap file
   * @param publicId The public ID to use for the file (without extension)
   * @returns Promise<UploadResult | null> The upload result or null on failure
   */
  async uploadSitemap(
    filePath: string,
    publicId: string,
  ): Promise<UploadResult | null> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "raw",
        public_id: `${this.folder}/${publicId}`,
        overwrite: true,
        access_mode: "public",
        type: "upload",
      });

      return result as UploadResult;
    } catch (error) {
      LogServerError({
        public_id: publicId,
        scenario: "uploadSitemap in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  /**
   * Upload sitemap content directly (without file path)
   *
   * @param content The XML content to upload
   * @param publicId The public ID to use for the file (without extension)
   * @returns Promise<UploadResult | null> The upload result or null on failure
   */
  async uploadSitemapContent(
    content: string,
    publicId: string,
  ): Promise<UploadResult | null> {
    try {
      // Convert content to buffer
      const buffer = Buffer.from(content, "utf8");

      const result = await cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            public_id: `${this.folder}/${publicId}`,
            overwrite: true,
            access_mode: "public",
            type: "upload",
          },
          (error, result) => {
            if (error) {
              console.error("[CloudinaryService] Upload stream error:", error);
              return null;
            }
            return result;
          },
        )
        .end(buffer);

      // Since upload_stream is callback-based, we need to handle it differently
      // Let's use a different approach with base64 encoding
      const base64Content = buffer.toString("base64");
      const dataUri = `data:text/xml;base64,${base64Content}`;

      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        resource_type: "raw",
        public_id: `${this.folder}/${publicId}`,
        overwrite: true,
        access_mode: "public",
        type: "upload",
      });

      return uploadResult as UploadResult;
    } catch (error) {
      LogServerError({
        public_id: publicId,
        scenario: "uploadSitemapContent in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  /**
   * Get the URL of a previously uploaded sitemap
   *
   * @param publicId The public ID of the sitemap (without extension)
   * @returns Promise<string | null> The URL or null if not found
   */
  async getSitemapUrl(publicId: string): Promise<string | null> {
    try {
      const result = await cloudinary.api.resource(
        `${this.folder}/${publicId}`,
        {
          resource_type: "raw",
        },
      );

      return result.secure_url;
    } catch (error) {
      LogServerError({
        public_id: publicId,
        scenario: "getSitemapUrl in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }

  /**
   * Delete a sitemap from Cloudinary
   *
   * @param publicId The public ID of the sitemap to delete (without extension)
   * @returns Promise<boolean> Whether the deletion was successful
   */
  async deleteSitemap(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(
        `${this.folder}/${publicId}`,
        {
          resource_type: "raw",
        },
      );

      return result.result === "ok";
    } catch (error) {
      LogServerError({
        public_id: publicId,
        scenario: "deleteSitemap in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * Get the latest sitemap URL
   *
   * @returns Promise<string> The URL to the sitemap index
   */
  async getLatestSitemapUrl(): Promise<string> {
    try {
      const result = await this.getSitemapUrl("sitemap");

      if (result) {
        return result;
      }

      // Fallback to a predictable URL pattern
      const cloudName = this.getCloudName();
      return `https://res.cloudinary.com/${cloudName}/raw/upload/sitemaps/sitemap.xml`;
    } catch (error) {
      LogServerError({
        scenario: "getLatestSitemapUrl in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });
      // Fallback to a predictable URL pattern
      const cloudName = this.getCloudName();
      return `https://res.cloudinary.com/${cloudName}/raw/upload/sitemaps/sitemap.xml`;
    }
  }

  /**
   * Get the Cloudinary cloud name
   *
   * @returns string
   */
  private getCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME || "dtcmozf4d";
  }

  /**
   * List all sitemaps in the folder
   *
   * @returns Promise<AssetResult[]> Array of sitemap assets
   */
  async listSitemaps(): Promise<AssetResult[]> {
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        resource_type: "raw",
        prefix: `${this.folder}/`,
        max_results: 100,
      });

      return result.resources as AssetResult[];
    } catch (error) {
      LogServerError({
        scenario: "listSitemaps in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return [];
    }
  }

  /**
   * Check if a sitemap exists
   *
   * @param publicId The public ID of the sitemap to check
   * @returns Promise<boolean> Whether the sitemap exists
   */
  async sitemapExists(publicId: string): Promise<boolean> {
    try {
      const url = await this.getSitemapUrl(publicId);
      return url !== null;
    } catch (error) {
      LogServerError({
        scenario: "sitemapExists in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get sitemap info (metadata)
   *
   * @param publicId The public ID of the sitemap
   * @returns Promise<AssetResult | null> The sitemap info or null if not found
   */
  async getSitemapInfo(publicId: string): Promise<AssetResult | null> {
    try {
      const result = await cloudinary.api.resource(
        `${this.folder}/${publicId}`,
        {
          resource_type: "raw",
        },
      );

      return result as AssetResult;
    } catch (error) {
      LogServerError({
        scenario: "getSitemapInfo in cloudinary.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }
}

// Export a singleton instance
export const cloudinaryService = new CloudinaryService();
