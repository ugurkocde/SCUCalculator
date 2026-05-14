import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

afterEach(() => {
  cleanup();
});

const mockResponse = {
  result: "success",
  rates: {
    USD: 1,
    EUR: 0.9,
    GBP: 0.78,
    TRY: 33,
    CAD: 1.36,
    AUD: 1.49,
    JPY: 152,
  },
};

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = vi.fn(async () => {
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});
