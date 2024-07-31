import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'sqlite',
  database: './config/reiverr.sqlite',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  // migrations: [__dirname + '/../**/*.migration{.ts,.js}'],
});
