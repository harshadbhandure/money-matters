export class GroupMemberDto {
  id: string;
  name: string;
  email: string;
}

export class GroupResponseDto {
  id: string;
  name: string;
  createdById: string;
  createdAt: Date;
  members?: GroupMemberDto[];
}
