---
trigger: always_on
---

# Kerala Superstore – Hosting & Deployment (Project Memory)

Always read this before debugging "site down", "logo/images not loading",
"old version showing", or anything about Vercel / Netlify / domain.

## Current hosting (since 18 Oct 2026)
- **Website is hosted on NETLIFY, not Vercel.**
  - Netlify team: `keralasuperstoreuk1-creator`
  - Live Netlify site: `https://cute-narwhal-264948.netlify.app`
  - Auto-deploys from GitHub repo `keralasuperstoreuk1-creator/kerala-superstore`, branch `main`.
  - Other Netlify names seen in history (`curious-tarsier-8c2be7`, `kerala-superstore`) return 404 – not in use.
- **Vercel (`kerala-superstore.vercel.app`) is OLD / abandoned.** Moved away because
  the Hobby plan bandwidth limit kept running out. It now returns `402 DEPLOYMENT_DISABLED`. Ignore it.
- Netlify free plan usage hit ~75% around 20 Oct 2026 – keep bandwidth low
  (`images.unoptimized: true`, large binaries go to GitHub Releases, not `public/`).

## Domain
- `keralasuperstore.com` is registered at **Namecheap** (Namecheap BasicDNS).
- Namecheap domain contacts (seen 20 Oct 2026):
  - **Registrant** (gets the WHOIS verification email): Sreejith Attingal – `s.sreejith0@gmail.com`
  - Admin / Technical / Billing: Thomas Mathew, Kerala Superstore Ltd – `keralasuperstoreltd@gmail.com`
- Correct DNS (Namecheap → Domain List → Manage → Advanced DNS):

  | Type  | Host | Value                              |
  |-------|------|------------------------------------|
  | A     | `@`  | `75.2.60.5` (Netlify load balancer) |
  | CNAME | `www`| `cute-narwhal-264948.netlify.app`  |

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
