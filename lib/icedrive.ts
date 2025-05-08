import axios from "axios";
import { createReadStream } from "fs";
import { join } from "path";

export interface IcedriveWebDAVConfig {
  username: string; // Your Icedrive email
  password: string; // Your WebDAV password (not your account password)
  baseUrl: string; // Usually https://webdav.icedrive.io
  apiKey?: string; // Icedrive API key for additional operations
}

export interface UploadResult {
  webdavUrl: string;
  publicUrl: string;
}

export class IcedriveWebDAVClient {
  private config: IcedriveWebDAVConfig;

  constructor(config: IcedriveWebDAVConfig) {
    this.config = config;
  }

  async uploadFile(
    filePath: string,
    targetFileName: string
  ): Promise<UploadResult> {
    try {
      const fileStream = createReadStream(filePath);

      // Upload the file using WebDAV PUT method
      await axios.put(`${this.config.baseUrl}/${targetFileName}`, fileStream, {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
        headers: {
          "Content-Type": this.getContentType(targetFileName),
        },
      });

      // After uploading via WebDAV, we need to make the file public
      // Since WebDAV doesn't have direct "make public" functionality,
      // we'll use the Icedrive API if available, or provide instructions

      // For now, we'll return both the WebDAV URL and a constructed public URL
      // Note: This public URL might not work directly - see the workaround below
      const webdavUrl = `${this.config.baseUrl}/${targetFileName}`;

      // IMPORTANT: Since we can't automatically make files public via WebDAV,
      // we'll return instructions on how to make them public manually
      console.log(`
        IMPORTANT: You need to manually make the file public in Icedrive:
        1. Log in to your Icedrive account
        2. Navigate to the file: ${targetFileName}
        3. Right-click and select "Share"
        4. Enable public sharing and copy the public link
      `);

      // This is a placeholder URL - it won't work until you manually make the file public
      // After making it public, you'll need to update the URL in your database
      const publicUrl = `https://icedrive.net/s/${targetFileName}`;

      return {
        webdavUrl,
        publicUrl: this.config.apiKey
          ? await this.makeFilePublic(targetFileName)
          : publicUrl,
      };
    } catch (error) {
      console.error("Icedrive WebDAV upload error:", error);
      throw new Error("Failed to upload file to Icedrive via WebDAV");
    }
  }

  // This is a placeholder method - Icedrive doesn't expose a simple API for this
  // You would need to implement this using their full API if available
  private async makeFilePublic(fileName: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("Icedrive API key not provided for making files public");
    }

    try {
      // This is a placeholder for the actual API call to make a file public
      // You would need to implement this based on Icedrive's API documentation
      console.log(`Attempting to make ${fileName} public via Icedrive API`);

      // Placeholder for the actual API call
      // const response = await axios.post(
      //   'https://api.icedrive.io/v1/files/share',
      //   { fileName },
      //   { headers: { 'Authorization': `Bearer ${this.config.apiKey}` } }
      // );

      // Return the public URL from the API response
      // return response.data.publicUrl;

      // For now, return a placeholder URL
      return `https://icedrive.net/s/${fileName}`;
    } catch (error) {
      console.error("Error making file public:", error);
      throw new Error("Failed to make file public via Icedrive API");
    }
  }

  private getContentType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "svg":
        return "image/svg+xml";
      default:
        return "application/octet-stream";
    }
  }
}

// Create a singleton instance
let icedriveWebDAVClient: IcedriveWebDAVClient | null = null;

export function getIcedriveWebDAVClient(): IcedriveWebDAVClient {
  if (!icedriveWebDAVClient) {
    // Get credentials from environment variables
    const username = process.env.ICEDRIVE_EMAIL;
    const password = process.env.ICEDRIVE_WEBDAV_PASSWORD;
    const baseUrl =
      process.env.ICEDRIVE_WEBDAV_URL || "https://webdav.icedrive.io";
    const apiKey = process.env.ICEDRIVE_API_KEY; // Optional API key for additional operations

    if (!username || !password) {
      throw new Error(
        "Icedrive WebDAV credentials not found in environment variables"
      );
    }

    icedriveWebDAVClient = new IcedriveWebDAVClient({
      username,
      password,
      baseUrl,
      apiKey,
    });
  }
  return icedriveWebDAVClient;
}
