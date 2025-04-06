import { Request, Response } from "express";
import { Telegram } from "../extensions/telegram.extension";
import { UserService } from "../services/user.service";

export class UserController {
  public static meHandler = async (req: Request, res: Response) => {
    const idUser = req.headers.id_user as string;

    const user = await UserService.getById(idUser, [
      "password",
      "refresh_tokens",
      "reset_password_expires",
      "reset_password_token",
    ]);

    if (!user) {
      res.status(404).jsonTyped({
        status: "error",
        message: "User not found",
      });
      return;
    }

    res.status(200).jsonTyped({
      status: "success",
      data: user,
    });
  };

  public static deleteMeHandler = async (req: Request, res: Response) => {
    const idUser = req.headers.id_user as string;

    const user = await UserService.getById(idUser);

    if (!user) {
      res.status(404).jsonTyped({
        status: "error",
        message: "User not found",
      });
      return;
    }

    await Telegram.send({
      text: `User account deletion request: ${idUser} ${user.email} on ${req.headers.host}`,
    });

    res.status(200).jsonTyped({
      status: "success",
      message: "User account deletion requested",
    });
  };
}
