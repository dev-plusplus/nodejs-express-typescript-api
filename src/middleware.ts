import {NextFunction, Request, Response} from "express";

const jwt = require('jsonwebtoken');

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    // @ts-ignore
    req.user = null;
    if (token) {
        jwt.verify(token, process.env.SECRET, (err: any, decoded: any) => {
            if (!err) {
                // @ts-ignore
                req.user = decoded;
            }
            next();
        });
    } else {
        next();
    }
}

export const authenticatedUser = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user: Record<string, string> | null = req.user;
    if (user === null) {
        return res.status(401).json({error: "Unauthorized"});
    }
    next();
}
