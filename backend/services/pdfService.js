import PDFDocument from "pdfkit";

/**
 * Generates an ATS-friendly, single-column clean PDF resume buffer from tailored CV data and candidate info.
 *
 * @param {object} candidate - User details ({ firstname, lastname, email, linkedin, location })
 * @param {object} tailored - Tailored CV details ({ summary, highlightedSkills, experience, education, projects })
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateAtsPdfBuffer = (candidate, tailored) => {
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
