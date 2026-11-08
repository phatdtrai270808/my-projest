import productService from '../services/product.service.js';

export class ProductController {
  // GET /api/products
  async getAll(req, res) {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/products/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: 'Không tìm thấy món ăn' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/products
  async create(req, res) {
    try {
      const { name, price, category, image, recipe } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Tên món và giá bán là bắt buộc' });
      }
      const product = await productService.createProduct({ name, price, category, image, recipe });
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /api/products/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await productService.updateProduct(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // DELETE /api/products/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res.json({ success: true, message: 'Đã xóa món khỏi thực đơn' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/products/upload-image
  async uploadImage(req, res) {
    try {
      const { base64Data, fileName, productId } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu ảnh base64' });
      }
      const result = await productService.uploadImage(base64Data, fileName, productId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ProductController();

