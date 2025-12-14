import { Request, Response } from 'express';
import { handleDocumentGeneration } from './standard/docgen';

export const generateDocs = async (req: Request, res: Response): Promise<void> => {
    const {
        accountHolder,
        accountNumber,
        months,
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
        isPayslipIncluded
    } = req.body;
    try {
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
            title: `${title}.`,
            bankType: bankType?.toUpperCase(),
            physicalAddress,
            isPayslipIncluded
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', status: 0, data: null });
    }
};
