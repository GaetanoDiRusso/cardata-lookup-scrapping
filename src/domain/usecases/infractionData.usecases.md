# Infraction Data Use Case - Cloudinary Integration

## Descripción

El caso de uso `generateAndSaveInfractionData` ha sido actualizado para usar Cloudinary como servicio de almacenamiento de archivos multimedia. Esta implementación reemplaza el sistema anterior de archivos locales por un sistema basado en la nube.

## Cambios Principales

### ✅ Ventajas de la Nueva Implementación

1. **Almacenamiento en la Nube**
   - Los archivos se guardan en Cloudinary en lugar del sistema de archivos local
   - URLs firmadas con expiración automática
   - CDN global para mejor rendimiento

2. **Gestión de Memoria Mejorada**
   - Los archivos se eliminan automáticamente de la memoria después de subirlos
   - No hay acumulación de archivos temporales en el servidor
   - Mejor escalabilidad para múltiples requests simultáneos

3. **Estructura Organizada**
   - Archivos organizados por usuario y vehículo
   - Timestamps para evitar colisiones
   - Separación clara entre screenshots y PDFs

4. **Optimización Automática**
   - Imágenes optimizadas automáticamente
   - Transformaciones aplicadas durante la subida
   - Formato automático (WebP cuando es posible)

## Estructura de Archivos en Cloudinary

```
servicio-automotor/
├── users/
│   ├── {userId}/
│   │   ├── vehicles/
│   │   │   ├── {matricula}/
│   │   │   │   ├── {timestamp}/
│   │   │   │   │   ├── screenshot-0.png
│   │   │   │   │   ├── screenshot-1.png
│   │   │   │   │   ├── report-0.pdf
│   │   │   │   │   └── report-1.pdf
```

## Uso

### Ejemplo Básico

```typescript
import { generateAndSaveInfractionData } from './infractionData.usecases';

const result = await generateAndSaveInfractionData(
    { userId: 'user123' },
    {
        matricula: 'ABC123',
        padron: '123456',
        departamento: 'Montevideo'
    }
);

console.log('URLs de screenshots:', result.imagePathsUrls);
console.log('URLs de PDFs:', result.pdfPathsUrls);
console.log('Datos del scraping:', result.data);
```

### Ejemplo con Manejo de Errores

```typescript
try {
    const result = await generateAndSaveInfractionData(currentUser, vehicleData);
    
    // Los archivos ya están en Cloudinary con URLs firmadas
    return {
        success: true,
        data: result.data,
        media: {
            screenshots: result.imagePathsUrls,
            pdfs: result.pdfPathsUrls
        }
    };
    
} catch (error) {
    console.error('Error en scraping de infracciones:', error);
    return {
        success: false,
        error: error.message
    };
}
```

## Flujo de Procesamiento

1. **Scraping**: Se ejecuta el scraping para obtener screenshots y PDFs
2. **Preparación**: Se preparan los archivos con IDs únicos
3. **Subida**: Se suben todos los archivos a Cloudinary en paralelo
4. **URLs Firmadas**: Se generan URLs firmadas para cada archivo
5. **Retorno**: Se retornan las URLs y los datos del scraping
6. **Limpieza**: Los buffers se liberan automáticamente

## Configuración Requerida

### Variables de Entorno

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### Dependencias

```json
{
  "dependencies": {
    "cloudinary": "^1.41.0"
  }
}
```

## Optimizaciones Aplicadas

### Imágenes (Screenshots)
- **Formato**: Auto-optimizado (WebP cuando es posible)
- **Calidad**: Auto-ajustada
- **Tamaño**: Máximo 1200x800 píxeles
- **Compresión**: Optimizada para web

### PDFs (Reportes)
- **Formato**: Original sin transformaciones
- **Acceso**: URLs firmadas con expiración
- **Descarga**: Directa desde Cloudinary

## Seguridad

### URLs Firmadas
- **Expiración**: 1 hora por defecto
- **HTTPS**: Obligatorio
- **Acceso**: Solo usuarios autenticados
- **Privacidad**: Archivos privados por defecto

### Control de Acceso
- **Organización**: Por usuario y vehículo
- **Aislamiento**: Cada usuario solo ve sus archivos
- **Auditoría**: Logs de acceso disponibles

## Monitoreo

### Métricas Disponibles
- **Archivos subidos**: Conteo por usuario
- **Tamaño total**: En bytes
- **Ancho de banda**: Estimación de uso
- **Errores**: Logs detallados

### Logs de Ejemplo

```
[INFO] Subiendo 2 screenshots y 1 PDF para usuario user123
[INFO] Archivos subidos exitosamente a Cloudinary
[INFO] URLs firmadas generadas para 3 archivos
[INFO] Limpieza de memoria completada
```

## Migración desde el Sistema Anterior

### Cambios en el Frontend

```typescript
// Antes (archivos locales)
const imageUrl = `/public/${fileName}`;

// Ahora (Cloudinary)
const imageUrl = result.imagePathsUrls[0]; // URL firmada
```

### Cambios en el Backend

```typescript
// Antes
import { saveImage, savePdf } from "../../media";

// Ahora
import { mediaService } from "../../data/MediaServices";
```

## Troubleshooting

### Problemas Comunes

1. **Error de credenciales**
   ```
   Error: Cloudinary credentials are required
   ```
   **Solución**: Verificar variables de entorno

2. **URLs expiradas**
   ```
   Error: 403 Forbidden
   ```
   **Solución**: Regenerar URLs firmadas

3. **Archivos no encontrados**
   ```
   Error: Resource not found
   ```
   **Solución**: Verificar que el scraping fue exitoso

### Debugging

```typescript
// Habilitar logs detallados
const result = await generateAndSaveInfractionData(currentUser, vehicleData);
console.log('Archivos subidos:', result);
```

## Costos Estimados

### Para 1000 consultas/mes
- **Almacenamiento**: ~$0.40/mes
- **Transferencia**: ~$2.00/mes
- **Transformaciones**: ~$5.00/mes
- **Total**: ~$7.40/mes

## Roadmap

### Versión 1.1
- [ ] Soporte para videos de auditoría
- [ ] Compresión inteligente
- [ ] Analytics detallados

### Versión 1.2
- [ ] Backup automático
- [ ] Retención configurable
- [ ] Notificaciones de eventos

## Contribución

Para contribuir a este caso de uso:

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/mejora-infracciones`)
3. Commit cambios (`git commit -am 'Mejorar caso de uso de infracciones'`)
4. Push a la rama (`git push origin feature/mejora-infracciones`)
5. Crear Pull Request

## Licencia

Este código está bajo la licencia MIT. Ver `LICENSE` para más detalles. 