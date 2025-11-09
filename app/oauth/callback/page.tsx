import { redirect as nextRedirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/routing';

type OAuthCallbackRedirectProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export const dynamic = 'force-dynamic';

export default function OAuthCallbackRedirectPage({ searchParams }: OAuthCallbackRedirectProps) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === 'string') {
          params.append(key, entry);
        }
      });
    }
  });

  const query = params.toString();
  const href = query ? `/oauth/callback?${query}` : '/oauth/callback';

  nextRedirect(`/${defaultLocale}${href}`);
}
