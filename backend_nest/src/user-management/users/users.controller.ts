import { Body, ConflictException, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/cookie-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppUser } from './user.entity';
import { UsersService } from './users.service';
import { toAdminResponse, toProfileResponse } from './user-response';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  getProfile(@CurrentUser() user: AppUser) {
    return toProfileResponse(user);
  }

  @Put('profile')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  async updateProfile(@CurrentUser() user: AppUser, @Body() body: Record<string, unknown>) {
    return toProfileResponse(await this.users.updateProfile(user.id, body));
  }

  @Get()
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  getUsers() {
    return this.users.findAll();
  }

  @Post('create')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  async createUser(@Body() body: CreateUserDto) {
  const user = await this.users.create({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    password: body.password,
    role: body.role,
    companyId: body.companyId,
    departmentId: body.departmentId,
    inEmailList: body.inEmailList,
  });

  return toAdminResponse(user);
}


  @Get(':id')
  @UseGuards(AccessTokenGuard)
  getUserById(@Param('id') id: string) {
    return this.users.findSafeById(id);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return toAdminResponse(await this.users.updateUser(id, body));
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.users.deleteUser(id);
    return { message: 'User deleted successfuly' };
  }
}
