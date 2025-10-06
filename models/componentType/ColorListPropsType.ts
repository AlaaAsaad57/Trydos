export interface ColorListPropsType {
  colors: SyncColorImage[];
  setColor: Function;
  currentColor: string;
  newColor: string;
  sizes: any;
  current_size: any;
  item: any;
  variations: any;
}

export interface SyncColorImage {
  color_name: string;
  images: any;
  color_option: string;
  sync_color_images: SyncColorImage[];
}
