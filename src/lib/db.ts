import { init, i } from '@instantdb/react'

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID ?? 'ea341417-50d6-420e-9eb3-d7c1ad50e8ff'

// Minimal schema: we only rely on auth for now, but declaring $users provides typesafety
const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().indexed().unique(),
    }),
  },
})

export const db = init({ appId: APP_ID, schema })

