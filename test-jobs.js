import 'dotenv/config';
import { fetchRemotive, fetchJobicy, fetchAdzuna } from './src/services/job-listings.js';

async function testAPIs() {
    console.log("---------- TESTING REMOTIVE ----------");
    const r = await fetchRemotive("Software Engineer");
    console.log(`Results Found: ${r.length}`);
    if (r.length > 0) console.log(r[0]);

    console.log("\n---------- TESTING JOBICY ----------");
    const j = await fetchJobicy("Software Engineer");
    console.log(`Results Found: ${j.length}`);
    if (j.length > 0) console.log(j[0]);

    console.log("\n---------- TESTING ADZUNA ----------");
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
        console.log("⚠️ Adzuna skipped: No ADZUNA_APP_ID or ADZUNA_APP_KEY in .env");
    } else {
        const a = await fetchAdzuna("Software Engineer");
        console.log(`Results Found: ${a.length}`);
        if (a.length > 0) console.log(a[0]);
    }
}

testAPIs();
