import { GeneralElementBase } from "./base";

export interface HeadingElement extends GeneralElementBase {
  type: "heading";
  label: string;
  description?: string;
}

export interface ToggleElement extends GeneralElementBase {
  type: "toggle";
  label: string;
  description?: string;
  value: boolean;
  style: "checkbox" | "switch";
}

export interface SelectElement extends GeneralElementBase {
  type: "select";
  label: string;
  description?: string;
  value: string;
  options: {
    label: string;
    value: string;
  }[];
  style: "dropdown" | "radio";
}

export interface InputElement extends GeneralElementBase {
  type: "input";
  label: string;
  description?: string;
  value: string;
  placeholder?: string;
  style: "text" | "number" | "email" | "password";
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
}

export interface ExternalLinkElement extends GeneralElementBase {
  type: "external-link";
  label: string;
  description?: string;
  url: string;
}

export interface OpenViewElement extends GeneralElementBase {
  type: "open-view";
  label: string;
  description?: string;
  viewId: string;
}
