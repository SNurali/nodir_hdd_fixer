import { Controller, Post, Body, UsePipes, Res, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    TRegisterDto,
    TLoginDto,
    TForgotPasswordDto,
    TResetPasswordDto,
} from '@hdd-fixer/shared';
import { ThrottleAuth } from '../../common/throttler/throttler.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private static readonly sessionMarkerCookieName = 'hdd_fixer_session';

    constructor(
        private readonly _authService: AuthService,
        private readonly _config: ConfigService,
    ) { }

    private setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
        res.cookie('refresh_token', refreshToken, this._authService.getCookieOptions());
        res.cookie('access_token', accessToken, this._authService.getAccessTokenCookieOptions());
        res.cookie(
            AuthController.sessionMarkerCookieName,
            '1',
            this._authService.getSessionMarkerCookieOptions(),
        );
    }

    private clearSessionCookies(res: Response) {
        res.clearCookie('refresh_token');
        res.clearCookie('access_token');
        res.clearCookie(
            AuthController.sessionMarkerCookieName,
            this._authService.getSessionMarkerCookieOptions(),
        );
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new client' })
    @ThrottleAuth(3, 60000)
    @UsePipes(new ZodValidationPipe(RegisterDto))
    async register(@Body() dto: TRegisterDto, @Res({ passthrough: true }) res: Response) {
        const result = await this._authService.register(dto);

        this.setSessionCookies(res, result.access_token, result.refresh_token);

        return result;
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with phone/email and password' })
    @ThrottleAuth(5, 60000)
    @UsePipes(new ZodValidationPipe(LoginDto))
    async login(@Body() dto: TLoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this._authService.login(dto);

        this.setSessionCookies(res, result.access_token, result.refresh_token);

        return result;
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh JWT token' })
    @ThrottleAuth(10, 60000)
    async refresh(@Body('refresh_token') refreshToken: string, @Res({ passthrough: true }) res: Response) {
        const result = await this._authService.refreshToken(refreshToken);

        this.setSessionCookies(res, result.access_token, result.refresh_token);

        return result;
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout and clear cookies' })
    async logout(@Res({ passthrough: true }) res: Response) {
        this.clearSessionCookies(res);
        return { message: 'Logged out successfully' };
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset by phone/email' })
    @ThrottleAuth(3, 60000)
    @UsePipes(new ZodValidationPipe(ForgotPasswordDto))
    async forgotPassword(@Body() dto: TForgotPasswordDto) {
        return this._authService.forgotPassword(dto.login);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using one-time token' })
    @ThrottleAuth(5, 60000)
    @UsePipes(new ZodValidationPipe(ResetPasswordDto))
    async resetPassword(@Body() dto: TResetPasswordDto) {
        return this._authService.resetPassword(dto.token, dto.new_password);
    }

    // ==================== GOOGLE OAUTH ====================

    @Get('google/config')
    @ApiOperation({ summary: 'Check if Google OAuth is configured' })
    async googleConfig() {
        const isGoogleConfigured = !!(
            process.env.GOOGLE_CLIENT_ID && 
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_CLIENT_ID !== '' && 
            process.env.GOOGLE_CLIENT_SECRET !== ''
        );
        return { enabled: isGoogleConfigured };
    }

    @Get('google')
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = req.user as {
            access_token: string;
            refresh_token: string;
            user: {
                id: string;
                full_name: string;
                role: string;
                avatar_url: string | null;
                email: string | null;
            };
        };

        this.setSessionCookies(res, result.access_token, result.refresh_token);

        // Redirect to frontend with success
        const webUrl = this._config.get<string>('WEB_URL', 'http://localhost:3003');
        res.redirect(`${webUrl}/login?oauth=success`);
    }
}
