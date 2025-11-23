import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Row = {
  date: string;
  description: string;
  category: string;
  type: string;
  amount: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: "Body inválido. Esperado { rows: [...] }" }, { status: 400 });
    }

    const rows: Row[] = (body.rows as Row[]).map((r) => ({
      date: r.date,
      description: r.description ?? "",
      category: r.category ?? "",
      type: r.type ?? "",
      amount: Number(r.amount ?? 0),
    }));

    rows.sort((a, b) => a.date.localeCompare(b.date));

    // Cálculo de resumo simples
    const incomeTotal = rows
      .filter((r) => r.type.toLowerCase().includes("renda"))
      .reduce((sum, r) => sum + r.amount, 0);
    const expenseTotal = rows
      .filter((r) => r.type.toLowerCase().includes("despesa"))
      .reduce((sum, r) => sum + r.amount, 0);
    const balance = incomeTotal - expenseTotal;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    let y = height - margin;

    // Faixa de cabeçalho colorida
    const headerHeight = 70;
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.04, 0.24, 0.45),
    });

    page.drawText("Relatório financeiro - xô planilhas", {
      x: margin,
      y: height - headerHeight + 40,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    const generatedAt = new Date().toLocaleString("pt-BR");
    page.drawText(`Gerado em ${generatedAt}`, {
      x: margin,
      y: height - headerHeight + 20,
      size: 10,
      font,
      color: rgb(0.9, 0.9, 0.9),
    });

    y = height - headerHeight - 20;

    // Bloco de resumo (3 colunas)
    const formatterCurrency = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const cardWidth = (width - margin * 2 - 20) / 3;
    const cardHeight = 50;
    const cardY = y - cardHeight;

    const summaryCards = [
      {
        label: "Renda total",
        value: formatterCurrency.format(incomeTotal),
        color: rgb(0.0, 0.5, 0.27),
      },
      {
        label: "Despesas totais",
        value: formatterCurrency.format(expenseTotal),
        color: rgb(0.7, 0.16, 0.16),
      },
      {
        label: "Saldo",
        value: formatterCurrency.format(balance),
        color: balance >= 0 ? rgb(0.0, 0.5, 0.27) : rgb(0.7, 0.16, 0.16),
      },
    ];

    summaryCards.forEach((card, index) => {
      const x = margin + index * (cardWidth + 10);
      page.drawRectangle({
        x,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        color: rgb(0.97, 0.98, 1),
      });

      page.drawText(card.label, {
        x: x + 8,
        y: cardY + cardHeight - 16,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.35),
      });

      page.drawText(card.value, {
        x: x + 8,
        y: cardY + 12,
        size: 12,
        font: fontBold,
        color: card.color,
      });
    });

    y = cardY - 24;

    // Resumo narrativo
    const totalCount = rows.length;
    const totalAbs = rows.reduce((sum, r) => sum + Math.abs(r.amount), 0);
    const avgTicket = totalCount ? totalAbs / totalCount : 0;
    const avgTicketLabel = formatterCurrency.format(avgTicket);

    const resumoBase =
      balance >= 0
        ? `Neste período, você teve um saldo POSITIVO de ${formatterCurrency.format(balance)}. `
        : `Neste período, você teve um saldo NEGATIVO de ${formatterCurrency.format(balance)}. `;

    const resumoDetalhes =
      `Foram ${totalCount} lançamentos, com ticket médio de ${avgTicketLabel}. ` +
      `Sua renda total foi de ${formatterCurrency.format(incomeTotal)} e as despesas somaram ${formatterCurrency.format(expenseTotal)}.`;

    page.drawText(resumoBase + resumoDetalhes, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.25, 0.25, 0.3),
      maxWidth: width - margin * 2,
      lineHeight: 12,
    });

    y -= 40;

    // Destaques de categorias com barras simples
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};
    for (const r of rows) {
      if (r.type.toLowerCase().includes("renda")) {
        incomeByCategory[r.category] = (incomeByCategory[r.category] || 0) + r.amount;
      } else if (r.type.toLowerCase().includes("despesa")) {
        expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount;
      }
    }

    const incomeTop = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const expenseTop = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

    if (incomeTop.length || expenseTop.length) {
      page.drawText("Destaques de categorias", {
        x: margin,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.3),
      });
      y -= 16;

      const colMiddle = margin + (width - margin * 2) / 2;
      const barMaxWidth = (width - margin * 2) / 2 - 40;

      const yStart = y;

      // Rendas
      page.drawText("Top rendas", {
        x: margin,
        y,
        size: 9,
        font: fontBold,
        color: rgb(0.0, 0.5, 0.27),
      });
      // Despesas
      page.drawText("Top despesas", {
        x: colMiddle,
        y,
        size: 9,
        font: fontBold,
        color: rgb(0.7, 0.16, 0.16),
      });

      y -= 12;
      let yIncome = y;
      let yExpense = yStart - 12;

      if (incomeTop.length) {
        const maxIncome = incomeTop[0][1] || 1;
        for (const [cat, val] of incomeTop) {
          const label = `${cat} - ${formatterCurrency.format(val)}`;
          const pct = Math.max(0, Math.min(1, val / maxIncome));

          page.drawText(label.slice(0, 28), {
            x: margin,
            y: yIncome,
            size: 8,
            font,
            color: rgb(0.2, 0.2, 0.3),
          });
          page.drawRectangle({
            x: margin,
            y: yIncome - 4,
            width: barMaxWidth * pct,
            height: 3,
            color: rgb(0.0, 0.5, 0.27),
          });
          yIncome -= 12;
        }
      }

      if (expenseTop.length) {
        const maxExpense = expenseTop[0][1] || 1;
        for (const [cat, val] of expenseTop) {
          const label = `${cat} - ${formatterCurrency.format(-Math.abs(val))}`;
          const pct = Math.max(0, Math.min(1, val / maxExpense));

          page.drawText(label.slice(0, 28), {
            x: colMiddle,
            y: yExpense,
            size: 8,
            font,
            color: rgb(0.2, 0.2, 0.3),
          });
          page.drawRectangle({
            x: colMiddle,
            y: yExpense - 4,
            width: barMaxWidth * pct,
            height: 3,
            color: rgb(0.7, 0.16, 0.16),
          });
          yExpense -= 12;
        }
      }

      y = Math.min(yIncome, yExpense) - 16;
    }

    // Linha divisória antes da tabela
    page.drawRectangle({
      x: margin,
      y: y + 8,
      width: width - margin * 2,
      height: 1,
      color: rgb(0.85, 0.85, 0.9),
    });

    y -= 12;

    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor"]; 
    const colX = [margin, margin + 90, margin + 260, margin + 380, margin + 450];

    headers.forEach((h, i) => {
      page.drawText(h, {
        x: colX[i],
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.3),
      });
    });

    y -= 18;

    const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
    const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    const lineHeight = 16;

    for (const row of rows) {
      if (y < margin + 40) {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        y = height - margin;

        page.drawText("Relatório financeiro - xô planilhas", {
          x: margin,
          y,
          size: 14,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.3),
        });
        y -= 22;
        headers.forEach((h, i) => {
          page.drawText(h, {
            x: colX[i],
            y,
            size: 10,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        y -= 16;
      }

      const dateLabel = formatter.format(new Date(row.date));
      const isExpense = row.type.toLowerCase().includes("despesa");
      const signedAmount = isExpense ? -Math.abs(row.amount ?? 0) : Math.abs(row.amount ?? 0);
      const amountLabel = currency.format(signedAmount);
      const amountColor = isExpense ? rgb(0.7, 0.16, 0.16) : rgb(0.0, 0.5, 0.27);

      page.drawText(dateLabel, { x: colX[0], y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(String(row.description).slice(0, 28), { x: colX[1], y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(String(row.category).slice(0, 16), { x: colX[2], y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(String(row.type).slice(0, 12), { x: colX[3], y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(amountLabel, { x: colX[4], y, size: 9, font, color: amountColor });

      y -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="relatorio-nexusfinances.pdf"',
      },
    });
  } catch (err) {
    console.error("Erro ao gerar PDF", err);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
