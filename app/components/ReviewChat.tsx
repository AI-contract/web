"use client";

/**
 * app/components/ReviewChat.tsx
 *
 * Chat hỏi-đáp trên MỘT hợp đồng vừa review cụ thể. Khác với trợ lý
 * ảo chung ở góc dưới phải (chỉ trả lời về cách dùng nền tảng): ở
 * đây AI được cấp toàn văn hợp đồng + kết quả đánh giá rủi ro làm
 * ngữ cảnh, trả lời được cả về nội dung hợp đồng lẫn quy định pháp
 * luật liên quan — luôn kèm ghi chú nguồn + cảnh báo không thay thế
 * tư vấn pháp lý chính thức (sources_note do backend trả về).
 */

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageCircleQuestion } from "lucide-react";
import {
  ApiError,
  ReviewChatMessageOut,
  askReviewChat,
  getReviewChatHistory,
} from "@/lib/api";

interface ReviewChatProps {
  reviewId: number;
}

export default function ReviewChat({ reviewId }: ReviewChatProps) {
  const [messages, setMessages] = useState<ReviewChatMessageOut[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    getReviewChatHistory(reviewId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        // Không có lịch sử hoặc lỗi tải — coi như chat trống, không
        // chặn người dùng bắt đầu hỏi mới.
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || asking) return;

    setAsking(true);
    setError(null);

    // Hiển thị ngay câu hỏi của người dùng (optimistic) trong lúc
    // chờ AI trả lời.
    const optimisticMessage: ReviewChatMessageOut = {
      id: -Date.now(),
      role: "user",
      content: trimmed,
      sources_note: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setQuestion("");

    try {
      const reply = await askReviewChat(reviewId, trimmed);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Có lỗi xảy ra, vui lòng thử lại."
      );
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="flex flex-col bg-[#FAF8F3] rounded-md border border-[#DCD7C9]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#DCD7C9]">
        <MessageCircleQuestion size={18} className="text-[#9C7A3C]" />
        <span className="text-sm font-medium text-[#1C2333]">
          Hỏi đáp về hợp đồng này
        </span>
      </div>

      <div className="flex-1 max-h-96 overflow-y-auto px-4 py-3 space-y-3">
        {loadingHistory && (
          <p className="text-[#5B6472] text-sm">Đang tải...</p>
        )}

        {!loadingHistory && messages.length === 0 && (
          <p className="text-[#5B6472] text-sm">
            Đặt câu hỏi về nội dung hợp đồng này, vd &quot;điều khoản
            thanh toán quy định thế nào?&quot; hoặc &quot;nếu bên B
            chậm giao hàng thì xử lý ra sao?&quot;.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#16213E] text-white"
                  : "bg-white border border-[#DCD7C9] text-[#1C2333]"
              }`}
            >
              {msg.content}
              {msg.sources_note && (
                <p className="mt-2 pt-2 border-t border-black/10 text-xs opacity-70">
                  {msg.sources_note}
                </p>
              )}
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex items-center gap-2 text-[#5B6472] text-sm">
            <Loader2 size={14} className="animate-spin" />
            Đang trả lời...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 text-red-600 text-xs pb-1">{error}</p>
      )}

      <div className="flex items-center gap-2 p-3 border-t border-[#DCD7C9]">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
          placeholder="Nhập câu hỏi về hợp đồng..."
          className="flex-1 rounded-md border border-[#DCD7C9] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9C7A3C]"
          disabled={asking}
        />
        <button
          onClick={handleAsk}
          disabled={asking || !question.trim()}
          className="flex items-center justify-center rounded-md bg-[#16213E] text-white p-2 disabled:opacity-50 hover:bg-[#1C2333] transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
