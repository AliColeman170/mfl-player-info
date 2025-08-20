import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
  viewAllText = 'View All',
  className,
  headerAction,
}: DashboardCardProps) {
  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className='flex flex-row items-center justify-between gap-y-0'>
        <div className='flex flex-col gap-0 sm:gap-1'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
          {description && (
            <CardDescription className='text-muted-foreground text-sm'>
              {description}
            </CardDescription>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {headerAction}
          {viewAllHref && (
            <Button variant='ghost' size='sm' asChild>
              <Link href={viewAllHref} className='flex items-center gap-1'>
                {viewAllText}
                <ExternalLink className='size-3' />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0'>{children}</CardContent>
    </Card>
  );
}
