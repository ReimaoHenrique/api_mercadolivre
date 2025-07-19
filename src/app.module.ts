import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';

import { PaymentStorageController } from './controllers/payment-storage.controller';
import { PaymentMonitorController } from './controllers/payment-monitor.controller';
import { MercadoPagoService } from './services/mercadopago.service';
import { WebhookValidationService } from './services/webhook-validation.service';
import { NotificationService } from './services/notification.service';

import { EventosApiService } from './services/eventos-api.service';
import { PaymentMonitorService } from './services/payment-monitor.service';

import { PaymentStorageService } from './services/payment-storage.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    PaymentController,
    WebhookController,

    PaymentStorageController,
    PaymentMonitorController,
  ],
  providers: [
    AppService,
    MercadoPagoService,
    WebhookValidationService,
    NotificationService,

    EventosApiService,
    PaymentMonitorService,

    PaymentStorageService,
  ],
})
export class AppModule {}
