import React from 'react'
import { db } from '../lib/db'
import { PENDING_PROFILE_KEY } from '../constants'

type View = 'signin' | 'signup'
type Step = 'details' | 'code'

export default function SignIn() {
  const [view, setView] = React.useState<View>('signin')
  const [signinEmail, setSigninEmail] = React.useState('')
  const [signinCode, setSigninCode] = React.useState('')
  const [signinStep, setSigninStep] = React.useState<Step>('details')
  const [signupEmail, setSignupEmail] = React.useState('')
  const [signupName, setSignupName] = React.useState('')
  const [signupAge, setSignupAge] = React.useState<number | ''>('')
  const [signupCode, setSignupCode] = React.useState('')
  const [signupStep, setSignupStep] = React.useState<Step>('details')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const switchView = (next: View) => {
    setView(next)
    setError(null)
    setLoading(false)
    setSigninStep('details')
    setSignupStep('details')
    setSigninCode('')
    setSignupCode('')
  }

  const sendSigninCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await db.auth.sendMagicCode({ email: signinEmail })
      setSigninStep('code')
    } catch (err: any) {
      setError(err?.body?.message ?? 'Unable to send code')
    } finally {
      setLoading(false)
    }
  }

  const verifySigninCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await db.auth.signInWithMagicCode({ email: signinEmail, code: signinCode })
    } catch (err: any) {
      setError(err?.body?.message ?? 'Invalid code')
      setSigninCode('')
    } finally {
      setLoading(false)
    }
  }

  const sendSignupCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!signupAge || signupAge <= 0) {
      setError('Please provide your age')
      return
    }
    setLoading(true)
    try {
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({ email: signupEmail.trim().toLowerCase(), name: signupName.trim(), age: signupAge }),
      )
      await db.auth.sendMagicCode({ email: signupEmail })
      setSignupStep('code')
    } catch (err: any) {
      setError(err?.body?.message ?? 'Unable to send code')
    } finally {
      setLoading(false)
    }
  }

  const verifySignupCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await db.auth.signInWithMagicCode({ email: signupEmail, code: signupCode })
    } catch (err: any) {
      setError(err?.body?.message ?? 'Invalid code')
      setSignupCode('')
    } finally {
      setLoading(false)
    }
  }

  const title =
    view === 'signin'
      ? signinStep === 'code'
        ? 'Check your email'
        : 'Sign in to Hydra'
      : signupStep === 'code'
        ? 'Confirm your email'
        : 'Create your Hydra account'

  const subtitle =
    view === 'signin'
      ? signinStep === 'code'
        ? `Enter the one-time code sent to ${signinEmail}.`
        : "Enter your email and we'll send a one-time code to access your dashboard."
      : signupStep === 'code'
        ? `Enter the one-time code sent to ${signupEmail}.`
        : 'Create a lightweight profile so your daily hydration records stay connected to your account.'

  return (
    <div className="min-h-screen bg-app px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[400px_1fr]">
        <aside className="panel h-full min-h-[520px] bg-slate-950 p-6 text-white dark:border-slate-800">
          <div className="flex h-full flex-col justify-between gap-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-sm font-semibold text-slate-950">H</div>
                <div>
                  <p className="text-sm font-semibold text-white">Hydra</p>
                  <p className="text-xs text-slate-400">Water intake tracker</p>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Daily overview</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Hydration records without the clutter.</h1>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Log water quickly, keep your target visible, and review useful rhythm data from the same workspace.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Today</p>
                  <p className="mt-2 text-2xl font-semibold text-white">1.8 L</p>
                </div>
                <div className="rounded-md bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">On pace</div>
              </div>
              <div className="mt-4 space-y-3">
                <PreviewRow label="Goal progress" value="75%" width="75%" />
                <PreviewRow label="Reminder cadence" value="60 min" width="48%" />
                <PreviewRow label="Weekly consistency" value="5 / 7" width="70%" />
              </div>
            </div>
          </div>
        </aside>

        <section className="panel p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="segmented mb-8">
              <button className={view === 'signin' ? 'segmented-option segmented-option-active' : 'segmented-option'} onClick={() => switchView('signin')}>
                Sign in
              </button>
              <button className={view === 'signup' ? 'segmented-option segmented-option-active' : 'segmented-option'} onClick={() => switchView('signup')}>
                Create account
              </button>
              <span className="segmented-option text-center text-slate-400">Email code</span>
            </div>

            <div>
              <p className="eyebrow">{view === 'signin' ? 'Account access' : 'New account'}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
            </div>

            <div className="mt-8">
              {view === 'signin' ? (
                signinStep === 'details' ? (
                  <form className="space-y-5" onSubmit={sendSigninCode}>
                    <div>
                      <label className="label" htmlFor="signin-email">Email address</label>
                      <input
                        id="signin-email"
                        className="input mt-2"
                        type="email"
                        required
                        autoComplete="email"
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send one-time code'}
                    </button>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                      New to Hydra?{' '}
                      <button type="button" className="btn-link" onClick={() => switchView('signup')}>
                        Create an account
                      </button>
                    </p>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={verifySigninCode}>
                    <div>
                      <label className="label" htmlFor="signin-code">Verification code</label>
                      <input
                        id="signin-code"
                        className="input mt-2"
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={signinCode}
                        onChange={(e) => setSigninCode(e.target.value)}
                        placeholder="123456"
                      />
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
                      {loading ? 'Verifying...' : 'Continue to dashboard'}
                    </button>
                    <button type="button" className="btn-link mx-auto block" onClick={() => setSigninStep('details')}>
                      Use a different email
                    </button>
                  </form>
                )
              ) : signupStep === 'details' ? (
                <form className="space-y-5" onSubmit={sendSignupCode}>
                  <div className="grid gap-4">
                    <div>
                      <label className="label" htmlFor="signup-email">Email address</label>
                      <input
                        id="signup-email"
                        className="input mt-2"
                        type="email"
                        required
                        autoComplete="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="signup-name">Full name</label>
                      <input
                        id="signup-name"
                        className="input mt-2"
                        required
                        autoComplete="name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Alex Morgan"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="signup-age">Age</label>
                      <input
                        id="signup-age"
                        className="input mt-2"
                        type="number"
                        min={1}
                        required
                        value={signupAge}
                        onChange={(e) => setSignupAge(e.target.value ? Number(e.target.value) : '')}
                        placeholder="25"
                      />
                    </div>
                  </div>
                  {error && <ErrorMessage message={error} />}
                  <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send verification code'}
                  </button>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button type="button" className="btn-link" onClick={() => switchView('signin')}>
                      Sign in
                    </button>
                  </p>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={verifySignupCode}>
                  <div>
                    <label className="label" htmlFor="signup-code">Verification code</label>
                    <input
                      id="signup-code"
                      className="input mt-2"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={signupCode}
                      onChange={(e) => setSignupCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  {error && <ErrorMessage message={error} />}
                  <button className="btn-primary w-full py-3" type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Create account'}
                  </button>
                  <div className="space-y-3 text-center">
                    <button type="button" className="btn-link block w-full" onClick={() => setSignupStep('details')}>
                      Use a different email
                    </button>
                    <button type="button" className="btn-link block w-full" onClick={() => switchView('signin')}>
                      Already have an account? Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>

            <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Passwordless account access keeps the form short and avoids stored passwords.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function PreviewRow({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-2 rounded-sm bg-white/10">
        <div className="h-full rounded-sm bg-water-400" style={{ width }} />
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
}
