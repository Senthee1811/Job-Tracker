import fs from "fs";
import path from "path";

const FIXTURES_DIR = path.resolve(process.cwd(), "tests", "fixtures");
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

const downloadFixture = async (url, filename) => {
    try {
        console.log(`Downloading ${url}...`);
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(12000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const targetPath = path.join(FIXTURES_DIR, filename);
        fs.writeFileSync(targetPath, text, "utf-8");
        console.log(`Saved ${filename} (${text.length} bytes).`);
    } catch (err) {
        console.warn(`Failed downloading ${url}:`, err.message);
    }
};

const run = async () => {
    await downloadFixture("https://itpro.lk/jobs", "itpro.html");
    await downloadFixture("https://xpress.jobs/jobs?q=Software", "xpressjobs.html");
    await downloadFixture("https://ikman.lk/en/jobs/information-technology", "ikman.html");
};

run();
