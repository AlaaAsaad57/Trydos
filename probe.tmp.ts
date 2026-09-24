import { probeStaging } from "./tests/e2e/harness/health";
probeStaging().then((r) => {
  console.log("probe ->", JSON.stringify(r));
});
