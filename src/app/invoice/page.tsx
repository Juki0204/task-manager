"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";

import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Invoice } from "@/utils/types/invoice";
import InvoiceList from "@/components/invoice/InvoiceList";
import { Input, Select } from "@headlessui/react";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import { idText } from "typescript";
import { FaSearch } from "react-icons/fa";

type Filters = {
  clients: string[]; //クライアント
  assignees: string[]; //担当者
  searchKeywords: string | null; //検索
}

type SortStates = "byDate"
  | "byClient"
  | "byClientRev";

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const { user } = useAuth();

  const [currentYear, setCurrentYear] = useState<string>(String(new Date().getFullYear()));
  const [currentMonth, setCurrentMonth] = useState<string>(String(new Date().getMonth()));

  const [sortState, setSortState] = useState<SortStates>("byDate");
  const [filteredInvoices, setFiteredInvoices] = useState<Invoice[] | null>(null);

  //フィルタリング
  const [filters, setFilters] = useState<Filters>({
    clients: [],
    assignees: [],
    searchKeywords: null,
  });

  const filteringInvoices = (invoices: Invoice[] | null) => {
    if (!invoices) return null;

    const sorted = sortState === "byDate" ? invoices.sort((a, b) => new Date(a.finish_date).getTime() - new Date(b.finish_date).getTime())
      : sortState === "byClient" ? invoices.sort((a, b) => a.client.localeCompare(b.client, "ja"))
        : sortState === "byClientRev" ? invoices.sort((a, b) => b.client.localeCompare(a.client, "ja"))
          : invoices;

    const filtered = sorted.filter((invoice) => {
      const clientMatch = filters.clients.length === 0 || filters.clients.includes(invoice.client);
      const assigneeMatch = filters.assignees.length === 0 || filters.assignees.includes(invoice.manager);

      const searchMatch =
        !filters.searchKeywords ||
        invoice.serial?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
        invoice.title?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(filters.searchKeywords.toLowerCase()) ||
        invoice.requester?.toLowerCase().includes(filters.searchKeywords.toLowerCase());

      return clientMatch && assigneeMatch && searchMatch;
    });

    return filtered;
  };

  //invoice一覧取得
  const getInvoice = async (year: string, month: string) => {
    const fromDate = `${year}-${month}-01`;
    const toDate = `${year}-${month}-31`;

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoice')
      .select('*')
      .gte("finish_date", fromDate)
      .lte("finish_date", toDate);

    if (invoiceError) {
      console.error('Failed to select invoice:', invoiceError);
    } else {
      const sortInvoiceData = invoiceData.sort((a, b) => {
        return new Date(a.finish_date).getTime() - new Date(b.finish_date).getTime();
      })
      setInvoices(sortInvoiceData);
      setFiteredInvoices(sortInvoiceData);
      console.log(invoiceData);
    }
  }

  useEffect(() => {
    getInvoice(currentYear, currentMonth);

    // Realtime購読（行追加・更新）
    const channel = supabase
      .channel("invoice")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoice" },
        (payload) => {
          setInvoices((prev): Invoice[] | null => {
            if (!prev) return null;

            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Invoice];
            }

            if (payload.eventType === "UPDATE") {
              return prev.map((inv) => inv.id === payload.new.id ? (payload.new as Invoice) : inv);
            }

            if (payload.eventType === "DELETE") {
              return prev.filter((inv) => inv.id !== payload.old.id);
            }

            return prev;
          })
          // getInvoice();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  useEffect(() => {
    getInvoice(currentYear, currentMonth);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    setFiteredInvoices(filteringInvoices(invoices));
    console.log(filteringInvoices(invoices));
  }, [sortState, filters]);

  return (
    <div className="p-1 py-4 sm:p-4 sm:pb-20 !pt-30 relative overflow-x-hidden min-h-[80svh]">
      <div className="flex justify-start items-end gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700">
        <h2 className="flex justify-center items-end gap-1 text-white text-xl font-bold text-center">
          <Select value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </Select>
          年
          <Select value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)} className="bg-neutral-700 rounded-md px-2 pt-0.5 pb-0.75">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </Select>
          月度 請求一覧
        </h2>

        <div className="flex justify-right gap-2 h-fit">
          <Select value={sortState} onChange={(e) => setSortState(e.target.value as SortStates)} className="bg-white rounded-md px-2 pb-0.5 text-sm font-bold">
            <option value="byDate">完了日順</option>
            <option value="byClient">クライアント順(昇順)</option>
            <option value="byClientRev">クライアント順(降順)</option>
          </Select>
          <MultiSelectPopover
            options={[
              { id: 1, label: "難波秘密倶楽部" },
              { id: 2, label: "新大阪秘密倶楽部" },
              { id: 3, label: "谷町秘密倶楽部" },
              { id: 4, label: "谷町人妻ゴールデン" },
              { id: 5, label: "梅田人妻秘密倶楽部" },
              { id: 6, label: "梅田ゴールデン" },
              { id: 7, label: "中州秘密倶楽部" },
              { id: 8, label: "奥様クラブ" },
              { id: 9, label: "快楽玉乱堂" },
            ]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
              setFilters({
                ...filters,
                clients: e.target.checked
                  ? [...filters.clients, label]
                  : filters.clients.filter((c) => c !== label)
              })
            }
            defaultText="作業担当者"
          />

          <MultiSelectPopover
            options={[
              { id: 1, label: "浜口" },
              { id: 2, label: "飯塚" },
              { id: 3, label: "谷" },
              { id: 4, label: "田口" },
              { id: 6, label: "西谷" },
            ]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
              setFilters({
                ...filters,
                assignees: e.target.checked
                  ? [...filters.assignees, label]
                  : filters.assignees.filter((a) => a !== label)
              })
            }
            defaultText="作業担当者"
          />

          <div className="relative">
            <FaSearch className="absolute top-1/2 left-2 -translate-y-1/2" />
            <Input
              type="text"
              className="flex w-65 items-center justify-between rounded-md border border-gray-300 bg-white px-4 pl-8 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none placeholder:text-neutral-400 placeholder:font-normal"
              placeholder="No./タイトル/内容/依頼者"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;

                setFilters({
                  ...filters,
                  searchKeywords: value.trim() === "" ? null : value,
                });
              }}
            />
          </div>
        </div>

      </div>
      <div className="scroll-container p-1 pb-2 overflow-x-scroll [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
        {user &&
          (filteredInvoices && filteredInvoices.length > 0 ? (
            <InvoiceList setInvoices={setInvoices} invoices={filteredInvoices} sortState={sortState} user={user} />
          ) : (
            <>
              <InvoiceList setInvoices={setInvoices} invoices={filteredInvoices} sortState={sortState} user={user} />
              <p className="text-white text-center my-5">請求するタスクがありません</p>
            </>
          ))}
      </div>
    </div >
  );
}
