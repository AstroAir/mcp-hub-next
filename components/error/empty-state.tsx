/**
 * EmptyState Component
 * Reusable empty state component for displaying when there's no data
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, type LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  icon: Icon = Inbox,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={className}>
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        
        {children && (
          <CardContent>
            {children}
          </CardContent>
        )}

        {action && (
          <CardFooter className="flex justify-center">
            <Button onClick={action.onClick} variant="default">
              {action.label}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

