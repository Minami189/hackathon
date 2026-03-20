import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import assesmentRouter from './routes/assessment.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/v1",assesmentRouter);

app.get("/assessment", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'assessment.html'));
});


app.listen(PORT, ()=>{
    console.log(`server listening to port ${PORT}`);
})