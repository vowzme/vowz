import { describe, it, expect } from "vitest";
import {
  FALLBACK_TEMPLATES,
  OCCASIONS,
  CATEGORY_LABELS,
  type CardCategory,
  type Occasion,
} from "@/lib/card-templates";

const MIN_PREMIUM = 25;
const categories = Object.keys(CATEGORY_LABELS) as CardCategory[];

const premium = FALLBACK_TEMPLATES.filter((t) => t.is_premium);
const occasionOf = (t: { occasion?: Occasion }): Occasion => t.occasion ?? "wedding";

describe("card gallery premium coverage", () => {
  it.each(categories)("category %s has >= 25 premium templates", (cat) => {
    const count = premium.filter((t) => t.category === cat).length;
    expect(count, `${cat} has ${count} premium templates`).toBeGreaterThanOrEqual(MIN_PREMIUM);
  });

  it.each(OCCASIONS)("occasion %s has >= 25 premium templates", (occ) => {
    const count = premium.filter((t) => occasionOf(t) === occ).length;
    expect(count, `${occ} has ${count} premium templates`).toBeGreaterThanOrEqual(MIN_PREMIUM);
  });

  it.each(categories)("category %s has >= 25 premium templates for every occasion", (cat) => {
    for (const occ of OCCASIONS) {
      const count = premium.filter(
        (template) => template.category === cat && occasionOf(template) === occ,
      ).length;
      expect(count, `${cat} / ${occ} has ${count} premium templates`).toBeGreaterThanOrEqual(MIN_PREMIUM);
    }
  });
});