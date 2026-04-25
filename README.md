# Spicy Lyrics — self-hosted fork

Personal fork of [Spikerko/spicy-lyrics](https://github.com/Spikerko/spicy-lyrics),
pinned to upstream commit [`594a325`](https://github.com/Spikerko/spicy-lyrics/commit/594a325)
(2026-04-07). The upstream extension installs a 92-byte CDN stub that re-fetches
arbitrary code from `cdn.jsdelivr.net/gh/Spikerko/spicy-lyrics@main/...` on every
Spotify launch; this fork builds the extension from `src/` and removes the
remote-code-loading channels.

## What changed vs. upstream

- **No auto-updating CDN loader.** `manifest.json`'s `main` is no longer a stub
  that imports from a mutable URL — the bundle is built locally from `src/`.
- **No author-controlled runtime code loading.** The four romanization
  packages that upstream loads from `pkgs.spikerko.org` (Kuromoji, pinyin,
  aromanize, GreekRomanization) are now loaded from
  `cdn.jsdelivr.net/npm/<pkg>@<exact-version>/+esm` — same pattern, pinned to
  immutable npm releases.
- **Side-service phone-home channels removed**, all soft-stubbed in source so
  the diff against upstream is small:
  - update poller + version-check (`api.spicylyrics.org/query?ext_version`)
  - fallback host probing (`coregateway.spicylyrics.org`, `lcgateway.spikerko.org`)
  - external font CSS (`fonts.spikerko.org`)
  - placeholder image (`images.spikerko.org`)
  - TTML profile fetcher and external profile pages on `spicylyrics.org`
  - PlaylistBGs side services (`portal.spicylyrics.org`, `betterpic.spikerko.org`,
    `storage.spicy-lyrics.spikerko.org`, `spicycolor.spikerko.org`)
  - external links in the update dialog (Discord, GitHub releases)

## Runtime hosts

After install, the only hosts the extension contacts are:

| Host | Why |
|---|---|
| `api.spicylyrics.org` | Lyrics data |
| `spclient.wg.spotify.com` | Spotify's own audio-analysis API |
| `i.scdn.co` | Spotify's own cover-art CDN |
| `cdn.jsdelivr.net` | Romanization libs + kuromoji dictionary, pinned by exact npm version |

The jsdelivr URLs are content-addressable by `<package>@<version>`; npm
releases are immutable post-publish, so the trust posture is "trust npm,"
not "trust the plugin author."

## Build & install

Requires [Bun](https://bun.com) and [Spicetify](https://spicetify.app).

```sh
bun install
bun run build
spicetify config extensions spicy-lyrics.js
spicetify apply
```

`spicetify-creator` auto-copies the built bundle into your Spicetify Extensions
directory during `bun run build`.

To remove:

```sh
spicetify config extensions ""
spicetify apply
```

## License

Upstream is AGPL-3.0; modifications inherit AGPL-3.0. This is a personal-use
fork — redistribution over a network requires publishing your modifications
under AGPL.

---

## Upstream README

### Check out our *[Sitee](https://yoursit.ee/lyrics)*
#### Make your own at -> [https://yoursit.ee](https://yoursit.ee)

[![Github Version](https://img.shields.io/github/v/release/spikerko/spicy-lyrics)](https://github.com/spikerko/spicy-lyrics/) [![Github Stars badge](https://img.shields.io/github/stars/spikerko/spicy-lyrics?style=social)](https://github.com/spikerko/spicy-lyrics/) [![Discord Badge](https://dcbadge.limes.pink/api/server/uqgXU5wh8j?style=flat)](https://discord.com/invite/uqgXU5wh8j)

Hi, I'm Spikerko (the person who made this repo). I've been really passionate about this project, and I'm really happy for this project.

I've seen a problem with the Spotify Lyrics. They're plain, just static colors. So I wanted to build my own version. And here it is: **Spicy Lyrics**. Hope you like it!

![Extension Example](./previews/page.gif)


*Inspired by [Beautiful Lyrics](https://github.com/surfbryce/beautiful-lyrics)*
