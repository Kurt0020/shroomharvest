import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  type ListProductsQuery,
} from "../validators/product.validators.js";
import { createProduct, getProductById, listProducts } from "../services/productService.js";

export const productsRouter = Router();

productsRouter.get(
  "/",
  validate(listProductsQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListProductsQuery;
    const result = await listProducts(req.shopId as number, query);
    res.json(result);
  })
);

productsRouter.get(
  "/:id",
  validate(productIdParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number };
    const product = await getProductById(req.shopId as number, id);
    res.json({ data: product });
  })
);

productsRouter.post(
  "/",
  validate(createProductSchema, "body"),
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.shopId as number, req.body);
    res.status(201).json({ data: product });
  })
);
