'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bug, FileQuestion, Loader2 } from 'lucide-react';
import { useBreadcrumbs } from '@/components/layout/breadcrumb-provider';

export default function TestErrorPage() {
  const t = useTranslations('testErrorPage');
  const router = useRouter();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [shouldError, setShouldError] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: t('breadcrumbs.label') }]);
  }, [t, setBreadcrumbs]);

  if (shouldError) {
    throw new Error(t('errors.boundaryExample'));
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('hero.description')}</p>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive" className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('warning.title')}</AlertTitle>
        <AlertDescription>{t('warning.description')}</AlertDescription>
      </Alert>

      {/* Test Sections */}
      <div className="grid gap-6">
        {/* Error Boundary Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              {t('sections.boundary.title')}
            </CardTitle>
            <CardDescription>{t('sections.boundary.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShouldError(true)}>
              {t('sections.boundary.action')}
            </Button>
          </CardContent>
        </Card>

        {/* 404 Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              {t('sections.notFound.title')}
            </CardTitle>
            <CardDescription>{t('sections.notFound.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/non-existent-page')}>
              {t('sections.notFound.action')}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5" />
              {t('sections.loading.title')}
            </CardTitle>
            <CardDescription>{t('sections.loading.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/chat')}>
              {t('sections.loading.action')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

