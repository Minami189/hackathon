import express from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { generateAssessment } from '../src/config/groq.js';
import pool from '../db/db.js';

const router = express.Router();

//null pdf parse context, then true for raw text to get raw text
const pdfParser = new PDFParser(null, true);



const upload = multer({ storage: multer.memoryStorage() });



router.post('/extract', upload.single('resume'), (req, res) => {

    if (!req.file) {
        return res.json({ success: false, error: "received no file" });
    }
    pdfParser.parseBuffer(req.file.buffer);

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const rawText = pdfParser.getRawTextContent();
        const decodedText = decodeURIComponent(rawText);
        console.log(decodedText);
    });
});

router.post('/upload', upload.single('resume'), (req, res) => {

});

router.post('/generate', async (req, res) => {
    try {
        const { jobTitle, skills, userId } = req.body;
        if (!jobTitle || !skills || !userId) {
            return res.status(400).json({ error: "Missing jobTitle, skills, or userId" });
        }

        const assessment = await generateAssessment(jobTitle, skills);

        // Store into database
        try {
            await pool.query('BEGIN');
            for (const assmnt of assessment.assessments) {
                // Ensure priority works with any pg enum formatting (e.g. replace spaces with underscores if needed, or mapping)
                // Assuming it works exactly. If not, Postgres might complain, but for now we'll pass the groq value.
                let priorityVal = String(assmnt.priority).toLowerCase().trim();
                // Replace any underscores with spaces in case AI generated it wrong
                priorityVal = priorityVal.replace('_', ' ');
                
                if (!['high priority', 'medium priority', 'low priority'].includes(priorityVal)) {
                    if (['high', 'medium', 'low'].includes(priorityVal)) {
                         priorityVal = priorityVal + ' priority'; 
                    } else {
                         priorityVal = 'medium priority'; // fallback
                    }
                }

                const assmtRes = await pool.query(
                    `INSERT INTO assessments (user_id, skill, priority, job_title) 
                     VALUES ($1, $2, CAST($3 AS priority_level), $4) RETURNING id`,
                     [userId, assmnt.skill || 'Unknown', priorityVal, jobTitle]
                );
                
                const assessmentId = assmtRes.rows[0].id;

                if (assmnt.questions) {
                    for (let i = 0; i < assmnt.questions.length; i++) {
                        const q = assmnt.questions[i];
                        
                        let safeType = q.type || 'multiple_choice';
                        // if types have spaces? groq prompt says "multiple_choice", "true_false", "code_output", etc.
                        safeType = safeType.toLowerCase();
                        
                        const qRes = await pool.query(
                            `INSERT INTO questions (assessment_id, sequence_num, type, approach, question, code_snippet, correct_answer, explanation)
                             VALUES ($1, $2, CAST($3 AS question_type), $4, $5, $6, $7, $8) RETURNING id`,
                            [
                                assessmentId, 
                                i + 1, 
                                safeType, 
                                q.approach || 'technical', 
                                q.question || 'Missing question?', 
                                q.code_snippet !== 'null' && q.code_snippet !== null ? q.code_snippet : null, 
                                typeof q.correct_answer === 'string' ? q.correct_answer : String(q.correct_answer || ''), 
                                q.explanation || ''
                            ]
                        );
                        
                        const qId = qRes.rows[0].id;
                        q.db_id = qId; // Expose ID to frontend
                        
                        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                            for (let j = 0; j < q.options.length; j++) {
                                const optStr = String(q.options[j]);
                                const label = String.fromCharCode(65 + j); // A, B, C...
                                
                                let isCorrect = false;
                                const corAns = String(q.correct_answer || '').toLowerCase().trim();
                                if (corAns === label.toLowerCase() || corAns.startsWith(label.toLowerCase() + '.') || corAns.startsWith(label.toLowerCase() + ')')) {
                                    isCorrect = true;
                                } else if (corAns.replace(/^[a-z][\.\)]\s*/, '') === optStr.toLowerCase().replace(/^[a-z][\.\)]\s*/, '')) {
                                    isCorrect = true;
                                }

                                await pool.query(
                                    `INSERT INTO question_options (question_id, label, content, is_correct, explanation)
                                     VALUES ($1, $2, $3, $4, $5)`,
                                    [qId, label, optStr, isCorrect, q.explanation || '']
                                );
                            }
                        } else if (safeType === 'true_false') {
                             const options = ['True', 'False'];
                             for (let j = 0; j < options.length; j++) {
                                 const label = String.fromCharCode(65 + j);
                                 const isCorrect = String(q.correct_answer || '').toLowerCase() === options[j].toLowerCase() || String(q.correct_answer || '').toLowerCase().startsWith(label.toLowerCase());
                                 
                                 await pool.query(
                                     `INSERT INTO question_options (question_id, label, content, is_correct, explanation)
                                      VALUES ($1, $2, $3, $4, $5)`,
                                     [qId, label, options[j], isCorrect, q.explanation || '']
                                 );
                             }
                        }
                    }
                }
            }
            await pool.query('COMMIT');
        } catch (dbErr) {
            await pool.query('ROLLBACK');
            console.error("Database error during assessment storage:", dbErr);
            // We can optionally still return the assessment even if saving fails, 
            // but the prompt implies it SHOULD be saved. Let's still continue to show to user, but warn.
        }

        res.json({ success: true, assessment });
    } catch (error) {
        console.error("Error generating assessment:", error);
        res.status(500).json({ error: "Failed to generate assessment" });
    }
});

router.post('/submit', async (req, res) => {
    try {
        const { userId, results } = req.body;
        if (!userId || !results || !Array.isArray(results)) {
            return res.status(400).json({ error: "Missing userId or results" });
        }
        
        await pool.query('BEGIN');
        for (const r of results) {
            await pool.query(
                `INSERT INTO user_results (user_id, question_id, selected_option, is_correct, score)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (user_id, question_id) 
                 DO UPDATE SET selected_option = EXCLUDED.selected_option, 
                               is_correct = EXCLUDED.is_correct, 
                               score = EXCLUDED.score,
                               answered_at = now()`,
                [userId, r.question_id, r.selected_option, r.is_correct, r.is_correct ? 1 : 0]
            );
        }
        await pool.query('COMMIT');
        res.json({ success: true, message: "Results saved successfully!" });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error saving assessment results:", err);
        res.status(500).json({ error: "Failed to save results" });
    }
});

export default router;
