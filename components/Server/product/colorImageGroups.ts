// Shared image grouping for the main photo slider and the fullscreen zoom
// slider. Both MUST use the same groups: the zoom overlay maps clicks on the
// main slider's slides to its own slides by index, so their image lists have
// to stay identical.
export type ColorImageGroup = {
  // color_option / color_name values that select this group (matches `?color=`)
  keys: string[];
  images: any[];
};

export const getColorImageGroups = (productData): ColorImageGroup[] => {
  const withImages = productData?.sync_color_images?.filter(
    (c) => c?.images?.length > 0,
  );
  if (withImages?.length > 0) {
    return withImages.map((c) => ({
      keys: [c?.color_option, c?.color_name].filter(Boolean),
      images: c.images,
    }));
  }
  return [{ keys: [], images: productData?.images ?? [] }];
};
