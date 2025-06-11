export interface AddComment {
    comment: {
      id: number;
      customer: {
        id: number;
        name: string;
        image: string;
      };
      product_id: number;
      comment: string;
      created_at: string;
    };
  }