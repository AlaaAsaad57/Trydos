
export interface BoutiquePageProps {
  params: {
    lang: string;
    boutiqueId: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}
  export interface Currency {
  id: number
  name: string
  symbol: string
  code: string
  exchange_rate: number
  }

  export  interface BoutiqueData {
    id: number
    icon: string
    name: string
    description: string
    banners: Banner[]
  }
  
export interface Banner {
    file_path: string
  }