import { describe, it, expect } from "vitest";
import {
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotalAmount,
  calculateItemAmount,
} from "./invoiceCalculation";

describe("calculateSubtotal", () => {
  it("sums amounts of non-header items", () => {
    const items = [
      { item_type: "product" as const, amount: 1000 },
      { item_type: "material" as const, amount: 500 },
      { item_type: "labor" as const, amount: 2000 },
    ];
    expect(calculateSubtotal(items)).toBe(3500);
  });

  it("excludes header items from subtotal", () => {
    const items = [
      { item_type: "header" as const, amount: 0 },
      { item_type: "product" as const, amount: 1000 },
      { item_type: "header" as const, amount: 0 },
      { item_type: "material" as const, amount: 500 },
    ];
    expect(calculateSubtotal(items)).toBe(1500);
  });

  it("returns 0 for empty items", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("returns 0 for only header items", () => {
    const items = [
      { item_type: "header" as const, amount: 0 },
      { item_type: "header" as const, amount: 0 },
    ];
    expect(calculateSubtotal(items)).toBe(0);
  });

  it("handles 'other' item type", () => {
    const items = [
      { item_type: "other" as const, amount: 300 },
      { item_type: "product" as const, amount: 700 },
    ];
    expect(calculateSubtotal(items)).toBe(1000);
  });
});

describe("calculateTaxAmount", () => {
  it("calculates 10% tax", () => {
    expect(calculateTaxAmount(10000, 0.1)).toBe(1000);
  });

  it("calculates 8% tax", () => {
    expect(calculateTaxAmount(10000, 0.08)).toBe(800);
  });

  it("floors tax amount (rounds down)", () => {
    expect(calculateTaxAmount(999, 0.1)).toBe(99);
    expect(calculateTaxAmount(1001, 0.1)).toBe(100);
  });

  it("returns 0 for 0 subtotal", () => {
    expect(calculateTaxAmount(0, 0.1)).toBe(0);
  });

  it("returns 0 for 0% tax rate", () => {
    expect(calculateTaxAmount(10000, 0)).toBe(0);
  });

  it("handles decimal subtotals correctly", () => {
    expect(calculateTaxAmount(1234, 0.1)).toBe(123);
    expect(calculateTaxAmount(5678, 0.08)).toBe(454);
  });
});

describe("calculateTotalAmount", () => {
  it("adds subtotal and tax amount", () => {
    expect(calculateTotalAmount(10000, 1000)).toBe(11000);
  });

  it("returns subtotal when tax is 0", () => {
    expect(calculateTotalAmount(5000, 0)).toBe(5000);
  });

  it("returns 0 when both are 0", () => {
    expect(calculateTotalAmount(0, 0)).toBe(0);
  });
});

describe("calculateItemAmount", () => {
  it("calculates amount as quantity * unit_price", () => {
    expect(calculateItemAmount(5, 1000)).toBe(5000);
  });

  it("handles decimal quantities", () => {
    expect(calculateItemAmount(1.5, 1000)).toBe(1500);
  });

  it("handles zero quantity", () => {
    expect(calculateItemAmount(0, 1000)).toBe(0);
  });

  it("handles zero unit price", () => {
    expect(calculateItemAmount(5, 0)).toBe(0);
  });

  it("returns 0 when quantity is null", () => {
    expect(calculateItemAmount(null, 1000)).toBe(0);
  });

  it("returns 0 when unit_price is null", () => {
    expect(calculateItemAmount(5, null)).toBe(0);
  });

  it("returns 0 when both are null", () => {
    expect(calculateItemAmount(null, null)).toBe(0);
  });
});
