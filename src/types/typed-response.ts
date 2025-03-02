export interface JsonTyped {
  status: "success" | "error";
  message?: string;
  data?: any;
  code?: string;
}
