import { OrderOption } from './types';

type Icon = {
  type: 'play' | 'download' | 'delete' | 'info' | 'external-link';
  size?: 'lg' | 'md' | 'sm';
};

export type ViewBase = {
  id: string;
  type: 'general' | 'list-with-details';
  label: string;
  priority?: number;
};

type GeneralElementBase = {
  type:
    | 'heading'
    | 'toggle'
    | 'select'
    | 'action'
    | 'input'
    | 'external-link'
    | 'open-view';
};

export interface HeadingElement extends GeneralElementBase {
  type: 'heading';
  label: string;
  description?: string;
}

export interface ToggleElement extends GeneralElementBase {
  type: 'toggle';
  label: string;
  description?: string;
  value: boolean;
  style: 'checkbox' | 'switch';
}

export interface SelectElement extends GeneralElementBase {
  type: 'select';
  label: string;
  description?: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  style: 'dropdown' | 'radio';
}

export interface ActionElement extends GeneralElementBase {
  type: 'action';

  /**
   * The label of the action
   * @example "Stream"
   */
  label: string;

  /**
   * The type of the action
   * @example "stream"
   */
  action: string;

  disabled?: boolean;

  icon?: Icon;

  // /**
  //  * The parameters to be passed to the action
  //  */
  // params: Record<string, any>;
}

export interface -StreamActionElement extends GeneralElementBase {
  type: 'action';

  /**
   * The label of the action
   * @example "Stream"
   */
  label: 'Stream';

  /**
   * The type of the action
   * @example "stream"
   */
  action: 'stream';

  disabled?: boolean;
}

export interface InputElement extends GeneralElementBase {
  type: 'input';
  label: string;
  description?: string;
  value: string;
  placeholder?: string;
  style: 'text' | 'number' | 'email' | 'password';
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}

export interface ExternalLinkElement extends GeneralElementBase {
  type: 'external-link';
  label: string;
  description?: string;
  url: string;
}

export interface OpenViewElement extends GeneralElementBase {
  type: 'open-view';
  label: string;
  description?: string;
  viewId: string;
}

export interface GeneralView extends ViewBase {
  type: 'general';
  elements: (
    | HeadingElement
    | ToggleElement
    | SelectElement
    | StreamActionElement
    | ActionElement
    | InputElement
    | ExternalLinkElement
    | OpenViewElement
  )[];
}

export type SortableProperty = {
  /**
   * The label of the property
   * @example "Resolution"
   */
  label: string;

  /**
   * Used for sorting and filtering, or displayed if `formatted` is not provided.
   * @example 1080
   */
  value: string | number;

  /**
   * The formatted value of the property
   * @example "1080p"
   */
  formatted: string | undefined;

  /**
   * Secondary properties are not shown in list views
   */
  secondary?: boolean;
};

export type ListWithDetailsItem = {
  /**
   * Unique id for the item, used for referencing it.
   */
  id: string;

  /**
   * Title of the item.
   */
  label: string;

  /**
   * A short optional description of the item.
   */
  description?: string;

  /**
   * A list of properties that are shown to the user in the stream selection UI.
   */
  properties: SortableProperty[];

  /**
   * A list of actions that the user can perform on the stream.
   */
  actions: (StreamActionElement | ActionElement | OpenViewElement)[];
};

export type ListWithDetailsView = ViewBase & {
  type: 'list-with-details';
  items: ListWithDetailsItem[];
  order?: OrderOption;
  orderOptions: OrderOption[];
};

export type MediaSourceViews = ViewBase[];

export type MediaSourceView = GeneralView | ListWithDetailsView;
