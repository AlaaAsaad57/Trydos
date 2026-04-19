import { Client } from "@elastic/elasticsearch";

const createElasticsearchClient = (): Client => {
  // During build time, ELASTICSEARCH_NODE might not be available
  // Provide a placeholder node to prevent "Missing node(s) option" error
  // The client won't actually be used during build, only at runtime
  const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";

  return new Client({
    node,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const elasticSearchClient = createElasticsearchClient();

export const elasticSearchComment = createElasticsearchClient();
