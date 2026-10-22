---
trigger: always_on
---

# Kerala Superstore – Hosting & Deployment (Project Memory)

Always read this before debugging "site down", "logo/images not loading",
"old version showing", or anything about Vercel / Netlify / domain.

## Current hosting (since 21 Oct 2026)
- **Website is hosted on RENDER (Web Service).**
  - Render Service: `kerala-superstore`
  - URL: `https://kerala-superstore.onrender.com`
  - Auto-deploys from GitHub repo `keralasuperstoreuk1-creator/kerala-superstore`, branch `main`.
- **Netlify (`cute-narwhal-264948.netlify.app`) is EXHAUSTED / INACTIVE.** Hit 503 "usage_exceeded" on 21 Oct 2026.
- **Vercel (`kerala-superstore.vercel.app`) is OLD / abandoned.** Moved away earlier because of bandwidth limits (402).
- Start command on Render: `npx next start -p $PORT` (managed via `npm start`).

## Domain
- `keralasuperstore.com` is registered at **Namecheap** (Namecheap BasicDNS).
- Namecheap domain contacts (seen 20 Oct 2026):
  - **Registrant** (gets the WHOIS verification email): Sreejith Attingal – `s.sreejith0@gmail.com`
  - Admin / Technical / Billing: Thomas Mathew, Kerala Superstore Ltd – `keralasuperstoreltd@gmail.com`
- Correct DNS on Render (Namecheap → Domain List → Manage → Advanced DNS):

  | Type  | Host | Value                                |
  |-------|------|--------------------------------------|
  | A     | `@`  | `216.24.57.1` (Render load balancer) |
  | CNAME | `www`| `kerala-superstore.onrender.com`     |

- If the domain resolves to `198.54.117.242` and shows
  "Registrant WHOIS contact information verification | Namecheap", the domain is
  **suspended for unverified registrant email** – owner must click the verification
  email from Namecheap. This happened on 20 Oct 2026.

## Data & images
- Database: Supabase (London). Product `image_url`s are mostly external URLs.
- Media bucket: Cloudflare R2 (`kerala-superstore-images`).
- Logo: `/logo.png` with fallback `/branding/kerala-superstore-round-logo.png`.

## Gotchas
- `public/sw.js` serves the cached `/` HTML when the network fails. When hosting or the
  domain is down, users see an OLD page (e.g. the removed Smart Assistant /
  `AiCustomerChat`) with broken logo/images. That is a symptom, not a code regression.
- `git` is not on PATH – use `"C:\Program Files\Git\cmd\git.exe"`.
- The owner communicates in Malayalam; reply in Malayalam script when asked.
