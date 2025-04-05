import { UserModel } from "..";
import { User } from "../model/user.model";

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

    const users = await UserModel.find(query);

    return users;
  };

  public static getById = async (
    id: string,
    ignore: string[] = []
  ): Promise<User | null> => {
    const user = await UserModel.findById(id).select(
      ignore.map((field) => `-${field}`).join(" ")
    );

    return user;
  };

  public static getUserByEmail = async (
    email: string
  ): Promise<User | null> => {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const emailSanitized = email.trim();

      const user = await UserModel.findOne({ email: emailSanitized });

      return user;
    } catch (error) {
      console.error(`Error finding user by email: ${email}`, error);
      throw new Error("Error retrieving user");
    }
  };

  public static post = async (
    email: string,
    passwordEncrypted: string,
    isAnonymous: boolean = false
  ): Promise<User> => {
    const user = await UserModel.create({
      email,
      password: passwordEncrypted,
      is_anonymous: isAnonymous,
    });

    if (!user) {
      throw new Error("Cannot create user");
    }

    return user;
  };

  public static patch = async (
    idUser: string,
    data: any
  ): Promise<User | null> => {
    const user = await UserModel.findByIdAndUpdate(idUser, data, {
      new: true,
    });

    return user;
  };
}
