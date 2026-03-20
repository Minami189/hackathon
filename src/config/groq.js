import { Groq } from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateAssessment(jobTitle, skills) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const promptPath = path.join(__dirname, 'groq_prompt.md');

    const promptTemplate = await fs.readFile(promptPath, 'utf-8');

    let prompt = promptTemplate.replace(/{job_title}/g, jobTitle);
    prompt = prompt.replace(/{skills}/g, JSON.stringify(skills));

    try {
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": prompt
                },
                {
                    "role": "user",
                    "content": "Please generate the assessment."
                }
            ],
            "model": "llama-3.3-70b-versatile", // Using a standard and reliable Groq model for JSON parsing; feel free to change!
            "temperature": 0.2, // Lower temp for more deterministic JSON
            "max_completion_tokens": 15491,
            "top_p": 1,
            "stream": false, // Set to false to get it all at once to send to the frontend
            "response_format": { "type": "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content;
        return JSON.parse(content || '{}');
    } catch (err) {
        console.error("Groq generation failed:", err);
        throw err;
    }
}
