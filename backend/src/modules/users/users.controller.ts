import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../user/user.entity';

export interface UserSearchDto {
  id: string;
  name: string;
  email: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('email') email: string): Promise<UserSearchDto[]> {
    if (!email || email.length < 3) {
      return [];
    }

    const users = await this.usersService.searchByEmail(email);
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  }
}
