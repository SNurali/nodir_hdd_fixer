import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { createLogger } from '../../common/logger/pino.logger';

export interface GoogleProfile {
    id: string;
    displayName: string;
    name: {
        familyName: string;
        givenName: string;
    };
    emails: Array<{ value: string; verified: boolean }>;
    photos: Array<{ value: string }>;
    provider: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = createLogger('GoogleStrategy');

    constructor(
        @Inject(ConfigService) private readonly config: ConfigService,
        private readonly authService: AuthService,
    ) {
        const clientID = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL', '/auth/google/callback');
        const apiUrl = config.get<string>('APP_URL', 'http://localhost:3004');

        super({
            clientID,
            clientSecret,
            callbackURL: `${apiUrl}${callbackURL}`,
            scope: ['email', 'profile'],
            passReqToCallback: false,
        });

        this.logger.log('GoogleStrategy initialized successfully');
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback,
    ): Promise<void> {
        this.logger.log('Google OAuth validation', { profileId: profile.id, email: profile.emails?.[0]?.value });

        try {
            const result = await this.authService.validateGoogleUser({
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                fullName: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
                avatarUrl: profile.photos?.[0]?.value,
            });

            done(null, result);
        } catch (error) {
            this.logger.error('Google OAuth validation failed', { error });
            done(error, false);
        }
    }
}
