export interface Address{
    id: number;
    location: {
      latitude: string;
      longitude: string;
    };
    region_details: {
      country: string;
      province: string;
      city: string;
      town: string;
      street: string;
      building: string;
    };
    address: string;
    address_detail: string;
    contact_info: {
      name: string;
      phone: string;
      alternative_phone: string;
    };
  }