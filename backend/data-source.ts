import { ENV } from 'src/consts';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'sqlite',
  database: `./config/reiverr${ENV === 'development' ? '.dev' : ''}.sqlite`,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: ENV === 'development',
  // migrations: [__dirname + '/../**/*.migration{.ts,.js}'],
});
