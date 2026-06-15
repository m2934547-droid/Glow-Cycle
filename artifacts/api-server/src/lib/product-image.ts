export const OVERNIGHT_MAXI_PADS_IMAGE_URL = "/overnight-maxi-pads.jpeg";
export const ORGANIC_COTTON_TAMPONS_IMAGE_URL = "/organic-cotton-tampons.png";

function normalizePublicImageUrl(imageUrl: string): string {
  if (
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }

  return `/${imageUrl.replace(/^\.?\//, "")}`;
}

export function getProductImageUrl(name: string, imageUrl?: string | null): string | undefined {
  if (name === "Overnight Maxi Pads") {
    return OVERNIGHT_MAXI_PADS_IMAGE_URL;
  }

  if (name === "Organic Cotton Tampons") {
    return ORGANIC_COTTON_TAMPONS_IMAGE_URL;
  }

  return imageUrl ? normalizePublicImageUrl(imageUrl) : undefined;
}
