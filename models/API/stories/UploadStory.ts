export interface UploadStoryApi {
    data: {
      data: {
        cut_video_name: any;
        storage_video_path: any;
        full_video_name: any;
        cut_video_path: any;
        full_video_path: any;
        user_id: number;
        photo_path: string;
        is_video: number;
        is_photo: number;
        product_id: any;
        id: number;
        file: any;
        is_seen: boolean;
        viewers_count: number;
        media: Array<any>;
      };
    };
  }