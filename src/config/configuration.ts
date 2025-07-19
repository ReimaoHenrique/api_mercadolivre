export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mercadoPago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    webhookSecret:
      process.env.MERCADOPAGO_WEBHOOK_SECRET ||
      'b4d5bf7ec70f6916544e6c338410ccaa86d234c211f0a9f173eddf57381cb063',
  },
  urls: {
    success:
      process.env.SUCCESS_URL ||
      'https://koi-pretty-quietly.ngrok-free.app/success',
    failure:
      process.env.FAILURE_URL ||
      'https://koi-pretty-quietly.ngrok-free.app/failure',
    pending:
      process.env.PENDING_URL ||
      'https://koi-pretty-quietly.ngrok-free.app/pending',
    webhook:
      process.env.WEBHOOK_URL ||
      'https://koi-pretty-quietly.ngrok-free.app/webhook/mercadopago',
  },
  eventosApi: {
    token: process.env.EVENTOS_API_TOKEN,
    url: process.env.EVENTOS_API_URL,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});
