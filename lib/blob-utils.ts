import { del, list } from "@vercel/blob";

/**
 * Extracts the filename from a Vercel Blob URL
 */
export function getBlobFilenameFromUrl(url: string): string | null {
  try {
    // Extract the filename from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // The filename is the last part of the pathname
    const filename = pathname.split("/").pop();
    return filename || null;
  } catch (error) {
    console.error("Error extracting filename from URL:", error);
    return null;
  }
}

/**
 * Deletes images from Vercel Blob that are no longer used
 * @param oldImages Array of image URLs that were previously used
 * @param newImages Array of image URLs that are currently in use
 */
export async function deleteUnusedImages(
  oldImages: string[],
  newImages: string[]
): Promise<void> {
  try {
    // Filter out non-Blob URLs
    const oldBlobImages = oldImages.filter(
      (url) => url && url.includes(".public.blob.vercel-storage.com")
    );

    const newBlobImages = newImages.filter(
      (url) => url && url.includes(".public.blob.vercel-storage.com")
    );

    // Find images that are in oldImages but not in newImages
    const imagesToDelete = oldBlobImages.filter(
      (oldUrl) => !newBlobImages.includes(oldUrl)
    );

    if (imagesToDelete.length === 0) {
      return;
    }

    console.log(
      `Deleting ${imagesToDelete.length} unused images from Vercel Blob`
    );

    // Delete each unused image
    for (const imageUrl of imagesToDelete) {
      const filename = getBlobFilenameFromUrl(imageUrl);
      if (filename) {
        try {
          await del(filename);
          console.log(`Deleted ${filename} from Vercel Blob`);
        } catch (error) {
          console.error(`Error deleting ${filename}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting unused images:", error);
  }
}

/**
 * Lists all blobs in the store
 */
export async function listAllBlobs() {
  try {
    const { blobs } = await list();
    return blobs;
  } catch (error) {
    console.error("Error listing blobs:", error);
    return [];
  }
}
