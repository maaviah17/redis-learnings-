// consumer
import { Worker } from "bullmq";
import { connection } from "./queue.js";

const emailWorker = new Worker(
    "emails",
    async(job)=> {
        console.log("processing email job<- yaha pr business logic aayega", job.id, job.name, job.data);

        await new Promise((resolve)=> setTimeout(resolve,1500));

        console.log("Email job completed!!", job.id, job.name, job.data); 
    },
    { connection }
)

emailWorker.on("completed", (job)=>{
    console.log("Job completed!", job.id, job.name, job.data);
})

emailWorker.on("failed", (job)=>{
    console.log("Job failed!", job.id, job.name, job.data);
})