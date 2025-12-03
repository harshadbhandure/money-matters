import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const tokenHash = await bcrypt.hash(token, 10);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<RefreshToken | null> {
    const tokens = await this.findByUserId(userId);

    for (const storedToken of tokens) {
      const isValid = await bcrypt.compare(token, storedToken.tokenHash);
      if (isValid && new Date() < storedToken.expiresAt) {
        return storedToken;
      }
    }

    return null;
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.delete(tokenId);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async cleanExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
