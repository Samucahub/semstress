import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get('GITHUB_CLIENT_ID', '');
    const clientSecret = configService.get('GITHUB_CLIENT_SECRET', '');

    super({
      clientID: clientID || 'dummy-id',
      clientSecret: clientSecret || 'dummy-secret',
      callbackURL: configService.get('GITHUB_CALLBACK_URL', 'http://localhost:3000/api/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const clientID = this.configService.get('GITHUB_CLIENT_ID', '');
    const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET', '');

    if (!clientID || !clientSecret) {
      return done(new Error('GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'));
    }

    const { id, username, emails, avatar_url } = profile;

    const user = {
      provider: 'github',
      id: id.toString(),
      email: emails[0]?.value,
      name: username,
      picture: avatar_url,
    };

    done(null, user);
  }
}

