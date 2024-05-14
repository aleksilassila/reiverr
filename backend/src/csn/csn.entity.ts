import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';

@Entity()
export class CsnInvite {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  expiresAt: Date;
}

@Entity()
export class CsnPeer {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CsnInstance, (instance) => instance.peers)
  instance: Relation<CsnInstance>;

  @ApiProperty({ required: true })
  @Column()
  host: string;

  @ApiProperty({ required: true })
  @Column()
  port: number;

  @ApiProperty({})
  @Column({ unique: true, generated: 'uuid' })
  apiKey: string;
}

@Entity()
export class CsnInstance {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  host: string;

  @ApiProperty({ required: true })
  @Column()
  port: number;

  @OneToMany(() => CsnPeer, (peer) => peer.instance)
  peers: Relation<CsnPeer[]>;

  @OneToOne(() => User, (user) => user.instance)
  @JoinColumn()
  user: Relation<User>;
}
