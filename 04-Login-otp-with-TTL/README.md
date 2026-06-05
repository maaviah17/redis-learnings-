# Redis OTP Service

A simple OTP verification service built with **Node.js**, **Express**, and **Redis**.

## Features

* Generate and send OTP
* Store OTP in Redis
* OTP expires automatically after 30 seconds
* Verify OTP
* Delete OTP after successful verification
* Check remaining OTP lifetime (TTL)


---

## API Endpoints

### Send OTP

**POST** `/send-otp`

Request:

```json
{
  "phone": "9876543210"
}
```

Response:

```json
{
  "msg": "OTP Sent",
  "otp": "123456"
}
```

---

### Verify OTP

**POST** `/otp/verify`

Request:

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

Success Response:

```json
{
  "msg": "OTP Verified successfully!!"
}
```

Error Responses:

```json
{
  "msg": "Invalid OTP"
}
```

```json
{
  "msg": "OTP Expired or Not Found"
}
```

---

### Check OTP TTL

**GET** `/otp/:phone/ttl`

Example:

```
GET /otp/9876543210/ttl
```

Response:

```json
{
  "ttl": 18
}
```

TTL represents the number of seconds remaining before the OTP expires.

---

## Redis Storage

OTPs are stored using the key format:

```text
otp:<phone>
```

Example:

```text
otp:9876543210 -> 123456
```

The OTP automatically expires after **30 seconds**.

---

## Run Locally

Install dependencies:

```bash
npm install
```

Start Redis:

```bash
docker compose up
```

Run the server:

```bash
npm run dev
```

Server runs on:

```text
http://localhost:3003
```

---

## Learning Concepts

This project demonstrates:

* Redis SET
* Redis GET
* Redis DEL
* Redis TTL
* Redis key naming conventions
* Temporary data storage with expiration
* OTP verification flow
