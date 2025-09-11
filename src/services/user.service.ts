import { BaseUserModel } from "..";
import { BaseUser } from "../types/base-user";

export class UserService {
  public static get = async ({
    type,
    search,
  }: {
    type?: string;
    search?: string;
  }): Promise<BaseUser[]> => {
    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await BaseUserModel.find(query);

    return users;
  };

  public static getById = async (
    id: string,
    ignore: string[] = []
  ): Promise<BaseUser | null> => {
    const user = await BaseUserModel.findById(id).select(
      ignore.map((field) => `-${field}`).join(" ")
    );

    return user;
  };

  public static getUserByEmail = async (
    email: string
  ): Promise<BaseUser | null> => {
    const emailSanitized = email.trim();

    const user = await BaseUserModel.findOne({ email: emailSanitized });

    return user;
  };

  public static post = async (
    email: string,
    passwordEncrypted: string,
    isAnonymous: boolean = false
  ): Promise<BaseUser | null> => {
    const user = await BaseUserModel.create({
      email,
      password: passwordEncrypted,
      is_anonymous: isAnonymous,
    });

    return user;
  };

  public static patch = async (
    idUser: string,
    data: any
  ): Promise<BaseUser | null> => {
    const user = await BaseUserModel.findByIdAndUpdate(idUser, data, {
      new: true,
    });

    return user;
  };
}
