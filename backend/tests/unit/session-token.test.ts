import { generateSessionToken, hashSessionToken, parseBearerToken } from "../../src/modules/auth/session-token";

describe("session-token", () => {
  it("generează token-uri diferite, de cel puțin 256 de biți", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();

    expect(a.token).not.toEqual(b.token);
    expect(Buffer.from(a.token, "base64url")).toHaveLength(32);
  });

  it("întoarce hash-ul token-ului, nu token-ul", () => {
    const { token, tokenHash } = generateSessionToken();

    expect(tokenHash).not.toEqual(token);
    expect(tokenHash).toEqual(hashSessionToken(token));
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    ["Bearer abc123", "abc123"],
    ["bearer abc123", "abc123"],
    ["  Bearer   abc123  ", "abc123"],
  ])("citește token-ul din %p", (header, expected) => {
    expect(parseBearerToken(header)).toBe(expected);
  });

  it.each([undefined, "", "abc123", "Basic abc123", "Bearer", "Bearer a b"])("refuză antetul %p", (header) => {
    expect(parseBearerToken(header)).toBeNull();
  });
});
