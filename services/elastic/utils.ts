"use server";

import { ElasticsearchReader } from "./elasticsearch-reader.service";

export const GetBoutiquesElasticPagination = async ({
  country,
  language,
  category,
  offset,
}) => {
  try {
    let reader = new ElasticsearchReader();
    let boutiqueData = await reader.getBoutiques({
      country,
      language,
      limit: 10,
      category,
      searchAfter: offset,
    });
    return boutiqueData;
  } catch (error) {
    throw new Error("Failed To load Next Boutiques");
  }
};
