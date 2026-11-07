import { getPasswordErrors, PASSWORD_MAX_LENGTH } from "../../src/modules/auth/password-rules";

describe("getPasswordErrors", () => {
  it("acceptă o parolă care respectă toate regulile", () => {
    expect(getPasswordErrors("Sintetic0!")).toEqual([]);
  });

  it("acceptă exact 8 caractere", () => {
    expect(getPasswordErrors("Abcdef1!")).toEqual([]);
  });

  it("refuză o parolă mai scurtă de 8 caractere", () => {
    expect(getPasswordErrors("Abcde1!")).toEqual(["Parola trebuie să aibă cel puțin 8 caractere."]);
  });

  it("cere o literă mare", () => {
    expect(getPasswordErrors("sintetic0!")).toEqual(["Parola trebuie să conțină cel puțin o literă mare."]);
  });

  it("acceptă majuscule cu diacritice", () => {
    expect(getPasswordErrors("ștefan12!Ș")).toEqual([]);
  });

  it("cere o cifră", () => {
    expect(getPasswordErrors("Sintetico!")).toEqual(["Parola trebuie să conțină cel puțin o cifră."]);
  });

  it("cere un caracter special", () => {
    expect(getPasswordErrors("Sintetico1")).toEqual([
      "Parola trebuie să conțină cel puțin un caracter special (ex. ! @ # $ %).",
    ]);
  });

  it("nu consideră spațiul caracter special", () => {
    expect(getPasswordErrors("Sintetico 1")).toHaveLength(1);
  });

  it("întoarce toate regulile încălcate pentru o parolă goală", () => {
    expect(getPasswordErrors("")).toHaveLength(4);
  });

  it("refuză parolele mai lungi decât limita maximă", () => {
    const tooLong = "Aa1!" + "a".repeat(PASSWORD_MAX_LENGTH);
    expect(getPasswordErrors(tooLong)).toEqual([`Parola poate avea cel mult ${PASSWORD_MAX_LENGTH} caractere.`]);
  });
});
