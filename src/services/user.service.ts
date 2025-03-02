import { User } from "@/model/user.model";

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

    const users = await User.find(query);

    return users;
  };

  public static getById = async (id: string, ignore: string[] = []) => {
    const user = await User.findById(id).select(
      ignore.map((field) => `-${field}`).join(" ")
    );

    return user;
  };

  public static getUserByEmail = async (email: string) => {
    const user = await User.findOne({ email: email });

    return user;
  };

  public static post = async (
    email: string,
    passwordEncrypted: string,
    isAnonymous: boolean = false
  ) => {
    const user = await User.create({
      email,
      password: passwordEncrypted,
      is_anonymous: isAnonymous,
    });

    return user;
  };

  public static patch = async (idUser: string, data: any) => {
    const user = await User.findByIdAndUpdate(idUser, data, { new: true });

    return user;
  };
}
