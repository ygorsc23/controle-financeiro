import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });
  });

  describe("formatCurrency", () => {
    it("formats BRL currency", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1.234");
      expect(result).toContain("56");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toContain("0");
    });
  });

  describe("formatDate", () => {
    it("formats date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toBeTruthy();
    });
  });
});
