import { JsonTyped } from "./typed-response";

declare global {
  namespace Express {
    interface Response {
      jsonTyped(data: JsonTyped): void;
    }
  }
}
