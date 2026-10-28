import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { AppUser } from '../users/user.entity';

export type UserAccessScope =
  | { allCompanies: true }
  | { allCompanies: false; companyId: string };

@Injectable()
export class UserAccessPolicyService {
  constructor(private readonly config: ConfigService) {}

  getUserAccessScope(actor: AppUser): UserAccessScope {
    const platformCompanyId =
      this.config.getOrThrow<string>('PLATFORM_COMPANY_ID');

    const isPlatformCompany =
      actor.companyId === platformCompanyId;

    const isCompanyAdministrator =
      actor.role === Role.ADMIN ||
      actor.role === Role.SUPER_ADMIN;

    if (isPlatformCompany && isCompanyAdministrator) {
      return { allCompanies: true };
    }

    if (!actor.companyId) {
      throw new ForbiddenException(
        'A company assignment is required for user administration',
      );
    }

    return {
      allCompanies: false,
      companyId: actor.companyId,
    };
  }
}