/* import { Hono } from "hono";
import * as stringController from "../controllers/strings.controller.ts";

const meRoutes = new Hono();

meRoutes.get("/filter-by-natural-language", ...stringController.filter_by_natural_language);
meRoutes.post("/", ...stringController.create_string);
meRoutes.get("/", ...stringController.get_all_strings);
meRoutes.get("/:value", ...stringController.read_string);
meRoutes.delete("/:value", ...stringController.delete_string);

export default meRoutes;
 */
