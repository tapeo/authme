import { User, userModel } from "../model/user.model";

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

    const users = await userModel.find(query);

    return users;
  };

  public static getById = async (
    id: string,
    ignore: string[] = []
  ): Promise<User> => {
    const user = await userModel
      .findById(id)
      .select(ignore.map((field) => `-${field}`).join(" "));

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };

  public static getUserByEmail = async (email: string): Promise<User> => {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const emailSanitized = email.trim();

      const user = await userModel.findOne({ email: emailSanitized });

      if (!user) {
        throw new Error("User not found");
      }

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
    const user = await userModel.create({
      email,
      password: passwordEncrypted,
      is_anonymous: isAnonymous,
    });

    if (!user) {
      throw new Error("Cannot create user");
    }

    return user;
  };

  public static patch = async (idUser: string, data: any): Promise<User> => {
    const user = await userModel.findByIdAndUpdate(idUser, data, { new: true });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };
}
