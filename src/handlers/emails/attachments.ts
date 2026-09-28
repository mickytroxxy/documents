import { Attachment } from './standardbank';
import path from 'path';
import fs from 'fs';
export const FNB_ATTACHMENTS: Attachment[] = [
    {
        filename: 'logo.png',
        path: path.join(process.cwd(), 'files/fnb/logo.png'),
        cid: 'logo'
    },
    {
        filename: 'banner.png',
        path: path.join(process.cwd(), 'files/fnb/banner.png'),
        cid: 'banner'
    }
];
