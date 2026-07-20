import ModuleService from "./module.service";

export class ModuleController {
  static async getAll({ query }: any) {
    return ModuleService.list(query);
  }

  static async getById({ params, error }: any) {
    const moduleItem = await ModuleService.getById(params.id);
    if (!moduleItem) {
      return error(404, { message: "Module not found" });
    }
    return moduleItem;
  }

  static async create({ body }: any) {
    return ModuleService.create(body);
  }

  static async update({ params, body }: any) {
    return ModuleService.update(params.id, body);
  }

  static async delete({ params }: any) {
    return ModuleService.delete(params.id);
  }
}
