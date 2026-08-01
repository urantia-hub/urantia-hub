import type { NextApiRequest, NextApiResponse } from "next";
import getSessionDetails from "@/utils/getSessionDetails";
import { getPaperParagraphCounts } from "@/libs/urantiaApi/paperCounts";

const mockFindMany = vi.fn();
const mockDeleteMany = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("@/utils/getSessionDetails", () => ({
  default: vi.fn(),
}));

vi.mock("@/services/readNode", () => ({
  default: class MockReadNodeService {
    findMany = mockFindMany;
    deleteMany = mockDeleteMany;
  },
}));

vi.mock("@/services/user", () => ({
  default: class MockUserService {
    update = mockUserUpdate;
  },
}));

vi.mock("@/middleware/sentry", () => ({
  withSentry: (handler: any) => handler,
}));

vi.mock("@/libs/urantiaApi/paperCounts", () => ({
  getPaperParagraphCounts: vi.fn(),
}));

vi.mock("@/libs/prisma/client", () => ({
  getPrismaClient: () => ({}),
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

const mockUser = { id: "user-1", email: "test@test.com" };
const mockSession = { session: {}, user: mockUser };

describe("pages/api/user/nodes/progress", () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/pages/api/user/nodes/progress");
    handler = mod.default;
  });

  it("GET returns progress data with percentage", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    mockFindMany.mockResolvedValue([
      { globalId: "1:0.1", paperId: "1" },
      { globalId: "1:0.2", paperId: "1" },
      { globalId: "2:0.1", paperId: "2" },
    ]);

    const paperCounts = new Map([
      ["1", 10],
      ["2", 5],
    ]);
    vi.mocked(getPaperParagraphCounts).mockResolvedValue(paperCounts);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.data).toEqual([
      { paperId: "1", paperTitle: "", progress: 20 },
      { paperId: "2", paperTitle: "", progress: 20 },
    ]);
  });

  it("GET returns empty data when no read nodes", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    mockFindMany.mockResolvedValue([]);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ data: [] });
  });

  it("GET returns 400 for non-string paperId", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({ method: "GET", query: { paperId: ["1", "2"] } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toBe("Expected paperId to be a string.");
  });

  it("GET handles error from getPaperParagraphCounts", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    mockFindMany.mockResolvedValue([
      { globalId: "1:0.1", paperId: "1" },
    ]);
    vi.mocked(getPaperParagraphCounts).mockRejectedValue(new Error("API down"));

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._json.message).toBe("Unable to calculate progress.");
  });

  it("DELETE clears progress and returns 204", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    mockUserUpdate.mockResolvedValue({});
    mockDeleteMany.mockResolvedValue({});

    const req = createMockReq({ method: "DELETE" });
    const res = createMockRes();

    await handler(req, res);

    expect(mockUserUpdate).toHaveBeenCalledWith("user-1", {
      lastAskedNotificationsAt: null,
      lastVisitedAt: null,
      lastVisitedGlobalId: null,
      lastVisitedPaperId: null,
      lastVisitedPaperTitle: null,
    });
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(res._status).toBe(204);
    expect(res._ended).toBe(true);
  });

  it("unsupported method returns 405", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({ method: "POST" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["GET", "DELETE"]);
    expect(res._status).toBe(405);
    expect(res._ended).toBe(true);
  });
});
