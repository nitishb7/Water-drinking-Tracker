import React from 'react'

type Props = {
  onGoogle: () => void
  onEmail: () => void
}

export default function SocialButtons({ onGoogle, onEmail }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn-secondary w-full" onClick={onGoogle}>
        <svg width="18" height="18" viewBox="0 0 48 48" className="mr-2" aria-hidden>
          <path fill="#FFC107" d="M43.61 20.083h-1.61V20H24v8h11.303c-1.65 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.06 0 5.84 1.154 7.938 3.043l5.657-5.657C33.24 6.053 28.833 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.39-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.297 16.391 18.816 14 24 14c3.06 0 5.84 1.154 7.938 3.043l5.657-5.657C33.24 6.053 28.833 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c4.736 0 9.055-1.807 12.317-4.756l-5.69-4.807C28.622 35.584 26.422 36 24 36c-5.202 0-9.62-3.317-11.285-7.957l-6.548 5.044C9.48 39.556 16.206 44 24 44z"/>
          <path fill="#1976D2" d="M43.61 20.083H42V20H24v8h11.303c-.792 2.236-2.254 4.154-4.18 5.437l.003-.002 5.69 4.807C35.941 39.248 40 32 40 24c0-1.341-.138-2.651-.39-3.917z"/>
        </svg>
        Continue with Google
      </button>
      <button type="button" className="btn-secondary w-full" onClick={onEmail}>
        Continue with Email
      </button>
    </div>
  )
}

