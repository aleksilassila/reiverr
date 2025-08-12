import { OrderOption } from "../types";
import { ViewBase } from "./base";
import {
  HeadingElement,
  ToggleElement,
  SelectElement,
  InputElement,
  ExternalLinkElement,
  OpenViewElement,
} from "./elements";
import { StreamActionElement, ActionElement } from "./actions";

export interface GeneralView extends ViewBase {
  type: "general";
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
  type: "list-with-details";
  items: ListWithDetailsItem[];
  order?: OrderOption;
  orderOptions: OrderOption[];
};

export type MediaSourceViews = ViewBase[];

export type MediaSourceView = GeneralView | ListWithDetailsView;
