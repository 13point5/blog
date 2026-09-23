"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";

export function ReaderDialog({ title, slug, children }: { title: string; slug: string; children: React.ReactNode }) {
  const router = useRouter();
  const closeButton = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) router.back(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="reader-overlay" />
        <Dialog.Content className="reader-panel" aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); closeButton.current?.focus(); }} onCloseAutoFocus={(event) => {
          event.preventDefault();
          // The route, rather than a Dialog.Trigger, owns this dialog.
          document.querySelector<HTMLAnchorElement>(`a[href="/blog/${slug}"]`)?.focus({ preventScroll: true });
        }}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="reader-toolbar"><span>from the collection</span><Dialog.Close ref={closeButton} className="close-button" aria-label="Close article"><X size={18} /></Dialog.Close></div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
