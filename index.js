import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import assesmentRouter from './routes/assessment.routes.js';
import accountRouter from './routes/account.routes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/v1", assesmentRouter);
app.use('/api/v1', accountRouter);


app.listen(PORT, ()=>{
    console.log(`server listening to port ${PORT}`);
})