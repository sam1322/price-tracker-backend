// Add Res from @nestjs/common
import { BadRequestException, Body, Controller, Get, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express'; // Import Response from express
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './jwt-authguard';
import { RequestDto } from 'src/dto/request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('guest')
  async createGuest(
    @Body() body: { fingerprint: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.fingerprint) {
      throw new BadRequestException('Fingerprint required');
    }

    const guestUser = await this.authService.createGuestUser(body.fingerprint);
    const { access_token } = await this.authService.login(guestUser);

    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { user: guestUser, message: 'Guest session created' };
  }


  // this api is for converting guest users into actual users
  @Post('guest/convert')
  @UseGuards(JwtAuthGuard)
  async convertGuest(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!req.user.isGuest) {
      throw new BadRequestException('User is not a guest');
    }

    const convertedUser = await this.authService.convertGuestToUser(
      req.user.guestId,
      createUserDto,
    );

    const { access_token } = await this.authService.login(convertedUser);

    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for registered users
    });

    return convertedUser;
  }


  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 registrations per 5 minutes
  async register(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.register(createUserDto);
    const { access_token } = await this.authService.login(user);

    // Set cookie after successful registration
    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      expires: new Date(Date.now() + 3600000 * 24), // 1 day
    });

    return user;
  }

  // Local Auth would also set a cookie instead of returning a token
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.login(req.user);
    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
      sameSite: 'lax',
      expires: new Date(Date.now() + 3600000 * 24), // Set cookie to expire
    });
    return req.user;
  }


  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the JWT cookie
    response.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }

  // --- Google Auth ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req,
    // @Query('redirect_uri') redirectUrl?: string,
  ) {
    // This endpoint now only initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
    // @Query('state') state?: string,

  ) {
    // This endpoint now handles the callback, creates a JWT, sets a cookie, and redirects
    const { access_token } = await this.authService.login(req.user);

    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      expires: new Date(Date.now() + 3600000 * 24), // Set cookie to expir
    });

    // Redirect back to the frontend application
    // response.redirect('http://localhost:3000/dashboard');
    response.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')


    // Get redirect URI from user object (passed through strategy)
    // const redirectUri = req.user?.redirectUri || '/';
    // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // response.redirect(`${frontendUrl}${redirectUri}`);

    // Decode the state parameter to get the original URL
    // let redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // if (state) {
    //   try {
    //     // Decode the state parameter
    //     const decodedState = Buffer.from(state, 'base64').toString('utf-8');
    //     const stateData = JSON.parse(decodedState);

    //     if (stateData.redirectUrl) {
    //       // Ensure it's a safe redirect (same origin)
    //       const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    //       const requestedUrl = new URL(stateData.redirectUrl, frontendUrl.origin);

    //       if (requestedUrl.origin === frontendUrl.origin) {
    //         redirectUrl = requestedUrl.href;
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error parsing state parameter:', error);
    //     // Fall back to default redirect
    //   }
    // }

    // response.redirect(redirectUrl);

  }

  // A protected route to check the user's session from the frontend
  // @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  // auth.controller.ts
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: RequestDto) {
    return await this.authService.findUserById(req.user.userId);
  }
}