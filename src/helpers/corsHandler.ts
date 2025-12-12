import { Request, Response, NextFunction } from 'express';

export function corsHandler(req: Request, res: Response, next: NextFunction) {
    // Allow all origins with wildcard (*)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    next();
}
