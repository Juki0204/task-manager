import { Rule } from "@/utils/types/rule";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FaBook, FaTag } from "react-icons/fa";
import { RiArticleFill } from "react-icons/ri";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/supabase";

interface AllGroupRuleListProps {
  rules: Rule[];
  onDetailOpen: (r: Rule) => void;
  onAccordionChange: (c: string) => void;
  onFilterReset: () => void;
}

export default function AllGroupRuleList({ rules, onDetailOpen, onAccordionChange, onFilterReset }: AllGroupRuleListProps) {
  const [clients, setClients] = useState<string[] | null>(null);

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

  console.log(rules);

  return (
    <div>
      <Accordion type="single" collapsible defaultValue="all">

        <AccordionItem value="all" className="border-none">
          <AccordionTrigger onClick={() => onFilterReset()} className="flex gap-1 items-center text-neutral-100 data-[state=open]:text-yellow-300 py-1.5 border-none [&_.lucide-chevron-down]:invisible [&_.lucide-chevron-up]:invisible focus:border-none data-[state=open]:pointer-events-none"><FaBook />すべてのルール</AccordionTrigger>
        </AccordionItem>

        {clients && clients.map((c, index) => {
          const filteredRules = rules.filter(r => r.target === c);
          console.log(filteredRules.length);
          if (filteredRules.length > 0) {
            return (
              <AccordionItem key={c} value={`item-${index}`} className="border-none">
                <AccordionTrigger onClick={() => onAccordionChange(c)} className="flex gap-1 items-center text-neutral-100 data-[state=open]:text-yellow-300 py-1.5 border-none focus:border-none data-[state=open]:pointer-events-none"><FaTag />{c}</AccordionTrigger>
                <AccordionContent className="text-neutral-100 h-fit pl-4 pr-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  {filteredRules.map((fr, index) => (
                    <div key={fr.id} className="flex gap-1 items-center">
                      {index + 1 === filteredRules.length ? <>&#9492;</> : <>&#9500;</>}
                      <RiArticleFill />
                      <span onClick={() => onDetailOpen(fr)} className="flex-1 truncate cursor-pointer hover:underline">{fr.title}</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          } else {
            return (
              <div key={c} className="flex gap-1 items-center text-sm text-neutral-100 py-1.5 opacity-50"><FaTag />{c}</div>
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
