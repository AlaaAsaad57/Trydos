export function reportWebVitals(metric) {
  if (metric.label === "web-vital") {
    console.log(metric);
    // Optional: send it to your own analytics server here
  }
}
