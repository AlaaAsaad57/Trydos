#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Convert file name to PascalCase for component names
function toPascalCase(str) {
  return str.replace(/(^\w|[-_]\w)/g, (match) =>
    match.replace(/[-_]/, "").toUpperCase()
  );
}

// Get all files matching a glob
function getFiles(pattern) {
  return glob.sync(pattern, { nodir: true });
}

// Transform SVG file into a TSX React component without modifying the original SVG
function transformSVG(filePath) {
  const svgContent = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath, ".svg");
  const componentName = toPascalCase(fileName);

  // Clean XML/DOCTYPE declarations
  const cleanedSVG = svgContent
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/g, "")
    .trim();

  // Inject props into <svg>
  const jsxSVG = cleanedSVG.replace(/<svg([\s\S]*?)>/, "<svg$1 {...props}>");

  const tsxContent = `import * as React from 'react';

const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (
  ${jsxSVG}
);

export default ${componentName};
`;

  const tsxPath = filePath.replace(/\.svg$/, ".tsx");

  // Only create the TSX file; do not overwrite the original SVG
  if (!fs.existsSync(tsxPath)) {
    fs.writeFileSync(tsxPath, tsxContent, "utf8");
    console.log(`Created ${tsxPath}`);
  } else {
    console.log(`Skipped ${tsxPath}, file already exists`);
  }
}

// Remove `.svg` from imports in code files
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const updatedContent = content.replace(
    /(import\s+.*?from\s+['"].*?)\.svg(['"])/g,
    "$1$2"
  );

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log(`Updated imports in ${filePath}`);
  }
}

// Main
function main() {
  // 1. Convert SVGs to TSX components
  const svgFiles = getFiles("**/*.svg");
  svgFiles.forEach(transformSVG);

  // 2. Fix imports in code files
  const codeFiles = getFiles("**/*.{ts,tsx,js,jsx}");
  codeFiles.forEach(updateImports);
}

main();
