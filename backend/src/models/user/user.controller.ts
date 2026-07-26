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

  static async getProfile({ user, error }: any) {
    const profile = await UserService.getProfile(user.sub);
    if (!profile) {
      return error(404, { message: "User not found" });
    }
    return profile;
  }

  static async getDashboard({ user, error }: any) {
    const dashboard = await UserService.getDashboard(user.sub);
    if (!dashboard) {
      return error(404, { message: "User not found" });
    }
    return dashboard;
  }

  static async updateProfile({ body, user, error }: any) {
    const profile = await UserService.updateProfile(user.sub, body);
    if (!profile) {
      return error(404, { message: "User not found" });
    }
    return profile;
  }

  static async updateAccountSecurity({ body, user, error }: any) {
    if (body.password && (!/[a-zA-Z]/.test(body.password) || !/\d/.test(body.password))) {
      return error(400, { message: "Password must include both letters and numbers" });
    }

    return UserService.updateAccountSecurity(user.sub, body);
  }

  static async softDelete({ body, user }: any) {
    return UserService.softDelete(user.sub, body);
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
