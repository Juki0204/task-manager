"use client";

import CancelAlertModal from "@/components/CancelAlertModal";
import AddRule from "@/components/rule/AddRule";
import AllGroupRuleList from "@/components/rule/AllGroupRuleList";
import EditRule from "@/components/rule/EditRule";
import RuleCard from "@/components/rule/RuleCard";
import RuleDetail from "@/components/rule/RuleDetail";
import { useRuleContext } from "@/components/rule/RuleProvider";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import { supabase } from "@/utils/supabase/supabase";
import { Rule, RuleAcknowledgement } from "@/utils/types/rule";
import { User } from "@/utils/types/user";
import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { CirclePlus } from "lucide-react";


type Filters = {
  targets: string[]; //対象
  types: string[]; //種別
  importance: string[]; //重要度
  creator: string[]; //投稿者
  searchKeywords: string | null; //検索
}

export default function RulePage() {
  const { rules, ruleAcknowledgements, isRulesLoading } = useRuleContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);

  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [activeRuleAcknowledgements, setActiveRuleAcknowledgements] = useState<RuleAcknowledgement[] | null>(null);
  const [modalMode, setModalMode] = useState<"detail" | "add" | "edit" | null>(null);

  const [users, setUsers] = useState<User[]>();

  //フィルタリング
  const [filters, setFilters] = useState<Filters>({
    targets: [],
    types: [],
    importance: [],
    creator: [],
    searchKeywords: null,
  });

  //フィルタリセット
  const resetFilters = () => {
    setFilters({
      targets: [],
      types: [],
      importance: [],
      creator: [],
      searchKeywords: null,
    })
  }

  const getData = async () => {
    //作業担当者一覧取得
    const { data: users } = await supabase
      .from('users')
      .select('*');

    if (users) {
      const nameList = users.filter(u => u.name !== "Administrator");
      setUsers(nameList);
    }
  }

  //ルール一覧ソート用ヘルパー
  const sortRulesByUpdatedAtDesc = (list: Rule[]) => {
    return [...list].sort(
      (a, b) =>
        new Date(b.confirmation_required_at).getTime() - new Date(a.confirmation_required_at).getTime()
    );
  };

  //フィルタリング適用
  const filteredRules = useMemo(() => {
    if (!rules) return [];

    const keyword = filters.searchKeywords?.trim().toLowerCase() ?? "";

    const filtered = rules.filter((rule) => {
      const matchTarget =
        filters.targets.length === 0 || filters.targets.includes(rule.target);

      const matchType =
        filters.types.length === 0 || filters.types.includes(rule.type);

      const matchImportance =
        filters.importance.length === 0 ||
        filters.importance.includes(rule.importance);

      const matchCreator =
        filters.creator.length === 0 ||
        filters.creator.includes(rule.created_by);

      const matchKeyword =
        keyword === "" ||
        rule.title.toLowerCase().includes(keyword) ||
        rule.content.toLowerCase().includes(keyword);

      return (
        matchTarget &&
        matchType &&
        matchImportance &&
        matchCreator &&
        matchKeyword
      );
    });

    return sortRulesByUpdatedAtDesc(filtered);
  }, [rules, filters]);

  //初回データGET
  useEffect(() => {
    getData();
  }, []);

  //アクティブルールに対しての既読判定用フラグデータ振り分け
  useEffect(() => {
    if (!activeRule) {
      setActiveRuleAcknowledgements([]);
      return;
    }

    const filteredAcknowledgements = ruleAcknowledgements.filter(r => r.rule_id === activeRule.id);
    setActiveRuleAcknowledgements(filteredAcknowledgements);
  }, [activeRule, ruleAcknowledgements]);

  return (
    <PageLayout title="作業ルール・情報共有板" overflowX="clip">

      <div className="pb-4 flex gap-4 w-full max-w-[1876px]">

        <div className="w-90 bg-neutral-200 p-4 outline -outline-offset-1 dark:outline-none outline-neutral-300 dark:bg-neutral-700 rounded-xl flex flex-col gap-2 min-h-[calc(100vh-12rem)]">
          <div
            onClick={() => {
              setIsOpen(true);
              setModalMode("add");
            }}
            className="px-3 py-2 mb-2 flex items-center justify-center gap-1 rounded-md bg-sky-600 text-white font-bold hover:cursor-pointer hover:opacity-80"
          >
            <CirclePlus />新規ルール追加
          </div>

          <h2 className="font-bold pl-1 border-b pb-1">フィルタリング</h2>
          <ul className="flex flex-col gap-1 mb-4">
            <li className="flex flex-wrap gap-2 p-2 rounded-md font-bold bg-neutral-400">
              <div className="w-fit rounded-md font-bold bg-neutral-400 text-neutral-700 z-4">
                <MultiSelectPopover
                  width={200}
                  options={[
                    { id: 1, label: "難波秘密倶楽部" },
                    { id: 2, label: "新大阪秘密倶楽部" },
                    { id: 3, label: "谷町秘密倶楽部" },
                    { id: 4, label: "谷町人妻ゴールデン" },
                    { id: 5, label: "梅田人妻秘密倶楽部" },
                    { id: 6, label: "梅田ゴールデン" },
                    { id: 7, label: "中洲秘密倶楽部" },
                    { id: 8, label: "奥様クラブ" },
                    { id: 9, label: "快楽玉乱堂" },
                    { id: 10, label: "シードライブ" },
                  ]}
                  selectedLabels={filters.targets}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      targets: e.target.checked
                        ? [...filters.targets, label]
                        : filters.targets.filter((t) => t !== label)
                    })
                  }
                  defaultText="対象"
                />
              </div>

              <div className="w-fit rounded-md font-bold bg-neutral-400 text-neutral-700 z-2">
                <MultiSelectPopover
                  width={100}
                  options={[
                    { id: 1, label: "通常" },
                    { id: 2, label: "重要" },
                  ]}
                  selectedLabels={filters.importance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      importance: e.target.checked
                        ? [...filters.importance, label]
                        : filters.importance.filter((i) => i !== label)
                    })
                  }
                  defaultText="重要度"
                />
              </div>

              <div className="rounded-md font-bold bg-neutral-400 text-neutral-700 z-3">
                <MultiSelectPopover
                  width={150}
                  options={[
                    { id: 1, label: "正式運用" },
                    { id: 2, label: "共有事項" },
                  ]}
                  selectedLabels={filters.types}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      types: e.target.checked
                        ? [...filters.types, label]
                        : filters.types.filter((t) => t !== label)
                    })
                  }
                  defaultText="種別"
                />
              </div>

              <div className="rounded-md font-bold bg-neutral-400 text-neutral-700 z-1">
                <MultiSelectPopover
                  width={150}
                  options={[
                    { id: 1, label: "浜口" },
                    { id: 2, label: "飯塚" },
                    { id: 3, label: "谷" },
                    { id: 4, label: "田口" },
                    { id: 5, label: "西谷" },
                    { id: 6, label: "岡本" },
                  ]}
                  selectedLabels={filters.creator}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>, label: string) =>
                    setFilters({
                      ...filters,
                      creator: e.target.checked
                        ? [...filters.creator, label]
                        : filters.creator.filter((i) => i !== label)
                    })
                  }
                  defaultText="投稿者"
                />
              </div>

              <div className="w-full">
                <button onClick={resetFilters} className="rounded-md w-full p-1 text-center bg-red-600/60 text-white z-1 cursor-pointer hover:opacity-70">リセット</button>
              </div>
            </li>
          </ul>

          <div className="sticky top-16">
            <AllGroupRuleList
              rules={rules}
              onFilterReset={() => setFilters({ ...filters, targets: [] })}
              onAccordionChange={(c: string) => {
                setFilters({
                  ...filters,
                  targets: [c],
                })
                console.log(filters);
              }}
              onDetailOpen={(r: Rule) => {
                setIsOpen(true);
                setModalMode("detail");
                setActiveRule(r);
              }}
              activeRule={activeRule}
            />
          </div>
        </div>

        <div className="w-[calc(100%-376px)] overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="grid mx-auto min-w-200">
            {
              filteredRules && users && filteredRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  acknowledgements={ruleAcknowledgements}
                  users={users}
                  onClick={(r: Rule) => {
                    setIsOpen(true);
                    setModalMode("detail");
                    setActiveRule(r);
                  }}
                />
              ))
            }
          </div>
        </div>

      </div>


      {/* 共通モーダル */}
      <div
        className={`
          fixed right-0 top-0 z-100 w-full max-w-[calc(100%-430px)] h-svh
          bg-neutral-100 dark:bg-[#2b2b2b]
          transition duration-300 ease-out 
          data-closed:opacity-0
          p-4 pt-4.5 shadow-2xl shadow-black/30
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {activeRule && users && modalMode === "detail" && (
          <RuleDetail
            rule={activeRule}
            acknowledgements={activeRuleAcknowledgements}
            users={users}
            onEdit={() => setModalMode("edit")}
            onClose={() => {
              setIsOpen(false);
              setModalMode(null);
              setActiveRule(null);
            }}
          />
        )}
        {users && modalMode === "add" && (
          <AddRule
            users={users}
            onCancel={() => {
              setIsAlertOpen(true);
            }}
            onComplete={() => {
              setIsOpen(false);
              setModalMode(null);
              setActiveRule(null);
            }}
          />
        )}
        {activeRule && users && modalMode === "edit" && (
          <EditRule
            rule={activeRule}
            users={users}
            onCancel={() => setModalMode("detail")}
            onClose={() => {
              setIsOpen(false);
              setModalMode(null);
              setActiveRule(null);
            }}
          />
        )}
      </div>

      <CancelAlertModal
        alertOpen={isAlertOpen}
        onModalClose={() => {
          if (modalMode === "edit") {
            setModalMode("detail");
          } else {
            setIsOpen(false);
            setModalMode(null);
            setActiveRule(null);
          }
        }}
        onCalcel={() => setIsAlertOpen(false)}
      />
    </PageLayout>
  )
}
