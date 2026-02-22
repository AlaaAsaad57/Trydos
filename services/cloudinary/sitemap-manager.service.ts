import { cloudinaryService } from "./cloudinary.service";
import {
  generateHomeSitemapXML,
  generateProductSitemapXML,
  generateStaticPagesSitemapXML,
  generateSearchTermsSitemapXML,
} from "../elastic/sitemap.service";
import { LogServerError } from "utils/serverErrorReporter";

interface SitemapUploadResult {
  success: boolean;
  publicId: string;
  url?: string;
  error?: string;
}

interface SitemapManagerResult {
  success: boolean;
  message: string;
  results: {
    home?: SitemapUploadResult;
    products?: SitemapUploadResult;
    static?: SitemapUploadResult;
    search?: SitemapUploadResult;
    index?: SitemapUploadResult;
  };
}

export class SitemapManagerService {
  private readonly sitemapTypes = [
    "home",
    "products",
    "static",
    "search",
  ] as const;

  /**
   * Generate and upload all sitemaps to Cloudinary
   */
  async generateAndUploadAllSitemaps(): Promise<SitemapManagerResult> {
    const results: SitemapManagerResult["results"] = {};
    let hasErrors = false;

    try {
      // Generate and upload each sitemap type
      for (const type of this.sitemapTypes) {
        const result = await this.generateAndUploadSitemap(type);
        results[type] = result;

        if (!result.success) {
          hasErrors = true;
        }
      }

      // Generate and upload sitemap index
      if (!hasErrors) {
        const indexResult = await this.generateAndUploadSitemapIndex();
        results.index = indexResult;

        if (!indexResult.success) {
          hasErrors = true;
        }
      }

      return {
        success: !hasErrors,
        message: hasErrors
          ? "Some sitemaps failed to generate or upload"
          : "All sitemaps generated and uploaded successfully",
        results,
      };
    } catch (error) {
      LogServerError({
        scenario: "generateAndUploadAllSitemaps in sitemap-manager.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: `Error generating sitemaps: ${error instanceof Error ? error.message : String(error)}`,
        results,
      };
    }
  }

  /**
   * Generate and upload a specific sitemap type
   */
  async generateAndUploadSitemap(
    type: "home" | "products" | "static" | "search",
  ): Promise<SitemapUploadResult> {
    try {
      // Generate XML content
      let xmlContent: string;
      switch (type) {
        case "home":
          xmlContent = await generateHomeSitemapXML();
          break;
        case "products":
          xmlContent = await generateProductSitemapXML();
          break;
        case "static":
          xmlContent = await generateStaticPagesSitemapXML();
          break;
        case "search":
          xmlContent = await generateSearchTermsSitemapXML();
          break;
        default:
          throw new Error(`Unknown sitemap type: ${type}`);
      }

      const publicId = `sitemap-${type}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadSitemapContent(
        xmlContent,
        publicId,
      );

      if (uploadResult) {
        return {
          success: true,
          publicId,
          url: uploadResult.secure_url,
        };
      } else {
        console.error(`[SitemapManager] Failed to upload ${type} sitemap`);

        return {
          success: false,
          publicId,
          error: "Upload failed",
        };
      }
    } catch (error) {
      LogServerError({
        scenario: "generateAndUploadAllSitemaps in sitemap-manager.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        publicId: `sitemap-${type}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate and upload sitemap index
   */
  async generateAndUploadSitemapIndex(): Promise<SitemapUploadResult> {
    try {
      // Get URLs for all sitemaps
      const sitemapUrls = [];

      for (const type of this.sitemapTypes) {
        const url = await cloudinaryService.getSitemapUrl(`sitemap-${type}`);
        if (url) {
          sitemapUrls.push(url);
        }
      }

      // Generate sitemap index XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml +=
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      for (const url of sitemapUrls) {
        xml += "  <sitemap>\n";
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
        xml += "  </sitemap>\n";
      }

      xml += "</sitemapindex>";

      const publicId = "sitemap";

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadSitemapContent(
        xml,
        publicId,
      );

      if (uploadResult) {
        return {
          success: true,
          publicId,
          url: uploadResult.secure_url,
        };
      } else {
        console.error("[SitemapManager] Failed to upload sitemap index");

        return {
          success: false,
          publicId,
          error: "Upload failed",
        };
      }
    } catch (error) {
      LogServerError({
        scenario: "generateAndUploadAllSitemaps in sitemap-manager.service",
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        publicId: "sitemap",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get all sitemap URLs
   */
  async getAllSitemapUrls(): Promise<Record<string, string | null>> {
    const urls: Record<string, string | null> = {};

    for (const type of this.sitemapTypes) {
      urls[type] = await cloudinaryService.getSitemapUrl(`sitemap-${type}`);
    }

    urls.index = await cloudinaryService.getSitemapUrl("sitemap");

    return urls;
  }

  /**
   * Delete all sitemaps from Cloudinary
   */
  async deleteAllSitemaps(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const type of this.sitemapTypes) {
      results[type] = await cloudinaryService.deleteSitemap(`sitemap-${type}`);
    }

    results.index = await cloudinaryService.deleteSitemap("sitemap");

    return results;
  }

  /**
   * Check if all sitemaps exist
   */
  async checkSitemapStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const type of this.sitemapTypes) {
      status[type] = await cloudinaryService.sitemapExists(`sitemap-${type}`);
    }

    status.index = await cloudinaryService.sitemapExists("sitemap");

    return status;
  }

  /**
   * Get sitemap info (metadata) for all sitemaps
   */
  async getAllSitemapInfo(): Promise<Record<string, any>> {
    const info: Record<string, any> = {};

    for (const type of this.sitemapTypes) {
      info[type] = await cloudinaryService.getSitemapInfo(`sitemap-${type}`);
    }

    info.index = await cloudinaryService.getSitemapInfo("sitemap");

    return info;
  }

  /**
   * List all sitemaps in Cloudinary
   */
  async listAllSitemaps(): Promise<any[]> {
    return await cloudinaryService.listSitemaps();
  }

  /**
   * Get the latest sitemap index URL
   */
  async getLatestSitemapUrl(): Promise<string> {
    return await cloudinaryService.getLatestSitemapUrl();
  }
}

// Export a singleton instance
export const sitemapManagerService = new SitemapManagerService();
