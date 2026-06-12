import jsPDF from "jspdf";

export function downloadChecklistPDF(scheme: {
  name_en: string;
  category?: string | null;
  ministry?: string | null;
  eligibility_en?: string | null;
  benefits_en?: string | null;
  documents: string[];
  apply_url?: string | null;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  // Header bar
  doc.setFillColor(255, 140, 0);
  doc.rect(0, 0, W, 8, "F");
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 30);
  const titleLines = doc.splitTextToSize(scheme.name_en, W - M * 2);
  doc.text(titleLines, M, y);
  y += titleLines.length * 22 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 120);
  doc.text(`${scheme.category ?? "Scheme"}${scheme.ministry ? " • " + scheme.ministry : ""}`, M, y);
  y += 22;

  doc.setDrawColor(220);
  doc.line(M, y, W - M, y);
  y += 18;

  const section = (title: string, body?: string | null) => {
    if (!body) return;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30, 30, 40);
    doc.text(title, M, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(70, 70, 80);
    const lines = doc.splitTextToSize(body, W - M * 2);
    doc.text(lines, M, y); y += lines.length * 13 + 12;
    if (y > 760) { doc.addPage(); y = M; }
  };

  section("Eligibility", scheme.eligibility_en);
  section("Benefits", scheme.benefits_en);

  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30, 30, 40);
  doc.text("Required documents checklist", M, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40, 40, 50);
  scheme.documents.forEach((d) => {
    if (y > 780) { doc.addPage(); y = M; }
    doc.rect(M, y - 9, 10, 10);
    const lines = doc.splitTextToSize(d, W - M * 2 - 18);
    doc.text(lines, M + 18, y);
    y += lines.length * 13 + 6;
  });

  if (scheme.apply_url) {
    y += 14;
    if (y > 760) { doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 40);
    doc.text("Apply online:", M, y); y += 14;
    doc.setFont("helvetica", "normal"); doc.setTextColor(20, 80, 200);
    doc.textWithLink(scheme.apply_url, M, y, { url: scheme.apply_url });
    y += 20;
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9); doc.setTextColor(140);
    doc.text(`JanSahayak • Page ${i}/${pages}`, M, doc.internal.pageSize.getHeight() - 20);
  }

  doc.save(`${scheme.name_en.replace(/[^\w]+/g, "_")}_checklist.pdf`);
}
