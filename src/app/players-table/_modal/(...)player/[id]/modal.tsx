'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef } from 'react';
import { ClientPlayer } from '@/components/Player/ClientPlayer';
import { usePlayerQuery } from '@/hooks/usePlayerQuery';

interface ModalProps {
  playerId: number;
}

export function Modal({ playerId }: ModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);
  const navigatingRef = useRef(false);

  // Get player data for the title
  const { data: player } = usePlayerQuery(playerId);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !navigatingRef.current) {
      navigatingRef.current = true;
      setOpen(false);
      // Navigate immediately
      const playersTableUrl = `/players-table${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(playersTableUrl);
    }
  };

  const title = player
    ? `${player.metadata.firstName} ${player.metadata.lastName} #${player.id}`
    : `Player #${playerId}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto p-8'>
        <DialogHeader className='sr-only'>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ClientPlayer playerId={playerId} />
      </DialogContent>
    </Dialog>
  );
}
