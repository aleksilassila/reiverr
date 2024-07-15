import { MyListItem } from './my-list-item.entity';
import { OmitType, PartialType } from '@nestjs/swagger';

export class MyListItemDto extends MyListItem {}

export class UpdateMyListItemDto extends PartialType(
  OmitType(MyListItem, ['user', 'id']),
) {}
