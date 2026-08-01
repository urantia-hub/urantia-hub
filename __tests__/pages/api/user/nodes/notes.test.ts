import type { NextApiRequest, NextApiResponse } from "next";
import getSessionDetails from "@/utils/getSessionDetails";

const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/utils/getSessionDetails", () => ({
  default: vi.fn(),
}));

vi.mock("@/services/note", () => ({
  default: class MockNoteService {
    create = mockCreate;
    findMany = mockFindMany;
  },
}));

vi.mock("@/middleware/sentry", () => ({
  withSentry: (handler: any) => handler,
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

describe("pages/api/user/nodes/notes", () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/pages/api/user/nodes/notes");
    handler = mod.default;
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(undefined as any);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(getSessionDetails).toHaveBeenCalled();
  });

  it("POST creates note with text and returns 201", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    const createdNote = { id: "note-1", globalId: "1:0.1", paperId: "1", text: "My note", userId: "user-1" };
    mockCreate.mockResolvedValue(createdNote);

    const req = createMockReq({
      method: "POST",
      body: {
        globalId: "1:0.1",
        paperId: "1",
        paperSectionId: "1:0",
        paperSectionParagraphId: "1:0.1",
        text: "My note",
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
        text: "My note",
        userId: "user-1",
      },
    });
    expect(res._status).toBe(201);
    expect(res._json).toEqual(createdNote);
  });

  it("POST returns 400 for missing fields", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({
      method: "POST",
      body: { globalId: "1:0.1", paperId: "1" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toContain("text");
  });

  it("POST returns 400 when text is not a string", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({
      method: "POST",
      body: { globalId: "1:0.1", paperId: "1", text: 123 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toBe("Text must be a string.");
  });

  it("POST returns 400 when text exceeds 1000 chars", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({
      method: "POST",
      body: { globalId: "1:0.1", paperId: "1", text: "a".repeat(1001) },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.message).toContain("Max length is 1000");
  });

  it("GET returns notes for user", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);
    const notes = [{ id: "note-1", globalId: "1:0.1", paperId: "1", text: "My note" }];
    mockFindMany.mockResolvedValue(notes);

    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(mockFindMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(res._status).toBe(200);
    expect(res._json).toEqual(notes);
  });

  it("unsupported method returns 405", async () => {
    vi.mocked(getSessionDetails).mockResolvedValue(mockSession as any);

    const req = createMockReq({ method: "DELETE" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["POST"]);
    expect(res._status).toBe(405);
    expect(res._ended).toBe(true);
  });
});
