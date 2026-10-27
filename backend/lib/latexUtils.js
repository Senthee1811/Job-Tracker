import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escapes characters that have special meaning in LaTeX and strips control characters.
 * Prevents LaTeX injection and compiler errors.
 *
 * @param {string} str - Raw input string
 * @returns {string} LaTeX-safe escaped string
 */
export const escapeLatex = (str) => {
    if (str === null || str === undefined) return "";
    let s = String(str);

    // Strip control characters (ASCII 0-31 except \t, \n, \r)
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Single-pass replacement avoids recursive escaping of generated braces/backslashes
    return s.replace(/[\\&%$#_{}~^]/g, (match) => {
        switch (match) {
            case "\\": return "\\textbackslash{}";
            case "&": return "\\&";
            case "%": return "\\%";
            case "$": return "\\$";
            case "#": return "\\#";
            case "_": return "\\_";
            case "{": return "\\{";
            case "}": return "\\}";
            case "~": return "\\textasciitilde{}";
            case "^": return "\\textasciicircum{}";
            default: return match;
        }
    });
};

/**
 * Loads the Jake's Resume style ATS template.
 */
const getTemplateContent = () => {
    // Check multiple candidate locations for serverless vs local dev
    const pathsToTry = [
        path.resolve(__dirname, "..", "templates", "resume.tex"),
        path.resolve(process.cwd(), "templates", "resume.tex"),
        path.resolve(process.cwd(), "backend", "templates", "resume.tex")
    ];

    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            return fs.readFileSync(p, "utf-8");
        }
    }

    // Fallback inline template in case file system path is isolated in serverless
    return `
\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage{tabularx}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape {{NAME}}} \\\\ \\vspace{2pt}
    \\small {{EMAIL}} $|$ {{LINKEDIN}} $|$ {{LOCATION}}
\\end{center}
{{SUMMARY_SECTION}}
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{\\textbf{Core Technologies}{: {{SKILLS}}}}}
 \\end{itemize}
\\section{Experience}
  \\resumeSubHeadingListStart
{{EXPERIENCE_SECTION}}
  \\resumeSubHeadingListEnd
\\section{Projects}
    \\resumeSubHeadingListStart
{{PROJECTS_SECTION}}
    \\resumeSubHeadingListEnd
\\section{Education}
  \\resumeSubHeadingListStart
{{EDUCATION_SECTION}}
  \\resumeSubHeadingListEnd
\\end{document}
`;
};

/**
/**
 * Dynamically renders LaTeX source directly from candidate's DocumentModel,
 * strictly preserving candidate's original section order, headings, and verbatim text.
 *
 * @param {object} docModel - DocumentModel
 * @returns {string} Compilable LaTeX source
 */
export const renderLatexFromDocumentModel = (docModel = {}) => {
    const contact = docModel.contactBlock || {};
    const fullName = escapeLatex(contact.name || "Candidate");
    const contactParts = [
        contact.email ? escapeLatex(contact.email) : null,
        contact.phone ? escapeLatex(contact.phone) : null,
        contact.location ? escapeLatex(contact.location) : null,
        ...(contact.links || []).map(l => escapeLatex(`${l.label}: ${l.url}`))
    ].filter(Boolean);

    let latex = `\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage{tabularx}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-2pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}
\\begin{center}
    \\textbf{\\Huge \\scshape ${fullName}} \\\\ \\vspace{2pt}
    \\small ${contactParts.join(" $|$ ") || "Professional Resume"}
\\end{center}
`;

    const sections = docModel.sections || [];
    const sectionOrder = docModel.sectionOrder || sections.map(s => s.id);
    const orderedSections = [...sections].sort((a, b) => {
        const idxA = sectionOrder.indexOf(a.id);
        const idxB = sectionOrder.indexOf(b.id);
        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

    for (const sec of orderedSections) {
        if (!sec.blocks || sec.blocks.length === 0) continue;

        const heading = escapeLatex(sec.heading || sec.originalHeading || "Section");
        latex += `\n\\section{${heading}}\n`;

        const hasBullets = sec.blocks.some(b => b.isBullet);
        if (hasBullets) {
            latex += `\\begin{itemize}[leftmargin=0.15in]\n`;
            for (const blk of sec.blocks) {
                if (blk.blockType === "entry_header" || blk.metadata?.company || blk.metadata?.dates) {
                    const title = escapeLatex(blk.metadata?.title || blk.text);
                    const company = blk.metadata?.company ? ` — ${escapeLatex(blk.metadata.company)}` : "";
                    const dates = blk.metadata?.dates ? ` (${escapeLatex(blk.metadata.dates)})` : "";
                    latex += `  \\item[] \\textbf{${title}}${company}${dates}\n`;
                } else if (blk.isBullet) {
                    latex += `  \\item \\small{${escapeLatex(blk.text)}}\n`;
                } else {
                    latex += `  \\item[] \\small{${escapeLatex(blk.text)}}\n`;
                }
            }
            latex += `\\end{itemize}\n`;
        } else {
            // Paragraphs
            for (const blk of sec.blocks) {
                latex += `\\small{${escapeLatex(blk.text)}}\\\\ \\vspace{3pt}\n`;
            }
        }
    }

    latex += `\\end{document}\n`;
    return latex;
};

/**
 * Renders structured candidate & tailored CV data into Jake's Resume LaTeX source string.
 * Delegates to renderLatexFromDocumentModel if a DocumentModel is provided.
 *
 * @param {object} candidate - Candidate details or DocumentModel
 * @param {object} tailored - Tailored CV details or patch
 * @returns {string} Compilable LaTeX source
 */
export const renderLatexResume = (candidate, tailored) => {
    if (candidate?.sections) {
        return renderLatexFromDocumentModel(candidate);
    }
    if (tailored?.sections) {
        return renderLatexFromDocumentModel(tailored);
    }

    let template = getTemplateContent();

    const fullName = `${candidate.firstname || ""} ${candidate.lastname || ""}`.trim() || "Candidate";
    const email = candidate.email || "";
    const linkedin = candidate.linkedin || "linkedin.com";
    const location = candidate.location || "Sri Lanka";

    // 1. Header placeholders
    template = template.replace("{{NAME}}", escapeLatex(fullName));
    template = template.replace("{{EMAIL}}", escapeLatex(email));
    template = template.replace("{{LINKEDIN}}", escapeLatex(linkedin));
    template = template.replace("{{LOCATION}}", escapeLatex(location));

    // 2. Summary
    if (tailored.summary) {
        const summaryBlock = `\\section{Professional Summary}\n\\small{\n${escapeLatex(tailored.summary)}\n}\n`;
        template = template.replace("{{SUMMARY_SECTION}}", summaryBlock);
    } else {
        template = template.replace("{{SUMMARY_SECTION}}", "");
    }

    // 3. Technical Skills
    const skillsList = tailored.highlightedSkills || tailored.skills || [];
    const skillsString = skillsList.map(escapeLatex).join(", ") || "Software Engineering, Problem Solving";
    template = template.replace("{{SKILLS}}", skillsString);

    // 4. Experience
    const experienceList = tailored.experience || [];
    let expLatex = "";
    experienceList.forEach(exp => {
        const company = escapeLatex(exp.company || "Technology Company");
        const duration = escapeLatex(exp.duration || "");
        const role = escapeLatex(exp.role || "Software Engineer");
        const expLocation = escapeLatex(exp.location || "Colombo, Sri Lanka");

        expLatex += `    \\resumeSubheading\n      {${company}}{${duration}}\n      {${role}}{${expLocation}}\n      \\resumeItemListStart\n`;
        const bullets = exp.bullets || [];
        bullets.forEach(b => {
            expLatex += `        \\resumeItem{${escapeLatex(b)}}\n`;
        });
        expLatex += `      \\resumeItemListEnd\n\n`;
    });
    template = template.replace("{{EXPERIENCE_SECTION}}", expLatex || "    \\item No prior experience listed.");

    // 5. Projects
    const projectsList = tailored.projects || [];
    let projLatex = "";
    projectsList.forEach(proj => {
        const title = escapeLatex(proj.title || "Software Project");
        const tech = Array.isArray(proj.technologies) ? proj.technologies.map(escapeLatex).join(", ") : "";
        const techHeader = tech ? ` [${tech}]` : "";

        projLatex += `    \\resumeSubheading\n      {${title}${techHeader}}{}\n      {Full-Stack Engineering}{}\n      \\resumeItemListStart\n`;
        if (proj.description) {
            projLatex += `        \\resumeItem{${escapeLatex(proj.description)}}\n`;
        }
        if (Array.isArray(proj.bullets)) {
            proj.bullets.forEach(pb => {
                projLatex += `        \\resumeItem{${escapeLatex(pb)}}\n`;
            });
        }
        projLatex += `      \\resumeItemListEnd\n\n`;
    });
    template = template.replace("{{PROJECTS_SECTION}}", projLatex || "    \\item Personal portfolio projects.");

    // 6. Education
    const educationList = tailored.education || [];
    let eduLatex = "";
    educationList.forEach(edu => {
        const inst = escapeLatex(edu.institution || "University / Institute");
        const year = escapeLatex(edu.year || "Graduated");
        const degree = escapeLatex(edu.degree || "Bachelor of Science in Computing");

        eduLatex += `    \\resumeSubheading\n      {${inst}}{${year}}\n      {${degree}}{}\n`;
    });
    template = template.replace("{{EDUCATION_SECTION}}", eduLatex || "    \\item Higher education credentials.");

    return template;
};
