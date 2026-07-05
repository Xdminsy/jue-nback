import { describe, expect, it } from "vitest";
import { resources } from "./locales";
import { flattenKeys } from "../utils/i18nKeys";

describe("i18n resources", () => {
  it("keeps zh and en keys aligned", () => {
    const zh = flattenKeys(resources.zh.translation).sort();
    const en = flattenKeys(resources.en.translation).sort();
    expect(en).toEqual(zh);
  });
});
