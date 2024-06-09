import { render, waitFor } from "@testing-library/react";
import { ReactElement } from "react";
import { allCountries } from "country-telephone-data";

// Custom render function to include providers, etc.
const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: ({ children }) => children, ...options });

export * from "@testing-library/react";
export { customRender as render };
export async function resolvedComponent(Component, props) {
  console.log(Component, props);
  const ComponentResolved = await Component(props);
  return () => ComponentResolved;
}
export async function expectNever(
  callable: () => unknown,
  time: number = 1000
): Promise<void> {
  return await expect(() =>
    waitFor(callable, { timeout: time })
  ).rejects.toEqual(expect.anything());
}
export async function expectAlways<T extends HTMLElement>(
  callable: () => T,
  time: number = 1000,
  name: string = "element"
): Promise<T> {
  try {
    const element = await waitFor(callable, { timeout: time });
    return element;
  } catch (error) {
    throw new Error(`${name} not found within ${time} milliseconds`);
  }
}
export const waitForNeverToHappen = async (callable) => {
  return await expect(waitFor(callable)).rejects.toEqual(expect.anything());
};

// Assuming this function retrieves country information based on a given dial code
export function getCountry(
  dialCode: string,
  format: string
): { dialCode: string; format: string } {
  const dial =
    allCountries.filter((countryItem) =>
      dialCode.startsWith(countryItem.dialCode)
    ).length === 1
      ? allCountries.filter((countryItem) =>
          dialCode.startsWith(countryItem.dialCode)
        )[0]
      : null;
  return {
    dialCode: dial?.dialCode,
    format: "+... .... ....",
  };
}
// Processes input text based on a template and disallowed characters
export function textMarshal({ input, template, disallowCharacters }) {
  // Your implementation here (e.g., handling disallowed characters, formatting, etc.)
  // Example:
  const plaintext = input.replace(
    new RegExp(disallowCharacters.join("|"), "g"),
    ""
  );
  // Other processing logic
  return { plaintext, marshaltext: input }; // Adjust as needed
}

// Replaces occurrences of a substring with another string
export function replaceString(str, search, replace) {
  return str.split(search).join(replace);
}
