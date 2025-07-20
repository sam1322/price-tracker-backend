// Add Res from @nestjs/common
import { Controller, Post, UseGuards, Request, Get, Res, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express'; // Import Response from express
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './jwt-authguard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
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

  // --- Google Auth ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    // This endpoint now only initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
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
    response.redirect('http://localhost:3000/dashboard');
  }

  // A protected route to check the user's session from the frontend
  // @UseGuards(AuthGuard('jwt'))
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}