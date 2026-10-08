# GitHub Pages and zuzanapurm.cz

The repository is `jnp4C/ZuzWeb`. It is currently public; Pages is currently
configured to publish the root of `deployment-final`. The intended setup uses
GitHub Actions to publish only the reviewed `_site` bundle.

## Prepare and preview

Run `node scripts/build-pages.mjs` from the repository root with Node 22.
`_site` must not already exist; alternatively pass a new output directory.
Preview with `python3 -m http.server 8081 --bind 127.0.0.1 --directory _site`.
The builder preserves published media, PDFs, responsive/zoom variants, and
static presentation order. It excludes unpublished records, scene metadata,
legacy year routes, local reference documents, and unrelated archive assets.
Source archives remain in Git. Public repositories expose tracked files/history
independently of what the website serves.

## Activate GitHub Pages

1. In https://github.com/jnp4C/ZuzWeb/settings/pages select **GitHub Actions**
   as the build/deployment source before pushing the workflow commit.
2. Push `deployment-final`. `.github/workflows/pages.yml` builds the bundle
   and deploys it on pushes to this branch. It does not publish from `main`.
3. Confirm both build and deploy jobs succeed in the repository's Actions tab.
4. Test https://jnp4c.github.io/ZuzWeb/ before connecting the domain.

For this public repository, GitHub Pages hosting and HTTPS do not require a
paid GitHub plan. The domain registration/renewal is a separate registrar cost;
a separate webhosting package is unnecessary.

## Connect the purchased domain

After completing the purchase of `zuzanapurm.cz`:

1. Verify ownership in https://github.com/settings/pages using GitHub's TXT
   challenge. Copy the exact name/value GitHub supplies into your DNS zone.
2. In the repository **Settings → Pages → Custom domain**, save `zuzanapurm.cz`.
3. At the provider that manages the domain's DNS, set these records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | jnp4c.github.io |

`@` means the root domain; some DNS interfaces use a blank field or the full
domain instead. Use ordinary DNS records, not web forwarding. The `www` target
must have no repository path. Replace conflicting parking/web records for the
root and `www`; preserve email MX/TXT records if present.

4. Wait for GitHub's DNS check and certificate provisioning. DNS propagation
   and the HTTPS option can take up to 24 hours.
5. Select **Enforce HTTPS** once available. Check both `https://zuzanapurm.cz`
   and `https://www.zuzanapurm.cz`; GitHub redirects www to the chosen root.

With an Actions deployment, the custom domain is stored in Pages settings;
GitHub ignores a repository CNAME file, so this workflow does not need one.

Official references:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
