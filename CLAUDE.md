# Man's Best Friend — website launch (EM Digital)

You are working for Lazaro at EM Digital. This folder is a finished static website
(plain HTML/CSS/JS, no build step) for a client. Your job is to put it live.

## Facts
- Client: Man's Best Friend — in-home dog boarding, owner Andrew Geist, Kendall FL
- Domain (registered at GoDaddy): mansbestfriendmiami.com — primary host is **www.mansbestfriendmiami.com**, bare domain redirects to www
- GitHub org: Marketing1527 — repo to create: **Marketing1527/mans-best-friend** (public)
- Vercel team: "laz's projects", slug `lazs-projects-04b09be7`, id `team_UmSovlnsttLQwLIsPu2o9tTW`
- Vercel project name: **mans-best-friend**, framework: none / "Other", no build command, output = repo root
- Pricing on the site is $50/night per dog only. Do not reintroduce any multi-dog rate.

## Launch plan (do these in order, report after each)
1. **Tools.** Check `git`, `gh`, `vercel` are installed (`--version`). Install what's missing
   (`npm i -g vercel`; GitHub CLI via the OS package manager). If `gh auth status` or `vercel whoami`
   shows not logged in, ask Lazaro to run `gh auth login` / `vercel login` himself — never handle passwords.
2. **GitHub.** The folder is already a git repo with commits on `main`. Create the repo and push:
   `gh repo create Marketing1527/mans-best-friend --public --source=. --remote=origin --push`
   (if it already exists, add it as `origin` and push).
3. **Vercel.** Link to a new project in the team above (`vercel link`, scope `lazs-projects-04b09be7`,
   project `mans-best-friend`), connect the GitHub repo so pushes to `main` auto-deploy (`vercel git connect`),
   then deploy to production (`vercel --prod`). Confirm with `--help` if a flag is unclear.
4. **Domains.** Add `www.mansbestfriendmiami.com` and `mansbestfriendmiami.com` to the project.
   Make the bare domain 308-redirect to www (CLI if supported, otherwise tell Lazaro the exact click path:
   Project → Settings → Domains → edit mansbestfriendmiami.com → Redirect to www).
   Then run `vercel domains inspect mansbestfriendmiami.com` and report the exact DNS records Vercel wants.
5. **GoDaddy DNS.** Expected records (use Vercel's values if they differ):
   - A `@` → `76.76.21.21` (edit GoDaddy's existing "Parked" A record rather than adding a second one)
   - CNAME `www` → `cname.vercel-dns.com`
   Do NOT touch MX/TXT records (email). There is no GoDaddy CLI; give Lazaro the table to enter,
   unless he provides a GoDaddy API key/secret, in which case use the GoDaddy Domains API.
6. **Verify.** Poll with `dig +short mansbestfriendmiami.com` / `dig +short www.mansbestfriendmiami.com`
   until they point at Vercel (can take minutes to a few hours). Then check with curl:
   - `https://www.mansbestfriendmiami.com/` → 200
   - `https://mansbestfriendmiami.com/` → redirects to www
   - `/pricing.html`, `/contact.html`, `/sitemap.xml`, `/robots.txt` → 200
   - `/this-does-not-exist` → 404 and serves the custom 404 page
   Report the live URL and anything that failed.

## Rules
- Ask before anything irreversible (deleting repos/projects, changing nameservers, removing DNS records).
- Don't edit site content unless asked. If you change something, commit with a clear message and push.
- `README.md` has the content/launch checklist; `CLAUDE.md`, `README.md`, `.htaccess` are excluded from deploys via `.vercelignore`.
