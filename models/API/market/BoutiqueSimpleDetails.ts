export interface SimpleBoutiqeApi {
    message: string;
    data: {
      id: number;
      icon: string;
      name: string;
      description: string;
      banners: Array<{
        file_path: string;
      }>;
    };
  }