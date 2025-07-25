import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  viewAllHref?: string;
  viewAllText?: string;
  className?: string;
  headerAction?: ReactNode;
}

export function DashboardCard({
  title,
  description,
  children,
  viewAllHref,
  viewAllText = "View All",
  className,
  headerAction,
}: DashboardCardProps) {
  return (
    <Card className={cn("h-fit hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {viewAllHref && (
            <Button variant="ghost" size="sm" asChild>
              <a href={viewAllHref} className="flex items-center gap-1">
                {viewAllText}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}