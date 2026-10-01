# Man's Best Friend — Website

Static HTML site for Man's Best Friend (Andrew Geist), in-home dog boarding in Pinecrest, FL.
Upload the contents of this folder to the web root. No build step, database, or plugins needed.

## Pages
| File | Purpose | Schema |
|---|---|---|
| index.html | Home | LocalBusiness, WebSite, FAQPage |
| dog-boarding.html | Service page | Service, BreadcrumbList |
| pricing.html | $50 / $40 rates + example totals | Service, BreadcrumbList |
| locations.html | Service-area hub | Service, BreadcrumbList |
| pinecrest-dog-boarding.html | Location page | Service, FAQPage, BreadcrumbList |
| palmetto-bay-dog-boarding.html | Location page | Service, FAQPage, BreadcrumbList |
| coconut-grove-dog-boarding.html | Location page | Service, FAQPage, BreadcrumbList |
| about.html | About Andrew | BreadcrumbList |
| faq.html | 9 FAQs | FAQPage, BreadcrumbList |
| contact.html | Call / text / email + stay request form | LocalBusiness, ContactPage, BreadcrumbList |
| boarding-policies.html | Vaccines, meds, drop-off, emergencies, cancellations | BreadcrumbList |
| privacy-policy.html, terms-of-service.html | Legal | BreadcrumbList |
| 404.html | Custom not-found page (noindex) | — |

Also included: `sitemap.xml`, `robots.txt`, `site.webmanifest`, `.htaccess` (404 handler, HTTPS + www redirect, caching, gzip), favicons and a social share image.

## CTA setup
- Primary CTA everywhere is **Call (305) 322-3338** (tel: link); text links use sms:.
- On phones a sticky Call / Text bar sits at the bottom of every page.
- The contact form opens the visitor's email app addressed to geistandrew@yahoo.com (no server needed). Swap it for a form service (Formspree, GHL, etc.) later if you want submissions tracked.

## Before launch
1. **Domain:** set to `https://www.mansbestfriend.com`. If different, find-and-replace that string across all files (canonicals, schema, sitemap, robots, .htaccess).
2. **Confirm with Andrew** (written as standard boarding policy, adjust as needed): required vaccines, deposit/payment terms, cancellation terms, emergency vet process, any breeds/sizes he won't take.
3. **Photos:** add real photos of Andrew, his home/yard and dogs in his care. They'll lift trust more than anything else.
4. **Google Business Profile:** keep it as a service-area business (no street address shown), matching name, phone and the three service areas.
5. Submit `sitemap.xml` in Google Search Console after launch.
6. `.htaccess` is for Apache hosting. On Netlify/Vercel/Cloudflare Pages, 404.html is picked up automatically; skip the file.
