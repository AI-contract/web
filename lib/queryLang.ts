// lib/queryLang.ts
//
// Nhận biết ngôn ngữ của câu hỏi tra cứu: "en" nếu người dùng gõ tiếng Anh, còn lại là "vi".
// Dùng để (1) gửi `lang` cho backend, để phần do AI viết (phân tích, tổng quan, gợi ý) trả về bằng
// tiếng Anh, và (2) hiển thị nhãn của khu vực kết quả bằng tiếng Anh. Trích dẫn nguyên văn từ trang
// nguồn luôn giữ tiếng Việt.
//
// Cách nhận biết (không cần thư viện, chạy tại trình duyệt):
//   - có chữ tiếng Việt có dấu, hoặc chữ không thuộc bảng chữ Latin (Trung/Hàn/Nhật...) → "vi";
//   - chỉ gồm chữ ASCII: đếm từ tiếng Anh đặc trưng so với từ tiếng Việt viết không dấu ("hop dong",
//     "luat lao dong"...). Chỉ khi từ tiếng Anh NHIỀU HƠN thì mới là "en".
// Không chắc thì chọn "vi" (hành vi cũ).

import type { Lang } from "@/lib/lang";

export type QueryLang = "vi" | "en";

// Ngôn ngữ nhãn hiển thị của khu vực kết quả: câu hỏi tiếng Anh → tiếng Anh (kết quả do AI viết
// cũng bằng tiếng Anh); còn lại theo ngôn ngữ giao diện đang chọn ở cột menu bên trái.
export function resultLabelLang(query: string, ui: Lang): Lang {
  return detectQueryLang(query) === "en" ? "en" : ui;
}

const VI_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;

// Từ tiếng Anh đặc trưng (đã loại những từ trùng với tiếng Việt không dấu như "to", "do", "can", "be").
const EN_WORDS = new Set(
  (
    "the of and or in for with from under between what which who whom how when where why should must " +
    "does did is are was were my our your their his her its it this that these those if not any all about " +
    "after before during i we you they there have has had will would could a " +
    "law laws legal labor labour employment employee employees employer contract contracts agreement " +
    "agreements company companies business registration register license licence tax taxes termination " +
    "dismissal liability damages lease rent tenant landlord property land intellectual trademark patent " +
    "copyright foreign investment investor enterprise procedure procedures requirement requirements penalty " +
    "penalties fine fines court judgment judgement dispute disputes article decree circular regulation " +
    "regulations vietnam vietnamese sale purchase buy sell share shares shareholder director capital " +
    "bankruptcy insurance social permit marriage divorce inheritance clause clauses confidentiality " +
    "non-compete noncompete severance probation overtime wage wages salary leave maternity compensation"
  ).split(/\s+/)
);

// Từ tiếng Việt viết không dấu thường gặp trong câu hỏi pháp lý.
const VI_ASCII_WORDS = new Set(
  (
    "hop dong luat lao cong ty nguoi dieu khoan thu tuc quy dinh cua va cho khi khong duoc nhu co la mot " +
    "cac nhung thanh lap doanh nghiep kinh dang ky nha dat mua thue thuong mai tranh chap boi tai san von " +
    "dau tu nuoc ngoai giay phep thoi han xu phat vi pham huong dan nghi dinh thong tu ban an le toa " +
    "hoc viec sa thai bao hiem xa hoi ly hon thua ke cuoi chuyen nhuong"
  ).split(/\s+/)
);

export function detectQueryLang(text: string): QueryLang {
  const t = (text || "").normalize("NFC").toLowerCase();
  if (VI_DIACRITICS.test(t)) return "vi";
  if (/[^\u0000-\u007f]/.test(t)) return "vi"; // chữ không phải Latin (Trung/Hàn/Nhật...) → giữ mặc định
  const words = t.match(/[a-z]+(?:-[a-z]+)?/g) ?? [];
  let en = 0;
  let vi = 0;
  for (const w of words) {
    if (EN_WORDS.has(w)) en += 1;
    else if (VI_ASCII_WORDS.has(w)) vi += 1;
  }
  return en > vi ? "en" : "vi";
}
