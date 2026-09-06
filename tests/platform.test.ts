import { expect, test } from "bun:test";

let moduleId = 0;
async function setup(get: () => Promise<unknown>, session?: object, authorization?: object) {
  (globalThis as any).Spicetify = {
    Platform: { Session: session, AuthorizationAPI: authorization },
    CosmosAsync: { get },
  };
  return (await import(`../src/components/Global/Platform.ts?test=${moduleId++}`)).default;
}

const token = (accessToken = "test-token") => ({
  accessToken,
  expiresAtTime: Date.now() + 60000,
  tokenType: "Bearer",
});

// A deadline turns the former self-referential promise into a visible test failure.
function bounded<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("hung")), 250)),
  ]);
}

test("failed token request rejects and next load can retry", async () => {
  let calls = 0;
  const platform = await setup(async () => {
    if (++calls === 1) throw new Error("OAuth unavailable");
    return token();
  });
  await expect(bounded(platform.GetSpotifyAccessToken())).rejects.toThrow("Unable to obtain");
  expect(await bounded(platform.GetSpotifyAccessToken())).toBe("test-token");
  expect(calls).toBe(2);
});

test("missing resolver without session rejects instead of hanging", async () => {
  const platform = await setup(async () => { throw new Error("Resolver not found"); });
  await expect(bounded(platform.GetSpotifyAccessToken())).rejects.toThrow("Unable to obtain");
});

test("valid session token recovers failed Cosmos request", async () => {
  const platform = await setup(async () => { throw new Error("Resolver not found"); }, {
    accessToken: "session-token",
    accessTokenExpirationTimestampMs: Date.now() + 60000,
  });
  expect(await bounded(platform.GetSpotifyAccessToken())).toBe("session-token");
});

test("concurrent requests share one fetch and successful tokens are cached", async () => {
  let calls = 0;
  const platform = await setup(async () => { calls++; return token(); });
  const first = platform.GetSpotifyAccessToken();
  expect(platform.GetSpotifyAccessToken()).toBe(first);
  expect(await first).toBe("test-token");
  expect(await platform.GetSpotifyAccessToken()).toBe("test-token");
  expect(calls).toBe(1);
});

test("expired cached token is refreshed", async () => {
  let calls = 0;
  const platform = await setup(async () => ++calls === 1
    ? { ...token("expired"), expiresAtTime: Date.now() - 1000 }
    : token("fresh"));
  await platform.GetSpotifyAccessToken();
  expect(await bounded(platform.GetSpotifyAccessToken())).toBe("fresh");
  expect(calls).toBe(2);
});

test("current Spotify authorization store avoids unavailable legacy resolver", async () => {
  let calls = 0;
  const platform = await setup(async () => { calls++; throw new Error("Resolver not found"); }, undefined, {
    getState: () => ({ isAuthorized: true, token: {
      accessToken: "modern-token", accessTokenExpirationTimestampMs: Date.now() + 60000,
    } }),
  });
  expect(await bounded(platform.GetSpotifyAccessToken())).toBe("modern-token");
  expect(calls).toBe(0);
});
