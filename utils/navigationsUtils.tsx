export function isSamePage(pathname) {
  // In SSR: no window
  if (typeof window === "undefined") {
    return false;
  }

  // Normalize both current path and input
  const normalize = (path) => {
    let p = path.replace(/\/+$/, ""); // strip trailing slashes
    if (p === "") p = "/"; // root normalization
    return p;
  };
  const current = normalize(window.location.pathname + window.location.search);
  const target = normalize(pathname);

  return current === target;
}
