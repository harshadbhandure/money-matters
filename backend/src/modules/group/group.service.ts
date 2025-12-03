import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto, GroupMemberDto } from './dto/group-response.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: string,
  ): Promise<GroupResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const group = this.groupRepository.create({
      name: createGroupDto.name,
      createdById: userId,
      members: [user],
    });

    const savedGroup = await this.groupRepository.save(group);

    return this.mapToGroupResponse(savedGroup);
  }

  async getUserGroups(userId: string): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'member')
      .where('member.id = :userId', { userId })
      .getMany();

    return groups.map((group) => this.mapToGroupResponse(group));
  }

  async getGroup(groupId: string, userId: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isMember = group.members.some((member) => member.id === userId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return this.mapToGroupResponse(group);
  }

  async addMember(
    groupId: string,
    userIdToAdd: string,
    currentUserId: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const isCurrentUserMember = group.members.some(
      (member) => member.id === currentUserId,
    );

    if (!isCurrentUserMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const userToAdd = await this.userRepository.findOne({
      where: { id: userIdToAdd },
    });

    if (!userToAdd) {
      throw new NotFoundException('User to add not found');
    }

    const isAlreadyMember = group.members.some(
      (member) => member.id === userIdToAdd,
    );

    if (isAlreadyMember) {
      throw new ForbiddenException('User is already a member of this group');
    }

    group.members.push(userToAdd);
    await this.groupRepository.save(group);

    return this.mapToGroupResponse(group);
  }

  private mapToGroupResponse(group: Group): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      createdById: group.createdById,
      createdAt: group.createdAt,
      members: group.members
        ? group.members.map((member) => this.mapToMemberDto(member))
        : undefined,
    };
  }

  private mapToMemberDto(user: User): GroupMemberDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
