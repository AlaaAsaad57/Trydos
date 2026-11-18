import React from 'react';
import NewLoginWidget from 'NewLoginDesign/NewLoginWidget';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
    title: 'Login & Registration Demo | Trydos',
    description: 'Interactive demo for the new Login and Registration design flow.',
};

/** The query value the demo's sign-in request adds: `/loginDemo?from=demo`. */
const FROM_DEMO = 'demo';

export default async function LoginDemoPage({
    params,
    searchParams,
}: {
    params: Promise<{ lang: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ lang }, query] = await Promise.all([params, searchParams]);
    // From the demo's "Get Started": the flow opens on its Get Started screen,
    // and its end goes back to the demo. The way back is built here, from the
    // route's own locale; the query only says where the shopper came from, so
    // it can never send them to another site.
    if (query.from === FROM_DEMO)
        return <NewLoginWidget initialStep="get-started" exitTo={`/${lang}/demo`} />;
    return <NewLoginWidget />;
}
