export interface GetStoriesApi {
    isSuccessful: boolean;
    hasContent: boolean;
    code: number;
    message: any;
    detailed_error: any;
    data: {
      current_page: number;
      data: Array<{
        id: number;
        mobile_phone: string;
        photo_path: any;
        name: string;
        username: any;
        original_user_id?: number;
        email: any;
        stories: Array<{
          id: number;
          cut_video_name: any;
          cut_video_path: any;
          full_video_name: any;
          full_video_path: any;
          storage_video_path: any;
          user_id: number;
          is_photo: number;
          is_video: number;
          photo_path: string;
          product_id: any;
          file: any;
          is_seen: boolean;
          viewers_count: number;
          media: Array<any>;
        }>;
        media: Array<any>;
      }>;
      first_page_url: string;
      from: number;
      last_page: number;
      last_page_url: string;
      links: Array<{
        url?: string;
        label: string;
        active: boolean;
      }>;
      next_page_url: any;
      path: string;
      per_page: number;
      prev_page_url: any;
      to: number;
      total: number;
    };
  }
  