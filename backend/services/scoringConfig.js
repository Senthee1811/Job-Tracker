/**
 * Configurable weights and normalization alias dictionary for candidate-to-job match scoring.
 */

export const SCORING_WEIGHTS = {
    semanticSimilarity: 0.50, // 50% vector similarity between chunks
    skillOverlap: 0.30,       // 30% overlap of normalized required skills
    experienceFit: 0.10,      // 10% seniority and years of experience alignment
    preferenceFit: 0.10       // 10% preferred role title, location, and work mode (remote/hybrid/onsite)
};

/**
 * Normalization alias map: maps variations, abbreviations, and informal names to canonical lower-cased forms.
 */
export const SKILL_ALIAS_MAP = {
    "react": "react",
    "react.js": "react",
    "reactjs": "react",
    "node": "node.js",
    "node.js": "node.js",
    "nodejs": "node.js",
    "express": "express",
    "express.js": "express",
    "expressjs": "express",
    "ts": "typescript",
    "typescript": "typescript",
    "js": "javascript",
    "javascript": "javascript",
    "py": "python",
    "python": "python",
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "sql": "sql",
    "mysql": "mysql",
    "next": "next.js",
    "next.js": "next.js",
    "nextjs": "next.js",
    "vue": "vue.js",
    "vue.js": "vue.js",
    "vuejs": "vue.js",
    "angular": "angular",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "aws": "aws",
    "amazon web services": "aws",
    "azure": "azure",
    "gcp": "gcp",
    "google cloud": "gcp",
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",
    "tailwind css": "tailwind css",
    "git": "git",
    "github": "git",
    "graphql": "graphql",
    "rest": "rest api",
    "restful": "rest api",
    "rest api": "rest api",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "jest": "jest",
    "cypress": "cypress",
    "html": "html",
    "html5": "html",
    "css": "css",
    "css3": "css",
    "c#": "c#",
    "csharp": "c#",
    ".net": ".net",
    "dotnet": ".net",
    "java": "java",
    "spring": "spring boot",
    "spring boot": "spring boot"
};

/**
 * Normalizes a raw skill string using the alias map.
 * @param {string} rawSkill
 * @returns {string} Canonical skill name
 */
export const normalizeSkill = (rawSkill) => {
    if (!rawSkill || typeof rawSkill !== "string") return "";
    const clean = rawSkill.trim().toLowerCase();
    return SKILL_ALIAS_MAP[clean] || clean;
};

/**
 * Normalizes an array of skills, removes duplicates and empty strings.
 * @param {string[]} skills
 * @returns {string[]}
 */
export const normalizeSkillList = (skills = []) => {
    if (!Array.isArray(skills)) return [];
    const normalized = skills
        .map(s => normalizeSkill(s))
        .filter(s => s && s.length > 0);
    return Array.from(new Set(normalized));
};
