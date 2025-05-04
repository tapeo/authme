import { Response } from "express";
import { JsonTyped } from "./typed-response";

export function extendResponse(response: Response) {
  response.jsonTyped = function (data: JsonTyped) {
    return this.json(data);
  };
}

declare global {
  namespace Express {
    interface Response {
      jsonTyped(data: JsonTyped): void;
    }
  }
}
