//imports
import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { db } from './db/client';
import { customers } from './db/schema';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';

//intialize express app
const app = express();

//Middleware
const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
    origin(origin, callback) {
        // Allow server-to-server requests (no origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

//Health check route (no DB) - registered first so it's never blocked
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'server is Live',
        timestamp: new Date().toISOString(),
    });
});

//DB health check — registered BEFORE /api router to avoid routing ambiguity
app.get('/api/health', async (_req: Request, res: Response) => {
    try {
        await db.select({ id: customers.id }).from(customers).limit(1);
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        const cause = (error as any)?.cause instanceof Error ? (error as any).cause.message : undefined;
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: msg,
            ...(cause ? { cause } : {}),
        });
    }
});

//Api routes (mounted after the explicit health routes)
app.use('/api', apiRoutes);

//404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

//Error handler (must be last)
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/api/health`);
});
