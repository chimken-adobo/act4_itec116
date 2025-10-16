import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WeatherLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  city: string;

  @Column()
  temperature: number;

  @Column()
  condition: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
