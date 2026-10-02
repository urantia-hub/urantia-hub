import { useState, useRef, useEffect } from "react";
import moment from "moment";
import { ReadNode } from "@prisma/client";
import { track } from "@/libs/analytics";
import { AVERAGE_READING_SPEED } from "@/utils/config";

function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, ms - (now - lastCall));
    }
  }) as T;
}

export function useReadProgress(paperId: string, paperTitle: string, nodes: UBNode[], status: string) {
  const [readNodes, setReadNodes] = useState<Set<string>>(new Set());
  const readingNodesRef = useRef<Record<string, { startsAt: number; node: UBNode }>>({});
  const trackedSectionsRef = useRef<Set<string>>(new Set());

  const estimatedReadTime = (node: UBNode) => {
    const paragraph = document.getElementById(node.globalId);
    if (!paragraph) return 0;
    const words = paragraph.innerText.split(" ").length;
    return (words / AVERAGE_READING_SPEED) * 60;
  };

  const markParagraphAsRead = async (node: UBNode) => {
    if (readNodes.has(node.globalId)) return;
    if (status !== "authenticated") return;

    try {
      const response = await fetch("/api/user/nodes/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalId: node.globalId,
          paperId: node.paperId,
          paperSectionId: node.paperSectionId,
          paperSectionParagraphId: node.paperSectionParagraphId,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const readNode = await response.json();
      setReadNodes((prev) => new Set(prev.add(readNode.globalId)));

      // One analytics event per section per page view, not one per paragraph.
      const sectionId = node.paperSectionId;
      if (sectionId && !trackedSectionsRef.current.has(sectionId)) {
        trackedSectionsRef.current.add(sectionId);
        track("section_read", { paper_id: node.paperId ?? null, section_id: sectionId });
      }
    } catch (error) {
      console.error("Error marking paragraph as read:", error);
    }
  };

  const resetReadingTime = (globalId: string) => {
    const current = readingNodesRef.current;
    if (current[globalId]) {
      delete current[globalId];
      readingNodesRef.current = current;
    }
  };

  const handleParagraphReadInView = (node: UBNode) => {
    if (readNodes.has(node.globalId)) return;
    const current = readingNodesRef.current;
    if (!current[node.globalId]) {
      current[node.globalId] = { startsAt: moment().unix(), node };
      readingNodesRef.current = current;
    }
  };

  const updateLastVisitedNode = async (
    globalId: string,
    pid: string,
    title: string
  ) => {
    localStorage.setItem("lastVisitedNode", JSON.stringify({ globalId, paperId: pid, paperTitle: title }));
    if (status !== "authenticated") return;

    try {
      const response = await fetch("/api/user/nodes/last-visited", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalId, paperId: pid, paperTitle: title }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const lastVisitedNode = await response.json();
      localStorage.setItem("lastVisitedNode", JSON.stringify(lastVisitedNode));
    } catch (error) {
      console.error("Error updating last visited node:", error);
    }
  };

  const throttledUpdate = throttle(updateLastVisitedNode, 2000);

  // Fetch read nodes on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchReadNodes = async () => {
      try {
        const response = await fetch(`/api/user/nodes/read?paperId=${paperId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data) return;
        const globalIds = data.map((node: ReadNode) => node.globalId);
        setReadNodes(new Set(globalIds));
      } catch (error) {
        console.error("Error fetching read nodes:", error);
      }
    };

    fetchReadNodes();
  }, [status, paperId]);

  // Reading timer checks
  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(() => {
      const current = readingNodesRef.current;
      Object.entries(current).forEach(([globalId, reading]) => {
        const now = moment().unix();
        const timeElapsed = now - reading.startsAt;

        if (timeElapsed > estimatedReadTime(reading.node)) {
          markParagraphAsRead(reading.node);
          delete current[globalId];
          readingNodesRef.current = current;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Observe paragraphs for reading progress
  useEffect(() => {
    if (status !== "authenticated") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const globalId = entry.target.getAttribute("id");
          if (!globalId) return;

          const node = nodes.find((n) => n.globalId === globalId);
          if (!node) return;

          if (entry.isIntersecting) {
            handleParagraphReadInView(node);
          } else {
            resetReadingTime(globalId);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".paragraph").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [nodes, status]);

  // Observe paragraphs for last visited tracking
  useEffect(() => {
    let visibleNodes = new Map();
    let currentTopNode: string | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const gid = entry.target.getAttribute("id");
          if (entry.isIntersecting) {
            visibleNodes.set(gid, entry.target);
          } else {
            visibleNodes.delete(gid);
          }

          if (visibleNodes.size > 0) {
            const topNode = Array.from(visibleNodes.values()).reduce(
              (top: Element, current: Element) =>
                top.getBoundingClientRect().top < current.getBoundingClientRect().top ? top : current
            );

            if (topNode && topNode.getAttribute("id") !== currentTopNode && window.location.href.includes("/papers/")) {
              currentTopNode = topNode.getAttribute("id");
              if (currentTopNode) throttledUpdate(currentTopNode, paperId, paperTitle);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".paragraph").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [nodes]);

  return { readNodes, markParagraphAsRead };
}
