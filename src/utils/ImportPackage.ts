// Self-hosted fork: previously this fetched packages from
// https://pkgs.spikerko.org (author-controlled, mutable).
// We now load the same kind of packages from jsdelivr's immutable npm
// mirror, pinned by exact version. jsdelivr serves the published npm tarball
// content; pinning to a specific version makes the URL content-addressable
// (compromising it would require compromising npm itself).
import type { Brand } from "../types/Brand.d.ts";

// deno-lint-ignore no-explicit-any
export type Package = Brand<any, "Package">;
export type PackageUrl = Brand<string, "PackageUrl">;
export type PackageFileType = "js" | "ts" | "wasm" | "mjs";

const cache = new Map<string, any>();

const loadScript = (url: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const selector = `script[data-spicy-pkg="${url}"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);
    if (existing) {
      if ((existing as any)._loaded) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Failed to load ${url}`))
      );
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.dataset.spicyPkg = url;
    s.addEventListener("load", () => {
      (s as any)._loaded = true;
      resolve();
    });
    s.addEventListener("error", () =>
      reject(new Error(`Failed to load ${url}`))
    );
    document.head.appendChild(s);
  });

const adapters: Record<string, () => Promise<any>> = {
  // kuromoji ships a UMD prebuild that defines window.kuromoji. Same
  // pattern the original CDN loader used, just pointed at jsdelivr's
  // immutable npm mirror instead of an author-controlled host.
  Kuromoji: async () => {
    if (!(window as any).kuromoji) {
      await loadScript("https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js");
    }
    return (window as any).kuromoji;
  },

  // pinyin-pro: ESM via jsdelivr's auto-conversion. Caller does
  // `result.join("-")` so we hand back string[].
  pinyin: async () => {
    const m: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pinyin-pro@3.28.1/+esm"
    );
    return {
      pinyin: (text: string) => m.pinyin(text, { type: "array" }) as string[],
    };
  },

  // hangul-romanization: { convert(text) }. Caller expects
  // `mod.default(text, scheme)`; we ignore the scheme arg.
  aromanize: async () => {
    const m: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/hangul-romanization@1.0.1/+esm"
    );
    const convert: (text: string) => string =
      m.convert ?? m.default?.convert ?? m.default ?? m;
    return { default: (text: string, _scheme?: string) => convert(text) };
  },

  // greek-utils: CJS object exposing toTransliteratedLatin (academic
  // Greek→Latin romanization). Caller expects `mod.default(text)`.
  GreekRomanization: async () => {
    const m: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/greek-utils@1.3.0/+esm"
    );
    const utils = m.default ?? m;
    return { default: (text: string) => utils.toTransliteratedLatin(text) };
  },
};

const LoadPackage = async (name: string): Promise<any | undefined> => {
  if (cache.has(name)) return cache.get(name);
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`SpicyLyrics [LoadPackage] No mapping for "${name}"`);
  }
  const pkg = await adapter();
  cache.set(name, pkg);
  return pkg;
};

export const RetrievePackage = async (
  name: string,
  _version: string,
  _fileType: PackageFileType = "js"
): Promise<Package | undefined> => {
  try {
    return (await LoadPackage(name)) as Package;
  } catch (error: any) {
    throw new Error(`SpicyLyrics [RetrievePackage] ${error?.message ?? "An Error Occured"}`);
  }
};
