import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber, formatDate, formatDateShort } from "./format";

describe("formatCurrency", () => {
  it("formats positive integer to JPY currency", () => {
    expect(formatCurrency(1000)).toBe("￥1,000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("￥0");
  });

  it("formats large numbers with comma separators", () => {
    expect(formatCurrency(1234567)).toBe("￥1,234,567");
  });

  it("returns '-' for null", () => {
    expect(formatCurrency(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatCurrency(undefined)).toBe("-");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-500)).toBe("-￥500");
  });

  it("returns '-' for NaN", () => {
    expect(formatCurrency(NaN)).toBe("-");
  });
});

describe("formatNumber", () => {
  it("formats integer with comma separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats large numbers", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("returns '-' for null", () => {
    expect(formatNumber(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatNumber(undefined)).toBe("-");
  });

  it("formats decimal numbers", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });
});

describe("formatDate", () => {
  it("formats ISO date string to Japanese format", () => {
    expect(formatDate("2024-01-15")).toBe("2024/01/15");
  });

  it("formats ISO datetime string", () => {
    expect(formatDate("2024-12-25T10:30:00Z")).toBe("2024/12/25");
  });

  it("returns '-' for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });

  it("returns '-' for empty string", () => {
    expect(formatDate("")).toBe("-");
  });
});

describe("formatDateShort", () => {
  it("formats to month/day format", () => {
    expect(formatDateShort("2024-01-15")).toBe("01/15");
  });

  it("formats ISO datetime string", () => {
    expect(formatDateShort("2024-12-25T10:30:00Z")).toBe("12/25");
  });

  it("returns '-' for null", () => {
    expect(formatDateShort(null)).toBe("-");
  });

  it("returns '-' for undefined", () => {
    expect(formatDateShort(undefined)).toBe("-");
  });

  it("returns '-' for empty string", () => {
    expect(formatDateShort("")).toBe("-");
  });
});
