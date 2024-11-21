require('dotenv').config();
const express = require('express');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

const app = express();

const client = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});
client.connect().catch(console.error);

let rateLimitScript;
try {
    rateLimitScript = fs.readFileSync(path.join(__dirname, 'rate_limiter.lua'), 'utf-8');
} catch (err) {
    console.error('Error al leer rate_limiter.lua:', err);
    process.exit(1);
}

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT) || 100;
const TIME_WINDOW = parseInt(process.env.TIME_WINDOW) || 60;

async function rateLimiter(req, res, next) {
    const ip = req.ip;

    try {
        // Evalúa el script usando el comando `sendCommand`
        const allowed = await client.sendCommand([
            'EVAL',
            rateLimitScript,
            '1',    // Número de keys
            ip,     // Key (dirección IP)
            RATE_LIMIT.toString(),  // Argumento RATE_LIMIT
            TIME_WINDOW.toString()  // Argumento TIME_WINDOW
        ]);

        if (parseInt(allowed) === 1) {
            console.log(`Allowed request from ${ip}`);
            next();
        } else {
            console.log(`Blocked request from ${ip}`);
            res.status(429).json({ message: 'Too many requests. Please try again later.' });
        }
    } catch (err) {
        console.error('Error en rate limiter:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

app.use(rateLimiter);

app.get('/', (req, res) => {
    res.send('Welcome to the Rate Limited API!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

