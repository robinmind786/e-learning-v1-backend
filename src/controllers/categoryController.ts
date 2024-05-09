import CrudService from "../services/CRUDService";
import Category from "../models/category/categoryModel";

const categoryController = new CrudService(Category);

export default categoryController;
