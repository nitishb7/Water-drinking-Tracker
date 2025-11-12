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

  return (
    <div className="min-h-screen bg-gradient-to-br from-water-200 via-cyan-200 to-water-300 px-4 py-10 flex items-center justify-center">
      <div className="flex w-full max-w-5xl rounded-3xl shadow-lg overflow-hidden bg-white">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-water-600 via-water-500 to-water-400 text-white p-10 flex-col justify-center gap-6">
          <div>
            <h2 className="text-4xl font-semibold">Stay hydrated effortlessly</h2>
          </div>
          <p className="text-water-50/90">
            Track your daily intake, set reminders, and visualize progress with a minimal interface designed for everyday momentum.
          </p>
        </div>
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-semibold tracking-tight text-water-600">
              {view === 'signin' ? 'Welcome back' : 'Create account'}
            </div>
          </div>

          <div className="space-y-6">
            {view === 'signin'
              ? (
                  signinStep === 'details'
                    ? (
                        <form className="flex flex-col gap-4" onSubmit={sendSigninCode}>
                          <div>
                            <label className="label text-water-600">Email address</label>
                            <input className="input" type="email" required value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} placeholder="you@example.com" />
                          </div>
                          {error && <div className="text-sm text-red-600">{error}</div>}
                          <button className="btn-primary w-full" type="submit" disabled={loading}>
                            {loading ? 'Sending…' : 'Send login code'}
                          </button>
                          <button type="button" className="text-sm font-medium text-water-600 mx-auto" onClick={() => switchView('signup')}>
                            Need an account? Sign up
                          </button>
                        </form>
                      )
                    : (
                        <form className="flex flex-col gap-4" onSubmit={verifySigninCode}>
                          <div>
                            <label className="label text-water-600">Verification code</label>
                            <input className="input" required value={signinCode} onChange={(e) => setSigninCode(e.target.value)} placeholder="123456" />
                          </div>
                          {error && <div className="text-sm text-red-600">{error}</div>}
                          <button className="btn-primary w-full" type="submit" disabled={loading}>
                            {loading ? 'Verifying…' : 'Verify & continue'}
                          </button>
                          <button type="button" className="text-sm font-medium text-water-600 mx-auto" onClick={() => setSigninStep('details')}>
                            Use a different email
                          </button>
                        </form>
                      )
                )
              : (
                  signupStep === 'details'
                    ? (
                        <form className="flex flex-col gap-4" onSubmit={sendSignupCode}>
                          <div className="grid gap-3">
                            <div>
                              <label className="label text-water-600">Email address</label>
                              <input className="input" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" />
                            </div>
                            <div>
                              <label className="label text-water-600">Name</label>
                              <input className="input" required value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Alex" />
                            </div>
                            <div>
                              <label className="label text-water-600">Age</label>
                              <input className="input" type="number" min={1} required value={signupAge} onChange={(e) => setSignupAge(e.target.value ? Number(e.target.value) : '')} placeholder="25" />
                            </div>
                          </div>
                          {error && <div className="text-sm text-red-600">{error}</div>}
                          <button className="btn-primary w-full" type="submit" disabled={loading}>
                            {loading ? 'Sending…' : 'Send verification code'}
                          </button>
                          <button type="button" className="text-sm font-medium text-slate-500 mx-auto" onClick={() => switchView('signin')}>
                            Already have an account? Sign in
                          </button>
                        </form>
                      )
                    : (
                        <form className="flex flex-col gap-4" onSubmit={verifySignupCode}>
                          <div>
                            <label className="label text-water-600">Verification code</label>
                            <input className="input" required value={signupCode} onChange={(e) => setSignupCode(e.target.value)} placeholder="123456" />
                          </div>
                          {error && <div className="text-sm text-red-600">{error}</div>}
                          <button className="btn-primary w-full" type="submit" disabled={loading}>
                            {loading ? 'Verifying…' : 'Create account'}
                          </button>
                          <button type="button" className="text-sm font-medium text-water-600 mx-auto" onClick={() => setSignupStep('details')}>
                            Use a different email
                          </button>
                          <button type="button" className="text-sm font-medium text-slate-500 mx-auto" onClick={() => switchView('signin')}>
                            Already have an account? Sign in
                          </button>
                        </form>
                      )
                )}
          </div>
        </div>
      </div>
    </div>
  )
}
