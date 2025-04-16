import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  // Fixed role field with explicit type and default value
  @Prop({ type: String, enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({ required: false })
  age: number;

  @Prop()
  phoneNumber: number;

  @Prop()
  address: string;

  // Fixed active field with explicit type and default value
  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ enum: ['male', 'female'] })
  gender: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
