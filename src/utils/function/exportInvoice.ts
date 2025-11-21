// @ts-expect-error no types for xlsx-populate
import XlsxPopulate from "xlsx-populate";
import { Invoice } from "../types/invoice";

const now = new Date();
const invoiceDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const invoiceYear = invoiceDate.getFullYear();
const invoiceMonth = invoiceDate.getMonth() + 1;

//請求一覧
export async function exportInvoice(invoices: Invoice[]) {
  const response = await fetch("/template/invoice_template.xlsx");
  const arrayBuffer = await response.arrayBuffer();
  const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
  const sheet = workbook.sheet(0);

  sheet.cell("A1").value(`${invoiceYear}年${invoiceMonth}月度日報【デザイン班】`);

  //データ挿入
  invoices.forEach((invoice: Invoice, index: number) => {
    const row = 3 + index;

    sheet.cell(`A${row}`).value(invoice.client);
    sheet.cell(`B${row}`).value(invoice.requester);
    sheet.cell(`C${row}`).value(invoice.title);
    sheet.cell(`D${row}`).value(invoice.description);
    sheet.cell(`E${row}`).value(invoice.finish_date ? new Date(invoice.finish_date) : "");
    sheet.cell(`F${row}`).value(invoice.manager);
    sheet.cell(`G${row}`).value(invoice.category);
    sheet.cell(`H${row}`).value(invoice.device);
    sheet.cell(`I${row}`).value(invoice.work_name);
    sheet.cell(`J${row}`).value(invoice.pieces);
    sheet.cell(`K${row}`).value(invoice.degree);
    sheet.cell(`L${row}`).value(invoice.amount);
    sheet.cell(`M${row}`).value(invoice.adjustment);
    sheet.cell(`N${row}`).value(invoice.total_amount);
    sheet.cell(`P${row}`).value(invoice.remarks);
  });

  //日付フォーマット
  sheet.range("E3:E1000").style({ numberFormat: 'mm"月"dd"日"' });

  //ダウンロード
  const blob = await workbook.outputAsync();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceYear}${invoiceMonth}_design.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}


//請求書加工用
export async function exportProcessingInvoice(invoices: Invoice[]) {
  const response = await fetch("/template/processing_template.xlsx");
  const arrayBuffer = await response.arrayBuffer();
  const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
  const sheet = workbook.sheet(0);

  //データ挿入
  invoices.forEach((invoice: Invoice, index: number) => {
    const row = 8 + index;

    sheet.cell(`A${row}`).value(invoice.client);
    sheet.cell(`B${row}`).value(invoice.category);
    sheet.cell(`C${row}`).value(invoice.device);
    sheet.cell(`D${row}`).value(invoice.work_name);
    sheet.cell(`E${row}`).value(`【${invoice.title}】${invoice.description}`);
    sheet.cell(`F${row}`).value(invoice.degree);
    sheet.cell(`G${row}`).value(invoice.total_amount);
  });

  //ダウンロード
  const blob = await workbook.outputAsync();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceYear}${invoiceMonth}_請求書加工用.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}