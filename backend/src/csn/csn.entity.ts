import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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
  baseUrl: string;

  @ApiProperty({ required: true })
  @Column()
  apiKey: string;
}

@Entity()
export class CsnInstance {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @Column()
  baseUrl: string;

  @OneToMany(() => CsnPeer, (peer) => peer.instance)
  peers: Relation<CsnPeer[]>;
}
