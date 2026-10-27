import PDFDocument from "pdfkit";

/**
 * Generates an ATS-friendly, single-column clean PDF resume buffer from tailored CV data and candidate info.
 * Delegates to generateDocumentModelPdfBuffer when a DocumentModel is provided.
 *
 * @param {object} candidate - User details or DocumentModel
 * @param {object} tailored - Tailored CV details or patch
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateAtsPdfBuffer = (candidate, tailored) => {
    // If either argument is a DocumentModel with sections, use the document model rebuilder
    if (candidate?.sections) {
        return generateDocumentModelPdfBuffer(candidate);
    }
    if (tailored?.sections) {
        return generateDocumentModelPdfBuffer(tailored);
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 45
            });

            const buffers = [];
            doc.on("data", chunk => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", err => reject(err));

            const fullName = `${candidate.firstname || ""} ${candidate.lastname || ""}`.trim() || "Candidate Resume";

            // --- HEADER ---
            doc.font("Helvetica-Bold").fontSize(20).fillColor("#111827").text(fullName, { align: "left" });
            doc.moveDown(0.2);

            const contactParts = [
                candidate.email,
                candidate.linkedin,
                candidate.location || "Sri Lanka"
            ].filter(Boolean);

            doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(contactParts.join("  |  "), { align: "left" });
            doc.moveDown(0.5);

            // Divider rule
            doc.strokeColor("#d1d5db").lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.8);

            // --- PROFESSIONAL SUMMARY ---
            if (tailored.summary) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("PROFESSIONAL SUMMARY");
                doc.moveDown(0.3);
                doc.font("Helvetica").fontSize(9.5).fillColor("#374151").text(tailored.summary, {
                    align: "justify",
                    lineGap: 2
                });
                doc.moveDown(0.8);
            }

            // --- CORE TECHNICAL SKILLS ---
            const skills = tailored.highlightedSkills || tailored.skills || [];
            if (skills.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("TECHNICAL SKILLS");
                doc.moveDown(0.3);
                doc.font("Helvetica").fontSize(9.5).fillColor("#374151").text(skills.join("  •  "), {
                    lineGap: 2
                });
                doc.moveDown(0.8);
            }

            // --- WORK EXPERIENCE ---
            const experience = tailored.experience || [];
            if (experience.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("RELEVANT EXPERIENCE");
                doc.moveDown(0.4);

                experience.forEach(exp => {
                    const roleTitle = exp.role || "Software Engineer";
                    const companyName = exp.company || "";
                    const duration = exp.duration || "";

                    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1f2937").text(roleTitle, { continued: true });
                    if (companyName) {
                        doc.font("Helvetica").fontSize(10).fillColor("#4b5563").text(` — ${companyName}`);
                    } else {
                        doc.text("");
                    }

                    if (duration) {
                        doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#6b7280").text(duration);
                    }

                    doc.moveDown(0.2);

                    const bullets = exp.bullets || [];
                    bullets.forEach(bullet => {
                        doc.font("Helvetica").fontSize(9).fillColor("#374151").text(`•  ${bullet}`, {
                            indent: 10,
                            lineGap: 1.5
                        });
                    });

                    doc.moveDown(0.6);
                });
            }

            // --- PROJECTS ---
            const projects = tailored.projects || [];
            if (projects.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("PROJECTS & PORTFOLIO");
                doc.moveDown(0.4);

                projects.forEach(proj => {
                    const title = proj.title || "Project";
                    const tech = Array.isArray(proj.technologies) ? proj.technologies.join(", ") : "";

                    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1f2937").text(title, { continued: !!tech });
                    if (tech) {
                        doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text(` [${tech}]`);
                    }

                    if (proj.description) {
                        doc.font("Helvetica").fontSize(9).fillColor("#374151").text(proj.description, {
                            indent: 10,
                            lineGap: 1.5
                        });
                    }

                    doc.moveDown(0.4);
                });
            }

            // --- EDUCATION ---
            const education = tailored.education || [];
            if (education.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("EDUCATION & CREDENTIALS");
                doc.moveDown(0.3);

                education.forEach(edu => {
                    const degree = edu.degree || "Degree";
                    const inst = edu.institution || "";
                    const year = edu.year || "";

                    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1f2937").text(degree, { continued: true });
                    doc.font("Helvetica").fontSize(9.5).fillColor("#4b5563").text(` — ${inst} ${year ? `(${year})` : ""}`);
                    doc.moveDown(0.2);
                });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Renders a PDF buffer directly from a candidate's DocumentModel.
 * Preserves the exact section order, original verbatim headings, bullet styles,
 * and entry structures from the uploaded document.
 *
 * @param {object} docModel - DocumentModel
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateDocumentModelPdfBuffer = (docModel = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 40
            });

            const buffers = [];
            doc.on("data", chunk => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", err => reject(err));

            const contact = docModel.contactBlock || {};
            const styleHints = docModel.styleHints || {};
            const bulletChar = styleHints.bulletStyle || "•";
            const fontName = styleHints.fontHints?.family === "Times New Roman" ? "Times-Roman" : "Helvetica";
            const fontBold = styleHints.fontHints?.family === "Times New Roman" ? "Times-Bold" : "Helvetica-Bold";
            const fontItalic = styleHints.fontHints?.family === "Times New Roman" ? "Times-Italic" : "Helvetica-Oblique";

            // --- HEADER: NAME & CONTACT ---
            const fullName = contact.name || "Candidate Resume";
            doc.font(fontBold).fontSize(18).fillColor("#111827").text(fullName, { align: "left" });
            doc.moveDown(0.2);

            const contactParts = [
                contact.email,
                contact.phone,
                contact.location,
                ...(contact.links || []).map(l => `${l.label}: ${l.url}`)
            ].filter(Boolean);

            if (contactParts.length > 0) {
                doc.font(fontName).fontSize(8.5).fillColor("#4b5563").text(contactParts.join("   |   "), { align: "left" });
                doc.moveDown(0.4);
            }

            // Divider rule
            doc.strokeColor("#9ca3af").lineWidth(0.75).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.6);

            // Order sections according to sectionOrder
            const sections = docModel.sections || [];
            const sectionOrder = docModel.sectionOrder || sections.map(s => s.id);
            const orderedSections = [...sections].sort((a, b) => {
                const idxA = sectionOrder.indexOf(a.id);
                const idxB = sectionOrder.indexOf(b.id);
                return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
            });

            for (const sec of orderedSections) {
                if (!sec.blocks || sec.blocks.length === 0) continue;

                // Section Heading (Verbatim from candidate's CV)
                const headingText = (sec.heading || sec.originalHeading || "SECTION").toUpperCase();
                
                // Avoid orphan headings near page bottom
                if (doc.y > 720) {
                    doc.addPage();
                }

                doc.font(fontBold).fontSize(10.5).fillColor("#111827").text(headingText);
                doc.moveDown(0.2);
                doc.strokeColor("#e5e7eb").lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.4);

                // Section Blocks
                for (const blk of sec.blocks) {
                    if (doc.y > 750) {
                        doc.addPage();
                    }

                    if (blk.blockType === "entry_header" || blk.metadata?.company || blk.metadata?.dates) {
                        const title = blk.metadata?.title || blk.text;
                        const company = blk.metadata?.company ? ` — ${blk.metadata.company}` : "";
                        const dates = blk.metadata?.dates ? ` (${blk.metadata.dates})` : "";
                        
                        doc.font(fontBold).fontSize(9.5).fillColor("#1f2937").text(title, { continued: !!(company || dates) });
                        if (company) {
                            doc.font(fontName).fontSize(9.5).fillColor("#374151").text(company, { continued: !!dates });
                        }
                        if (dates) {
                            doc.font(fontItalic).fontSize(8.5).fillColor("#6b7280").text(dates);
                        }
                        doc.moveDown(0.2);
                    } else if (blk.isBullet) {
                        doc.font(fontName).fontSize(9).fillColor("#374151").text(`${bulletChar}  ${blk.text}`, {
                            indent: 10,
                            lineGap: 1.5
                        });
                        doc.moveDown(0.15);
                    } else {
                        // Paragraph text
                        doc.font(fontName).fontSize(9).fillColor("#374151").text(blk.text, {
                            align: "left",
                            lineGap: 1.5
                        });
                        doc.moveDown(0.3);
                    }
                }

                doc.moveDown(0.5);
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generates an executive, branded AI CV Analysis & Audit Report PDF.
 *
 * @param {object} candidate - User object ({ firstname, lastname, email })
 * @param {object} cv - CV document ({ originalName, version, createdAt })
 * @param {object} report - Analysis report ({ overallScore, atsScore, impactScore, brevityScore, skillsScore, summary, strengths, weaknesses, missingKeywords, actionableSuggestions, tailoredRoles })
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateCvAnalysisPdfBuffer = (candidate, cv, report) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 45
            });

            const buffers = [];
            doc.on("data", chunk => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", err => reject(err));

            const candidateName = `${candidate.firstname || ""} ${candidate.lastname || ""}`.trim() || "Candidate";
            const auditDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

            // --- HEADER ---
            doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text("JOB TRACKER • AI CV AUDIT REPORT");
            doc.moveDown(0.2);
            doc.font("Helvetica").fontSize(9).fillColor("#6b7280").text(
                `Candidate: ${candidateName}  |  File: ${cv.originalName || "Resume"} (v${cv.version || 1})  |  Generated: ${auditDate}`
            );
            doc.moveDown(0.4);

            // Top Rule
            doc.strokeColor("#111827").lineWidth(1.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.8);

            // --- SCORECARD BANNER ---
            const overall = report.overallScore || 0;
            const startY = doc.y;

            // Background card for score
            doc.rect(45, startY, 505, 55).fillAndStroke("#f9fafb", "#e5e7eb");

            // Overall Score
            doc.font("Helvetica-Bold").fontSize(26).fillColor("#111827").text(`${overall}/100`, 60, startY + 12);
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#6b7280").text("OVERALL READINESS", 60, startY + 40);

            // Sub-scores
            const subscores = [
                { label: "ATS Readiness", score: report.atsScore || 0 },
                { label: "Impact & Metrics", score: report.impactScore || 0 },
                { label: "Brevity & Conciseness", score: report.brevityScore || 0 },
                { label: "Technical Depth", score: report.skillsScore || 0 }
            ];

            let subX = 210;
            subscores.forEach(sub => {
                doc.font("Helvetica-Bold").fontSize(14).fillColor("#1f2937").text(`${sub.score}%`, subX, startY + 14);
                doc.font("Helvetica").fontSize(7.5).fillColor("#6b7280").text(sub.label, subX, startY + 34);
                subX += 78;
            });

            doc.y = startY + 68;

            // --- EXECUTIVE SUMMARY ---
            doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("EXECUTIVE SUMMARY");
            doc.moveDown(0.3);
            doc.font("Helvetica").fontSize(9.5).fillColor("#374151").text(
                report.summary || "Candidate demonstrates strong engineering fundamentals and solid alignment with current tech vacancy profiles.",
                { align: "justify", lineGap: 2 }
            );
            doc.moveDown(0.7);

            // --- STRENGTHS & COMPETITIVE ADVANTAGES ---
            const strengths = report.strengths || [];
            if (strengths.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("KEY COMPETITIVE ADVANTAGES");
                doc.moveDown(0.3);
                strengths.forEach(str => {
                    doc.font("Helvetica").fontSize(9).fillColor("#15803d").text(`[+]  `, { continued: true });
                    doc.fillColor("#374151").text(str, { indent: 15, lineGap: 1.5 });
                });
                doc.moveDown(0.6);
            }

            // --- CRITICAL GAPS & WEAKNESSES ---
            const weaknesses = report.weaknesses || [];
            if (weaknesses.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("AREAS FOR ENHANCEMENT");
                doc.moveDown(0.3);
                weaknesses.forEach(w => {
                    doc.font("Helvetica").fontSize(9).fillColor("#b91c1c").text(`[!]  `, { continued: true });
                    doc.fillColor("#374151").text(w, { indent: 15, lineGap: 1.5 });
                });
                doc.moveDown(0.6);
            }

            // --- MISSING HIGH DEMAND KEYWORDS ---
            const missing = report.missingKeywords || [];
            if (missing.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("RECOMMENDED KEYWORDS TO INCORPORATE");
                doc.moveDown(0.3);
                doc.font("Helvetica").fontSize(9).fillColor("#4338ca").text(missing.join("   •   "), { lineGap: 2 });
                doc.moveDown(0.6);
            }

            // --- ACTIONABLE SUGGESTIONS ---
            const suggestions = report.actionableSuggestions || [];
            if (suggestions.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("ACTIONABLE STEP-BY-STEP SUGGESTIONS");
                doc.moveDown(0.3);

                suggestions.forEach((sug, idx) => {
                    const sectionName = sug.section || `Recommendation #${idx + 1}`;
                    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1f2937").text(`${idx + 1}. Section: ${sectionName}`);
                    if (sug.issue) {
                        doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#4b5563").text(`   Issue: ${sug.issue}`);
                    }
                    if (sug.recommendation) {
                        doc.font("Helvetica").fontSize(9).fillColor("#111827").text(`   Tip: ${sug.recommendation}`, { lineGap: 1.5 });
                    }
                    doc.moveDown(0.3);
                });
                doc.moveDown(0.4);
            }

            // --- RECOMMENDED ROLES ---
            const roles = report.tailoredRoles || [];
            if (roles.length > 0) {
                doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("RECOMMENDED TARGET ROLES");
                doc.moveDown(0.2);
                doc.font("Helvetica").fontSize(9).fillColor("#374151").text(roles.join("   •   "));
                doc.moveDown(0.8);
            }

            // Footer
            doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(45, 780).lineTo(550, 780).stroke();
            doc.font("Helvetica").fontSize(7.5).fillColor("#9ca3af").text(
                "Job Tracker Automated AI Audit • Powered by Google GenAI SDK & Sri Lankan Tech Intelligence",
                45,
                788,
                { align: "center", width: 505 }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
