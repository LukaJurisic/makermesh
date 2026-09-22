import {
  CalendarClock,
  CheckCircle2,
  FileSearch,
  Globe2,
  Languages,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import {ShareMenu} from '@/components/sharing/ShareMenu';
import {demoMakers} from '@/data/demo';
import {useDemo} from '@/app/useDemo';
import {ControlledReplyPanel} from '@/components/outreach/ControlledReplyPanel';

export function PassportPage() {
  const {trackEvent} = useDemo();
  const atlas = demoMakers[0];
  if (!atlas) return null;
  return (
    <div className="passport-page-shell">
      <div className="passport-warning">
        <Sparkles className="size-4" /> Demonstration profile — not a real supplier endorsement.
      </div>
      <ControlledReplyPanel />
      <p className="mx-auto my-4 max-w-3xl px-5 text-sm leading-6 text-[var(--muted)]">
        This sample workshop profile uses fictional information. The original email reply is shown
        separately above.
      </p>
      <article className="passport-dossier">
        <header className="passport-cover">
          <img
            src={atlas.visual}
            alt="Illustrative ceramic cups for the fictional Atlas Clay Studio"
          />
          <div className="passport-cover-shade" />
          <div className="passport-cover-copy">
            <p>Workshop profile · example</p>
            <h2>
              Atlas Clay
              <br />
              Studio
            </h2>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> Safi, Morocco
              </span>
              <span className="flex items-center gap-1.5">
                <Languages className="size-4" /> French · English
              </span>
            </div>
          </div>
          <div className="passport-consent">
            <LockKeyhole className="size-4" />
            <span>
              Preview only
              <br />
              <strong>Publication not approved</strong>
            </span>
          </div>
        </header>

        <div className="passport-content">
          <section className="passport-lede">
            <p className="section-kicker">Capability summary</p>
            <h3>
              Small-batch ceramic hospitality ware with custom decal and hand-painted finishing.
            </h3>
            <p>
              Compiled from a controlled fictional French response. Supplier statements remain
              “Maker confirmed,” not independently verified.
            </p>
          </section>

          <dl className="passport-facts">
            <div>
              <dt>Minimum quantity</dt>
              <dd>150 units</dd>
              <span>Maker confirmed</span>
            </div>
            <div>
              <dt>Typical production</dt>
              <dd>30–35 days</dd>
              <span>Maker confirmed</span>
            </div>
            <div>
              <dt>Sample</dt>
              <dd>650 MAD</dd>
              <span>Before production</span>
            </div>
            <div>
              <dt>Unit price</dt>
              <dd>72 MAD</dd>
              <span>EXW · shipping excluded</span>
            </div>
          </dl>

          <div className="passport-columns">
            <section>
              <p className="section-kicker">Materials and techniques</p>
              <ul className="passport-list">
                <li>
                  <CheckCircle2 /> Stoneware-style hospitality forms
                </li>
                <li>
                  <CheckCircle2 /> Matte sand and off-white finishes
                </li>
                <li>
                  <CheckCircle2 /> Decal logo application
                </li>
                <li>
                  <CheckCircle2 /> Hand-painted colour detail
                </li>
              </ul>
            </section>
            <section>
              <p className="section-kicker">Commercial and export</p>
              <ul className="passport-list">
                <li>
                  <PackageCheck /> Previous European shipments stated
                </li>
                <li>
                  <FileSearch /> Food-contact documents can be shared
                </li>
                <li>
                  <Globe2 /> Shipping not included
                </li>
                <li className="unknown">
                  <FileSearch /> International packaging unresolved
                </li>
              </ul>
            </section>
          </div>

          <section className="passport-timeline">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Source history</p>
                <h3>What changed, and when</h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <CalendarClock className="size-4" /> Last confirmed Aug 29, 2026
              </span>
            </div>
            <ol>
              <li>
                <span>10:36:41</span>
                <div>
                  <strong>Controlled reply received</strong>
                  <p>Original French message preserved in the private project thread.</p>
                </div>
              </li>
              <li>
                <span>10:36:47</span>
                <div>
                  <strong>Quote normalized</strong>
                  <p>MOQ, MAD pricing, sample cost, lead time, and shipping basis structured.</p>
                </div>
              </li>
              <li>
                <span>10:36:49</span>
                <div>
                  <strong>Passport preview assembled</strong>
                  <p>Only confirmed and explicitly attributable fields included.</p>
                </div>
              </li>
            </ol>
          </section>

          <footer className="passport-footer">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Source categories</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Controlled email · Demonstration fixture · Buyer-approved brief
              </p>
            </div>
            <ShareMenu
              label="Share demonstration preview"
              summary="An example café order: 200 ceramic cups, the workshop’s reply, and the questions still to ask."
              onShare={() => void trackEvent('passport_shared')}
            />
          </footer>
        </div>
      </article>
    </div>
  );
}
