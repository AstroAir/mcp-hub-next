/**
 * Not Found Page
 * Displayed when a page or resource is not found (404)
 * Redirects to localized version
 */

import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/routing';

export default function NotFound() {
  redirect(`/${defaultLocale}/not-found`);
}

