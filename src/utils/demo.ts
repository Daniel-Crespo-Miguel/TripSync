// Demo Mode configuration
// Required env vars in .env:
//   VITE_DEMO_EMAIL      — email of the pre-seeded Firebase demo account
//   VITE_DEMO_PASSWORD   — password of the pre-seeded Firebase demo account
//   VITE_DEMO_GROUP_ID   — Firestore group ID of the pre-seeded demo trip

import { auth } from '../firebase/firebaseConfig';

export const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
export const DEMO_GROUP_ID = import.meta.env.VITE_DEMO_GROUP_ID as string | undefined;

export const IS_DEMO_AVAILABLE =
  Boolean(DEMO_EMAIL) && Boolean(DEMO_PASSWORD) && Boolean(DEMO_GROUP_ID);

// Returns true when the currently signed-in user is the demo account.
// Checked at call time so it works after Firebase auth resolves.
export function isDemoMode(): boolean {
  return IS_DEMO_AVAILABLE && auth.currentUser?.email === DEMO_EMAIL;
}
