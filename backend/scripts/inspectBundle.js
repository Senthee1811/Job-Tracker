const run = async () => {
    try {
        const res = await fetch("https://xpress.jobs/static/js/main.25e5cca4.js");
        const js = await res.text();
        const baseUrls = js.match(/baseURL\s*:\s*["'][^"']+["']/g) || [];
        console.log("baseURLs:", baseUrls);
        const apis = js.match(/"https:\/\/[a-zA-Z0-9_.-]*api[a-zA-Z0-9_.-]*[^"']*"/g) || [];
        console.log("APIs:", apis.slice(0, 10));
    } catch (e) {
        console.error(e.message);
    }
};

run();
