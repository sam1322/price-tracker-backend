import { AuthGuard } from "@nestjs/passport";

export class JwtAuthGuard extends AuthGuard('jwt') {
  // You can add custom logic here if needed
//    canActivate(context: ExecutionContext) {
//     // Add custom logic here if needed
//     return super.canActivate(context);
//   }
}
