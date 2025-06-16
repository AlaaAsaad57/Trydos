import { BoutiqueData } from "./OfferAvatarsPropsType";

export interface OfferAvatarPropsType {
    images: string;
    zIndex: number;
    name: string;
    category: string | number;
    linkUrl: string;
    priority: boolean;
    boutique: BoutiqueData;
}