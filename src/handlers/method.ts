import { Request, Response } from 'express';
import { handleDocumentGeneration } from './standard/docgen';
import { authenticate } from './auth';
import { authenticateUser, updateData } from '../helpers/api';
import { parse } from 'path';
export type DocumentConfig = {
    documentType: 'BANK_STATEMENT' | 'PAYSLIP';
    price: number;
};
export type Country = {
    countryName: string;
    country_code: 'ZA' | 'NG' | 'US';
    documents: DocumentConfig[];
};

export const countries: Country[] = [
    {
        countryName: 'South Africa',
        country_code: 'ZA',
        documents: [
            { documentType: 'BANK_STATEMENT', price: 600 },
            { documentType: 'PAYSLIP', price: 150 }
        ]
    },
    {
        countryName: 'Nigeria',
        country_code: 'NG',
        documents: [
            { documentType: 'BANK_STATEMENT', price: 200 },
            { documentType: 'PAYSLIP', price: 100 }
        ]
    },
    {
        countryName: 'United States',
        country_code: 'US',
        documents: [
            { documentType: 'BANK_STATEMENT', price: 200 },
            { documentType: 'PAYSLIP', price: 100 }
        ]
    }
];

export type CompanyInfo = {
    companyId: string;
    companyName: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    roles: string[];
};

export const companies: CompanyInfo[] = [
    {
        companyId: 'cmp-001',
        companyName: 'Tshepiso Cleaning Services',
        website: 'https://tshepisocleaning.pro',
        email: 'hr@tshepisocleaning.pro',
        phone: '+27 71 482 1934',
        address: '45 Main Road, Tembisa, Gauteng, 1632',
        roles: [
            'Owner',
            'Director',
            'General Manager',
            'Operations Manager',
            'HR Manager',
            'Payroll Officer',
            'Accounts Payable Clerk',
            'Accounts Receivable Clerk',
            'Finance Administrator',
            'Site Supervisor',
            'Cleaning Staff',
            'Shift Supervisor',
            'Health & Safety Officer',
            'Procurement Officer',
            'Office Administrator'
        ]
    },
    {
        companyId: 'cmp-002',
        companyName: 'Jozi Motors',
        website: 'https://jozimotors.shop',
        email: 'accounts@jozimotors.shop',
        phone: '+27 82 615 7749',
        address: '112 Jules Street, Jeppestown, Johannesburg, 2043',
        roles: [
            'Dealer Principal',
            'Managing Director',
            'Financial Manager',
            'Payroll Administrator',
            'Accounts Clerk',
            'Sales Manager',
            'Sales Executive',
            'Vehicle Buyer',
            'Stock Controller',
            'Workshop Manager',
            'Service Advisor',
            'Mechanic',
            'Panel Beater',
            'Admin Clerk',
            'Compliance Officer'
        ]
    },
    {
        companyId: 'cmp-003',
        companyName: 'May Family Holdings',
        website: 'https://mayfamilyholdings.org',
        email: 'payroll@mayfamilyholdings.org',
        phone: '+27 83 902 1186',
        address: '18 Kingfisher Drive, Midrand, Gauteng, 1685',
        roles: [
            'Director',
            'Chairperson',
            'Group CEO',
            'Group CFO',
            'Finance Manager',
            'Payroll Manager',
            'HR Business Partner',
            'Accounts Payable Officer',
            'Accounts Receivable Officer',
            'Internal Auditor',
            'Compliance Manager',
            'Legal Administrator',
            'Office Administrator',
            'Executive Assistant',
            'Facilities Manager'
        ]
    },
    {
        companyId: 'cmp-004',
        companyName: 'Muda Digitals',
        website: 'https://mudadigitals.shop',
        email: 'finance@mudadigitals.shop',
        phone: '+27 76 331 9042',
        address: '77 Rivonia Boulevard, Sandton, Johannesburg, 2196',
        roles: [
            'Founder',
            'Managing Director',
            'Finance Manager',
            'Payroll Coordinator',
            'HR Administrator',
            'Project Manager',
            'Account Manager',
            'UI/UX Designer',
            'Frontend Developer',
            'Backend Developer',
            'Mobile App Developer',
            'DevOps Engineer',
            'QA Engineer',
            'Digital Marketing Manager',
            'Content Strategist'
        ]
    },
    {
        companyId: 'cmp-005',
        companyName: 'Gauteng Tech Digital',
        website: 'https://gautengtech.digital',
        email: 'payments@gautengtech.digital',
        phone: '+27 79 554 6632',
        address: '26 Fredman Drive, Sandton, Johannesburg, 2031',
        roles: [
            'Chief Executive Officer',
            'Chief Technology Officer',
            'Chief Financial Officer',
            'Finance Controller',
            'Payroll Officer',
            'HR Manager',
            'IT Administrator',
            'Systems Engineer',
            'Network Engineer',
            'Cloud Engineer',
            'Cybersecurity Analyst',
            'Technical Support Manager',
            'Service Desk Agent',
            'Customer Success Manager',
            'Vendor Manager'
        ]
    },
    {
        companyId: 'cmp-006',
        companyName: 'Gauteng Tech Guru',
        website: 'https://gautengtech.guru',
        email: 'hr@gautengtech.guru',
        phone: '+27 74 210 8891',
        address: '9 High Street, Kempton Park, Gauteng, 1619',
        roles: [
            'Business Owner',
            'Managing Director',
            'Finance Administrator',
            'Payroll Assistant',
            'HR Coordinator',
            'IT Consultant',
            'Solutions Architect',
            'Project Consultant',
            'Technical Trainer',
            'Support Technician',
            'Field Technician',
            'Sales Consultant',
            'Account Executive',
            'Office Administrator',
            'Client Liaison Officer'
        ]
    },
    {
        companyId: 'cmp-007',
        companyName: 'Zolain Digital',
        website: 'https://zolain.digital',
        email: 'payslips@zolain.digital',
        phone: '+27 81 639 4470',
        address: '14 Loop Street, Cape Town City Centre, 8001',
        roles: [
            'Founder',
            'Creative Director',
            'Managing Director',
            'Finance Manager',
            'Payroll Specialist',
            'HR Manager',
            'Marketing Strategist',
            'Performance Marketing Manager',
            'SEO Specialist',
            'Social Media Manager',
            'Content Creator',
            'Graphic Designer',
            'Video Editor',
            'Client Account Manager',
            'Brand Manager'
        ]
    }
];

export const get_countries = async (req: Request, res: Response): Promise<void> => {
    console.log('Fetching countries...');
    res.status(200).json({ message: 'Countries fetched successfully', status: 1, data: countries });
};
export const get_companies = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ message: 'Companies fetched successfully', status: 1, data: companies });
};
export const get_banks = async (req: Request, res: Response): Promise<void> => {
    const bankTypeOptions = [
        { value: 'standard', label: 'Standard Bank' },
        { value: 'tymebank', label: 'TymeBank Business' },
        { value: 'FNB', label: 'FNB' },
        { value: 'CAPITEC', label: 'Capitec' }
    ];
    res.status(200).json({ message: 'Banks fetched successfully', status: 1, data: bankTypeOptions });
};
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
        comment,
        accountType,
        companyId
    } = req.body;
    let months = 1;
    try {
        const userInfo = await authenticateUser(userPhone);
        if (userInfo?.length > 0) {
            const currentBalance = parseFloat(userInfo?.[0]?.balance);
            if (currentBalance >= parseFloat(totalCost)) {
                months = parseInt(mnth);
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
                comment,
                accountType,
                companyId
            });
            res.status(200).json(response);
            console.log(response);
            if (currentBalance >= parseFloat(totalCost)) {
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
