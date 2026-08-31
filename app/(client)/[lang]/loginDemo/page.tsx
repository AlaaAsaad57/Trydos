import React from 'react';
import NewLoginWidget from 'NewLoginDesign/NewLoginWidget';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
    title: 'Login & Registration Demo | Trydos',
    description: 'Interactive demo for the new Login and Registration design flow.',
};

export default function LoginDemoPage() {
    return <NewLoginWidget />;
}
