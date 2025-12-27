export class PaymentAPI {
    static async verifyPassword(userId, password) {
        try {
            const response = await fetch('../api/payment/verify_user_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    password: password
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();

            if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
                throw new Error('Server trả về HTML thay vì JSON: ' + text.substring(0, 100));
            }

            const result = JSON.parse(text);
            return result;
        } catch (error) {
            console.error('Password verification error:', error);
            throw new Error('Lỗi xác thực mật khẩu: ' + error.message);
        }
    }

    static async verifyUserPassword(userId) {
        try {
            const response = await fetch('../api/payment/verify_user_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('User password verification error:', error);
            throw new Error('Lỗi xác thực người dùng: ' + error.message);
        }
    }

    static async processPayment(paymentData) {
        try {
            const response = await fetch('../api/payment/process_payment.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();

            if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
                throw new Error('Server trả về HTML thay vì JSON: ' + text.substring(0, 200));
            }

            const result = JSON.parse(text);
            return result;
        } catch (error) {
            console.error('Payment processing error:', error);
            throw new Error('Lỗi xử lý thanh toán: ' + error.message);
        }
    }

    static async getInvoice(invoiceId) {
        try {
            const response = await fetch(`../api/payment/get_invoice.php?invoice=${invoiceId}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Invoice fetch error:', error);
            throw new Error('Lỗi tải hóa đơn: ' + error.message);
        }
    }
}