import type { NextApiRequest, NextApiResponse } from "next";
import { searchParagraphs } from "@/libs/urantiaApi/client";

vi.mock("@/libs/urantiaApi/client", () => ({
  searchParagraphs: vi.fn(),
}));

vi.mock("@/middleware/sentry", () => ({
  withSentry: (handler: any) => handler,
}));

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "GET",
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as NextApiRequest;
}

function createMockRes(): NextApiResponse & { _status: number; _json: any; _ended: boolean } {
  const res: any = {
    _status: 200,
    _json: null,
    _ended: false,
    status: vi.fn().mockImplementation(function (code: number) { res._status = code; return res; }),
    json: vi.fn().mockImplementation(function (data: any) { res._json = data; return res; }),
    end: vi.fn().mockImplementation(function () { res._ended = true; return res; }),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn(),
  };
  return res;
}

describe("pages/api/urantia-book/search", () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/pages/api/urantia-book/search");
    handler = mod.default;
  });

  it("POST returns search results", async () => {
    const mockResults = [{ globalId: "0:0.1", text: "The Universal Father" }];
    vi.mocked(searchParagraphs).mockResolvedValue(mockResults as any);

    const req = createMockReq({ method: "POST", body: { q: "Universal Father" } });
    const res = createMockRes();

    await handler(req, res);

    expect(searchParagraphs).toHaveBeenCalledWith("Universal Father");
    expect(res._status).toBe(200);
    expect(res._json).toEqual(mockResults);
  });

  it("POST returns 500 when searchParagraphs throws", async () => {
    vi.mocked(searchParagraphs).mockRejectedValue(new Error("DB error"));

    const req = createMockReq({ method: "POST", body: { q: "test" } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: "Search failed" });
  });

  it("GET returns 405", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["POST"]);
    expect(res._status).toBe(405);
    expect(res._ended).toBe(true);
  });
});
