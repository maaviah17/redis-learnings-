import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
// const QUEUE_KEY = "email:queue"
const QUEUE_KEY = "queue:emails";


app.post('/emails', async(req,res)=>{
    
    const job={
        to : req.body.to,
        subject : req.body.subject || "NO SUBJECT",
        body : req.body.body || "NO CONTENT",
        createdAt : new Date().toISOString()
    }

    await redis.lpush(QUEUE_KEY, JSON.stringify(job));
    res.json({
        queued : true,
        job
    })
})


app.get('/emails/process-one', async(req,res)=>{
    const rawJob = await redis.rpop(QUEUE_KEY);
    if(!rawJob){
        res.status(400).json({msg : "No jobs in queue"})
    }
    const job = JSON.parse(rawJob);
    res.json({
        msg : "Email sent",
        job
    })

})

app.listen(3000,()=>{
    console.log("running on port:3000")
})