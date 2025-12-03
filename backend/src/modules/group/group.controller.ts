import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupResponseDto> {
    return this.groupService.createGroup(createGroupDto, user.id);
  }

  @Get()
  async getUserGroups(
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupResponseDto[]> {
    return this.groupService.getUserGroups(user.id);
  }

  @Get(':id')
  async getGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupResponseDto> {
    return this.groupService.getGroup(groupId, user.id);
  }

  @Post(':id/members')
  async addMember(
    @Param('id') groupId: string,
    @Body('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupResponseDto> {
    return this.groupService.addMember(groupId, userId, user.id);
  }
}
