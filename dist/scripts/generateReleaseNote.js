"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var notesDir = path_1.default.join(process.cwd(), "public", "release-notes");
var outputPath = path_1.default.join(notesDir, "release-notes.json");
//public/release-notes が存在しない場合は作成
if (!fs_1.default.existsSync(notesDir)) {
    fs_1.default.mkdirSync(notesDir, { recursive: true });
    console.log("Created release-notes directory.");
}
//.mdファイルを取得
var files = fs_1.default.readdirSync(notesDir).filter(function (f) { return f.endsWith(".md"); });
//JSON用配列
var releaseNotes = files.map(function (file) {
    var filePath = path_1.default.join(notesDir, file);
    var stat = fs_1.default.statSync(filePath);
    var version = path_1.default.basename(file, ".md");
    return {
        version: version,
        date: stat.birthtime.toISOString().split("T")[0],
    };
});
releaseNotes.sort(function (a, b) { return (a.date < b.date ? 1 : -1); });
fs_1.default.writeFileSync(outputPath, JSON.stringify(releaseNotes, null, 2), "utf-8");
console.log("release-note.json \u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002(".concat(files.length, "\u4EF6)"));
