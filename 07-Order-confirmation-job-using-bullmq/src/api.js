// producer
import express from 'express';
import { emailQueue } from './queue.js';

const app = express();
app.use(express.json());

app.post("/welcome-email", async(req,res)=>{

    const job = await emailQueue.add(
        "send-welcome-email",
        {
            to : req.body.to,
            name : req.body.name || "Learner"
        },
        {
            // this indicates ->  ye job ko 3 times try kro before marking as failed
            attempts : 3,
            backoff : {
                type : "exponential",
                delay : 1000,  // 1s → 2s → 4s between retries
            }
        }
    )
    res.json({
        msg : "Welcome email job added to queue"
    })
})

app.listen(3000,()=>{
    console.log("port running fine:)");
})