
export interface BoutiqueLoaderPropsType {
    boutique: BoutiqueData;
    isForSearch?: boolean;
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