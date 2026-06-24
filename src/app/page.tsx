import { Suspense } from 'react';
import { ScrollRestore } from '@/app/_home/ScrollRestore';
import { VenueViewer } from './_home/VenueViewer';

export default function Home() {
  return (
    <>
      <Suspense>
        <VenueViewer />
      </Suspense>
      <ScrollRestore />
    </>
  );
}
