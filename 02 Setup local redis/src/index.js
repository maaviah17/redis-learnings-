import express from "express";
import Redis from "ioredis";
import mongoose from "mongoose";

const app=express();

const redis = new Redis("redis://localhost:6379")

app.get('/redass', async(req,res)=>{
    const reply = await redis.ping();
    res.json({
        redis : reply
    })
})

app.get('/mongod', async(req,res)=>{
    const url = "mongodb://localhost:27017/mmk_db"
    if(mongoose.connection.readyState===0){
        await mongoose.connect(url)
    }

    res.json({
        mongo:"connected",
        db : mongoose.connection.name
    })
})


app.listen(3002,()=>{
    console.log("port running by mmk");
})