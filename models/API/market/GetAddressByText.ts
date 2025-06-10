export interface GetAddressByTextApi {
    status: string;
    results: Array<{
      country: string;
      province: string;
      city: string;
      town: string;
      street: string;
      building: string;
      coordinates: {
        lat: number;
        lon: number;
      };
    }>;
  }