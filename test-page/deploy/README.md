# Deploying the controlled test page

Deploy `test-page/index.html` and `test-page/style.css` byte-identical on each platform, then set
`controlledUrl` in `config/targets.json`. Each platform needs an account and, for automation, a token.
Nothing here runs automatically; these are the configs and the secrets a human must create.

| Host | Config | Account / secret needed | Expected URL pattern |
|------|--------|-------------------------|----------------------|
| GitHub Pages | separate repo `varshith/hostbench-probe` | none (done) | https://varshith.github.io/hostbench-probe/ |
| Cloudflare Pages | `wrangler.toml` | Cloudflare account; `CLOUDFLARE_API_TOKEN` (Pages:Edit) + `CLOUDFLARE_ACCOUNT_ID` | https://hostbench-probe.pages.dev/ |
| Vercel | `vercel.json` | Vercel account; `VERCEL_TOKEN` (+ `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) | https://hostbench-probe.vercel.app/ |
| Netlify | `netlify.toml` | Netlify account; `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` | https://hostbench-probe.netlify.app/ |
| Render | `render.yaml` | Render account; connect the repo (Blueprint) or `RENDER_API_KEY` | https://hostbench-probe.onrender.com/ |
| Railway | `railway.json` + `Dockerfile.static` | Railway account; `RAILWAY_TOKEN` | https://hostbench-probe.up.railway.app/ |
| Fly.io | `fly.toml` + `Dockerfile.static` | Fly account; `FLY_API_TOKEN` | https://hostbench-probe.fly.dev/ |
| DigitalOcean App Platform | `do-app.yaml` | DO account; `DIGITALOCEAN_ACCESS_TOKEN` | https://hostbench-probe-xxxxx.ondigitalocean.app/ |
| Firebase Hosting | `firebase.json` | Google account + Firebase project; `FIREBASE_TOKEN` or service account JSON | https://<project>.web.app/ |
| AWS Amplify Hosting | `amplify.yml` | AWS account; connect repo in Amplify console | https://main.<id>.amplifyapp.com/ |
| Deno Deploy | `deno-deploy.ts` | Deno Deploy account; `DENO_DEPLOY_TOKEN` | https://hostbench-probe.deno.dev/ |
| GitLab Pages | `gitlab-ci.yml` | GitLab account; mirror repo, no token needed for Pages | https://<group>.gitlab.io/hostbench-probe/ |
| Surge | `surge.sh` | Surge account; `SURGE_LOGIN` + `SURGE_TOKEN` | https://hostbench-probe.surge.sh/ |
| Koyeb | `koyeb.yaml` + `Dockerfile.static` | Koyeb account; `KOYEB_TOKEN` | https://hostbench-probe-<org>.koyeb.app/ |
| Azure Static Web Apps | `azure-static-web-apps.yml` | Azure subscription; `AZURE_STATIC_WEB_APPS_API_TOKEN` | https://<name>.azurestaticapps.net/ |

Rules: no custom domain (we measure the platform's default edge), platform default cache headers,
no extra files. After deploying, `curl -I <url>` must return 200 with `text/html`.
