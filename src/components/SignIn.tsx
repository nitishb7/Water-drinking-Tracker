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

  const title = view === 'signin' ? 'Welcome back' : 'Create your account'
  const subtitle =
    view === 'signin'
      ? 'Use your email to receive a secure sign-in code.'
      : 'Set up a profile so your hydration data stays attached to you.'

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="panel panel-dark overflow-hidden">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              Hydra
            </div>
            <div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Hydration tracking with less noise and more clarity
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                Log water quickly, keep your goal visible, and review progress in a cleaner workspace built for everyday use.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Feature title="Daily logging" copy="Fast entry flow for quick check-ins." />
              <Feature title="Reminder support" copy="Simple browser-based nudges." />
              <Feature title="Progress review" copy="A calm dashboard with focused analytics." />
            </div>
          </div>
        </section>

        <section className="panel mx-auto w-full max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-water-200 bg-water-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-water-700 dark:border-water-800 dark:bg-water-500/10 dark:text-water-200">
              {view === 'signin' ? 'Sign in' : 'Sign up'}
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-main">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {view === 'signin' ? (
              signinStep === 'details' ? (
                <form className="space-y-4" onSubmit={sendSigninCode}>
                  <div>
                    <label className="label">Email address</label>
                    <input className="input mt-2" type="email" required value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                  <button className="btn-primary w-full justify-center" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send login code'}
                  </button>
                  <button type="button" className="btn-link mx-auto block" onClick={() => switchView('signup')}>
                    Need an account? Sign up
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={verifySigninCode}>
                  <div>
                    <label className="label">Verification code</label>
                    <input className="input mt-2" required value={signinCode} onChange={(e) => setSigninCode(e.target.value)} placeholder="123456" />
                  </div>
                  {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                  <button className="btn-primary w-full justify-center" type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify and continue'}
                  </button>
                  <button type="button" className="btn-link mx-auto block" onClick={() => setSigninStep('details')}>
                    Use a different email
                  </button>
                </form>
              )
            ) : signupStep === 'details' ? (
              <form className="space-y-4" onSubmit={sendSignupCode}>
                <div className="grid gap-4">
                  <div>
                    <label className="label">Email address</label>
                    <input className="input mt-2" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input className="input mt-2" required value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Alex" />
                  </div>
                  <div>
                    <label className="label">Age</label>
                    <input className="input mt-2" type="number" min={1} required value={signupAge} onChange={(e) => setSignupAge(e.target.value ? Number(e.target.value) : '')} placeholder="25" />
                  </div>
                </div>
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <button className="btn-primary w-full justify-center" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send verification code'}
                </button>
                <button type="button" className="btn-link mx-auto block" onClick={() => switchView('signin')}>
                  Already have an account? Sign in
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={verifySignupCode}>
                <div>
                  <label className="label">Verification code</label>
                  <input className="input mt-2" required value={signupCode} onChange={(e) => setSignupCode(e.target.value)} placeholder="123456" />
                </div>
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                <button className="btn-primary w-full justify-center" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Create account'}
                </button>
                <button type="button" className="btn-link mx-auto block" onClick={() => setSignupStep('details')}>
                  Use a different email
                </button>
                <button type="button" className="btn-link mx-auto block" onClick={() => switchView('signin')}>
                  Already have an account? Sign in
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Feature({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{copy}</p>
    </div>
  )
}
