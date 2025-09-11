import { BaseUserModel } from "..";
import { User } from "../types/user";

export class UserService {
  public static get = async ({
    type,
    search,
  }: {
    type?: string;
    search?: string;
  }): Promise<User[]> => {
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
  ): Promise<User | null> => {
    const user = await BaseUserModel.findById(id).select(
      ignore.map((field) => `-${field}`).join(" ")
    );

    return user;
  };

  public static getUserByEmail = async (
    email: string
  ): Promise<User | null> => {
    const emailSanitized = email.trim();

    const user = await BaseUserModel.findOne({ email: emailSanitized });

    return user;
  };

  public static post = async (
    email: string,
    passwordEncrypted: string,
    isAnonymous: boolean = false
  ): Promise<User | null> => {
    const user = await BaseUserModel.create({
      email,
      password: passwordEncrypted,
      is_anonymous: isAnonymous,
      created_at: new Date(),
    });

    return user;
  };

  public static patch = async (
    idUser: string,
    data: any
  ): Promise<User | null> => {
    const user = await BaseUserModel.findByIdAndUpdate(idUser, data, {
      new: true,
    });

    return user;
  };
}
