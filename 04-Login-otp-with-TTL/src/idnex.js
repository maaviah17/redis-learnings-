// just a revision index file.

import express from 'express';
import Redis from 'ioredis';

const app=express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

function otpKey(phone){
    return `otp:${phone}`;
}

app.post('/send-otp', async(req,res)=>{
    const {phone} = req.body;
    const otp = Math.floor(100000 + Math.random()*90000).toString(); //redis stores everything as strings, so better to be explicit about it.
    
    // redis.set( WHERE to store,  WHAT to store,  HOW LONG to keep it )
    await redis.set(otpKey(phone), otp, 'EX',60)
    res.json({
        msg : otp
    })
})

app.post('/otp/verify', async(req,res)=>{
    const {phone, otp} = req.body;
    const redisOTP = await redis.get(otpKey(phone));

    if(!redisOTP){
        return res.status(400).json({
            msg : "Expired OTP"
        })
    }

    if(otp !==redisOTP){
        return res.status(400).json({
            msg : "Invalid/Incorrect OTP"
        })
    }

    await redis.del(otpKey(phone));
    res.json({
        msg : "OTP Verified✅"
    })
})


app.get('/otp/:phone/ttl', async(req,res)=>{
    const phone = req.params.phone;
    const time = await redis.ttl(otpKey(phone));

    res.json({
        ttl : time
    })
})

app.listen(3000,()=>{
    console.log("hey,its running")
})