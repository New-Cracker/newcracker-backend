import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  jwt: {
    secretKey: process.env.JWT_SECRET,
  },
  database: {
    databaseUrl: process.env.DATABASE_URL,
  },
}));
