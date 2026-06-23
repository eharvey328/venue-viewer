import { Suspense } from 'react';
import { VenueListClient } from '@/components/VenueListClient';

export default function Home() {
  return (
    <Suspense>
      <VenueListClient />
    </Suspense>
  );
}
