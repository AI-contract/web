"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getBillingStatus, BillingStatus } from "@/lib/api";

// useSearchParams() bắt buộc phải nằm trong <Suspense> ở App Router,
// nếu không `next build` sẽ báo lỗi và dừng build.
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            maxWidth: "720px",
            margin: "80px auto",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <Loader2 className="animate-spin" size={24} />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Webhook Stripe có thể xử lý chậm hơn vài giây so với
    // lúc user quay lại trang này, nên thử poll vài lần.
    let attempts = 0;
    const maxAttempts = 6;

    const poll = async () => {
      try {
        const s = await getBillingStatus();
        setStatus(s);
        attempts += 1;
        if (!s.is_pro && attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };

    poll();
  }, []);

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "80px auto",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1>Thanh toán thành công</h1>

      <p>Cảm ơn bạn. Thanh toán của bạn đã được gửi tới Stripe.</p>

      {sessionId && (
        <p>
          <strong>Stripe Session ID:</strong> {sessionId}
        </p>
      )}

      <div style={{ margin: "24px 0" }}>
        {checking && (
          <p style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Loader2 className="animate-spin" size={18} />
            Đang xác nhận thanh toán với hệ thống...
          </p>
        )}

        {!checking && status?.is_pro && (
          <p
            style={{
              color: "#16a34a",
              display: "flex",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} /> Tài khoản của bạn đã lên PRO.
          </p>
        )}

        {!checking && status && !status.is_pro && (
          <p>
            Hệ thống chưa xác nhận thanh toán. Nếu bạn đã thanh toán
            thành công, vui lòng đợi thêm ít phút rồi tải lại trang
            chủ — webhook có thể cần thêm thời gian xử lý.
          </p>
        )}
      </div>

      <Link href="/" style={{ display: "inline-block", marginTop: "24px" }}>
        Về trang chủ
      </Link>
    </main>
  );
}
