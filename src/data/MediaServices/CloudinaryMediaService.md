# Cloudinary Media Service - Versión Genérica

## Descripción

El `CloudinaryMediaService` es una implementación genérica y reutilizable del servicio de manejo de archivos multimedia que utiliza Cloudinary como proveedor de almacenamiento y CDN. Esta implementación es completamente agnóstica al dominio y puede ser utilizada en cualquier proyecto.

## Características Principales

### ✅ Ventajas

1. **Completamente Genérico**
   - No depende de entidades específicas del dominio
   - Sistema de carpetas flexible
   - IDs de archivo personalizables

2. **Flexibilidad Total**
   - Archivos en root: `"photo.jpg"`
   - Archivos en carpetas: `"users/123/profile.jpg"`
   - Carpetas anidadas: `"projects/web/app/assets/logo.png"`

3. **API Intuitiva**
   - Métodos simples y claros
   - Manejo de errores consistente
   - Documentación completa

4. **Escalabilidad**
   - Auto-scaling automático
   - Sin límites de almacenamiento
   - Manejo automático de picos de tráfico

5. **Seguridad**
   - URLs firmadas con expiración
   - Archivos privados por defecto
   - Control granular de acceso

### ⚠️ Desventajas

1. **Vendor Lock-in**
   - APIs específicas de Cloudinary
   - Difícil migración a otros proveedores

2. **Costos a Escala**
   - Puede ser más costoso que S3 para volúmenes grandes
   - Transformaciones adicionales tienen costo

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install cloudinary
```

### 2. Configurar Variables de Entorno

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

### 3. Configurar el Servicio

```typescript
import { CloudinaryMediaService } from './infrastructure/services/CloudinaryMediaService';

// Configuración básica
const mediaService = new CloudinaryMediaService();

// Configuración personalizada
const mediaService = new CloudinaryMediaService({
    cloudName: 'mi-cloud',
    apiKey: 'mi-api-key',
    apiSecret: 'mi-api-secret',
    defaultFolder: 'mi-proyecto'
});
```

## Uso

### Ejemplos Básicos

```typescript
// 1. Subir archivo simple
const file = await mediaService.uploadFile('mi-archivo.txt', buffer);

// 2. Subir archivo en carpeta
const image = await mediaService.uploadFile('users/123/profile.jpg', imageBuffer);

// 3. Obtener URL firmada
const url = await mediaService.getSignedUrl('users/123/profile.jpg');

// 4. Eliminar archivo
await mediaService.deleteFile('users/123/profile.jpg');

// 5. Eliminar carpeta completa
await mediaService.deleteFolder('users/123/');
```

### Ejemplos Avanzados

```typescript
// Subir múltiples archivos
const files = [
    { fileId: 'users/123/photo1.jpg', buffer: photo1Buffer },
    { fileId: 'users/123/photo2.jpg', buffer: photo2Buffer },
    { fileId: 'users/123/document.pdf', buffer: pdfBuffer }
];

const uploadedFiles = await mediaService.uploadFiles(files);

// URL con transformaciones
const thumbnailUrl = await mediaService.getSignedUrl('users/123/photo.jpg', {
    expiresIn: 7200, // 2 horas
    transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' }
    ]
});

// Listar archivos en carpeta
const files = await mediaService.listFiles('users/123/', { maxResults: 50 });

// Obtener estadísticas
const stats = await mediaService.getUsageStats({ 
    timeRange: 'month',
    folder: 'users/123/'
});
```

## Estructura de Archivos

Los archivos se organizan en Cloudinary siguiendo la estructura del fileId:

```
cloudinary-instance/
├── mi-archivo.txt
├── users/
│   ├── 123/
│   │   ├── profile.jpg
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── document.pdf
│   └── 456/
│       └── avatar.png
├── projects/
│   └── web/
│       └── app/
│           └── assets/
│               └── logo.png
└── temp/
    └── upload.jpg
```

## Migración a Otros Proveedores

### Migración a AWS S3

```typescript
// 1. Crear nueva implementación
export class S3MediaService implements IMediaService {
    async uploadFile(fileId: string, buffer: Buffer, options?: UploadOptions): Promise<MediaFile> {
        // Implementar con AWS S3
    }
    
    // Implementar todos los métodos de la interfaz
}

// 2. Cambiar implementación
const mediaService: IMediaService = new S3MediaService();
```

### Migración a Google Cloud Storage

```typescript
export class GCSMediaService implements IMediaService {
    async uploadFile(fileId: string, buffer: Buffer, options?: UploadOptions): Promise<MediaFile> {
        // Implementar con Google Cloud Storage
    }
    
    // Implementar todos los métodos de la interfaz
}
```

## Casos de Uso Comunes

### 1. Sistema de Usuarios
```typescript
// Perfil de usuario
await mediaService.uploadFile('users/123/profile.jpg', imageBuffer);
await mediaService.uploadFile('users/123/cover.jpg', coverBuffer);

// Documentos del usuario
await mediaService.uploadFile('users/123/documents/id.pdf', idBuffer);
await mediaService.uploadFile('users/123/documents/address.pdf', addressBuffer);
```

### 2. Sistema de Productos
```typescript
// Imágenes de producto
await mediaService.uploadFile('products/456/main.jpg', mainImageBuffer);
await mediaService.uploadFile('products/456/thumbnail.jpg', thumbnailBuffer);
await mediaService.uploadFile('products/456/gallery/1.jpg', galleryImage1Buffer);
```

### 3. Sistema de Reportes
```typescript
// Reportes generados
await mediaService.uploadFile('reports/2024/01/report-123.pdf', reportBuffer);
await mediaService.uploadFile('reports/2024/01/screenshots/screen1.png', screenshotBuffer);
```

### 4. Sistema de Backups
```typescript
// Backups automáticos
await mediaService.uploadFile('backups/2024-01-15/database.sql', dbBuffer);
await mediaService.uploadFile('backups/2024-01-15/uploads.zip', uploadsBuffer);
```

## Troubleshooting

### Problemas Comunes

1. **Error de credenciales**
   ```
   Error: Cloudinary credentials are required
   ```
   **Solución**: Verificar variables de entorno

2. **Archivo no encontrado**
   ```
   Error: Resource not found
   ```
   **Solución**: Verificar que el archivo existe

3. **Carpeta no existe**
   ```
   Error: Folder not found
   ```
   **Solución**: Las carpetas se crean automáticamente al subir archivos

### Debugging

```typescript
// Habilitar logs detallados
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    debug: true // Solo en desarrollo
});
```

## Costos Estimados

### Para 1000 archivos/mes

| Servicio | Costo Mensual |
|----------|---------------|
| Almacenamiento (10GB) | $0.40 |
| Transferencia (50GB) | $2.00 |
| Transformaciones (1000) | $5.00 |
| **Total** | **$7.40** |

## Roadmap

### Versión 2.1
- [ ] Soporte para streaming de videos
- [ ] Transformaciones personalizadas
- [ ] Analytics avanzados

### Versión 2.2
- [ ] Backup automático
- [ ] Compresión inteligente
- [ ] CDN personalizado

### Versión 3.0
- [ ] Migración a microservicios
- [ ] Cache distribuido
- [ ] Monitoreo en tiempo real

## Contribución

Para contribuir a este servicio:

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## Soporte

Para soporte técnico:
- **Email**: soporte@tuapp.com
- **Documentación**: https://docs.tuapp.com
- **Issues**: https://github.com/tuapp/servicio-automotor/issues
```

Esta implementación es completamente genérica y reutilizable, permitiendo usar cualquier estructura de carpetas y nombres de archivo que el desarrollador necesite. 