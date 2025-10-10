import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ERRORS } from '../utils/errors'
import { PrismaClient } from '@prisma/client'
import type { WebAuthnChallenge, ChallengeType } from '@prisma/client'

@Injectable()
export class ChallengeService {
  private prisma = new PrismaClient()

  async create(
    requestId: WebAuthnChallenge['requestId'],
    type: WebAuthnChallenge['type'],
    challenge: WebAuthnChallenge['challenge'],
    expiresAt: WebAuthnChallenge['expiresAt'],
  ) {
    return await this.prisma.webAuthnChallenge.create({
      data: {
        requestId,
        type,
        challenge,
        expiresAt,
      },
    })
  }

  async get(requestId: WebAuthnChallenge['requestId'], type: ChallengeType) {
    const challenge = await this.prisma.webAuthnChallenge.findUnique({
      where: { requestId },
    })
    if (!challenge) {
      throw new NotFoundException(ERRORS.CHALLENGE_NOT_FOUND)
    } else if (challenge.isConsumed) {
      throw new BadRequestException(ERRORS.CHALLENGE_CONSUMED)
    } else if (new Date(challenge.expiresAt) < new Date()) {
      throw new BadRequestException(ERRORS.CHALLENGE_EXPIRED)
    } else if (challenge.type !== type) {
      throw new BadRequestException(ERRORS.CHALLENGE_MISMATCH)
    }
    return challenge
  }

  async update(requestId: WebAuthnChallenge['requestId'], data: Partial<WebAuthnChallenge>) {
    await this.prisma.webAuthnChallenge.update({
      where: { requestId },
      data,
    })
  }

  @Cron(CronExpression.EVERY_WEEKEND)
  async cleanExpriredChallenges() {
    const previousDay = new Date()
    previousDay.setDate(previousDay.getDate() - 1)
    await this.prisma.webAuthnChallenge.deleteMany({
      where: {
        expiresAt: {
          lt: previousDay,
        },
      },
    })
  }
}
