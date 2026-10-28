import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './user-management/auth/auth.module';
import { TwoFaModule } from './user-management/two-fa/two-fa.module';
import { GoogleModule } from './user-management/google/google.module';
import { ProductsModule } from './product-management/products/products.module';
import { ServicesModule } from './services/services.module';
import { CompanyInfoModule } from './company-management/company-info/company-info.module';
import { JobsModule } from './jobs/jobs.module';
import { WebsiteStylesModule } from './user-management/website-styles-management/website-styles/website-styles.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { CompaniesModule } from './company-management/companies/companies.module';
import { CategoriesModule } from './product-management/categories/categories.module';
import { SubcategoriesModule } from './product-management/subcategories/subcategories.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CartModule } from './product-management/cart/cart.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ShipmentsModule } from './product-management/shipments/shipments.module';
import { CompanyInfoHistoryModule } from './company-management/company-info-history/company-info-history.module';
import { WebsiteStylesHistoryModule } from './user-management/website-styles-management/website-styles-history/website-styles-history.module';
import { SupplierOrdersModule } from './product-management/supplier-orders/supplier-orders.module';
import { TasksModule } from './task-management/tasks/tasks.module';
import { TeamsModule } from './task-management/teams/teams.module';
import { TasksStatusesModule } from './task-management/tasks-statuses/tasks-statuses.module';
import { TaskCommentsModule } from './task-management/task-comments/task-comments.module';
import { TeamMembersModule } from './task-management/team-members/team-members.module';
import { TaskAttachmentsModule } from './task-management/task-attachments/task-attachments.module';
import { AutomatedMessagesModule } from './messages-management/automated-messages/automated-messages.module';
import { DepartmentModule } from './company-management/department/department.module';
import { SubdepartmentModule } from './subdepartment/subdepartment.module';
import { RolesModule } from './roles/roles.module';
import { SuppliersModule } from './product-management/suppliers/suppliers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SubscriptionInvoicesModule } from './subscription-invoices/subscription-invoices.module';
import { MailModule } from './messages-management/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    InfrastructureModule,
    AuthModule,
    TwoFaModule,
    GoogleModule,
    ProductsModule,
    ServicesModule,
    CompanyInfoModule,
    JobsModule,
    WebsiteStylesModule,
    AnalyticsModule,
    UploadsModule,
    HealthModule,
    CompaniesModule,
    CategoriesModule,
    SubcategoriesModule,
    OrdersModule,
    PaymentsModule,
    CartModule,
    AddressesModule,
    ReviewsModule,
    ShipmentsModule,
    CompanyInfoHistoryModule,
    WebsiteStylesHistoryModule,
    SupplierOrdersModule,
    TasksModule,
    TeamsModule,
    TasksStatusesModule,
    TaskCommentsModule,
    TeamMembersModule,
    TaskAttachmentsModule,
    AutomatedMessagesModule,
    DepartmentModule,
    SubdepartmentModule,
    RolesModule,
    SuppliersModule,
    SubscriptionsModule,
    SubscriptionInvoicesModule,
    MailModule,
  ],
})
export class AppModule {}
