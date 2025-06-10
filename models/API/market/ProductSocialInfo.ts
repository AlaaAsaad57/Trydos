export interface ProductSocialInfo {
    id: number;
    slug_en_topic: string;
    comments_count: number;
    comments: Array<any>;
    variation: Array<{
      variant_notify_for_user: boolean;
      type: string;
    }>;
    is_product_notify_for_user: boolean;
    is_liked: boolean;
    count_of_likes: number;
  }