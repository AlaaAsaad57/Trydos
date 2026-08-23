// Stand-in for the `server-only` marker.
//
// WHY THIS FILE EXISTS
// `server-only` is not an installed package. It is a marker the framework's
// build resolves to nothing on the server and to a hard error in a browser
// bundle, which is how a module says "importing me from the client is a bug".
// The test runner has no such build step, so `import "server-only"` cannot
// resolve at all — and every module carrying that line is unloadable in a test
// until something stands in for it. vitest.config.mts points the id here.
//
// WHY IT IS NOT AN EMPTY FILE
// An empty stub would make the marker mean nothing in the runner: a browser-like
// (jsdom) test could then pull a server module's whole graph in and nobody would
// notice. That is the one thing the marker exists to prevent. So the stub keeps
// the rule and only moves where it is enforced — the build normally decides by
// bundle, this decides by test environment:
//
//   • a server-like (node) test  → resolves to nothing, exactly like the build
//   • a browser-like (jsdom) test → throws, exactly like the browser bundle
//
// A server module's test therefore has to declare `// @vitest-environment node`
// at the top of the file. That is not a hoop: it is the same statement the
// module already makes about itself, written where the runner can read it.
if (typeof window !== "undefined") {
  throw new Error(
    "server-only: this module cannot be imported from a browser-like test. " +
      "Add `// @vitest-environment node` to the top of the test file, or stop " +
      "importing server code from a component under test.",
  );
}

export {};
