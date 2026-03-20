import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import assesmentRouter from './routes/assessment.routes.js';
<<<<<<< HEAD
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

=======
import accountRouter from './routes/account.routes.js';
>>>>>>> 4e701612223cdfb9c339e90f66bdf0c034be9043

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
app.get("/assessment", (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend-test', 'assessment.html'));
});
=======
app.use("/api/v1", assesmentRouter);
app.use('/api/v1', accountRouter);
>>>>>>> 4e701612223cdfb9c339e90f66bdf0c034be9043


app.listen(PORT, ()=>{
    console.log(`server listening to port ${PORT}`);
})