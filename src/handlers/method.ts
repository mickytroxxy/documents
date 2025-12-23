import { Request, Response } from 'express';
import { handleDocumentGeneration } from './standard/docgen';
import { authenticate } from './auth';
import { authenticateUser, updateData } from '../helpers/api';

export const generateDocs = async (req: Request, res: Response): Promise<void> => {
    const {
        accountHolder,
        accountNumber,
        months: mnth,
        salaryAmount,
        payDate,
        employeeID,
        paymentMethod,
        bankName,
        idNumber,
        taxReference,
        department,
        branchCode,
        companyName,
        companyAddress,
        companyEmail,
        companyTel,
        availableBalance,
        openBalance,
        title,
        bankType,
        physicalAddress,
        isPayslipIncluded,
        userPhone,
        totalCost,
        comment
    } = req.body;
    let months = 1;
    try {
        const userInfo = await authenticateUser(userPhone);
        if (userInfo?.length > 0) {
            const currentBalance = parseFloat(userInfo?.[0]?.balance);
            if (currentBalance >= parseFloat(totalCost)) {
                months = 3;
            }
            const response = await handleDocumentGeneration({
                accountHolder,
                accountNumber,
                months,
                openBalance,
                availableBalance,
                salaryAmount,
                payDate,
                employeeID,
                paymentMethod,
                bankName,
                idNumber,
                taxReference,
                department,
                branchCode,
                companyName,
                companyAddress,
                companyEmail,
                companyTel,
                title: bankType === 'STANDARD' ? `${title}.` : `${title}`,
                bankType: bankType?.toUpperCase(),
                physicalAddress,
                isPayslipIncluded,
                comment
            });
            res.status(200).json(response);
            console.log(response);
            if (months == 3) {
                const balance = (currentBalance - parseFloat(totalCost)).toString();
                await updateData('users', userPhone, { balance });
            }
        } else {
            res.status(401).json({ message: 'Authentication failed', status: 0, data: null });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', status: 0, data: null });
    }
};
