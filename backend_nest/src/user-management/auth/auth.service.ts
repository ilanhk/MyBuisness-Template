import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import { Response } from "express";
import * as jwt from "jsonwebtoken";
import nodemailer = require("nodemailer");
import * as speakeasy from "speakeasy";
import { AppUser } from "../users/user.entity";
import { UsersService } from "../users/users.service";
import { CompaniesService } from "../../company-management/companies/companies.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { sendEmail } from "../../messages-management/mail/send-email";

const ACCESS_TOKEN_EXPIRES_IN = "15m" as const;
const REFRESH_TOKEN_EXPIRES_IN = "3d" as const;
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: AppUser["role"];
  companyId: string | null;
  departmentId: string | null;
  inEmailList: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly companies: CompaniesService,
  ) {}

  async register(response: Response, body: RegisterDto) {
    const firstName = this.requiredString(body.firstName, "firstName");
    const lastName = this.requiredString(body.lastName, "lastName");
    const email = this.requiredEmail(body.email);
    const password = this.requiredString(body.password, "password");
    const domainName = this.requiredString(body.domainName, "domainName");

    this.validatePassword(password);

    if (await this.users.findByEmail(email)) {
      throw new ConflictException("User already exists");
    }

    const company = await this.companies.findByDomainName(domainName);
    let companyId: string | null = null;
    if (!company) {
      //throw new BadRequestException('Invalid company domain name');
      companyId = null;
    } else {
      companyId = company.id;
    }

    const user = await this.users.create({
      firstName,
      lastName,
      email,
      password,
      companyId,
      inEmailList: typeof body.inEmailList === "boolean" && body.inEmailList,
    });

    return this.authenticate(response, user);
  }

  async login(response: Response, body: LoginDto) {
    const email = this.requiredEmail(body.email);
    const password = this.requiredString(body.password, "password");
    const user = await this.users.findByEmail(email);

    if (
      !user ||
      !user.isActive ||
      !(await this.users.matchesPassword(user, password))
    ) {
      throw new HttpException(
        { message: "Invalid Email or Password" },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.twoFaSecret) {
      this.verifyTwoFactorCode(user.twoFaSecret, body.twoFaCode);
    }

    user.lastLogin = new Date();
    return this.authenticate(response, user);
  }

  async logout(response: Response, userId?: string) {
    if (userId) {
      await this.users.revokeAuthentication(userId);
    }

    this.clearCookie(response, "ACCESS_TOKEN_NAME");
    this.clearCookie(response, "REFRESH_TOKEN_NAME");

    return { message: "Logged out successfully" };
  }

  async refresh(
    response: Response,
    user: AppUser,
    presentedRefreshToken: string,
  ) {
    return this.authenticate(response, user, presentedRefreshToken);
  }

  async issueTokens(response: Response, user: AppUser) {
    return this.authenticate(response, user);
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const email = this.requiredEmail(body.email);
    const user = await this.users.findByEmail(email);
    const response = {
      message:
        "If an account exists for that email, a reset link has been sent.",
    };

    if (!user) {
      return response;
    }

    const resetToken = randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.users.save(user);

    const baseUrl = this.config.get<string>("BASE_URL");
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
    await sendEmail(
      email,
      "Password Reset",
      `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    );
    
    return response;
  }

  async resetPassword(body: ResetPasswordDto, routeToken?: string) {
    const resetToken =
      typeof body.resetToken === "string" ? body.resetToken : routeToken;
    const newPassword = this.requiredString(body.newPassword, "newPassword");

    if (!resetToken) {
      throw new HttpException(
        { message: "Invalid or expired token" },
        HttpStatus.BAD_REQUEST,
      );
    }

    this.validatePassword(newPassword);

    const tokenHash = createHash("sha256").update(resetToken).digest("hex");
    const user = await this.users.findByResetToken(tokenHash);

    if (!user) {
      throw new HttpException(
        { message: "Invalid or expired token" },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.users.resetPassword(user, newPassword);
    return { message: "Password has been reset successfully." };
  }

  private async authenticate(
    response: Response,
    user: AppUser,
    presentedRefreshToken?: string,
  ) {
    if (!user.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }

    const accessToken = this.createToken(
      user,
      "access",
      "JWT_SECRET_ACCESS",
      ACCESS_TOKEN_EXPIRES_IN,
    );
    const refreshToken = this.createToken(
      user,
      "refresh",
      "JWT_SECRET_REFRESH",
      REFRESH_TOKEN_EXPIRES_IN,
    );
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_MAX_AGE_MS,
    );

    if (presentedRefreshToken) {
      const currentRefreshTokenHash = createHash("sha256")
        .update(presentedRefreshToken)
        .digest("hex");
      const rotated = await this.users.rotateRefreshToken(
        user.id,
        currentRefreshTokenHash,
        refreshTokenHash,
        refreshTokenExpiresAt,
      );

      if (!rotated) {
        throw new UnauthorizedException("Refresh token has already been used");
      }
    } else {
      user.refreshTokenHash = refreshTokenHash;
      user.refreshTokenExpiresAt = refreshTokenExpiresAt;
      await this.users.save(user);
    }

    this.setCookie(
      response,
      "ACCESS_TOKEN_NAME",
      accessToken,
      ACCESS_TOKEN_MAX_AGE_MS,
    );
    this.setCookie(
      response,
      "REFRESH_TOKEN_NAME",
      refreshToken,
      REFRESH_TOKEN_MAX_AGE_MS,
    );

    return this.publicUser(user);
  }

  private createToken(
    user: AppUser,
    tokenType: "access" | "refresh",
    secretName: string,
    expiresIn: jwt.SignOptions["expiresIn"],
  ): string {
    const secret = this.config.get<string>(secretName);

    if (!secret) {
      throw new Error(`${secretName} must be set before using authentication.`);
    }

    return jwt.sign(
      {
        sub: user.id,
        tokenVersion: user.tokenVersion,
        tokenType,
      },
      secret,
      {
        expiresIn,
        algorithm: "HS256",
        issuer: "mybusiness-api",
        audience: "mybusiness-web",
      },
    );
  }

  private setCookie(
    response: Response,
    name: string,
    value: string,
    maxAge: number,
  ): void {
    const cookieName = this.config.get<string>(name);

    if (!cookieName) {
      throw new Error(`${name} must be set before using authentication.`);
    }

    response.cookie(cookieName, value, this.getCookieOptions(maxAge));
  }

  private getCookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") !== "development",
      sameSite: "strict" as const,
      path: "/",
      maxAge,
    };
  }

  private clearCookie(response: Response, configName: string): void {
    const cookieName = this.config.get<string>(configName);

    if (!cookieName) {
      throw new Error(`${configName} must be set before using authentication.`);
    }

    response.clearCookie(cookieName, { path: "/" });
  }

  private publicUser(user: AppUser): PublicUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
      inEmailList: user.inEmailList,
      isActive: user.isActive,
      twoFactorEnabled: Boolean(user.twoFaSecret),
    };
  }

  private requiredString(value: unknown, field: string): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(`${field} is required`);
    }

    return value.trim();
  }

  private requiredEmail(value: unknown): string {
    const email = this.requiredString(value, "email").toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("A valid email address is required");
    }

    return email;
  }

  private validatePassword(password: string): void {
    if (
      !/^\S{12,}$/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new BadRequestException(
        "Password must be at least 12 characters and include uppercase, lowercase, number, and special character.",
      );
    }
  }

  private verifyTwoFactorCode(secret: string, value: unknown): void {
    const twoFaCode = this.requiredString(value, "twoFaCode");
    const isVerified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: twoFaCode,
      window: 1,
    });

    if (!isVerified) {
      throw new UnauthorizedException("Invalid credentials");
    }
  }
}
