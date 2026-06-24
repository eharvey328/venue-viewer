'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAction } from 'next-safe-action/hooks';
import { Link2, Image, AtSign, X, ArrowLeft } from 'lucide-react';
import { Dialog, DialogPopup, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addLink, updateLink, updateInstagram } from '@/app/actions';

type Step = 'pick' | 'link' | 'instagram';

interface VenueLink { id: number; url: string; }

type EditTarget =
  | { type: 'link'; link: VenueLink }
  | { type: 'instagram' };

const MEDIA_TYPES = [
  { key: 'link', label: 'Link', icon: Link2 },
  { key: 'instagram', label: 'Instagram', icon: AtSign },
  { key: 'photo', label: 'Photo', icon: Image },
] as const;

export function AddMediaModal({
  venueId,
  instagramUrl,
  editTarget,
  onEditClose,
}: {
  venueId: number;
  instagramUrl: string | null;
  editTarget: EditTarget | null;
  onEditClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('pick');
  const [url, setUrl] = useState('');
  const queryClient = useQueryClient();

  // Open modal pre-filled when an edit target is set from outside
  useEffect(() => {
    if (!editTarget) return;
    if (editTarget.type === 'link') {
      setUrl(editTarget.link.url);
      setStep('link');
    } else {
      setUrl(instagramUrl ?? '');
      setStep('instagram');
    }
    setOpen(true);
  }, [editTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLinkAction = useAction(addLink, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      handleClose();
    },
  });

  const updateLinkAction = useAction(updateLink, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      handleClose();
    },
  });

  const updateInstagramAction = useAction(updateInstagram, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      handleClose();
    },
  });

  function handleClose() {
    setOpen(false);
    setStep('pick');
    setUrl('');
    addLinkAction.reset();
    updateLinkAction.reset();
    updateInstagramAction.reset();
    onEditClose();
  }

  function handleBack() {
    setStep('pick');
    setUrl('');
    addLinkAction.reset();
    updateLinkAction.reset();
    updateInstagramAction.reset();
  }

  const isEditing = !!editTarget;
  const stepTitle =
    step === 'pick'
      ? 'Add media'
      : step === 'link'
      ? isEditing ? 'Edit link' : 'Add link'
      : isEditing ? 'Edit Instagram' : 'Add Instagram';

  const linkError =
    addLinkAction.result.serverError ??
    addLinkAction.result.validationErrors?.url?._errors?.[0] ??
    updateLinkAction.result.serverError ??
    updateLinkAction.result.validationErrors?.url?._errors?.[0] ??
    null;

  const instagramError =
    updateInstagramAction.result.serverError ??
    updateInstagramAction.result.validationErrors?.instagramUrl?._errors?.[0] ??
    null;

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
              {step !== 'pick' && (
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-700 mr-1"
                  aria-label="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <DialogTitle>{stepTitle}</DialogTitle>
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
                {MEDIA_TYPES.map(({ key, label, icon: Icon }) => {
                  const disabled = key === 'photo' || (key === 'instagram' && !!instagramUrl);
                  const subLabel = key === 'photo' ? 'Coming soon' : key === 'instagram' && instagramUrl ? 'Connected' : null;
                  return (
                    <button
                      key={key}
                      disabled={disabled}
                      onClick={() => !disabled && setStep(key as Step)}
                      className={[
                        'flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-colors',
                        disabled
                          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer',
                      ].join(' ')}
                    >
                      <Icon size={24} className={disabled ? 'text-gray-400' : 'text-gray-700'} />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      {subLabel && <span className="text-xs text-gray-400">{subLabel}</span>}
                    </button>
                  );
                })}
              </div>
            ) : step === 'link' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isEditing && editTarget?.type === 'link') {
                    updateLinkAction.execute({ linkId: editTarget.link.id, venueId, url });
                  } else {
                    addLinkAction.execute({ venueId, url });
                  }
                }}
                className="space-y-4"
              >
                {linkError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{linkError}</div>
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
                <Button
                  type="submit"
                  disabled={(isEditing ? updateLinkAction.isPending : addLinkAction.isPending) || !url}
                  className="w-full"
                >
                  {(isEditing ? updateLinkAction.isPending : addLinkAction.isPending) ? 'Saving…' : isEditing ? 'Save link' : 'Add link'}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateInstagramAction.execute({ venueId, instagramUrl: url || null });
                }}
                className="space-y-4"
              >
                {instagramError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{instagramError}</div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="instagram-url">Instagram profile URL</Label>
                  <Input
                    id="instagram-url"
                    type="url"
                    placeholder="https://www.instagram.com/username"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-9"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updateInstagramAction.isPending || !url}
                  className="w-full"
                >
                  {updateInstagramAction.isPending ? 'Saving…' : 'Save Instagram'}
                </Button>
              </form>
            )}
          </div>
        </DialogPopup>
      </Dialog>
    </>
  );
}
