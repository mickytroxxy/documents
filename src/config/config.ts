import dotenv from 'dotenv';

dotenv.config();

export const DEVELOPMENT = process.env.NODE_ENV === 'development';
export const TEST = process.env.NODE_ENV === 'test';

export const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || '0.0.0.0';
export const SERVER_PORT = process.env.PORT ? Number(process.env.PORT) : process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 8080;

export const server = {
    SERVER_HOSTNAME,
    SERVER_PORT
};

export const DEEP_SEEK_API = process.env.DEEP_SEEK_API;
