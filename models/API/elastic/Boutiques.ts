import { Boutique } from "models/Genaral/Boutique";

export interface BoutiquesResponse{
    data: {
        total: number;
        limit: number;
        offset: number;
        boutiques: Array<Boutique>;
      };
}