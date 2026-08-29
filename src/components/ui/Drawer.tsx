import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import type {PropsWithChildren, ReactNode} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Button} from './Button';

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  width?: 'standard' | 'wide';
}

export function Drawer({
  children,
  description,
  onOpenChange,
  open,
  title,
  trigger,
  width = 'standard',
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-[#15130f]/45 backdrop-blur-[2px]"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.18}}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.aside
                className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--border)] bg-[var(--surface-raised)] shadow-[-24px_0_70px_rgba(29,29,26,0.16)] outline-none ${width === 'wide' ? 'max-w-[760px]' : 'max-w-[610px]'}`}
                initial={{x: '100%'}}
                animate={{x: 0}}
                exit={{x: '100%'}}
                transition={{duration: 0.23, ease: [0.22, 1, 0.36, 1]}}
              >
                <header className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5 sm:px-8">
                  <div>
                    <Dialog.Title className="text-xl font-semibold tracking-[-0.025em] text-[var(--ink)]">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 max-w-[55ch] text-sm leading-6 text-[var(--muted)]">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="quiet" size="icon" aria-label="Close drawer">
                      <X className="size-5" />
                    </Button>
                  </Dialog.Close>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
