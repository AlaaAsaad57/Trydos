import type { DemoCountry } from "./DemoData";
import type { XdIconName } from "./xdIcons";
import type { DemoKey } from "./demoKeys";

/**
 * The places the address picker offers. Mock data, a few per level — the real
 * list comes from the address service once the design is approved.
 *
 * The picker walks down four levels (province, district, town, street), the
 * order the design writes in "Province | District | Town | Street". The saved
 * address is shown the other way round, street first, as `Home Page – 98` does:
 * "Cendere | Ayazağa | Sariyer | İstanbul | Turkiye".
 */

export const LEVELS = ["Province", "District", "Town", "Street"] as const;

export type Country = {
  id: DemoCountry;
  name: DemoKey;
  flag: XdIconName | null;
};

/**
 * The four countries of `Home Page – 95`. The file draws Syria with the
 * Turkish flag — a placeholder — so Syria shows no flag until the designer
 * sends one.
 */
export const COUNTRIES: Country[] = [
  { id: "tr", name: "Turkiye", flag: "flagTr" },
  { id: "sy", name: "Syria", flag: null },
  { id: "iq", name: "Iraq", flag: "flagIq" },
  { id: "lb", name: "Lebanon", flag: "flagLb" },
];

type Tree = { [name: string]: Tree | string[] };

const PLACES: Record<DemoCountry, Tree> = {
  tr: {
    İstanbul: {
      Sariyer: {
        Ayazağa: ["Cendere", "Kemerburgaz", "Vadi"],
        Maslak: ["Büyükdere", "Ahi Evran"],
      },
      Beşiktaş: {
        Levent: ["Nispetiye", "Levent Cd."],
        Ortaköy: ["Dereboyu", "Mecidiye"],
      },
    },
    Ankara: { Çankaya: { Kızılay: ["Atatürk Blv.", "Ziya Gökalp"] } },
    Adana: { Seyhan: { Reşatbey: ["Atatürk Cd."] } },
    Mersin: { Yenişehir: { Pozcu: ["GMK Blv."] } },
    Antalya: { Muratpaşa: { Lara: ["Lara Cd."] } },
  },
  sy: {
    Damascus: {
      Mezzeh: { "Villat Gharbiya": ["Jalaa St."] },
      "Abu Rummaneh": { Malki: ["Malki St."] },
    },
    Aleppo: { Aziziyeh: { Sulaymaniyah: ["Faisal St."] } },
    Latakia: { "Al-Ziraa": { Tishreen: ["8 March St."] } },
  },
  iq: {
    Baghdad: {
      Karrada: { "Arasat Al-Hindiya": ["Street 62"] },
      Mansour: { "14 Ramadan": ["Mansour St."] },
    },
    Erbil: { Ankawa: { "Ankawa Center": ["100m St."] } },
  },
  lb: {
    Beirut: {
      Achrafieh: { Sassine: ["Sassine Sq."] },
      Hamra: { "Ras Beirut": ["Hamra St."] },
    },
    Tripoli: { "El Mina": { Port: ["Port St."] } },
  },
};

/** The choices at the next level, given the ones already made (province first). */
export function choicesAt(country: DemoCountry, picked: string[]): string[] {
  let node: Tree | string[] = PLACES[country];
  for (const name of picked) {
    if (Array.isArray(node)) return [];
    node = node[name];
    if (!node) return [];
  }
  return Array.isArray(node) ? node : Object.keys(node);
}

export const countryOf = (id: DemoCountry) =>
  COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];
