// The parts of Sentry the browser uses, named one by one. `import("@sentry/nextjs")`
// loads the whole package, 179 KB: a dynamic import of a namespace cannot be
// tree-shaken. A dynamic import of this file can. Add a name here to use it.
export {
  captureException,
  captureRouterTransitionStart,
  init,
  setUser,
  withScope,
} from "@sentry/nextjs";
