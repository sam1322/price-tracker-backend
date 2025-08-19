import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from 'src/generated/client';
// import { PrismaClient } from 'generated/prisma/client';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    console.log('Connecting to database...');
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';
// import { Pool } from 'pg';
// import { PrismaPg } from '@prisma/adapter-pg';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   private adapter: PrismaPg;

//   constructor() {
//     const pool = new Pool({ connectionString: process.env.DATABASE_URL });
//     const adapter = new PrismaPg(pool);

//     // Correct way to initialize with adapter in Prisma 5+
//     super({
//       adapter: adapter,
//       log: ['error', 'warn'],
//     });

//     this.adapter = adapter;
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//     await this.adapter?.pool.end(); // Properly close the connection pool
//   }
// }
