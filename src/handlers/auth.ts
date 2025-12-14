import { Request, Response } from 'express';
import { authenticateUser, createData } from '../helpers/api';

export const authenticate = async (req: Request, res: Response): Promise<void> => {
    const { phoneNumber } = req.body;
    console.log(`logging in with ${phoneNumber}`);
    try {
        const response = await authenticateUser(phoneNumber);
        if (response?.length === 0) {
            const success = await createData('users', phoneNumber, { phoneNumber, balance: 0, date: Date.now() });
            if (success) {
                res.status(200).json({ message: 'User authenticated', status: 1, data: { phoneNumber, balance: 0, date: Date.now() } });
            } else {
                res.status(500).json({ message: 'Something went wrong', status: 0, data: null });
            }
        } else {
            res.status(200).json({ message: 'User authenticated', status: 1, data: response[0] });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', status: 0, data: null });
    }
};
