
export interface ProductPhotosSliderPropsType {
    product: {
        name?: string;
        sync_color_images: SyncColorImage[];
        images: Image[];
    };
    priority?: boolean;
}
export interface Image {
    file_path: string
  }
  
  export interface SyncColorImage {
    color_name: string
    images: Image2[]
  }
  
  export interface Image2 {
    file_path: string
  }