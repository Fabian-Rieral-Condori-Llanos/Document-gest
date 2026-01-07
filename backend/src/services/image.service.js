const mongoose = require('mongoose');
const Image = mongoose.model('Image');

class ImageService {
    /**
     * Obtiene una imagen por ID
     * @param {string} imageId
     */
    static async getById(imageId) {
        const image = await Image.findById(imageId)
            .select(Image.listFields)
            .exec();

        if (!image) {
            throw { fn: 'NotFound', message: 'Image not found' };
        }

        return image;
    }

    /**
     * Obtiene imágenes por ID de auditoría
     * @param {string} auditId
     */
    static async getByAuditId(auditId) {
        return Image.find({ auditId })
            .select(Image.listFields)
            .exec();
    }

    /**
     * Crea una nueva imagen o retorna la existente si ya existe
     * @param {Object} imageData
     */
    static async create(imageData) {
        // Buscar si ya existe una imagen con el mismo valor
        const existing = await Image.findOne({ value: imageData.value });
        
        if (existing) {
            return { _id: existing._id };
        }

        try {
            const image = new Image(imageData);
            const saved = await image.save();
            return { _id: saved._id };
        } catch (err) {
            console.error('Error creating image:', err);
            throw err;
        }
    }

    /**
     * Elimina una imagen
     * @param {string} imageId
     */
    static async delete(imageId) {
        const image = await Image.findByIdAndDelete(imageId);

        if (!image) {
            throw { fn: 'NotFound', message: 'Image not found' };
        }

        return image;
    }

    /**
     * Elimina todas las imágenes de una auditoría
     * @param {string} auditId
     */
    static async deleteByAuditId(auditId) {
        const result = await Image.deleteMany({ auditId });
        return { deletedCount: result.deletedCount };
    }
}

module.exports = ImageService;