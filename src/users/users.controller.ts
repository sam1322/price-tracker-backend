import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    
    constructor(private readonly usersService:UsersService ) {}
    @Get()
    findAll(): string {
        return this.usersService.getUsers();
        // return 'This action returns all users';
    }
}
