import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';
import { MercadoPagoService } from './services/mercadopago.service';
import { WebhookValidationService } from './services/webhook-validation.service';
import { NotificationService } from './services/notification.service';
import { AuditService } from './services/audit.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [AppController, PaymentController, WebhookController],
  providers: [
    AppService, 
    MercadoPagoService, 
    WebhookValidationService,
    NotificationService,
    AuditService,
  ],
})
export class AppModule {}
