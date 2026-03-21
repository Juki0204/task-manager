"use client";

import AddRule from "@/components/rule/AddRule";
import EditRule from "@/components/rule/EditRule";
import RuleCard from "@/components/rule/RuleCard";
import RuleDetail from "@/components/rule/RuleDetail";
import MultiSelectPopover from "@/components/ui/MultiSelectPopover";
import { supabase } from "@/utils/supabase/supabase";
import { Rule, RuleAcknowledgement } from "@/utils/types/rule";
import { User } from "@/utils/types/user";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import { FiPlusCircle } from "react-icons/fi";


type Filters = {
  targets: string[]; //対象
  types: string[]; //種別
  importance: string[]; //重要度
  creator: string[]; //投稿者
  searchKeywords: string | null; //検索
}

export default function RulePage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [ruleAcknowledgements, setRuleAcknowledgements] = useState<RuleAcknowledgement[] | null>(null);
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

    const { data: ruleList } = await supabase
      .from("rules")
      .select("*");

    if (!ruleList) return;
    setRules(sortRulesByUpdatedAtDesc(ruleList));

    const { data: ruleAcknowledgements } = await supabase
      .from("rules_acknowledgements")
      .select("*");

    setRuleAcknowledgements(ruleAcknowledgements);
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
      setActiveRuleAcknowledgements(null);
      return;
    }

    const filteredAcknowledgements = ruleAcknowledgements?.filter(r => r.rule_id === activeRule?.id) ?? [];
    setActiveRuleAcknowledgements(filteredAcknowledgements);
  }, [activeRule, ruleAcknowledgements]);

  //ルールのリアルタイム購読
  useEffect(() => {
    const rulesChannel = supabase
      .channel("rules-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rules" },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newRule = payload.new as Rule;
            setRules((prev) => {
              if (!prev) return [newRule];
              return sortRulesByUpdatedAtDesc([newRule, ...prev]);
            });
            return;
          }

          if (eventType === "UPDATE") {
            const updatedRule = payload.new as Rule;

            setRules((prev) => {
              if (!prev) return [updatedRule];
              return sortRulesByUpdatedAtDesc(
                prev.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
              );
            });

            setActiveRule((prev) =>
              prev?.id === updatedRule.id ? updatedRule : prev
            );
            return;
          }

          if (eventType === "DELETE") {
            const deletedRule = payload.old as Rule;

            setRules((prev) =>
              prev ? prev.filter((rule) => rule.id !== deletedRule.id) : []
            );

            setActiveRule((prev) =>
              prev?.id === deletedRule.id ? null : prev
            );
          }
        }
      )
      .subscribe();

    //ルールの既読判定フラグのリアルタイム購読
    const acknowledgementsChannel = supabase
      .channel("rules-acknowledgements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rules_acknowledgements" },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newAck = payload.new as RuleAcknowledgement;
            setRuleAcknowledgements((prev) => {
              if (!prev) return [newAck];
              return [...prev, newAck];
            });
            return;
          }

          if (eventType === "UPDATE") {
            const updatedAck = payload.new as RuleAcknowledgement;
            setRuleAcknowledgements((prev) => {
              if (!prev) return [updatedAck];
              return prev.map((ack) =>
                ack.id === updatedAck.id ? updatedAck : ack
              );
            });
            return;
          }

          if (eventType === "DELETE") {
            const deletedAck = payload.old as RuleAcknowledgement;
            setRuleAcknowledgements((prev) =>
              prev ? prev.filter((ack) => ack.id !== deletedAck.id) : []
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(acknowledgementsChannel);
    };
  }, []);

  return (
    <div className="p-1 py-4 sm:p-4 sm:pb-2 !pt-26 m-auto max-w-[1920px] relative overflow-x-hidden">
      <div className="flex justify-between gap-4 mb-2 border-b-2 p-1 pb-2 border-neutral-700 min-w-375">
        <div className="flex justify-start items-end gap-4">
          <h2 className="flex justify-center items-center gap-1 py-1 text-white text-xl font-bold text-center">
            情報共有掲示板
          </h2>
        </div>
      </div>

      <div className="pb-4 flex gap-4 w-full max-w-[1876px]">

        <div className="w-90 bg-zinc-700 p-4 rounded-xl flex flex-col gap-2 min-h-[calc(100vh-12rem)]">
          <div
            onClick={() => {
              setIsOpen(true);
              setModalMode("add");
            }}
            className="px-3 py-2 mb-2 flex items-center justify-center gap-1 rounded-md bg-sky-600 text-white font-bold hover:cursor-pointer hover:opacity-80"
          >
            <FiPlusCircle />新規ルール追加
          </div>

          <h2 className="font-bold text-white pl-1 border-b pb-1">フィルタリング</h2>
          <ul className="flex flex-col gap-1 mb-4">
            <li className="flex flex-wrap gap-2 p-2 rounded-md font-bold bg-neutral-400">
              <div className="w-fit rounded-md font-bold bg-neutral-400 z-4">
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

              <div className="w-fit rounded-md font-bold bg-neutral-400 z-2">
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

              <div className="rounded-md font-bold bg-neutral-400 z-3">
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

              <div className="rounded-md font-bold bg-neutral-400 z-1">
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

          <h2 className="font-bold text-white pl-1 border-b pb-1">使い方</h2>
          <ul className="flex flex-col gap-1 mb-4 pl-0.5 pr-1 text-justify">
            <li className="text-sm text-white tracking-wider">■ 新規追加は左上「新規追加」ボタンより入力フォームに内容を入力して下さい。</li>
            <li className="text-sm text-white tracking-wider">■ タスク一覧同様、カードクリックで詳細表示、編集ボタンより編集が可能です。</li>
            <li className="text-sm text-white tracking-wider"><span className="text-red-400">■ 現時点で削除機能は実装していないので、やむを得ず削除したい場合は管理者までご連絡ください。</span></li>
            <li className="text-sm text-white tracking-wider">■ 新規投稿された情報には投稿者を含め、全員の未読 / 既読フラグが設定されます。</li>
            <li className="text-sm text-white tracking-wider">■ 内容を確認したら「確認しました」ボタン押下で既読済になります。</li>
            <li className="text-sm text-white tracking-wider mb-1">■ カード下部のバーの色で未読状態のステータスが確認できます。
              <div className="flex gap-1 mt-1"><span className="bg-blue-600/80 px-2 rounded-md">未読（新規）</span><span className="bg-red-600/80 px-2 rounded-md">未読（更新分）</span><span className="bg-neutral-500 px-2 rounded-md">既読</span></div>
            </li>
            <li className="text-sm text-white tracking-wider">■ 編集後、全体に通知するかどうかを選択し、全体通知された場合は全員に上記ステータスバーが赤色で表示されます。</li>
          </ul>
        </div>

        <div className="w-[calc(100%-360px)] overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="grid gap-2 mx-auto min-w-200">
            {
              filteredRules && users && filteredRules.map((rule, index) => (
                <RuleCard
                  key={index}
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
      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setModalMode(null);
          setActiveRule(null);
        }}
        // transition
        className="relative z-50 transition duration-300 ease-out data-closed:opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-250 relative space-y-4 rounded-2xl bg-neutral-100 p-6 pt-7">
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
                onClose={() => {
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
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}