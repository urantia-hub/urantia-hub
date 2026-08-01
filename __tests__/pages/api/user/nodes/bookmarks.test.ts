import type { NextApiRequest, NextApiResponse } from "next";
import getSessionDetails from "@/utils/getSessionDetails";
import { enforceGlobalId } from "@/utils/typeUtils";

vi.mock("@/utils/getSessionDetails", () => ({
  default: vi.fn(),
}));

const mockCreate = vi.fn();
const mockFind = vi.fn();
const mockFindMany = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/services/bookmark", () => ({
  default: class MockBookmarkService {
    create = mockCreate;
    find = mockFind;
    findMany = mockFindMany;
    delete = mockDelete;
  },
}));

vi.mock("@/middleware/sentry", () => ({
  withSentry: (handler: any) => handler,
}));

vi.mock("@/utils/typeUtils", () => ({
  enforceGlobalId: vi.fn(),
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

function createMockRes() {
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

describe("pages/api/user/nodes/bookmarks", () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/pages/api/user/nodes/bookmarks");
    handler = mod.default;
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(undefined as any);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(getSessionDetails).toHaveBeenCalled();
  });

  it("POST creates bookmark and returns 201", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    const createdBookmark = { id: "bm-1", globalId: "1:0.1", paperId: "1", userId: "user-1" };
    mockCreate.mockResolvedValue(createdBookmark);

    const req = createMockReq({
      method: "POST",
      body: {
        globalId: "1:0.1",
        paperId: "1",
        paperSectionId: "1:0",
        paperSectionParagraphId: "1:0.1",
      },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        globalId: "1:0.1",
        paperId: "1",
        paperSectionId: "1:0",
        paperSectionParagraphId: "1:0.1",
        userId: "user-1",
      },
    });
    expect(res._status).toBe(201);
    expect(res._json).toEqual(createdBookmark);
  });

  it("POST returns 400 when missing required fields", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({
      method: "POST",
      body: { paperId: "1" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toContain("globalId");
  });

  it("GET returns bookmarks for user", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    const bookmarks = [{ id: "bm-1", globalId: "1:0.1", paperId: "1" }];
    mockFindMany.mockResolvedValue(bookmarks);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(mockFindMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(res._status).toBe(200);
    expect(res._json).toEqual(bookmarks);
  });

  it("GET with paperId filter", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    const bookmarks = [{ id: "bm-1", globalId: "1:0.1", paperId: "1" }];
    mockFindMany.mockResolvedValue(bookmarks);

    const req = createMockReq({ method: "GET", query: { paperId: "1" } });
    const res = createMockRes();

    await handler(req, res);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", paperId: "1" },
    });
    expect(res._status).toBe(200);
  });

  it("DELETE returns 204 after deleting bookmark", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    vi.mocked(enforceGlobalId).mockImplementation(() => {});
    const bookmark = { id: "bm-1", globalId: "1:0.1", userId: "user-1" };
    mockFind.mockResolvedValue(bookmark);
    mockDelete.mockResolvedValue(undefined);

    const req = createMockReq({ method: "DELETE", query: { globalId: "1:0.1" } });
    const res = createMockRes();

    await handler(req, res);

    expect(mockFind).toHaveBeenCalledWith({
      where: { globalId: "1:0.1", userId: "user-1" },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "bm-1" } });
    expect(res._status).toBe(204);
    expect(res._ended).toBe(true);
  });

  it("DELETE returns 400 when bookmark not found", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    vi.mocked(enforceGlobalId).mockImplementation(() => {});
    mockFind.mockResolvedValue(null);

    const req = createMockReq({ method: "DELETE", query: { globalId: "999:0.1" } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toBe("Bookmark not found.");
  });

  it("unsupported method returns 405", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({ method: "PATCH" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["POST", "GET", "DELETE"]);
    expect(res._status).toBe(405);
    expect(res._ended).toBe(true);
  });
});
