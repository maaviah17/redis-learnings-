import express from 'express';
import Redis from 'ioredis';

const app=express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const BANNER_KEY = "app:banner";

app.post('/banner', async(req,res)=>{
    await redis.set(BANNER_KEY, req.body.message || "welcome to mmk and redis");
    res.json({
        msg : "successfully done"
    })
})

app.get("/banner", async(req,res)=>{
    const msg = await redis.get(BANNER_KEY);
    res.json({msg})
})

app.delete("/banner", async(req,res)=>{
    await redis.del(BANNER_KEY);
    res.json({success : true});
})

app.get("/banner/exists", async(req,res)=>{
    const exists = await redis.exists(BANNER_KEY);
    res.json({exists : Boolean(exists)});
})

app.listen(3003,()=>{
   console.log("connected to port ji.")
})