export interface RequestDto {
  user: {
    // sub: string;
    userId: string
    email: string;
    iat: number;
    exp: number
  };
}
