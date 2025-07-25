'use client';

import { Modal } from './modal';
import { useEffect, useState } from 'react';

type Props = {
  params: Promise<{ id: string }>;
};

export default function InterceptedPlayerModal({ params }: Props) {
  const [id, setId] = useState<number | null>(null);
  const [key, setKey] = useState('');

  useEffect(() => {
    params.then(({ id: paramId }) => {
      const playerId = parseInt(paramId);
      setId(playerId);
      setKey(`${playerId}-${Date.now()}`); // Force remount with new key
    });
  }, [params]);

  if (id === null) return null;

  return <Modal key={key} playerId={id} />;
}