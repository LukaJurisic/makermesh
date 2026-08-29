import {useAuthActions} from '@convex-dev/auth/react';
import {useConvexAuth, useQuery} from 'convex/react';
import {ArrowLeft, KeyRound, LockKeyhole, ShieldCheck} from 'lucide-react';
import {type FormEvent, useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../../convex/_generated/api';
import {Brand} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';

export function OperatorPage() {
  const {signIn, signOut} = useAuthActions();
  const {isAuthenticated, isLoading} = useConvexAuth();
  const operator = useQuery(api.operatorAuth.getCurrent);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn('operator-code', {code});
      setCode('');
    } catch {
      setError('Access was not accepted or operator authentication is not configured.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--rail)] px-5 py-6 text-white sm:px-8">
      <header className="mx-auto flex max-w-[1040px] items-center justify-between">
        <Brand inverse />
        <Button
          asChild
          variant="quiet"
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Link to="/">
            <ArrowLeft className="size-4" /> Public product
          </Link>
        </Button>
      </header>
      <main className="mx-auto grid min-h-[calc(100svh-100px)] max-w-[1040px] items-center gap-16 py-12 md:grid-cols-[1fr_420px]">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#dfb791]">
            Protected operations
          </p>
          <h1 className="mt-5 max-w-[620px] font-serif text-[clamp(3.2rem,6vw,5.6rem)] leading-[0.9] tracking-[-0.045em]">
            Operator access is a backend boundary.
          </h1>
          <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-white/58">
            Live research, raw evidence, snapshot capture, and controlled AgentMail sending remain
            unreachable until Convex verifies a short-lived signed operator session.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/72">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[#a7cfbf]" /> Server-only PBKDF2 verifier
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[#a7cfbf]" /> Rate-limited credential attempts
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-[#a7cfbf]" /> Authorization repeated inside
              privileged functions
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.055] p-6 shadow-2xl backdrop-blur sm:p-8">
          {isLoading ? (
            <p className="text-sm text-white/60">Checking the signed session…</p>
          ) : isAuthenticated && operator ? (
            <div>
              <span className="flex size-12 items-center justify-center rounded-xl bg-[#dcebe7] text-[var(--teal)]">
                <ShieldCheck className="size-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                Operator session active
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/58">
                The signed session is short-lived and the server confirmed the active operator
                profile.
              </p>
              <Button className="mt-7 w-full" variant="dark" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <LockKeyhole className="size-5" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                Authenticate operator
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/58">
                The access code is submitted directly to Convex and is never stored in the browser
                or a Vite environment variable.
              </p>
              <label className="mt-6 block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/55">
                  Operator access code
                </span>
                <div className="relative mt-2">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    minLength={12}
                    required
                    className="h-12 w-full rounded-lg border border-white/16 bg-black/20 pl-10 pr-3 text-white outline-none placeholder:text-white/30 focus:border-[#a7cfbf] focus:ring-2 focus:ring-[#a7cfbf]/20"
                  />
                </div>
              </label>
              {error && (
                <p className="mt-3 text-xs leading-5 text-[#f0a79f]" role="alert">
                  {error}
                </p>
              )}
              <Button
                className="mt-5 w-full"
                variant="dark"
                disabled={submitting || code.length < 12}
              >
                {submitting ? 'Verifying…' : 'Continue with signed session'}
              </Button>
              <p className="mt-4 text-[11px] leading-5 text-white/38">
                No default code is shipped. Configuration remains locked until the project owner
                sets a verifier in Convex.
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
