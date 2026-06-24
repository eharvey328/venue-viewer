'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAction } from 'next-safe-action/hooks';
import { Link2, Image, X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogPopup, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addLink } from '@/app/actions';

type Step = 'pick' | 'link';

const MEDIA_TYPES = [
  { key: 'link', label: 'Link', icon: Link2, enabled: true },
  { key: 'photo', label: 'Photo', icon: Image, enabled: false },
] as const;

export function AddMediaModal({ venueId }: { venueId: number }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('pick');
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  const { execute, isPending, result, reset } = useAction(addLink, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      handleClose();
    },
  });

  function handleClose() {
    setOpen(false);
    setStep('pick');
    setUrl('');
    reset();
  }

  const error = result.serverError ?? result.validationErrors?.url?._errors?.[0] ?? null;

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        + Add Media
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogPopup>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {step === 'link' && (
                <button
                  onClick={() => { setStep('pick'); setUrl(''); reset(); }}
                  className="text-gray-400 hover:text-gray-700 mr-1"
                  aria-label="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <DialogTitle>
                {step === 'pick' ? 'Add media' : 'Add link'}
              </DialogTitle>
            </div>
            <DialogClose
              className="text-gray-400 hover:text-gray-700"
              aria-label="Close"
              onClick={handleClose}
            >
              <X size={20} />
            </DialogClose>
          </div>

          {/* Body */}
          <div className="flex-1 px-5 py-6 overflow-y-auto">
            {step === 'pick' ? (
              <div className="grid grid-cols-2 gap-3">
                {MEDIA_TYPES.map(({ key, label, icon: Icon, enabled }) => (
                  <button
                    key={key}
                    disabled={!enabled}
                    onClick={() => enabled && setStep(key as Step)}
                    className={[
                      'flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-colors',
                      enabled
                        ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50',
                    ].join(' ')}
                  >
                    <Icon size={24} className={enabled ? 'text-gray-700' : 'text-gray-400'} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {!enabled && <span className="text-xs text-gray-400">Coming soon</span>}
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  execute({ venueId, url });
                }}
                className="space-y-4"
              >
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-9"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={isPending || !url} className="w-full">
                  {isPending ? 'Adding…' : 'Add link'}
                </Button>
              </form>
            )}
          </div>
        </DialogPopup>
      </Dialog>
    </>
  );
}
