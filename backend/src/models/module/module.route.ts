import { Elysia } from "elysia";
import { ModuleController } from "./module.controller";
import {
  CreateModuleBody,
  UpdateModuleBody,
  ModuleParams,
  ModuleListQuery,
} from "./module.schema";

export const moduleRoute = new Elysia({ prefix: "/modules" })
  .get("/", ModuleController.getAll, { query: ModuleListQuery })
  .get("/:id", ModuleController.getById, { params: ModuleParams })
  .post("/", ModuleController.create, { body: CreateModuleBody })
  .patch("/:id", ModuleController.update, { params: ModuleParams, body: UpdateModuleBody })
  .delete("/:id", ModuleController.delete, { params: ModuleParams });

export default moduleRoute;
