# Portfolio Starter

A clean, static portfolio site — no build step, no dependencies. Just HTML and CSS.

## File structure

```
portfolio/
├── index.html              ← home page with project grid
├── about.html              ← about page
├── assets/
│   ├── style.css           ← all styling lives here
│   └── thumb-01.jpg ...    ← project grid thumbnails (replace with your own)
└── projects/
    ├── project-one.html    ← duplicate this file for each new project
    ├── project-two.html
    └── ...
```

## Customize it

**1. Change your name and copy**
Open `index.html` and `about.html`, replace `Sean Last Name`, the intro line, and the about text with yours. Same for the contact email and social links.

**2. Add a project**
- Duplicate `projects/project-one.html` and rename it (e.g., `projects/my-new-film.html`).
- Inside that file, change the title, client tag, description, and credits.
- Replace the `<iframe src="...">` URL with your YouTube or Vimeo embed URL. To get it:
  - **Vimeo**: open the video → Share → Embed → copy the `src` URL from the iframe code.
  - **YouTube**: right-click the video → "Copy embed code" → use the `src` URL.
- Drop a 16:9 thumbnail image into `assets/` (e.g., `assets/my-new-film.jpg`).
- Add a new card to the grid in `index.html`, pointing to your new project file and thumbnail.

**3. Replace thumbnails**
The four `thumb-0X.jpg` files in `assets/` are placeholders. Export your own 16:9 JPGs (roughly 1600×900, keep them under ~300KB each for fast loading).

## Deploy to GitHub Pages (free)

1. Create a new repo on GitHub. Name it anything — but if you name it `yourusername.github.io`, the site will live at that URL automatically.
2. Upload all the files in this folder to the repo (via the web UI or `git push`).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to "Deploy from a branch," then pick `main` and `/ (root)`. Save.
5. Wait ~1 minute. Your site will be live at `https://yourusername.github.io/reponame/` (or `https://yourusername.github.io/` if you used the special repo name).

## Hook up your custom domain

1. In the repo's **Settings → Pages**, under "Custom domain," enter your domain (e.g., `sean.com` or `work.sean.com`) and save.
2. At your domain registrar, add DNS records:
   - **Apex domain** (`sean.com`): add four A records pointing to GitHub's IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - **Subdomain** (`work.sean.com`): add one CNAME record pointing to `yourusername.github.io`.
3. Back on GitHub, check "Enforce HTTPS" once it becomes available (usually within an hour after DNS propagates).

That's it — free hosting, your domain, no monthly fee.

## Tips

- Keep the aesthetic restrained. The work should be the loudest thing on the page.
- Compress video thumbnails. Use [squoosh.app](https://squoosh.app) for quick JPG optimization.
- For the best video experience, host videos on Vimeo (Pro plan hides their branding) or use unlisted YouTube videos. Don't self-host video files — they're too large for GitHub Pages.
- The fonts (Fraunces + Inter Tight) load from Google Fonts. Swap them in `assets/style.css` if you want a different look.
