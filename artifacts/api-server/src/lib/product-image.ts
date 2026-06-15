export const OVERNIGHT_MAXI_PADS_IMAGE_URL = "/overnight-maxi-pads.jpeg";

export function getProductImageUrl(name: string, imageUrl?: string | null): string | undefined {
  if (name === "Overnight Maxi Pads") {
    return OVERNIGHT_MAXI_PADS_IMAGE_URL;
  }

  return imageUrl ?? undefined;
}
