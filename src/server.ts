import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import './config/logging';
import { server } from './config/config';
import upload from 'express-fileupload';
import routes from './routes';
import path from 'path';
import cors from 'cors';
import { corsHandler } from './helpers/corsHandler';
import { createData } from './helpers/api';
import { generateCapitecBankPDF } from './handlers/capitec';
import { capitec_sample } from './handlers/capitec/sample';
export const app = express();
export const application = app;
export let httpServer: ReturnType<typeof http.createServer>;

app.use(upload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Remove default cors() to use our custom handler

export let secrets = {
    BASE_URL: 'https://documents-225250995708.europe-west1.run.app/api',
    DEEP_SEEK_API: 'sk-aee53cdb70a04ea7baa613ddc897ade0'
};

export const Main = () => {
    app.use(express.urlencoded({ extended: true }));
    const filesPath = path.join(__dirname, '..', 'files');
    app.use('/api', express.static(filesPath));

    // Apply CORS handler before routes to intercept all requests
    app.use(corsHandler);

    app.use(express.json());
    app.use('/api', routes);

    httpServer = http.createServer(app);

    httpServer.listen(server.SERVER_PORT, async () => {
        console.log(`Server started on ${server.SERVER_HOSTNAME}:${server.SERVER_PORT}`);
        generateCapitecBankPDF(capitec_sample);
    });
};

export const Shutdown = (callback: any) => httpServer && httpServer.close(callback);

Main();
