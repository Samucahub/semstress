import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID', '');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET', '');

    super({
      clientID: clientID || 'dummy-id',
      clientSecret: clientSecret || 'dummy-secret',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback'),
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      accessType: 'offline',
      prompt: 'consent',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const clientID = this.configService.get('GOOGLE_CLIENT_ID', '');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', '');

    if (!clientID || !clientSecret) {
      return done(new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'));
    }

    const { id, name, emails, photos } = profile;

    const user = {
      provider: 'google',
      id,
      email: emails[0]?.value,
      name: name?.givenName || name?.displayName,
      picture: photos[0]?.value,
    };

    done(null, user);
  }
}
