/**
 * Centralized API client for api.urantia.dev.
 *
 * All external API calls should go through this module instead of
 * using raw fetch/axios with hardcoded endpoint paths.
 */

import {
  mapParagraphToUBNode,
  mapSearchResult,
  mapTocToFlatNodes,
} from "./mapper";
import type {
  ApiPaperDetailResponse,
  ApiParagraphResponse,
  ApiParagraphWithParallelsResponse,
  ApiSearchResponse,
  ApiTocResponse,
  ParagraphParallels,
} from "./types";

const API_HOST = process.env.NEXT_PUBLIC_URANTIA_DEV_API_HOST;

/**
 * Fetch the table of contents as a flat array of TOCNode objects
 * (compatible with the legacy format expected by pages/papers and pages/explore).
 */
export async function fetchToc() {
  const url = `${API_HOST}/toc`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch TOC: ${res.status} ${res.statusText}`);
    }
    const json: ApiTocResponse = await res.json();
    return mapTocToFlatNodes(json.data.parts);
  } catch (error) {
    console.error(`[urantiaApi] fetchToc failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch a single paper with all paragraphs, returned as UBNode[].
 * The result is wrapped in the legacy `{ data: { results: UBNode[] } }` shape
 * to match what the paper reader page expects.
 */
export async function fetchPaper(paperId: string) {
  const url = `${API_HOST}/papers/${paperId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch paper ${paperId}: ${res.status} ${res.statusText}`
      );
    }
    const json: ApiPaperDetailResponse = await res.json();
    const { paper, paragraphs } = json.data;

    // Build the interspersed node array: paper header + (section headers + paragraphs)
    const nodes: UBNode[] = [];

    // Paper header node
    nodes.push({
      globalId: `${paper.partId}:${paper.id}`,
      paperId: paper.id,
      paperTitle: paper.title,
      partId: paper.partId,
      labels: paper.labels ?? [],
      language: "eng",
      type: "paper",
      objectID: `${paper.partId}:${paper.id}`,
    });

    // Paragraphs with section headers injected before each new section
    let lastSectionId: string | null = null;
    for (const p of paragraphs) {
      const sectionId = p.sectionId ?? "0";
      if (sectionId !== lastSectionId) {
        nodes.push({
          globalId: `${paper.partId}:${paper.id}.${sectionId}`,
          paperId: paper.id,
          paperTitle: paper.title,
          sectionId: sectionId,
          sectionTitle: p.sectionTitle ?? null,
          partId: paper.partId,
          labels: [],
          language: "eng",
          type: "section",
          objectID: `${paper.partId}:${paper.id}.${sectionId}`,
        });
        lastSectionId = sectionId;
      }
      nodes.push(mapParagraphToUBNode(p));
    }

    return { data: { results: nodes } };
  } catch (error) {
    console.error(`[urantiaApi] fetchPaper failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch a single paragraph by any reference format (globalId, standardReferenceId,
 * or paperSectionParagraphId). Returns a UBNode.
 */
export async function fetchParagraph(ref: string): Promise<UBNode> {
  const res = await fetch(`${API_HOST}/paragraphs/${encodeURIComponent(ref)}`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch paragraph ${ref}: ${res.status} ${res.statusText}`
    );
  }
  const json: ApiParagraphResponse = await res.json();
  return mapParagraphToUBNode(json.data);
}

/**
 * Fetch a paragraph's pre-computed cross-references (Bible + Urantia parallels).
 * Powers the per-paragraph "Cross-references" modal in the reader.
 */
export async function fetchParagraphParallels(
  ref: string
): Promise<ParagraphParallels> {
  const url = `${API_HOST}/paragraphs/${encodeURIComponent(
    ref
  )}?include=bibleParallels,urantiaParallels`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch parallels for ${ref}: ${res.status} ${res.statusText}`
    );
  }
  const json: ApiParagraphWithParallelsResponse = await res.json();
  return {
    urantiaParallels: json.data.urantiaParallels ?? [],
    bibleParallels: json.data.bibleParallels ?? [],
  };
}

/**
 * Fetch multiple paragraphs by reference. Uses Promise.all with individual fetches
 * since the new API doesn't have a batch endpoint.
 *
 * Returns UBNode[] — failed fetches are silently excluded.
 */
export async function fetchParagraphs(refs: string[]): Promise<UBNode[]> {
  const results = await Promise.all(
    refs.map(async (ref) => {
      try {
        return await fetchParagraph(ref);
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is UBNode => r !== null);
}

/**
 * Search paragraphs via full-text search. Returns results in the legacy
 * `{ data: { results: SearchResult[] } }` wrapper shape.
 */
export async function searchParagraphs(
  q: string,
  options: {
    limit?: number;
    type?: "phrase" | "and" | "or";
    paperId?: string;
    partId?: string;
  } = {}
) {
  const res = await fetch(`${API_HOST}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q,
      type: options.type ?? "and",
      limit: options.limit ?? 100,
      ...(options.paperId && { paperId: options.paperId }),
      ...(options.partId && { partId: options.partId }),
    }),
  });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  }
  const json: ApiSearchResponse = await res.json();
  const results = json.data.map(mapSearchResult);
  return { data: { results } };
}
