"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteBoard } from "@/app/actions/board";

interface DeleteBoardButtonProps {
  boardId: string;
}

export default function DeleteBoardButton({ boardId }: DeleteBoardButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa bảng (board) này không? Hành động này sẽ xóa sạch tất cả danh sách và thẻ bài viết bên trong và không thể hoàn tác.")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteBoard(boardId);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Lỗi khi xóa board:", error);
      alert("Đã xảy ra lỗi khi xóa bảng này. Vui lòng thử lại sau.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger-subtle hover:bg-danger-subtle-hover text-danger border border-danger/20 transition-all disabled:opacity-50 cursor-pointer"
    >
      {deleting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      Xóa Board
    </button>
  );
}
