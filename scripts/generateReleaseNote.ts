const fs = require("fs");
const path = require("path");

const notesDir = path.join(process.cwd(), "public", "release-notes");
const outputPath = path.join(notesDir, "release-notes.json");

interface JsonMeda {
  version: string;
  date: string;
}

//public/release-notes が存在しない場合は作成
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
  console.log("Created release-notes directory.");
}

//.mdファイルを取得
const files = fs.readdirSync(notesDir).filter((f: string) => f.endsWith(".md"));

//JSON用配列
const releaseNotes = files.map((file: string) => {
  const filePath = path.join(notesDir, file);
  const stat = fs.statSync(filePath);

  const version = path.basename(file, ".md");

  return {
    version,
    date: stat.birthtime.toISOString().split("T")[0],
  };
});

releaseNotes.sort((a: JsonMeda, b: JsonMeda) => (a.date < b.date ? 1 : -1));

fs.writeFileSync(outputPath, JSON.stringify(releaseNotes, null, 2), "utf-8");

console.log(`release-note.json を作成しました。(${files.length}件)`);