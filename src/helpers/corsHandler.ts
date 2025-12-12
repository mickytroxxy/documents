import { Request, Response, NextFunction } from 'express';

export function corsHandler(req: Request, res: Response, next: NextFunction) {
    // Allow specific origins or use wildcard for development
    const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://documents-225250995708.europe-west1.run.app',
        'https://documents-225250995708.europe-west1.run.app'
    ];

    const origin = req.headers.origin || '';
    const requestOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    next();
}
