import { writeFile, mkdir } from "node:fs/promises";

const TOKEN = process.env.NOTION_TOKEN;
const DB = "8babc45b-3eda-4c14-8807-66a3e6d969e6";
const BASE = "https://" + "api.notion.com/v1"; // getrennt, damit nichts verschluckt wird

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const q = await fetch(`${BASE}/databases/${DB}/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({ filter: { property: "Status", select: { equals: "Aktiv" } } }),
}).then(r => r.json());

await mkdir("feeds", { recursive: true });

for (const page of q.results) {
  const datei = (page.properties["Datei"].rich_text || [])
    .map(t => t.plain_text).join("") || `${page.id}.xml`;
  const blocks = await fetch(`${BASE}/blocks/${page.id}/children?page_size=100`, { headers })
    .then(r => r.json());
  const code = blocks.results.find(b => b.type === "code");
  if (!code) continue;
  const xml = code.code.rich_text.map(t => t.plain_text).join("").trim();
  await writeFile(`feeds/${datei}`, xml, "utf8");
  console.log("geschrieben: feeds/" + datei);
}