"use client";

/**
 * app/legal-lookup/documents/[id]/page.tsx — toàn văn một tài liệu (mở từ thẻ
 * kết quả cấp 3). `?locator=Điều 418` cuộn tới và đánh dấu đúng Điều/mục khớp.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ExternalLink, Info, Loader2 } from "lucide-react";
import { ApiError, LegalDocumentDetail, getLegalDocument } from "@/lib/api";
import {
  BasisAndKeywords,
  CopyCitationButton,
  DISCLAIMER_FALLBACK,
  IssueResolution,
  Meta,
  PageHeader,
  StatusBadge,
  TypeBadge,
  buildCitation,
  errorMessage,
  fmtDateTime,
  safeUrl,
  useAuthGuard,
} from "../../_components/shared";

type Loaded = { id: number; doc: LegalDocumentDetail | null; error: string | null };

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F3]">
      <Loader2 className="animate-spin text-[#9C7A3C]" size={28} />
    </div>
  );
}

export default function DocumentPage() {
  // useSearchParams cần Suspense boundary (Next.js App Router).
  return (
    <Suspense fallback={<Spinner />}>
      <DocumentView />
    </Suspense>
  );
}

function DocumentView() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { ok, onUnauthorized } = useAuthGuard();

  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const focusLocator = searchParams.get("locator");

  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!ok || !validId) return;
    let cancelled = false;
    getLegalDocument(id)
      .then((doc) => {
        if (!cancelled) setLoaded({ id, doc, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) onUnauthorized();
        else setLoaded({ id, doc: null, error: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [ok, validId, id, onUnauthorized]);

  const doc = loaded?.id === id ? loaded.doc : null;
  const error = !validId ? "Đường dẫn tài liệu không hợp lệ." : loaded?.id === id ? loaded.error : null;

  // Cuộn tới Điều/mục khớp khi mở từ kết quả tìm kiếm.
  useEffect(() => {
    if (!doc || !focusLocator) return;
    const target = doc.chunks.find((c) => c.locator === focusLocator);
    if (target) {
      document
        .getElementById(`legal-chunk-${target.id}`)
        ?.scrollIntoView({ block: "start" });
    }
  }, [doc, focusLocator]);

  if (!ok) return <Spinner />;

  const body = doc?.chunks.filter((c) => c.role !== "meta") ?? [];
  const provisions = body.filter((c) => c.role === "provision" && c.locator);
  const joinRole = (role: string) =>
    doc?.chunks
      .filter((c) => c.role === role)
      .map((c) => c.content)
      .join("\n") || null;
  const src = doc ? safeUrl(doc.source_url) : null;
  const firstField = doc?.fields[0];
  const firstFieldLabel = doc?.field_labels[0];

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <PageHeader
        title="Tra cứu pháp lý"
        backHref={firstField ? `/legal-lookup/${firstField}` : "/legal-lookup"}
        backLabel={firstFieldLabel ?? "Tổng quan"}
      />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}{" "}
            <Link href="/legal-lookup" className="underline">
              Về trang tổng quan
            </Link>
          </p>
        )}

        {!doc && !error && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#9C7A3C]" size={26} />
          </div>
        )}

        {doc && (
          <>
            <nav aria-label="Đường dẫn" className="text-sm text-[#5B6472] mb-4">
              <Link href="/legal-lookup" className="hover:text-[#9C7A3C]">
                Tra cứu pháp lý
              </Link>
              {firstField && (
                <>
                  <span className="mx-1.5">›</span>
                  <Link href={`/legal-lookup/${firstField}`} className="hover:text-[#9C7A3C]">
                    {firstFieldLabel}
                  </Link>
                </>
              )}
              <span className="mx-1.5">›</span>
              <span className="text-[#1C2333]">{doc.number ?? doc.title}</span>
            </nav>

            <article className="bg-white border border-[#DCD7C9] rounded-lg p-6 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <TypeBadge docType={doc.doc_type} label={doc.doc_type_label} />
                <StatusBadge status={doc.status} label={doc.status_label} />
                {doc.field_labels.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2 py-0.5 rounded-full bg-[#F3EFE4] text-[#5B6472] border border-[#DCD7C9]"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-[#1C2333]">{doc.title}</h2>
              <Meta item={doc} />
              {doc.topic_labels.length > 0 && (
                <p className="text-xs text-[#5B6472] mt-1">
                  Chuyên đề: {doc.topic_labels.join(", ")}
                </p>
              )}
              {doc.summary && (
                <p className="text-sm text-[#1C2333] leading-relaxed mt-3">{doc.summary}</p>
              )}

              <IssueResolution
                issue={joinRole("issue")}
                resolution={joinRole("resolution")}
                terms={[]}
              />
              <BasisAndKeywords basis={doc.basis} keywords={doc.keywords} />

              <div className="flex flex-wrap items-center gap-4 mt-5 pt-3 border-t border-[#EAE5D8] text-sm">
                <CopyCitationButton text={buildCitation(doc, focusLocator)} />
                {src && (
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5B6472] hover:text-[#9C7A3C]"
                  >
                    <ExternalLink size={13} />
                    {doc.source_name ? `Xem tại ${doc.source_name}` : "Nguồn gốc"}
                  </a>
                )}
              </div>
            </article>

            <h3 className="text-base font-semibold text-[#1C2333] mb-3">Toàn văn</h3>

            {body.length === 0 ? (
              <p className="text-sm text-[#5B6472] bg-white border border-[#DCD7C9] rounded-lg px-4 py-3">
                Tài liệu này chưa có toàn văn trong cơ sở dữ liệu. Vui lòng xem tại nguồn gốc để đối
                chiếu.
              </p>
            ) : (
              <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
                {provisions.length > 5 && (
                  <aside aria-label="Mục lục" className="hidden lg:block">
                    <div className="sticky top-4 max-h-[70vh] overflow-y-auto bg-white border border-[#DCD7C9] rounded-lg p-3 text-sm">
                      <p className="text-xs font-semibold text-[#9C7A3C] mb-2">Mục lục</p>
                      <ul className="space-y-1">
                        {provisions.map((c) => (
                          <li key={c.id}>
                            <button
                              onClick={() =>
                                document
                                  .getElementById(`legal-chunk-${c.id}`)
                                  ?.scrollIntoView({ block: "start" })
                              }
                              className="text-left text-[#5B6472] hover:text-[#9C7A3C]"
                            >
                              {c.locator}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                )}

                <div className="space-y-3">
                  {body.map((c) => (
                    <section
                      key={c.id}
                      id={`legal-chunk-${c.id}`}
                      className={`rounded-lg border px-4 py-3 bg-white ${
                        focusLocator && c.locator === focusLocator
                          ? "border-[#9C7A3C] bg-[#FBF6EA]"
                          : "border-[#EAE5D8]"
                      }`}
                    >
                      {c.locator && (
                        <p className="text-xs font-semibold text-[#9C7A3C] mb-1">{c.locator}</p>
                      )}
                      <p className="whitespace-pre-wrap text-sm text-[#1C2333] leading-relaxed">
                        {c.content}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-[#5B6472] flex gap-1.5">
              <Info size={14} className="shrink-0 mt-0.5" />
              {doc.data_updated_at ? `Dữ liệu cập nhật ${fmtDateTime(doc.data_updated_at)} · ` : ""}
              {doc.disclaimer || DISCLAIMER_FALLBACK}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
