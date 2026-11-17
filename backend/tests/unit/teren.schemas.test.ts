import { fieldListQuerySchema, fieldSchema } from "../../src/modules/teren/teren.schemas";

const valid = { nume: "Sintetic Titan", adresa: "Bd. Nicolae Grigorescu 12", sector: "SECTOR_3", numarJucatori: 10 };

describe("datele terenului (US-05)", () => {
  it("acceptă un teren valid și elimină spațiile de la capete", () => {
    const result = fieldSchema.parse({ ...valid, nume: "  Sintetic Titan  ", adresa: "  Bd. Nicolae Grigorescu 12 " });
    expect(result).toEqual(valid);
  });

  it.each([
    { nume: "AB" }, { nume: "a".repeat(100) }, { adresa: "Str 1" }, { adresa: "a".repeat(255) },
    { numarJucatori: 2 }, { numarJucatori: 22 }, { sector: "SECTOR_1" }, { sector: "SECTOR_6" },
  ])("acceptă valorile de la limită %o", (override) => {
    expect(fieldSchema.safeParse({ ...valid, ...override }).success).toBe(true);
  });

  it.each([
    { nume: "A" }, { nume: "   A   " }, { nume: "a".repeat(101) }, { nume: 123 },
    { adresa: "Str" }, { adresa: "a".repeat(256) },
    { sector: "SECTOR_7" }, { sector: "sector_1" }, { sector: 1 },
    { numarJucatori: 1 }, { numarJucatori: 23 }, { numarJucatori: 10.5 }, { numarJucatori: "10" }, { numarJucatori: Number.NaN },
    { adminId: "11111111-1111-1111-1111-111111111111" },
  ])("refuză valoarea invalidă %o", (override) => {
    expect(fieldSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it.each(["nume", "adresa", "sector", "numarJucatori"])("cere câmpul %s", (key) => {
    const input: Record<string, unknown> = { ...valid };
    delete input[key];
    expect(fieldSchema.safeParse(input).success).toBe(false);
  });
});

describe("filtrele listei de terenuri", () => {
  it("folosește paginarea implicită și sectorul opțional", () => {
    expect(fieldListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(fieldListQuerySchema.parse({ page: "2", pageSize: "5", sector: "SECTOR_2" }))
      .toEqual({ page: 2, pageSize: 5, sector: "SECTOR_2" });
  });

  it.each([{ sector: "SECTOR_0" }, { page: "0" }, { pageSize: "101" }, { nume: "x" }])("refuză %o", (query) => {
    expect(fieldListQuerySchema.safeParse(query).success).toBe(false);
  });
});
