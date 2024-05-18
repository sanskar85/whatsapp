import { NextFunction, Request, Response } from 'express';
import { INVOICE_PATH } from '../../config/const';
import APIError, { API_ERRORS } from '../../errors/api-errors';
import InternalError, { INTERNAL_ERRORS } from '../../errors/internal-errors';
import PaymentDB from '../../repository/payments/payment';
import PaymentBucketService from '../../services/payments/payment-bucket';
import { DeviceService } from '../../services/user';
import CSVParser from '../../utils/CSVParser';
import { Respond, RespondCSV, RespondFile, idValidator } from '../../utils/ExpressUtils';
import { FileUtils } from '../../utils/files';
import { CreateBucketValidationResult } from './payment.validator';

async function fetchTransactionDetail(req: Request, res: Response, next: NextFunction) {
	try {
		const paymentBucketService = await PaymentBucketService.getBucketById(req.locals.id);

		const transactionDetails = paymentBucketService.getTransactionDetails();

		return Respond({
			res,
			status: 200,
			data: {
				bucket_id: transactionDetails.bucket_id,
				gross_amount: transactionDetails.gross_amount,
				tax: transactionDetails.tax,
				discount: transactionDetails.discount,
				total_amount: transactionDetails.total_amount,
				status: transactionDetails.status,
			},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function fetchUserTransactions(req: Request, res: Response, next: NextFunction) {
	const options = {
		csv: false,
	};
	if (req.query.csv === 'true') {
		options.csv = true;
	}
	try {
		const device = await DeviceService.getServiceByClientID(req.locals.client_id);

		const payments = await PaymentBucketService.getPaymentRecords(device.getPhoneNumber());

		if (options.csv) {
			return RespondCSV({
				res,
				filename: 'Exported Contacts',
				data: CSVParser.exportPayments(payments),
			});
		} else {
			return Respond({
				res,
				status: 200,
				data: {
					payments,
				},
			});
		}
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function fetchAllTransactions(req: Request, res: Response, next: NextFunction) {
	const options = {
		csv: false,
	};
	if (req.query.csv === 'true') {
		options.csv = true;
	}
	try {
		const payments = await PaymentBucketService.getAllPaymentRecords();

		if (options.csv) {
			return RespondCSV({
				res,
				filename: 'Exported Contacts',
				data: CSVParser.exportPaymentsAdmin(payments),
			});
		} else {
			return Respond({
				res,
				status: 200,
				data: {
					payments,
				},
			});
		}
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function createPaymentBucket(req: Request, res: Response, next: NextFunction) {
	const data = req.locals.data as CreateBucketValidationResult;

	try {
		const paymentBucketService = await PaymentBucketService.createBucket(data);

		const transactionDetails = paymentBucketService.getTransactionDetails();

		return Respond({
			res,
			status: 200,
			data: {
				bucket_id: transactionDetails.bucket_id,
				gross_amount: transactionDetails.gross_amount,
				tax: transactionDetails.tax,
				discount: transactionDetails.discount,
				total_amount: transactionDetails.total_amount,
			},
		});
	} catch (err) {
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function applyCoupon(req: Request, res: Response, next: NextFunction) {
	try {
		const bucketService = await PaymentBucketService.getBucketById(req.locals.id);

		await bucketService.applyCoupon(req.locals.data);
		const transactionDetails = bucketService.getTransactionDetails();

		return Respond({
			res,
			status: 200,
			data: {
				bucket_id: transactionDetails.bucket_id,
				gross_amount: transactionDetails.gross_amount,
				tax: transactionDetails.tax,
				discount: transactionDetails.discount,
				total_amount: transactionDetails.total_amount,
			},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.COUPON_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_EXPIRED)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.COUPON_EXPIRED));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}
async function removeCoupon(req: Request, res: Response, next: NextFunction) {
	try {
		const bucketService = await PaymentBucketService.getBucketById(req.locals.id);

		await bucketService.removeCoupon();
		const transactionDetails = bucketService.getTransactionDetails();

		return Respond({
			res,
			status: 200,
			data: {
				bucket_id: transactionDetails.bucket_id,
				gross_amount: transactionDetails.gross_amount,
				tax: transactionDetails.tax,
				discount: transactionDetails.discount,
				total_amount: transactionDetails.total_amount,
			},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.COUPON_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.COUPON_EXPIRED)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.COUPON_EXPIRED));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function initializeBucketPayment(req: Request, res: Response, next: NextFunction) {
	try {
		const bucketService = await PaymentBucketService.getBucketById(req.locals.id);

		const paymentDetails = await bucketService.generatePaymentLink();

		return Respond({
			res,
			status: 200,
			data: paymentDetails,
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function downloadInvoice(req: Request, res: Response, next: NextFunction) {
	const [isIDValid, payment_id] = idValidator(req.params.id);

	if (!isIDValid) {
		return res.status(404);
	}
	try {
		const destination = __basedir + INVOICE_PATH + payment_id + '.pdf';

		if (FileUtils.exists(destination)) {
			return RespondFile({
				res,
				filepath: destination,
				filename: 'Invoice.pdf',
			});
		} else {
			const payment = await PaymentDB.findById(payment_id);
			if (!payment) {
				return res.status(404);
			}
			await payment.save();
			return RespondFile({
				res,
				filepath: destination,
				filename: 'Invoice.pdf',
			});
		}
	} catch (err) {
		res.status(404);
	}
}

async function confirmTransaction(req: Request, res: Response, next: NextFunction) {
	const order_id = req.body.order_id;
	const subscription_id = req.body.subscription_id;
	const payment_id = req.body.payment_id;

	try {
		const bucketService = await PaymentBucketService.getBucketById(req.locals.id);
		const paymentService = bucketService.getPaymentService();
		if (bucketService.getTransactionDetails().type === 'one-time') {
			if (!order_id || !payment_id) {
				return next(new APIError(INTERNAL_ERRORS.COMMON_ERRORS.INVALID_FIELD));
			}
			await paymentService.confirmOneTimePayment(order_id, payment_id);
		} else {
			if (!subscription_id || !payment_id) {
				return next(new APIError(INTERNAL_ERRORS.COMMON_ERRORS.INVALID_FIELD));
			}
			await paymentService.acceptSubscriptionPayment(subscription_id, payment_id);
		}

		return Respond({
			res,
			status: 200,
			data: {
				message: 'Bucket Purchase Completed',
			},
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.COMMON_ERRORS.NOT_FOUND)) {
				return next(new APIError(API_ERRORS.COMMON_ERRORS.NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.RAZORPAY_ERRORS.ORDER_PENDING)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.ORDER_PENDING));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function pauseSubscription(req: Request, res: Response, next: NextFunction) {
	try {
		const userService = await DeviceService.getServiceByClientID(req.locals.client_id);
		await userService.resumeSubscription(req.locals.data);
		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.ACCESS_DENIED));
			}
		}
		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

async function resumeSubscription(req: Request, res: Response, next: NextFunction) {
	try {
		const userService = await DeviceService.getServiceByClientID(req.locals.client_id);
		await userService.resumeSubscription(req.locals.data);
		return Respond({
			res,
			status: 200,
		});
	} catch (err) {
		if (err instanceof InternalError) {
			if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.PAYMENT_NOT_FOUND)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.PAYMENT_NOT_FOUND));
			} else if (err.isSameInstanceof(INTERNAL_ERRORS.PAYMENT_ERROR.ACCESS_DENIED)) {
				return next(new APIError(API_ERRORS.PAYMENT_ERRORS.ACCESS_DENIED));
			}
		}

		return next(new APIError(API_ERRORS.COMMON_ERRORS.INTERNAL_SERVER_ERROR, err));
	}
}

const TokenController = {
	fetchTransactionDetail,
	fetchUserTransactions,
	fetchAllTransactions,
	createPaymentBucket,
	applyCoupon,
	removeCoupon,
	initializeBucketPayment,
	confirmTransaction,
	pauseSubscription,
	resumeSubscription,
	downloadInvoice,
};

export default TokenController;
