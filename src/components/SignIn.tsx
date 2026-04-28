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
  const primaryActionClass =
    'btn w-full justify-center bg-[#1b87df] py-3 text-white shadow-sm shadow-[#1b87df]/25 hover:bg-[#176fba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31b4ff]/35'

  return (
    <div className="min-h-screen px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-[#cceeff] bg-white shadow-[0_30px_80px_rgba(27,135,223,0.18)] lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden bg-[#1b87df] px-6 py-8 text-white sm:px-10 lg:px-12">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#68a4d5_0%,#6fb0df_50%,#75b6e4_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(49,180,255,0.32),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(27,135,223,0.12)_48%,rgba(27,135,223,0.24))]" />
            <div className="relative flex min-h-full flex-col justify-between gap-10">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/35 bg-white/18 text-sm font-bold shadow-sm shadow-[#1b87df]/30">
                    H
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-wide">Hydra</p>
                    <p className="text-xs text-white/80">Water intake tracker</p>
                  </div>
                </div>

                <div className="max-w-xl">
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    A cleaner way to manage daily hydration.
                  </h1>
                  <p className="mt-5 text-base leading-7 text-white/90">
                    Track intake, review progress, and keep your routine visible in a focused dashboard built for everyday use.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/30 bg-[#1b87df]/20 p-5 shadow-[0_20px_50px_rgba(27,135,223,0.24)] backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/25 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Today</p>
                    <p className="mt-2 text-2xl font-semibold">Hydration overview</p>
                  </div>
                  <div className="rounded-full border border-white/35 bg-white/18 px-3 py-1 text-sm text-white">
                    On track
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Feature title="Fast logging" copy="Record intake in seconds." />
                  <Feature title="Goal visibility" copy="See progress at a glance." />
                  <Feature title="Routine support" copy="Use reminders when needed." />
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center px-6 py-8 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-md">
              <div className="space-y-3">
                <div className="inline-flex rounded-full border border-water-200 bg-water-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-water-800">
                  {view === 'signin' ? 'Account access' : 'New account'}
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
                </div>
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
                      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                      <button className={primaryActionClass} type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send one-time code'}
                      </button>
                      <p className="text-center text-sm text-slate-500">
                        New to Hydra?{' '}
                        <button type="button" className="font-medium text-[#1b87df] underline underline-offset-4 hover:text-[#176fba]" onClick={() => switchView('signup')}>
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
                      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                      <button className={primaryActionClass} type="submit" disabled={loading}>
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
                    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                    <button className={primaryActionClass} type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send verification code'}
                    </button>
                    <p className="text-center text-sm text-slate-500">
                      Already have an account?{' '}
                      <button type="button" className="font-medium text-[#1b87df] underline underline-offset-4 hover:text-[#176fba]" onClick={() => switchView('signin')}>
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
                    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                    <button className={primaryActionClass} type="submit" disabled={loading}>
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

              <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-500">
                Your account is accessed with an email code, so there is no password to remember.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Feature({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/14 px-4 py-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/80">{copy}</p>
    </div>
  )
}
