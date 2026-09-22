import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {Check, Copy, Share2} from 'lucide-react';
import {useState} from 'react';
import {Button} from '@/components/ui/Button';

interface ShareMenuProps {
  summary: string;
  label?: string;
  onShare?: () => void;
}

export function ShareMenu({summary, label = 'Share preview', onShare}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : window.location.href;

  const copy = async () => {
    onShare?.();
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  };

  const open = (target: string) => {
    onShare?.();
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary">
          <Share2 className="size-4" /> {label}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[80] min-w-64 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[0_20px_60px_rgba(29,29,26,0.18)]"
        >
          <DropdownMenu.Item onSelect={() => void copy()} className="share-menu-item">
            {copied ? <Check className="size-4 text-[var(--teal)]" /> : <Copy className="size-4" />}
            {copied ? 'Build summary copied' : 'Copy build summary'}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() =>
              open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
            }
            className="share-menu-item"
          >
            <span className="flex size-4 items-center justify-center text-xs font-bold">in</span>{' '}
            Share on LinkedIn
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() =>
              open(
                `https://x.com/intent/post?text=${encodeURIComponent(summary)}&url=${encodeURIComponent(url)}`,
              )
            }
            className="share-menu-item"
          >
            <span className="flex size-4 items-center justify-center text-xs font-bold">X</span>{' '}
            Share on X
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
          <p className="px-2 py-1.5 text-xs leading-4 text-[var(--muted)]">
            Opens a prefilled composer. MakerMesh never posts automatically.
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
