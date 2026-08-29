import {ArrowRight, FileSearch, Network} from 'lucide-react';
import {LogoMark} from '@/components/brand/Logo';
import {demoMetrics} from '@/data/demo';

export function ShareCardPage() {
  return (
    <main className="relative h-[630px] w-[1200px] overflow-hidden bg-[var(--rail)] text-white">
      <img
        src="/images/maker-hands-hero.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-right opacity-70"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,30,26,0.98)_0%,rgba(24,30,26,0.93)_42%,rgba(24,30,26,0.25)_78%)]" />
      <div className="relative flex h-full flex-col px-16 py-12">
        <header className="flex items-center gap-3">
          <LogoMark className="size-11 text-white" />
          <span className="text-[25px] font-semibold tracking-[-0.04em]">MakerMesh</span>
        </header>
        <section className="mt-14 max-w-[660px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#dfb791]">
            A demand-triggered market compiler
          </p>
          <h1 className="mt-4 font-serif text-[72px] leading-[0.9] tracking-[-0.045em]">
            A market appears
            <br />
            <em>when you ask.</em>
          </h1>
          <p className="mt-6 max-w-[600px] text-[18px] leading-7 text-white/68">
            We described 200 custom espresso cups. MakerMesh compiled fragmented evidence into a
            live Moroccan maker network and found the unanswered requirements.
          </p>
        </section>
        <div className="mt-auto flex items-center gap-6 border-t border-white/16 pt-6">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <FileSearch className="size-4 text-[#a7cfbf]" /> {demoMetrics.sources} sources
          </span>
          <ArrowRight className="size-4 text-white/30" />
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <Network className="size-4 text-[#a7cfbf]" /> {demoMetrics.makers} makers
          </span>
          <ArrowRight className="size-4 text-white/30" />
          <span className="text-[13px] font-semibold">{demoMetrics.questions} question gaps</span>
          <ArrowRight className="size-4 text-white/30" />
          <span className="text-[13px] font-semibold">{demoMetrics.replies} structured reply</span>
          <span className="ml-auto rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/72">
            Demonstration fixture
          </span>
        </div>
      </div>
    </main>
  );
}
