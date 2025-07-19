import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      //   callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
      // passReqToCallback: true, // Add if you need the request object
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile, // Use the proper type
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.findOrCreateUser(
        { ...profile, accessToken, refreshToken },
        'google'
      );
      if (!user) {
        throw new UnauthorizedException('Could not process user from provider.');
      }

      return user; // ✅ On success, return the user
    } catch (err) {
      // ❌ On failure, throw an exception
      console.log("error", err)
      throw new UnauthorizedException('Failed to validate user.', err.message);
    }
  }
}