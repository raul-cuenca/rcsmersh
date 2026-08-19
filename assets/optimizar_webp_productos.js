const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Carpeta de origen y destino
const dirEntrada = path.join(__dirname, 'img_productos_originales');
const dirSalida = path.join(__dirname, 'img_productos_opt');

// Crear la carpeta de salida si no existe
if (!fs.existsSync(dirSalida)) {
    fs.mkdirSync(dirSalida, { recursive: true });
}

// Procesar las imágenes de productos
fs.readdir(dirEntrada, (err, archivos) => {
    if (err) {
        console.error('❌ Error al leer la carpeta de origen:', err.message);
        return;
    }

    const imagenes = archivos.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

    if (imagenes.length === 0) {
        console.log('⚠️ No se encontraron imágenes en la carpeta productos_originales.');
        return;
    }

    console.log(`🖼️ Procesando ${imagenes.length} imágenes de productos...\n`);

    imagenes.forEach(archivo => {
        const rutaEntrada = path.join(dirEntrada, archivo);
        // Guardar todas como .webp para mayor eficiencia
        const nombreSinExt = path.parse(archivo).name;
        const rutaSalida = path.join(dirSalida, `${nombreSinExt}.webp`);

        sharp(rutaEntrada)
            .resize(600, null, { // Redimensionar a 600px de ancho manteniendo proporción
                withoutEnlargement: true // Evita agrandar imágenes más pequeñas
            })
            .webp({ quality: 75 }) // Calidad optimizada para productos
            .toFile(rutaSalida)
            .then(info => {
                const pesoKB = (info.size / 1024).toFixed(2);
                console.log(`✅ ${archivo} ➡️ ${nombreSinExt}.webp | Peso: ${pesoKB} KB`);
            })
            .catch(err => {
                console.error(`❌ Error al procesar ${archivo}:`, err.message);
            });
    });
});