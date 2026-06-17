import { VenueForm } from '@/components/VenueForm';

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Venue</h1>
      <VenueForm />
    </div>
  );
}
