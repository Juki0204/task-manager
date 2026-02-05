import { NextResponse } from "next/server";
// @ts-expect-error no types for xlsx-populate
import XlsxPopulate from "xlsx-populate";
import fs from "fs";
import path from "path";

interface Invoice {
  id: string;
  client: string;
  requester: string;
  title: string;
  description: string;
  finish_date: string;
  manager: string;
  serial: string;

  remarks?: string;
  work_name?: string;
  amount?: number;
  category?: string;
  media?: string;
  pieces?: number;
  degree?: number;
  work_time?: string;
  adjustment?: number;
  total_amount?: number;
  embedding?: number[];
}

export async function POST(req: Request) {
  const { invoices, mode } = await req.json();

  const now = new Date();
  const invoiceDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const invoiceYear = invoiceDate.getFullYear();
  const invoiceMonth = invoiceDate.getMonth() + 1;

  const templateFile =
    mode === "processing"
      ? "processing_template.xlsx"
      : "invoice_template.xlsx";

  //テンプレート読み込み
  const templatePath = path.join(
    process.cwd(),
    "public",
    "template",
    templateFile
  );

  const buffer = fs.readFileSync(templatePath);
  const workbook = await XlsxPopulate.fromDataAsync(buffer);
  const sheet = workbook.sheet(0);

  //請求一覧
  if (mode === "invoice") {
    sheet.cell("A1").value(`${invoiceYear}年${invoiceMonth}月度日報【デザイン班】`);

    invoices.filter((i: Invoice) => i.total_amount).forEach((invoice: Invoice, index: number) => { //請求なしは除外

      const row = 3 + index;

      sheet.cell(`A${row}`).value(invoice.client);
      sheet.cell(`B${row}`).value(invoice.requester);
      sheet.cell(`C${row}`).value(`【${invoice.title}】`);
      sheet.cell(`D${row}`).value(invoice.description);
      sheet
        .cell(`E${row}`)
        .value(invoice.finish_date ? new Date(invoice.finish_date) : "");
      sheet.cell(`F${row}`).value(invoice.manager);
      sheet.cell(`G${row}`).value(invoice.category);
      sheet.cell(`H${row}`).value(invoice.media);
      sheet.cell(`I${row}`).value(invoice.work_name);
      sheet.cell(`J${row}`).value(invoice.pieces);
      sheet.cell(`K${row}`).value(invoice.degree ? `${invoice.degree}%` : "");
      sheet.cell(`L${row}`).value(invoice.amount);
      sheet.cell(`M${row}`).value(invoice.adjustment);
      sheet.cell(`N${row}`).value(invoice.total_amount);
      sheet.cell(`P${row}`).value(invoice.remarks);
    });

    sheet.range("E3:E1000").style({ numberFormat: 'mm"月"dd"日"' });
  }

  //加工用
  if (mode === "processing") {
    invoices.forEach((invoice: Invoice, index: number) => {
      const row = 8 + index;

      sheet.cell(`A${row}`).value(invoice.client);
      sheet.cell(`B${row}`).value(invoice.category);
      sheet.cell(`C${row}`).value(invoice.media);
      sheet.cell(`D${row}`).value(invoice.work_name);
      sheet.cell(`E${row}`).value(`【${invoice.title}】${invoice.description}`);
      sheet.cell(`F${row}`).value(invoice.degree ? `${invoice.degree}%` : "");
      sheet.cell(`G${row}`).value(invoice.total_amount);
    });
  }

  //Excelバッファを出力
  const outBuffer = await workbook.outputAsync();

  const fileSuffix =
    mode === "processing" ? "_請求書加工用.xlsx" : "_design.xlsx";

  const fileName = `${invoiceYear}${String(invoiceMonth).padStart(2, "0")}${fileSuffix}`;

  return new NextResponse(outBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        fileName
      )}`,
    },
  });
}
