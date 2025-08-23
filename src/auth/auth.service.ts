// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class AuthService {}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // For Local (Email/Password) Strategy
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(createUserDto: CreateUserDto) {
    const { email, password, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...userData,
      },
    });

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  // For JWT Generation
  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // For Social Logins (Google, GitHub, etc.)
  async findOrCreateUser(profile: any, provider: string): Promise<any> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider,
          providerAccountId: profile.id,
        },
      },
    });

    if (account) {
      return this.prisma.user.findUnique({ where: { id: account.userId } });
    }

    // If user exists with same email, link account
    if (profile.emails && profile.emails[0]) {
      const userByEmail = await this.prisma.user.findUnique({
        where: { email: profile.emails[0].value },
      });

      if (userByEmail) {
        await this.prisma.account.create({
          data: {
            userId: userByEmail.id,
            type: 'oauth',
            provider: provider,
            providerAccountId: profile.id,
            access_token: profile.accessToken,
            refresh_token: profile.refreshToken,
          },
        });
        return userByEmail;
      }
    }

    // Create a new user and account
    const newUser = await this.prisma.user.create({
      data: {
        name: profile.displayName,
        email:
          profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        image:
          profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        accounts: {
          create: {
            type: 'oauth',
            provider: provider,
            providerAccountId: profile.id,
            access_token: profile.accessToken,
            refresh_token: profile.refreshToken,
          },
        },
      },
    });

    return newUser;
  }

  // auth.service.ts

  async createGuestUser(fingerprint: string) {
    // Check if guest with this fingerprint already exists
    const existingGuest = await this.prisma.user.findFirst({
      where: {
        fingerprint,
        isGuest: true
      },
    });

    if (existingGuest) {
      return existingGuest;
    }

    // Create new guest user
    const guestUser = await this.prisma.user.create({
      data: {
        isGuest: true,
        fingerprint,
        // guestId: undefined, // Let Prisma generate it with @default(cuid())
        name: `Guest User ${Math.random().toString(36).substr(2, 4)}`,
      },
    });

    return guestUser;
  }

  async convertGuestToUser(guestId: string, createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    // Check if email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Find guest user
    const guestUser = await this.prisma.user.findUnique({
      where: { guestId },
    });

    if (!guestUser || !guestUser.isGuest) {
      throw new BadRequestException('Guest user not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert guest to regular user
    const convertedUser = await this.prisma.user.update({
      where: { id: guestUser.id },
      data: {
        email,
        password: hashedPassword,
        name: name || guestUser.name,
        isGuest: false,
        // emailVerified: new Date(), // Mark as verified or handle separately
      },
    });

    // Remove password from response
    const { password: _, ...result } = convertedUser;
    return result;
  }

  async findGuestByFingerprint(fingerprint: string) {
    return this.prisma.user.findFirst({
      where: {
        fingerprint,
        isGuest: true,
      },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isGuest: true,
        guestId: true,
        createdAt: true,
      },
    });
  }
}
