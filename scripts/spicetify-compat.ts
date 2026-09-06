/** Temporary compatibility patch for Spicetify 2.44.0 on Spotify 1.2.97.
 * The wrapper can abort while scanning a lazy module with missing dependencies,
 * never fires webpackLoaded, and never binds Player.origin on the new client.
 * Keep this separate from the extension: its generated loader waits for that event.
 */
export function patchWrapper(source: string): string {
  const marker = "/* spicy-lyrics: spicetify-2.44.0 compatibility */";
  if (source.startsWith(marker)) return source;
  const replacements = [
    ["Object.keys(e.m).map(u=>e(u))", "Object.keys(e.m).map(u=>{try{return e(u)}catch{return undefined}})"],
    ["let h=s(o);", "let h;try{h=s(o)}catch{continue}"],
    // Wait for the platform too, so consumers of platformLoaded can use History.
    ["await M(()=>a,100)", "await M(()=>Spicetify.Platform?.History&&Spicetify.Platform?.PlayerAPI,50),n.O(),await M(()=>a,100)"],
    ["(function e(){if(!Spicetify?.Player?.origin?._state)", "(function e(){Spicetify.Player.origin??=Spicetify.Platform?.PlayerAPI;if(!Spicetify?.Player?.origin?._state)"],
  ];
  for (const [before, after] of replacements) {
    if (source.split(before).length !== 2) {
      throw new Error("Unrecognized Spicetify wrapper; compatibility patch needs review. No file changed.");
    }
    source = source.replace(before, after);
  }
  return `${marker}\n${source}`;
}

if (import.meta.main) {
  const config = Bun.spawnSync(["spicetify", "config", "spotify_path"]);
  if (config.exitCode !== 0) throw new Error("Unable to locate Spotify");
  const path = `${config.stdout.toString().trim()}/Apps/xpui/helper/spicetifyWrapper.js`;
  const original = await Bun.file(path).text();
  const patched = patchWrapper(original);
  if (patched !== original) {
    await Bun.write(`${path}.spicy-backup`, original);
    await Bun.write(path, patched);
  }
  console.log("Spicetify compatibility patch installed.");
}
