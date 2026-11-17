import { isProfileComplete } from "../../src/modules/profile/profile-completeness";

describe("isProfileComplete", () => {
  it("cere atât numele, cât și telefonul", () => {
    expect(isProfileComplete({ name: "Alex Popescu", phoneNumber: "+40712345678" })).toBe(true);
    expect(isProfileComplete({ name: null, phoneNumber: "+40712345678" })).toBe(false);
    expect(isProfileComplete({ name: "Alex Popescu", phoneNumber: null })).toBe(false);
    expect(isProfileComplete({ name: null, phoneNumber: null })).toBe(false);
  });

  it("nu acceptă valori formate doar din spații", () => {
    expect(isProfileComplete({ name: "   ", phoneNumber: "+40712345678" })).toBe(false);
    expect(isProfileComplete({ name: "Alex", phoneNumber: " " })).toBe(false);
  });
});
