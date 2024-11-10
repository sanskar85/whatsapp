import countries from './countries.json';

export const ROUTES = {
    INITIATE_RAZORPAY_PAYMENT: '/api/razorpay/initiate-payment/:bucket_id',
    HOME: '/',
    PRIVACY_POLICY: '/privacy-policy',
    PRICING: '/pricing',
    PLANS: ':plan',
    TERMS_AND_CONDITIONS: '/terms-and-conditions',
    FEATURES: '/features',
    API: '/api-docs',
};

export const THEME = {
    THEME_GREEN: '#4CB072',
};

export enum BILLING_PLANS_TYPE {
    SILVER_MONTH = 'SILVER_MONTH',
    GOLD_MONTH = 'GOLD_MONTH',
    PLATINUM_MONTH = 'PLATINUM_MONTH',
    SILVER_YEAR = 'SILVER_YEAR',
    GOLD_YEAR = 'GOLD_YEAR',
    PLATINUM_YEAR = 'PLATINUM_YEAR',
}

export const BILLING_PLANS_DETAILS = {
    [BILLING_PLANS_TYPE.SILVER_MONTH]: { amount: 1500, user_count: 1 },
    [BILLING_PLANS_TYPE.GOLD_MONTH]: { amount: 2500, user_count: 2 },
    [BILLING_PLANS_TYPE.PLATINUM_MONTH]: { amount: 3000, user_count: 4 },
    [BILLING_PLANS_TYPE.SILVER_YEAR]: { amount: 15000, user_count: 1 },
    [BILLING_PLANS_TYPE.GOLD_YEAR]: { amount: 20000, user_count: 2 },
    [BILLING_PLANS_TYPE.PLATINUM_YEAR]: { amount: 30000, user_count: 4 },
};

export enum TRANSACTION_DETAIL {
    CODE = 'CODE',
    CHECKING_COUPON = 'CHECKING_COUPON',
    COUPON_VALID = 'COUPON_VALID',
    COUPON_ERROR = 'COUPON_ERROR',
    TRANSACTION_ID = 'TRANSACTION_ID',
    GROSS_AMOUNT = 'GROSS_AMOUNT',
    TAX = 'TAX',
    DISCOUNT = 'DISCOUNT',
    TOTAL_AMOUNT = 'TOTAL_AMOUNT',
    TRANSACTION_ERROR = 'TRANSACTION_ERROR',
    STATUS = 'STATUS',
    BUCKET_ID = 'BUCKET_ID',
}

export const APP_URL = 'https://www.whatsleads.in';
// export const SERVER_URL = 'https://api.whatsleads.in';
// export const APP_URL = 'http://localhost:8282';
export const SERVER_URL = 'http://localhost:8282';
export const RAZORPAY_KEY_ID = import.meta.env.RAZORPAY_KEY_ID;

export const COUNTRIES: {
    [country_code: string]: string;
} = countries;
