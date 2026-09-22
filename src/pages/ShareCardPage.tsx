import {Brand} from '@/components/brand/Logo';
export function ShareCardPage() {
  return (
    <main className="relative h-[630px] w-[1200px] overflow-hidden bg-[var(--surface)] text-[var(--ink)]">
      <img
        src="/images/maker-hands-hero.webp"
        alt="Illustrative ceramics workshop"
        className="absolute right-0 top-0 h-full w-[46%] object-cover object-right"
      />
      <div className="relative flex h-full w-[54%] flex-col px-14 py-12">
        <Brand />
        <p className="mt-14 text-base text-[var(--ink-soft)]">Ceramics · Morocco</p>
        <h1 className="mt-5 font-serif text-[64px] leading-[1.03] tracking-[-0.03em]">
          Find a workshop for your café’s next cups.
        </h1>
        <p className="mt-auto max-w-[470px] text-lg leading-7 text-[var(--ink-soft)]">
          Describe your order. Explore workshops. Work through the details.
        </p>
      </div>
    </main>
  );
}
