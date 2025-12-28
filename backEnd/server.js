const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS actualizado - acepta múltiples orígenes
const allowedOrigins = [
  'https://etiquetflash.vercel.app',
  'https://etiquetflash-onmol10z-edherlos-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar si está en la lista de orígenes permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Permitir cualquier subdominio de Vercel (*.vercel.app)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Configuración de tamaños
const SIZES = {
  letter: { width: 612, height: 792 },
  etiquetaExhibicion: { width: 180, height: 240 },
  etiquetaStock: { width: 250, height: 160 }
};

// 🆕 Mapeo de fuentes para el sistema nuevo
const FUENTES_MAP = {
  'helvetica': { regular: 'Helvetica-Bold', size: 1 },
  'times': { regular: 'Times-Bold', size: 1 },
  'courier': { regular: 'Courier-Bold', size: 1 },
  'arial': { regular: 'Helvetica-Bold', size: 1.1 },
  'impact': { regular: 'Helvetica-Bold', size: 1.2 },
  'verdana': { regular: 'Helvetica-Bold', size: 1 }
};

// 🆕 Mapeo de colores
const COLORES_MAP = {
  'rojo': '#EF4444',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'naranja': '#F97316',
  'morado': '#A855F7',
  'negro': '#000000'
};

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🚀 Backend de Etiquetas Flash funcionando - v2.0',
    endpoints: [
      '/api/health',
      '/api/etiquetas/exhibicion',
      '/api/etiquetas/stock',
      '/api/etiquetas/precio-batch (NEW)'
    ]
  });
});

// ✅ ENDPOINT ORIGINAL - Exhibición (SIN CAMBIOS)
app.post('/api/etiquetas/exhibicion', async (req, res) => {
  try {
    const { titulo, especificaciones, cantidad, fuente, color } = req.body;
    
    console.log('📦 Generando PDF Exhibición:', { titulo, cantidad });
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-exhibicion-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaExhibicion.width;
    const etiquetaHeight = SIZES.etiquetaExhibicion.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    // 🆕 Soporte para fuentes y colores personalizados (backward compatible)
    const fontInfo = fuente ? (FUENTES_MAP[fuente] || FUENTES_MAP['helvetica']) : { regular: 'Helvetica-Bold', size: 1 };
    const colorHex = color ? (COLORES_MAP[color] || '#EF4444') : '#EF4444';

    for (let i = 0; i < cantidad; i++) {
      if (etiquetasEnPagina >= etiquetasPorPagina) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
        etiquetasEnPagina = 0;
      }

      doc.rect(currentX, currentY, etiquetaWidth, etiquetaHeight).stroke('#CCCCCC');

      doc.font(fontInfo.regular)
        .fontSize(24)
        .fillColor(colorHex)
        .text(titulo, currentX + 10, currentY + 20, {
          width: etiquetaWidth - 20,
          align: 'center'
        });

      let specY = currentY + 60;
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#3B82F6');

      especificaciones.forEach((espec) => {
        doc.text(`• ${espec}`, currentX + 15, specY, { width: etiquetaWidth - 30 });
        specY += 20;
      });

      currentX += etiquetaWidth + spacing;
      etiquetasEnPagina++;

      if (etiquetasEnPagina % cols === 0) {
        currentX = margin;
        currentY += etiquetaHeight + spacing;
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

// ✅ ENDPOINT ORIGINAL - Stock (SIN CAMBIOS - mantiene compatibilidad)
app.post('/api/etiquetas/stock', async (req, res) => {
  try {
    const { precioOriginal, precioDescuento, logo, cantidad } = req.body;
    
    console.log('📦 Generando PDF Stock:', { precioOriginal, precioDescuento, cantidad });
    
    if (!logo) {
      return res.status(400).json({ error: 'Se requiere un logo' });
    }

    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-stock-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaStock.width;
    const etiquetaHeight = SIZES.etiquetaStock.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    const logoBase64 = logo.replace(/^data:image\/\w+;base64,/, '');
    const logoBuffer = Buffer.from(logoBase64, 'base64');

    for (let i = 0; i < cantidad; i++) {
      if (etiquetasEnPagina >= etiquetasPorPagina) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
        etiquetasEnPagina = 0;
      }

      const centerX = currentX + etiquetaWidth / 2;
      const centerY = currentY + etiquetaHeight / 2;

      doc.ellipse(centerX, centerY, etiquetaWidth / 2, etiquetaHeight / 2)
        .lineWidth(3)
        .stroke('#000000');

      try {
        doc.image(logoBuffer, currentX + 30, currentY + 20, { 
          fit: [50, 50], 
          align: 'center' 
        });
      } catch (err) {
        console.warn('⚠️ Error cargando logo:', err.message);
      }

      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#666666')
        .text('De:', currentX + 90, currentY + 30);
      
      doc.fontSize(16)
        .fillColor('#EF4444')
        .text(`$${precioOriginal}`, currentX + 90, currentY + 45);
      
      doc.moveTo(currentX + 88, currentY + 53)
        .lineTo(currentX + 165, currentY + 53)
        .stroke('#EF4444');

      const boxY = currentY + 75;
      const boxWidth = 140;
      const boxHeight = 60;

      doc.rect(currentX + 55, boxY, boxWidth, boxHeight)
        .lineWidth(4)
        .strokeColor('#22C55E')
        .fillColor('#F0FDF4')
        .fillAndStroke();
      
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#000000')
        .text('A:', currentX + 65, boxY + 8);
      
      doc.fontSize(32)
        .fillColor('#22C55E')
        .text(`$${precioDescuento}`, currentX + 60, boxY + 22, { 
          width: boxWidth - 10, 
          align: 'center' 
        });

      currentX += etiquetaWidth + spacing;
      etiquetasEnPagina++;

      if (etiquetasEnPagina % cols === 0) {
        currentX = margin;
        currentY += etiquetaHeight + spacing;
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});
// 🆕 NUEVO ENDPOINT - Sistema Acumulativo para Etiquetas de Exhibición
app.post('/api/etiquetas/exhibicion-batch', async (req, res) => {
  try {
    const { etiquetas } = req.body;
    
    if (!etiquetas || etiquetas.length === 0) {
      return res.status(400).json({ error: 'No hay etiquetas para generar' });
    }

    console.log('📦 Generando PDF Exhibición Batch:', etiquetas.length, 'configuraciones');
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-exhibicion-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaExhibicion.width;
    const etiquetaHeight = SIZES.etiquetaExhibicion.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    // Procesar cada configuración del carrito
    for (const config of etiquetas) {
      const fontInfo = FUENTES_MAP[config.fuente] || FUENTES_MAP['helvetica'];
      const colorHex = COLORES_MAP[config.color] || '#EF4444';
      
      // Generar la cantidad especificada de cada etiqueta
      for (let i = 0; i < config.cantidad; i++) {
        if (etiquetasEnPagina >= etiquetasPorPagina) {
          doc.addPage();
          currentX = margin;
          currentY = margin;
          etiquetasEnPagina = 0;
        }

        // Dibujar borde de etiqueta
        doc.rect(currentX, currentY, etiquetaWidth, etiquetaHeight)
          .stroke('#CCCCCC');

        // Título con fuente y color personalizados
        doc.font(fontInfo.regular)
          .fontSize(24 * fontInfo.size)
          .fillColor(colorHex)
          .text(config.titulo, currentX + 10, currentY + 20, {
            width: etiquetaWidth - 20,
            align: 'center'
          });

        // Especificaciones en azul
        let specY = currentY + 60;
        doc.font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#3B82F6');

        config.especificaciones.forEach((espec) => {
          doc.text(`• ${espec}`, currentX + 15, specY, { 
            width: etiquetaWidth - 30 
          });
          specY += 20;
        });

        // Avanzar a siguiente posición
        currentX += etiquetaWidth + spacing;
        etiquetasEnPagina++;

        if (etiquetasEnPagina % cols === 0) {
          currentX = margin;
          currentY += etiquetaHeight + spacing;
        }
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});
// 🆕 NUEVO ENDPOINT - Sistema Acumulativo con Múltiples Diseños
app.post('/api/etiquetas/precio-batch', async (req, res) => {
  try {
    const { etiquetas } = req.body;
    
    if (!etiquetas || etiquetas.length === 0) {
      return res.status(400).json({ error: 'No hay etiquetas para generar' });
    }

    console.log('📦 Generando PDF Batch:', etiquetas.length, 'configuraciones');
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-precio-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaStock.width;
    const etiquetaHeight = SIZES.etiquetaStock.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    // Procesar cada configuración del carrito
    for (const config of etiquetas) {
      const logoBase64 = config.logo.replace(/^data:image\/\w+;base64,/, '');
      const logoBuffer = Buffer.from(logoBase64, 'base64');
      
      const fontInfo = FUENTES_MAP[config.fuente] || FUENTES_MAP['helvetica'];
      const colorOriginal = COLORES_MAP[config.colorOriginal] || '#EF4444';
      const colorDescuento = COLORES_MAP[config.colorDescuento] || '#22C55E';
      
      // Generar la cantidad especificada de cada etiqueta
      for (let i = 0; i < config.cantidad; i++) {
        if (etiquetasEnPagina >= etiquetasPorPagina) {
          doc.addPage();
          currentX = margin;
          currentY = margin;
          etiquetasEnPagina = 0;
        }

        // 🎨 Dibujar según el diseño seleccionado
        if (config.diseño === 'coolpanda') {
          // Diseño Cool Panda Frame
          doc.roundedRect(currentX, currentY, etiquetaWidth, etiquetaHeight, 15)
            .lineWidth(4)
            .stroke('#000000');

          // Círculos superiores
          const circleRadius = 15;
          const circleY = currentY - 10;
          const leftCircleX = currentX + etiquetaWidth * 0.3;
          const rightCircleX = currentX + etiquetaWidth * 0.7;

          doc.circle(leftCircleX, circleY, circleRadius).fillAndStroke('#000000', '#000000');
          doc.circle(rightCircleX, circleY, circleRadius).fillAndStroke('#000000', '#000000');

          // Logo
          try {
            doc.image(logoBuffer, currentX + 25, currentY + 15, { fit: [45, 45], align: 'center' });
          } catch (err) {}

          doc.font(fontInfo.regular)
            .fontSize(9)
            .fillColor('#666666')
            .text('De:', currentX + 85, currentY + 25);
          
          doc.fontSize(14 * fontInfo.size)
            .fillColor(colorOriginal)
            .text(`$${config.precioOriginal}`, currentX + 85, currentY + 38);
          
          doc.moveTo(currentX + 83, currentY + 45)
            .lineTo(currentX + 150, currentY + 45)
            .stroke(colorOriginal);

          const boxY = currentY + 70;
          doc.rect(currentX + 65, boxY, 120, 55)
            .lineWidth(3)
            .strokeColor(colorDescuento)
            .fillColor('#F0FDF4')
            .fillAndStroke();
          
          doc.fontSize(12 * fontInfo.size)
            .fillColor('#000000')
            .text('A:', currentX + 75, boxY + 6);
          
          doc.fontSize(28 * fontInfo.size)
            .fillColor(colorDescuento)
            .text(`$${config.precioDescuento}`, currentX + 70, boxY + 18, { width: 110, align: 'center' });

        } else {
          // Diseño Ovalado Clásico
          const centerX = currentX + etiquetaWidth / 2;
          const centerY = currentY + etiquetaHeight / 2;

          doc.ellipse(centerX, centerY, etiquetaWidth / 2, etiquetaHeight / 2)
            .lineWidth(3)
            .stroke('#000000');

          try {
            doc.image(logoBuffer, currentX + 30, currentY + 20, { fit: [50, 50], align: 'center' });
          } catch (err) {}

          doc.font(fontInfo.regular)
            .fontSize(10)
            .fillColor('#666666')
            .text('De:', currentX + 90, currentY + 30);
          
          doc.fontSize(16 * fontInfo.size)
            .fillColor(colorOriginal)
            .text(`$${config.precioOriginal}`, currentX + 90, currentY + 45);
          
          doc.moveTo(currentX + 88, currentY + 53)
            .lineTo(currentX + 165, currentY + 53)
            .stroke(colorOriginal);

          const boxY = currentY + 75;
          doc.rect(currentX + 55, boxY, 140, 60)
            .lineWidth(4)
            .strokeColor(colorDescuento)
            .fillColor('#F0FDF4')
            .fillAndStroke();
          
          doc.fontSize(14 * fontInfo.size)
            .fillColor('#000000')
            .text('A:', currentX + 65, boxY + 8);
          
          doc.fontSize(32 * fontInfo.size)
            .fillColor(colorDescuento)
            .text(`$${config.precioDescuento}`, currentX + 60, boxY + 22, { width: 130, align: 'center' });
        }

        currentX += etiquetaWidth + spacing;
        etiquetasEnPagina++;

        if (etiquetasEnPagina % cols === 0) {
          currentX = margin;
          currentY += etiquetaHeight + spacing;
        }
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente - v2.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      legacy: ['/api/etiquetas/exhibicion', '/api/etiquetas/stock'],
      new: ['/api/etiquetas/precio-batch']
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT} - v2.0`);
  console.log(`📍 Endpoints disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/etiquetas/exhibicion (legacy + enhanced)`);
  console.log(`   POST /api/etiquetas/stock (legacy)`);
  console.log(`   POST /api/etiquetas/precio-batch (NEW - sistema acumulativo)`);
});

