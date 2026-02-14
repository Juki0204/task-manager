type MailRef = {
  domain: string;
  prefixNo: number;
  raw: string;
};

export function extractMailRefs(remarks: string | null | undefined): MailRef[] {
  if (!remarks) return [];

  const trimmed = remarks.trim();
  if (!trimmed) return [];

  const regex = /\[(?:\[(www\.[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)\]\((?:https?:\/\/)\1\)|(www\.[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+))\s+(\d+)\]/g;

  const results: MailRef[] = [];

  for (const match of trimmed.matchAll(regex)) {
    const domain = match[1] ?? match[2];
    const prefixNo = Number(match[3]);

    results.push({
      domain,
      prefixNo,
      raw: match[0],
    });
  }

  return results;
}