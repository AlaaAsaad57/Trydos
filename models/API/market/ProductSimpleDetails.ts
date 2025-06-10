
export interface SimpleDetailsProductApi {
    message: string;
    data: {
      name: string;
      description: any;
      details: string;
      photo: {
        file_path: string;
      };
    };
  }