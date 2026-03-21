import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import assesmentRouter from './routes/assessment.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import accountRouter from './routes/account.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/assessment", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'assessment.html'));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'login.html'));
});
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'register.html'));
});
app.get("/results", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'results.html'));
});
app.get("/jobs", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'jobs.html'));
});

app.use("/api/v1", assesmentRouter);
app.use('/api/v1', accountRouter);


app.listen(PORT, () => {
    console.log(`server listening to port ${PORT}`);
})