# Kerala Super Store UK: Website Plan

## 1. Recommended tech stack (free to start, fast)

| ഭാഗം | തിരഞ്ഞെടുപ്പ് | കാരണം |
|---|---|---|
| Frontend + Admin | Next.js (React) + Tailwind CSS | Fast, SEO friendly, Antigravity നന്നായി കൈകാര്യം ചെയ്യും |
| Database + Login + Realtime | Supabase (Postgres) | Admin മാറ്റം live ആയി site-ൽ വരും, free tier ഉണ്ട് |
| Image storage + CDN | Cloudflare R2 (അല്ലെങ്കിൽ Supabase Storage) | 5000 product image എളുപ്പം, fast delivery |
| Hosting | Cloudflare Pages | Commercial use-ന് free plan അനുവദിക്കുന്നു, ലോകമെമ്പാടും fast |
| AI (identify, description, SEO) | Gemini API (Flash model, vision) | Photo നോക്കി product തിരിച്ചറിയും |
| Background remove | `@imgly/background-removal` (admin-ന്റെ browser-ൽ run ചെയ്യും) | API cost ഇല്ല, free |
| Search | Postgres full-text search (പിന്നീട് വേണമെങ്കിൽ Meilisearch) | 5000 product-ന് ധാരാളം |
| Payment | ആദ്യം Cash on Delivery, പിന്നീട് Stripe | UK card payment ഭാവിയിൽ ചേർക്കാം |

**ശ്രദ്ധിക്കുക:**
- Vercel-ന്റെ free (Hobby) plan commercial ഉപയോഗത്തിന് അനുവദനീയമല്ല. അതുകൊണ്ട് Cloudflare Pages ആണ് നല്ലത്.
- Supabase free project ഒരാഴ്ച ഉപയോഗമില്ലെങ്കിൽ pause ആകും. Shop launch ചെയ്യുമ്പോൾ Supabase Pro (ഏകദേശം $25/മാസം) എടുക്കുന്നത് സുരക്ഷിതം.
- Free tier limit-കൾ മാറാറുണ്ട്. തുടങ്ങുന്നതിന് മുമ്പ് ഓരോ service-ന്റെയും pricing page ഒന്ന് നോക്കുക.
- Domain: നിങ്ങൾ വാങ്ങും (`.co.uk` UK customers-ന് നല്ലത്). Cloudflare-ൽ തന്നെ വാങ്ങിയാൽ setup എളുപ്പം.

## 2. Customer website

**Home page:** Logo, search bar, category tiles (Rice, Pulses, Masala, Powders, Spices, Crisps & Snacks, Oil, Pickles, Frozen, Kitchenwares), Offers, New arrivals, Best sellers, Delivery info.

**Category page:**
- ഇടത് വശത്ത് filters: **Brand** (ആ category-യിലെ എല്ലാ brand-ഉം count സഹിതം), Price range, Size/Weight, In stock only, Offers.
- Sort: Price, Popular, New.
- Product grid (mobile-ൽ 2 column), Lazy loading.

**Brand filter രീതി:** Product-ൽ brand save ചെയ്യും. Category തുറക്കുമ്പോൾ ആ category-യിൽ ഉള്ള brand-കൾ automatic ആയി list ചെയ്യും. Admin പുതിയ brand ചേർത്താൽ filter-ൽ തനിയെ വരും.

**Product page:** Transparent-background image, Name, Brand, Size, Price, Stock status, Quantity selector, Add to Cart, Description, Ingredients, Allergen info, Related products.

**Cart & Checkout:** Guest checkout + optional account, UK address + postcode, Delivery method (Home delivery / Collection), Payment: Cash on Delivery, Order confirmation email, Order tracking.

**Other:** Mobile-first design, Dark/Light, Fast loading, WhatsApp button, About/Contact, Privacy policy, Cookie consent (UK GDPR), Delivery & returns policy.

## 3. Admin panel (owner-ന്)

**Login:** Email + password (Supabase Auth), പിന്നീട് 2-step verification.

**AI Product Add (പ്രധാന feature):**
1. Admin computer-ൽ "Add Product" അമർത്തി photo upload ചെയ്യും (phone-ൽ എടുത്ത photo computer-ൽ transfer ചെയ്തത്, അല്ലെങ്കിൽ phone browser-ൽ നിന്ന് നേരിട്ട് camera).
2. Photo Gemini-ലേക്ക് പോകും. Gemini തിരിച്ചറിയും: Product name, Brand, Category, Weight/Size, Ingredients (label വായിക്കാൻ കഴിഞ്ഞാൽ), Barcode/text.
3. Background browser-ൽ തന്നെ remove ആകും, തുടർന്ന് ഒരേ size-ൽ (ഉദാ: 1000x1000) centre ചെയ്ത്, സ്ഥിരമായ light background ചേർക്കും.
4. Image WebP ആയി compress ചെയ്യും (ഏകദേശം 50-100 KB) → storage-ൽ save.
5. AI താഴെ പറയുന്നവ generate ചെയ്യും: SEO title, Meta description, Product description, Keywords/tags, Image alt text, URL slug.
6. Admin **Review screen** കാണും. എല്ലാം edit ചെയ്യാം. അതിൽ **Price, Quantity, Offer price** admin type ചെയ്യും (ഇത് AI-ക്ക് അറിയില്ല).
7. "Publish" അമർത്തിയാൽ site-ൽ live.

**Bulk add:** ഒന്നിലധികം photo ഒരുമിച്ച് upload ചെയ്യാം, ഓരോന്നും draft ആകും, admin review ചെയ്ത് publish ചെയ്യും.

**Duplicate check:** ഒരേ product രണ്ടുതവണ add ചെയ്താൽ warning കാണിക്കും.

**Admin control ചെയ്യുന്ന കാര്യങ്ങൾ:**
- Products: add / edit / delete / hide, stock, price, offer
- Categories & Brands: add / edit / reorder
- Orders: New → Confirmed → Packed → Out for delivery → Delivered / Cancelled, Cash received mark ചെയ്യൽ
- Delivery settings: Delivery charge, Free delivery limit, Delivery areas (postcodes), Delivery days/slots
- Payment settings: Cash on Delivery on/off (Stripe പിന്നീട്)
- Customers list
- Banners, Homepage sections, Announcement bar
- Site settings: Logo, Address, Phone, Email, Social links
- Dashboard: ഇന്നത്തെ orders, sales, low stock alert
- Export: Orders/Products CSV

**Live update:** Admin മാറ്റുന്നതെല്ലാം database-ൽ ആയതിനാൽ site-ൽ ഉടൻ കാണും. Stock/price മാറ്റം Supabase Realtime വഴി open ആയ pages-ലും update ആകും.

## 4. Database tables (ചുരുക്കത്തിൽ)

`categories`, `brands`, `products` (name, slug, brand_id, category_id, size, price, offer_price, stock, description, seo_title, seo_description, tags, image_url, status), `product_images`, `customers`, `addresses`, `orders`, `order_items`, `settings`, `banners`, `admin_users`.

## 5. Security

- Gemini API key browser-ൽ വെക്കരുത്. Server-side (Cloudflare Worker / API route) വഴി മാത്രം call ചെയ്യുക.
- Admin routes login ഇല്ലാതെ തുറക്കരുത്. Supabase Row Level Security ഉപയോഗിക്കുക.
- Image upload size/type check.
- Order data GDPR അനുസരിച്ച്: Privacy policy, data delete request.

## 6. UK specific

- Food product-ന് Allergen info കാണിക്കണം (admin panel-ൽ allergen field).
- Prices £ ൽ, VAT settings.
- Delivery: UK postcode check.
- Cookie banner, Privacy Policy, Terms, Returns policy.
- Food business registration ഉം labelling നിയമങ്ങളും നിങ്ങളുടെ local council / Food Standards Agency വഴി ഉറപ്പാക്കുക.

## 7. Build phases (Antigravity-ൽ ഓരോന്നായി)

1. **Phase 1:** Project setup, database, design system, logo/colours.
2. **Phase 2:** Customer site: home, category with brand filters, product page, search.
3. **Phase 3:** Cart + checkout + Cash on Delivery + order emails.
4. **Phase 4:** Admin login + product CRUD + orders management.
5. **Phase 5:** AI product add (Gemini + background removal + SEO generation).
6. **Phase 6:** Settings, banners, delivery rules, dashboard, live updates.
7. **Phase 7:** SEO (sitemap, schema.org Product markup, meta tags), speed, testing.
8. **Phase 8:** Deploy to Cloudflare Pages, connect domain, launch.
9. **Later:** Stripe card payment, Customer accounts/wishlist, Reviews, Multi-language (English + Malayalam).

## 8. Antigravity-ൽ കൊടുക്കാനുള്ള Prompt (English, copy ചെയ്ത് paste ചെയ്യുക)

```
Build a full e-commerce website for "Kerala Super Store", a UK-based Kerala grocery store.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres, Auth, Storage, Realtime), deploy target Cloudflare Pages. Mobile-first, modern, clean, user-friendly UI, fast loading.

Categories: Rice, Pulses, Masala, Powders, Spices, Crisps & Snacks, Oil, Pickles, Frozen, Kitchen Wares.

Customer site:
- Home with search, category tiles, offers, new arrivals.
- Category page with sidebar filters: Brand (auto-generated from products in that category with counts), price range, size, in-stock, offers; sorting; product grid.
- Product page with image, brand, size, price, stock, quantity selector, add to cart, description, allergens, related items.
- Cart, guest checkout, UK address/postcode, Cash on Delivery, order confirmation email, order status page.
- Cookie consent, privacy policy, terms, delivery info pages.

Admin panel (/admin, protected login):
- Dashboard (orders today, sales, low stock).
- Products CRUD, categories, brands, stock, offers, bulk actions.
- AI Add Product: admin uploads a product photo. Server-side call to Gemini API (key in env var, never exposed to client) to identify product name, brand, category, size/weight, ingredients, allergens. Remove image background in the browser using @imgly/background-removal, place on a consistent light background at 1000x1000, convert to WebP, upload to storage. Gemini also generates SEO title, meta description, product description, tags, alt text and slug. Show an editable review screen where admin enters price, offer price and quantity, then publishes. Support bulk upload as drafts. Warn on duplicates.
- Orders management with status workflow and cash-received marking.
- Settings: delivery charge, free delivery threshold, delivery postcodes/days, COD on/off, logo, address, phone, banners, homepage sections.
- All admin changes must appear live on the website (Supabase Realtime for stock/price).

SEO: dynamic meta tags, sitemap.xml, robots.txt, schema.org Product JSON-LD, clean slugs, image optimization.
Scale: must handle 5000+ products with pagination and fast queries.
Security: Row Level Security, admin-only routes, input validation.

Work in phases, and after each phase tell me what to test. Start with Phase 1: project setup, database schema, design system.
```

## 9. ചെയ്യേണ്ട ആദ്യ കാര്യങ്ങൾ

1. Logo, address, phone, email തയ്യാറാക്കുക.
2. Gemini API key എടുക്കുക (Google AI Studio).
3. Supabase, Cloudflare accounts ഉണ്ടാക്കുക.
4. Domain വാങ്ങുക.
5. Antigravity-ൽ മുകളിലെ prompt paste ചെയ്ത് Phase 1 തുടങ്ങുക.
