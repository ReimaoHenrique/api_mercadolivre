export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  },
  urls: {
    success: process.env.SUCCESS_URL || 'http://localhost:3000/success',
    failure: process.env.FAILURE_URL || 'http://localhost:3000/failure',
    pending: process.env.PENDING_URL || 'http://localhost:3000/pending',
    webhook: process.env.WEBHOOK_URL || 'https://your-domain.com/webhook/mercadopago',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});

