import { GeneralElementBase, Icon } from "./base";

export interface ActionElement extends GeneralElementBase {
  type: "action";

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

export interface StreamActionElement extends GeneralElementBase {
  type: "action";

  /**
   * The label of the action
   * @example "Stream"
   */
  label: "Stream";

  /**
   * The type of the action
   * @example "stream"
   */
  action: "stream";

  icon: {
    type: "play";
    size?: "lg" | "md" | "sm";
  };

  disabled?: boolean;
}
