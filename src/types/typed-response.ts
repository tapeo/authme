export interface JsonTyped {
  status: "success" | "error";
  message?: string;
  error?: string;
  data?: any;
  code?: string;
}
