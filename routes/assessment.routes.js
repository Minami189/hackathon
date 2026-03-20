import express from 'express';
import multer from 'multer';
import PDFParser from 'pdf2json';
import { generateAssessment } from '../src/config/groq.js';

const router = express.Router();

//null pdf parse context, then true for raw text to get raw text
const pdfParser = new PDFParser(null, true);


//saving on RAM
const upload = multer({ storage: multer.memoryStorage() });


//upload.single uses the name resume to find what file to use from frontend
//upload.single is so that we can get req.file.buffer
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
        const { jobTitle, skills } = req.body;
        if (!jobTitle || !skills) {
            return res.status(400).json({ error: "Missing jobTitle or skills" });
        }

        const assessment = await generateAssessment(jobTitle, skills);
        res.json({ success: true, assessment });
    } catch (error) {
        console.error("Error generating assessment:", error);
        res.status(500).json({ error: "Failed to generate assessment" });
    }
});

export default router;
