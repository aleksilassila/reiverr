export type Icon = {
  type: "play" | "download" | "delete" | "info" | "external-link";
  size?: "lg" | "md" | "sm";
};

export type ViewBase = {
  id: string;
  type: "general" | "list-with-details";
  label: string;
  priority?: number;
};

export type GeneralElementBase = {
  type:
    | "heading"
    | "toggle"
    | "select"
    | "action"
    | "input"
    | "external-link"
    | "open-view";
};
