function getRobotsConfig(productionRobots) {
  if (process.env.NODE_ENV !== "production") {
    return {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    };
  }
  return productionRobots;
}
