---
trigger: always_on
---

# Kerala Superstore – Hosting & Deployment (Project Memory)

Always read this before debugging "site down", "logo/images not loading",
"old version showing", or anything about Vercel / Netlify / domain.

## Current hosting (since 18 Nov 2026)
- **Website is hosted on RAILWAY (Hobby Plan).**
  - Project: `kerala-superstore` (ID: `8453e1f3-26ea-4e66-9b3e-0750ec51497f`)
  - Service: `kerala-superstore` (ID: `b25be591-a0da-483b-ada8-2e38b50a5cd2`)
  - Live Railway URL: `https://kerala-superstore-production.up.railway.app`
  - Auto-deploys from GitHub repo `keralasuperstoreuk1-creator/kerala-superstore`, branch `main`.
- **Render (`kerala-superstore.onrender.com`) is SUSPENDED / INACTIVE.** Suspended on 15 Nov 2026.
- **Netlify (`cute-narwhal-264948.netlify.app`) is EXHAUSTED / INACTIVE.** Hit 503 "usage_exceeded" on 21 Oct 2026.
- **Vercel (`kerala-superstore.vercel.app`) is OLD / abandoned.** Moved away earlier because of bandwidth limits (402).

## Domain
- `keralasuperstore.com` is registered at **Namecheap** (Namecheap BasicDNS).
- Namecheap domain contacts:
  - **Registrant**: Sreejith Attingal – `s.sreejith0@gmail.com`
  - Admin / Technical / Billing: Thomas Mathew, Kerala Superstore Ltd – `keralasuperstoreltd@gmail.com`
- Correct DNS on Railway (Namecheap → Domain List → Manage → Advanced DNS):

  | Type         | Host                  | Value                                                                             |
  |--------------|-----------------------|-----------------------------------------------------------------------------------|
  | CNAME / ALIAS| `@`                   | `bdtep2be.up.railway.app`                                                         |
  | TXT          | `_railway-verify`      | `railway-verify=0a16e80d54ce2af477435179ddd47639037eb5799fc5b74a360fd2a601e72628`|
  | CNAME        | `www`                 | `binlkxjg.up.railway.app`                                                         |
  | TXT          | `_railway-verify.www` | `railway-verify=f90c3cc7bd93df87001d729afb2f0a78e10401dd860a9cd416130014564c949d`|

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
