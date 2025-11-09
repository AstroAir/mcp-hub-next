import createMiddleware from "next-intl/middleware";
import {routing} from "../i18n/routing";

export default createMiddleware({
  ...routing,
  localeDetection: true,
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)"],
};
