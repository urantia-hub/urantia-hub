import { useState, useEffect } from "react";
import { Bookmark } from "@prisma/client";
import { toast } from "sonner";

export function useBookmarks(paperId: string, status: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [savingGlobalIds, setSavingGlobalIds] = useState<string[]>([]);
  const [savingErrorGlobalIds, setSavingErrorGlobalIds] = useState<string[]>([]);
  const [showBookmarkCategoryModal, setShowBookmarkCategoryModal] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [selectedNode, setSelectedNode] = useState<UBNode | null>(null);

  // Fetch bookmarks on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`/api/user/nodes/bookmarks?paperId=${paperId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setBookmarks(data);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, [paperId, status]);

  const bookmarkGlobalId = async (
    globalId: string,
    nodePaperId: string,
    paperSectionId?: string,
    paperSectionParagraphId?: string
  ): Promise<Bookmark | undefined> => {
    if (savingGlobalIds.includes(globalId)) return;
    if (status !== "authenticated") {
      console.warn("User is not logged in, cannot bookmark global ID.");
      return;
    }

    setSavingGlobalIds((prev) => [...prev, globalId]);
    setSavingErrorGlobalIds((prev) => prev.filter((id) => id !== globalId));

    try {
      const response = await fetch(`/api/user/nodes/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalId, paperId: nodePaperId, paperSectionId, paperSectionParagraphId }),
      });
      if (response.status !== 201) {
        throw new Error(`Unexpected response status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error bookmarking:", error);
      setSavingErrorGlobalIds((prev) => [...prev, globalId]);
      return;
    } finally {
      setSavingGlobalIds((prev) => prev.filter((id) => id !== globalId));
    }
  };

  const deleteBookmarkGlobalId = async (globalId: string) => {
    if (savingGlobalIds.includes(globalId)) return;
    if (status !== "authenticated") return;

    setSavingGlobalIds((prev) => [...prev, globalId]);
    setSavingErrorGlobalIds((prev) => prev.filter((id) => id !== globalId));

    try {
      const response = await fetch(`/api/user/nodes/bookmarks?globalId=${globalId}`, { method: "DELETE" });
      if (response.status !== 204) {
        throw new Error(`Unexpected response status ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      setSavingErrorGlobalIds((prev) => [...prev, globalId]);
    } finally {
      setSavingGlobalIds((prev) => prev.filter((id) => id !== globalId));
    }
  };

  const handleCategorySelect = async (bookmarkId: string, category: string) => {
    if (!bookmarkId) {
      toast.error("No bookmark selected, please try again");
      return;
    }

    try {
      const response = await fetch(`/api/user/nodes/bookmarks/${bookmarkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        toast.error("Failed to update bookmark category, please try again");
        return;
      }

      const updatedBookmark = await response.json();
      setBookmarks((prev) => prev.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b)));
      toast.success("Bookmark added to category");
    } catch (error) {
      console.error("Error updating bookmark category:", error);
      toast.error("Failed to assign bookmark to category, please try again");
    }
  };

  const onBookmarkClick = (node: UBNode) => async () => {
    if (savingGlobalIds.includes(node.globalId)) return;

    // If already bookmarked, delete
    if (bookmarks.some((b) => b.globalId === node.globalId)) {
      await deleteBookmarkGlobalId(node.globalId);
      setBookmarks((prev) => prev.filter((b) => b.globalId !== node.globalId));
      return;
    }

    // Create bookmark
    const bookmark = await bookmarkGlobalId(
      node.globalId,
      node.paperId,
      node.paperSectionId,
      node.paperSectionParagraphId
    );

    if (bookmark) {
      setBookmarks((prev) => [...prev, bookmark]);
      // Set state for category modal prompt — the component renders the toast JSX
      setSelectedBookmark(bookmark);
      setSelectedNode(node);
    }
  };

  return {
    bookmarks,
    savingGlobalIds,
    savingErrorGlobalIds,
    showBookmarkCategoryModal, setShowBookmarkCategoryModal,
    selectedBookmark, setSelectedBookmark,
    selectedNode, setSelectedNode,
    bookmarkGlobalId,
    deleteBookmarkGlobalId,
    handleCategorySelect,
    onBookmarkClick,
  };
}
