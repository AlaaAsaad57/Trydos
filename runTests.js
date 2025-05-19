#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { promisify } = require("util");
const NYC = require("nyc");
const libCoverage = require("istanbul-lib-coverage");

// Configuration
const SPEC_PATTERN = "cypress/e2e/configuredTests/*.cy.ts";
const PARALLEL_INSTANCES = 3; // Adjust based on your machine capacity
const REPORT_DIR = "cypress/reports";
const COVERAGE_DIR = ".nyc_output";
const FINAL_COVERAGE_DIR = "coverage";

// Ensure report directories exist
for (const dir of [REPORT_DIR, COVERAGE_DIR, FINAL_COVERAGE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  } else {
    // Clean existing coverage files
    if (dir === COVERAGE_DIR) {
      const files = glob.sync(`${dir}/*.json`);
      files.forEach((file) => fs.unlinkSync(file));
      console.log(`🧹 Cleaned ${files.length} old coverage files from ${dir}`);
    }
  }
}

// Get all test files that match pattern
const testFiles = glob.sync(SPEC_PATTERN);

// Split test files into groups based on number of parallel instances
const testGroups = [];
for (let i = 0; i < PARALLEL_INSTANCES; i++) {
  testGroups.push([]);
}

// Distribute test files among groups
testFiles.forEach((file, index) => {
  const groupIndex = index % PARALLEL_INSTANCES;
  testGroups[groupIndex].push(file);
});

console.log(
  `\n🚀 Running ${testFiles.length} tests in ${PARALLEL_INSTANCES} parallel instances...\n`
);

// Run tests in parallel
const runTestGroup = (group, index) => {
  const groupedSpecs = group.join(",");
  const outputFile = `${COVERAGE_DIR}/coverage-${index}.json`;

  try {
    console.log(
      `📌 Group ${index + 1} running: ${group
        .map((file) => path.basename(file))
        .join(", ")}`
    );

    // Run Cypress for this group with coverage enabled
    execSync(
      `npx cypress run --headless --spec "${groupedSpecs}" --reporter cypress-mochawesome-reporter`,
      {
        stdio: "inherit",
        env: {
          ...process.env,
          CYPRESS_COVERAGE: "true",
          NODE_ENV: "test",
        },
      }
    );

    console.log(`\n✅ Group ${index + 1} completed successfully!\n`);
    return true;
  } catch (error) {
    console.error(
      `\n❌ Group ${index + 1} failed with error:\n`,
      error.message
    );
    return false;
  }
};

// Execute test groups
const results = testGroups.map((group, index) => {
  if (group.length === 0) return true;
  return runTestGroup(group, index);
});

// Check if any test group failed
const allTestsPassed = results.every((result) => result === true);

console.log("\n📊 Generating coverage reports...");

// Merge code coverage reports
const mergeCoverage = async () => {
  // Find all coverage files
  const coverageFiles = glob.sync(`${COVERAGE_DIR}/*.json`);

  console.log(`\n📁 Found ${coverageFiles.length} coverage files to merge:`);
  coverageFiles.forEach((file) => console.log(`   - ${path.basename(file)}`));

  if (coverageFiles.length === 0) {
    console.error("⚠️ No coverage files found to merge");
    return false;
  }

  try {
    // Create a map of merged coverage objects
    const coverageMap = libCoverage.createCoverageMap({});

    // Merge all coverage files
    coverageFiles.forEach((file) => {
      try {
        const coverage = JSON.parse(fs.readFileSync(file, "utf8"));
        coverageMap.merge(coverage);
        console.log(`✓ Merged ${path.basename(file)} successfully`);
      } catch (err) {
        console.error(
          `⚠️ Error parsing ${path.basename(file)}: ${err.message}`
        );
      }
    });

    // Write merged coverage
    fs.writeFileSync(
      path.join(COVERAGE_DIR, "coverage-merged.json"),
      JSON.stringify(coverageMap)
    );

    // Generate reports using NYC
    const nyc = new NYC({
      reporter: ["lcov", "text", "html"],
      reportDir: FINAL_COVERAGE_DIR,
      cwd: process.cwd(),
      tempDir: COVERAGE_DIR,
    });

    await nyc.report();
    console.log(`\n✨ Coverage reports generated in ${FINAL_COVERAGE_DIR}`);

    return true;
  } catch (error) {
    console.error("❌ Error merging coverage reports:", error);
    return false;
  }
};

// Generate report for Cypress tests
const generateMergedReport = () => {
  try {
    execSync(
      "npx mochawesome-merge cypress/reports/mochawesome-report/*.json > cypress/reports/mochawesome.json",
      { stdio: "inherit" }
    );

    execSync(
      "npx marge cypress/reports/mochawesome.json -o cypress/reports/html",
      { stdio: "inherit" }
    );

    console.log("✨ Cypress test report generated in cypress/reports/html");
    return true;
  } catch (error) {
    console.error("❌ Error generating merged Cypress report:", error);
    return false;
  }
};

// Execute post-test tasks
(async () => {
  const mergeCoverageResult = await mergeCoverage();
  const mergeReportResult = generateMergedReport();

  // Exit with appropriate code
  process.exit(
    allTestsPassed && mergeCoverageResult && mergeReportResult ? 0 : 1
  );
})();
