import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("tests/fixtures/xpressjobs.html", "utf-8");
const $ = cheerio.load(html);

$("script").each((i, el) => {
    const src = $(el).attr("src") || "";
    const id = $(el).attr("id") || "";
    const type = $(el).attr("type") || "";
    console.log(`Script ${i}: src="${src}" id="${id}" type="${type}"`);
    if ($(el).html()?.includes("NEXT_DATA") || $(el).html()?.includes("jobs")) {
        console.log("Inline script preview:", $(el).html()?.slice(0, 300));
    }
});
