/**
 * Localized Not Found Page
 * Displayed when a page or resource is not found (404)
 */

'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('notFoundPage');
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">{t('title')}</CardTitle>
          <CardDescription className="text-base mt-2">{t('description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-6xl font-bold text-muted-foreground/20">404</p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{t('suggestions.intro')}</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>{t('suggestions.dashboard')}</li>
              <li>{t('suggestions.url')}</li>
              <li>{t('suggestions.navigation')}</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push('/')} variant="default" className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" />
            {t('actions.dashboard')}
          </Button>
          <Button onClick={() => router.push('/chat')} variant="outline" className="w-full sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            {t('actions.chat')}
          </Button>
          <Button onClick={() => router.back()} variant="ghost" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.back')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
