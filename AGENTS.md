# Billing
- All payment-creating endpoints must use the shared payments-policy guard before any Stripe write, so deactivation cannot be bypassed through direct requests.