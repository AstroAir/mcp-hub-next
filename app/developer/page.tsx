import { redirect as nextRedirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default function DeveloperRedirectPage() {
  nextRedirect(`/${defaultLocale}/developer`);
}
