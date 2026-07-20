import UserService from "./user.service";

export class UserController {
  static async getAll({ query }: any) {
    return UserService.list(query);
  }

  static async getById({ params, error }: any) {
    const user = await UserService.getById(params.id);
    if (!user) {
      return error(404, { message: "User not found" });
    }
    return user;
  }

  static async create({ body }: any) {
    return UserService.create(body);
  }

  static async update({ params, body }: any) {
    return UserService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return UserService.delete(params.id);
  }
}
