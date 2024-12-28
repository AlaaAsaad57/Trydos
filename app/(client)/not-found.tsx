import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  return (
    <html>
      <body>
        <div>
          <h2>Not Found</h2>
          <p>Could not find requested resource</p>
          <p>
            View <Link href="/">Home page</Link>
          </p>
        </div>
      </body>
    </html>
  );
}
