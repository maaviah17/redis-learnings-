import express from "express";
import varRedis from "ioredis";
import mongoose from "mongoose";

const app=express();

const redis = new varRedis("redis://localhost:6379")

app.get('/redass', async(req,res)=>{
    const reply = await redis.ping();
    res.json({
        redis : reply
    })
})

app.get('/mongod', async(req,res)=>{
    const url = new mongoose("mongodb://localhost:27017")
    if(mongoose.connection.readyState===0){
        await mongoose.connect(url)
    }

    res.json({
        mongo:"connected",
        db : mongoose.connect.name
    })
})

app.listen(3002,()=>{
    console.log("port running by mmk");
})