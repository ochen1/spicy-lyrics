import { expect, test } from "bun:test";
import { patchWrapper } from "../scripts/spicetify-compat";

// Small executable fixture containing the four affected wrapper paths.
const wrapper = `
function inventory(e){return Object.keys(e.m).map(u=>e(u))}
function scan(s){let i=[];for(let o of Object.keys(s.m)){let h=s(o);i.push(h)}return i}
async function boot(){let a=true,n={O(){}};await M(()=>a,100)}
(function e(){if(!Spicetify?.Player?.origin?._state){setTimeout(e,10);return}})();
`;

test("missing lazy modules do not abort discovery or player binding", () => {
  const player = { _state: {} };
  const spicetify = { Player: {} as any, Platform: { PlayerAPI: player } };
  const { inventory, scan } = new Function("Spicetify", `${patchWrapper(wrapper)};return {inventory,scan}`)(spicetify);
  const require = Object.assign((id: string) => {
    if (id === "missing") throw new TypeError("Cannot read properties of undefined (reading 'call')");
    return { id };
  }, { m: { missing: {}, loaded: {} } });
  expect(inventory(require).filter(Boolean)).toEqual([{ id: "loaded" }]);
  expect(scan(require)).toEqual([{ id: "loaded" }]);
  expect(spicetify.Player.origin).toBe(player);
});

test("patch is idempotent", () => {
  const patched = patchWrapper(wrapper);
  expect(patchWrapper(patched)).toBe(patched);
});

test("unknown wrappers fail without applying a partial patch", () => {
  expect(() => patchWrapper(wrapper.replace("let h=s(o);", "let h=somethingElse(o);"))).toThrow("No file changed");
});
