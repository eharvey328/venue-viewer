import { Suspense } from 'react';
import { VenueViewer } from './_home/VenueViewer';

export default function Home() {
  return (
    <Suspense>
      <VenueViewer />
    </Suspense>
  );
}
