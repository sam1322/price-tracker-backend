import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
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
      passReqToCallback: true, // Add if you need the request object
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile, // Use the proper type
    done: VerifyCallback,
  ): Promise<any> {
    try {
    //   const user = await this.authService.findOrCreateUser(
    //     { ...profile, accessToken, refreshToken },
    //     'google'
    //   );
    //   done(null, user);
    } catch (err) {
    //   done(err, null);
    }
  }
}