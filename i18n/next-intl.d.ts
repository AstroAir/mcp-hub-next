import "next-intl";

import messages from "@/messages/en.d.json.ts";
import {routing} from "./routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
