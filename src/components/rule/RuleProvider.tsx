"use client";

import { supabase } from "@/utils/supabase/supabase";
import { Rule, RuleAcknowledgement } from "@/utils/types/rule";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type RuleContextType = {
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  ruleAcknowledgements: RuleAcknowledgement[];
  setRuleAcknowledgements: React.Dispatch<React.SetStateAction<RuleAcknowledgement[]>>;
  isRulesLoading: boolean;
  refreshRulesData: () => Promise<void>;
}

const RuleContext = createContext<RuleContextType | null>(null);

//ルール一覧ソート
const sortRulesByUpdatedAtDesc = (list: Rule[]) => {
  return [...list].sort((a, b) => new Date(b.confirmation_required_at).getTime() - new Date(a.confirmation_required_at).getTime());
};

export const RuleProvider = ({ children }: { children: React.ReactNode }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleAcknowledgements, setRuleAcknowledgements] = useState<RuleAcknowledgement[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState<boolean>(true);

  const refreshRulesData = async () => {
    setIsRulesLoading(true);

    const [rulesRes, acknowledgementsRes] = await Promise.all([
      supabase.from("rules").select("*").order("confirmation_required_at", { ascending: false }),
      supabase.from("rules_acknowledgements").select("*"),
    ]);

    if (rulesRes.error) {
      console.error("ルールの取得に失敗しました", rulesRes.error);
    } else {
      setRules(sortRulesByUpdatedAtDesc((rulesRes.data ?? []) as Rule[]));
    }

    if (acknowledgementsRes.error) {
      console.error("ルールの取得に失敗しました", acknowledgementsRes.error);
    } else {
      setRuleAcknowledgements((acknowledgementsRes.data ?? []) as RuleAcknowledgement[]);
    }

    setIsRulesLoading(false);
  };

  useEffect(() => {
    refreshRulesData();
  }, []);

  useEffect(() => {
    //ルールのリアルタイム購読
    const rulesChannel = supabase
      .channel("rules-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rules" },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const newRule = payload.new as Rule;
            setRules((prev) => sortRulesByUpdatedAtDesc([newRule, ...prev]));
            return;
          }

          if (eventType === "UPDATE") {
            const updatedRule = payload.new as Rule;
            setRules((prev) => sortRulesByUpdatedAtDesc(
              prev.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
            ));
          }

          if (eventType === "DELETE") {
            const deletedRule = payload.old as Rule;
            setRules((prev) => prev.filter((rule) => rule.id !== deletedRule.id));
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
            setRuleAcknowledgements((prev) => [...prev, newAck]);
          }

          if (eventType === "UPDATE") {
            const updatedAck = payload.new as RuleAcknowledgement;
            setRuleAcknowledgements((prev) =>
              prev.map((ack) => (ack.id === updatedAck.id ? updatedAck : ack))
            );
          }

          if (eventType === "DELETE") {
            const deletedAck = payload.old as RuleAcknowledgement;
            setRuleAcknowledgements((prev) =>
              prev.filter((ack) => ack.id !== deletedAck.id)
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

  const value = useMemo(() =>
  ({
    rules,
    setRules,
    ruleAcknowledgements,
    setRuleAcknowledgements,
    isRulesLoading,
    refreshRulesData,
  }),
    [rules, ruleAcknowledgements, isRulesLoading]
  );

  return <RuleContext.Provider value={value}>{children}</RuleContext.Provider>;
};

export const useRuleContext = () => {
  const context = useContext(RuleContext);
  if (!context) {
    throw new Error("useRuleContextはRuleProvider内で使用してください。");
  }

  return context;
}