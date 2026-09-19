import {ArrowLeft, ArrowRight, Check} from 'lucide-react';
import {useState} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {useQuery} from 'convex/react';
import {useSessionMutation} from 'convex-helpers/react/sessions';
import {api} from '../../convex/_generated/api';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {demoBrief} from '@/data/demo';

const storageKey = 'makermesh-request-draft-v1';
const empty = {request: '', quantity: '', destination: '', budget: '', timing: ''};
function initialDraft() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as unknown;
    if (stored && typeof stored === 'object') {
      return Object.fromEntries(
        Object.entries(empty).map(([key, value]) => [
          key,
          key in stored && typeof (stored as Record<string, unknown>)[key] === 'string'
            ? String((stored as Record<string, unknown>)[key]).slice(0, 4000)
            : value,
        ]),
      ) as typeof empty;
    }
  } catch {
    /* A local draft is optional. */
  }
  return empty;
}
export function ComposerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const availability = useQuery(api.buyerResearch.availability, {});
  const createResearch = useSessionMutation(api.buyerResearch.create);
  const [researchBusy, setResearchBusy] = useState(false);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [draft, setDraft] = useState(() => {
    const candidate: unknown = location.state?.researchDraft;
    if (
      candidate &&
      typeof candidate === 'object' &&
      Object.keys(empty).every(
        (key) =>
          key in candidate && typeof (candidate as Record<string, unknown>)[key] === 'string',
      )
    )
      return Object.fromEntries(
        Object.keys(empty).map((key) => [
          key,
          String((candidate as Record<string, unknown>)[key]).slice(
            0,
            key === 'request' ? 2000 : 120,
          ),
        ]),
      ) as typeof empty;
    return initialDraft();
  });
  const [notice, setNotice] = useState('');
  const update = (key: keyof typeof empty, value: string) => {
    setDraft((current) => ({...current, [key]: value}));
    setNotice('');
    setRequestKey(crypto.randomUUID());
  };
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setNotice('Draft saved on this device.');
    } catch {
      setNotice('This browser could not save your draft. Keep this page open to retain your text.');
    }
  };
  const prepare = async () => {
    setResearchBusy(true);
    setNotice('');
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      /* Research can continue without device storage. */
    }
    try {
      const id = await createResearch({input: draft, requestKey});
      navigate(`/research/${id}`);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'Could not prepare research. Your draft remains here.',
      );
    } finally {
      setResearchBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <header className="flex h-20 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-10">
        <Brand />
        <Link to="/" className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 py-12 sm:px-10 lg:py-20">
        <p className="page-kicker">Start with the product</p>
        <h1 className="mt-4 font-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-none tracking-tight">
          What do you need made?
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
          Describe your product and the details that matter. Keep a draft here, or explore the café
          example to see the complete sourcing journey.
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <label className="block text-sm font-semibold">
              Your production request
              <textarea
                required
                maxLength={2000}
                value={draft.request}
                onChange={(e) => update('request', e.target.value)}
                placeholder="I’m looking for a workshop to make…"
                className="mt-3 min-h-52 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-white p-5 text-base font-normal leading-7 outline-none focus:border-[var(--teal)]"
              />
            </label>
            <div className="mt-7 grid grid-cols-2 gap-5">
              {(
                [
                  {key: 'quantity', label: 'Quantity', placeholder: 'e.g. 200 cups'},
                  {key: 'destination', label: 'Destination', placeholder: 'e.g. Toronto, Canada'},
                  {
                    key: 'budget',
                    label: 'Product budget & currency',
                    placeholder: 'e.g. CAD 3,500',
                  },
                  {key: 'timing', label: 'Production deadline', placeholder: 'e.g. Within 42 days'},
                ] as const
              ).map((field) => (
                <label key={field.key} className="text-xs font-medium text-[var(--ink-soft)]">
                  {field.label}
                  <input
                    maxLength={120}
                    value={draft[field.key]}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-2 h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:border-[var(--teal)]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void prepare()}
                disabled={
                  researchBusy ||
                  !availability?.enabled ||
                  draft.request.trim().length < 20 ||
                  draft.destination.trim().length < 2
                }
              >
                {researchBusy ? 'Preparing…' : 'Create research brief'}
                <ArrowRight size={16} />
              </Button>
              <Button type="submit" variant="secondary" disabled={!draft.request.trim()}>
                Save draft
                <Check size={16} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraft({
                    request: demoBrief.rawRequest,
                    quantity: '200 cups',
                    destination: 'Toronto, Canada',
                    budget: 'CAD 3,500',
                    timing: 'Within 42 days',
                  });
                  setNotice('Example loaded. Save it to keep a local draft.');
                }}
              >
                Use café example
              </Button>
            </div>
            <p className="mt-4 text-xs leading-6 text-[var(--muted)]">
              {availability?.enabled
                ? 'Create a brief, review it, then research up to three real public sources. Moroccan ceramics only; no email is sent.'
                : 'Live research is at capacity or paused. Save a draft or explore the example.'}{' '}
              Drafts can also be saved on this device.
            </p>
            {notice && (
              <p className="mt-3 text-sm text-[var(--teal)]" role="status">
                {notice}
              </p>
            )}
          </form>
          <aside className="border-t border-[var(--border)] pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <img
              src="/images/espresso-cup-study.webp"
              alt="Illustrative cups for the fictional café example"
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            <p className="mt-5 page-kicker">Explore the example</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight">
              200 cups for
              <br />
              Harbour Coffee Lab.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Follow a fictional café from its brief to maker research, approved outreach, and a
              supplier reply.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/projects/harbour-coffee-lab/brief">
                Open example project
                <ArrowRight size={16} />
              </Link>
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
