const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración ⚙️
const carpetaEntrada = './img_carrusel_originales'; // Carpeta con las imágenes pesadas
const carpetaSalida = './img_carrusel_opt'; // Carpeta donde se guardarán
const anchoMaximo = 800; // Px de ancho máximo
const calidadWebp = 75;  // Calidad (75 u 80 es ideal)

// Crear la carpeta de salida si no existe 📁
if (!fs.existsSync(carpetaSalida)) {
  fs.mkdirSync(carpetaSalida, { recursive: true });
}

fs.readdirSync(carpetaEntrada).forEach(archivo => {
  const extension = path.extname(archivo).toLowerCase();
  
  if (['.webp', '.png', '.jpg', '.jpeg'].includes(extension)) {
    const rutaEntrada = path.join(carpetaEntrada, archivo);
    const rutaSalida = path.join(carpetaSalida, archivo);

    sharp(rutaEntrada)
      .resize({ width: anchoMaximo, withoutEnlargement: true }) // Redimensiona si supera el ancho máximo 📐
      .webp({ quality: calidadWebp })                           // Aplica la compresión WebP ⚙️
      .toFile(rutaSalida)
      .then(() => console.log(`✅ Procesada: ${archivo}`))
      .catch(err => console.error(`❌ Error en ${archivo}:`, err));
  }
});