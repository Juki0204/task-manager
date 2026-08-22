import { Rule } from "@/utils/types/rule";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { BookOpenText, BookText, Tag } from "lucide-react";

interface AllGroupRuleListProps {
  rules: Rule[];
  onDetailOpen: (r: Rule) => void;
  onAccordionChange: (c: string) => void;
  onFilterReset: () => void;
  activeRule: Rule | null;
}

export default function AllGroupRuleList({ rules, onDetailOpen, onAccordionChange, onFilterReset, activeRule }: AllGroupRuleListProps) {
  const [clients, setClients] = useState<string[] | null>(null);
  const [openItem, setOpenItem] = useState<string>("all");
  
  const getClient = async () => {
    const { data: clients } = await supabase
      .from("clients")
      .select("*");

    if (clients) {
      const clientList = clients?.map(c => c.name).sort();
      setClients(clientList);
    }
  }

  useEffect(() => {
    getClient();
  }, []);

  useEffect(() => {
    if(!activeRule) return;

    setOpenItem(activeRule.target)
  }, [activeRule]);

  console.log(rules);

  return (
    <div className="text-neutral-700 dark:text-neutral-100">
      <Accordion type="single" collapsible defaultValue="all">

        <AccordionItem value="all" className="border-none">
          <AccordionTrigger onClick={() => onFilterReset()} className="flex gap-1 items-center data-[state=open]:text-red-700 data-[state=open]:dark:text-yellow-300 py-1.5 border-none [&_.lucide-chevron-down]:invisible [&_.lucide-chevron-up]:invisible focus:border-none data-[state=open]:pointer-events-none"><BookText className="w-5" />すべてのルール</AccordionTrigger>
        </AccordionItem>

        {clients && clients.map((c) => {
          const filteredRules = rules.filter(r => r.target === c);
          console.log(filteredRules.length);
          if (filteredRules.length > 0) {
            return (
              <AccordionItem key={c} value={c} className="border-none">
                <AccordionTrigger onClick={() => onAccordionChange(c)} className="flex gap-1 items-center data-[state=open]:text-red-700 data-[state=open]:dark:text-yellow-300 py-1.5 border-none focus:border-none data-[state=open]:pointer-events-none"><Tag className="w-5" />{c}</AccordionTrigger>
                <AccordionContent className="h-fit pl-4 pr-2">
                  {filteredRules.map((fr, index) => (
                    <div key={fr.id} className={`flex gap-1 items-center ${activeRule?.id === fr.id ? "text-red-700 dark:text-yellow-300 font-bold" : ""}`}>
                      {index + 1 === filteredRules.length ? <>&#9492;</> : <>&#9500;</>}
                      <BookOpenText className="w-4" />
                      <span onClick={() => onDetailOpen(fr)} className="flex-1 truncate cursor-pointer hover:underline">{fr.title}</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          } else {
            return (
              <div key={c} className="flex gap-1 items-center text-sm py-1.5 opacity-50"><Tag className="w-5" />{c}</div>
            )
          }
        })}
        {/* <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="flex gap-1 items-center text-neutral-100 py-1.5 border-none"><FaTag />難波秘密倶楽部</AccordionTrigger>
            <AccordionContent className="text-neutral-100 h-fit pl-4">
              <div className="flex gap-1 items-center truncate">
                &#9500;<RiArticleFill />イベントページ更新作業
              </div>
              <div className="flex gap-1 items-center truncate">
                &#9500;<RiArticleFill />イベントページ更新作業
              </div>
              <div className="flex gap-1 items-center truncate">
                &#9492;<RiArticleFill />イベントページ更新作業
              </div>
            </AccordionContent>
          </AccordionItem>

          <div className="flex gap-1 items-center text-sm text-neutral-100 py-1.5"><FaTag />中洲秘密倶楽部</div> */}
      </Accordion>
    </div>
  )
}
