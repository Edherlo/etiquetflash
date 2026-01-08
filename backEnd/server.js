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
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
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
  etiquetaExhibicion: { width: 180, height: 240 }, // Se usará dinámicamente
  etiquetaStock: { width: 155.91, height: 127.56 } // 5.5cm x 4.5cm en puntos (1cm = 28.35 puntos)
};

// 🆕 Mapeo de fuentes
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
    message: '🚀 Backend de Etiquetas Flash funcionando - v3.0',
    endpoints: [
      '/api/health',
      '/api/etiquetas/exhibicion (LEGACY)',
      '/api/etiquetas/exhibicion-batch (NEW - Dimensiones dinámicas + Cool Panda)',
      '/api/etiquetas/stock (LEGACY)',
      '/api/etiquetas/precio-batch (NEW - 4x2cm + Medio círculo)'
    ]
  });
});

// ✅ ENDPOINT LEGACY - Exhibición (mantener compatibilidad)
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

// 🆕 NUEVO ENDPOINT - Exhibición Batch con Dimensiones Dinámicas
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

    const margin = 20;
    const spacing = 15;

    let currentX = margin;
    let currentY = margin;
    let maxHeightInRow = 0;

    // Procesar cada configuración del carrito
    for (const config of etiquetas) {
      const fontInfo = FUENTES_MAP[config.fuente] || FUENTES_MAP['helvetica'];
      const colorHex = COLORES_MAP[config.color] || '#EF4444';
      const colorBorde = COLORES_MAP[config.colorBorde] || '#000000';
      
      // 📏 Calcular dimensiones dinámicas según especificaciones
      const numEspecs = config.especificaciones.length;
      const etiquetaWidth = Math.max(170, Math.min(340, 170 + (numEspecs * 42.5))); // 6cm a 12cm
      const etiquetaHeight = 113.39; // 4cm fijo
      
      // Generar la cantidad especificada de cada etiqueta
      for (let i = 0; i < config.cantidad; i++) {
        // Verificar si cabe en la página actual
        if (currentX + etiquetaWidth > SIZES.letter.width - margin) {
          // No cabe en horizontal, pasar a siguiente fila
          currentX = margin;
          currentY += maxHeightInRow + spacing;
          maxHeightInRow = 0;
        }

        if (currentY + etiquetaHeight > SIZES.letter.height - margin) {
          // No cabe en la página, nueva página
          doc.addPage();
          currentX = margin;
          currentY = margin;
          maxHeightInRow = 0;
        }

        // 🎨 Dibujar según el diseño seleccionado
        if (config.diseño === 'coolpanda') {
          // Diseño Cool Panda Frame con medio círculo
          const earRadius = 12;
          const earY = currentY - 5;
          const leftEarX = currentX + etiquetaWidth * 0.3;
          const rightEarX = currentX + etiquetaWidth * 0.7;

          // Orejas - Solo medio círculo superior
          doc.arc(leftEarX, earY, earRadius, 0, Math.PI, true)
            .fillAndStroke(colorBorde, colorBorde);
          doc.arc(rightEarX, earY, earRadius, 0, Math.PI, true)
            .fillAndStroke(colorBorde, colorBorde);

          // Cuerpo de la etiqueta
          doc.roundedRect(currentX, currentY, etiquetaWidth, etiquetaHeight, 15)
            .lineWidth(3)
            .stroke(colorBorde);

          // Título
          doc.font(fontInfo.regular)
            .fontSize(16 * fontInfo.size)
            .fillColor(colorHex)
            .text(config.titulo, currentX + 10, currentY + 15, {
              width: etiquetaWidth - 20,
              align: 'center'
            });

          // Especificaciones
          let specY = currentY + 45;
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#3B82F6');
          config.especificaciones.forEach((espec) => {
            doc.text(`• ${espec}`, currentX + 15, specY, { width: etiquetaWidth - 30 });
            specY += 15;
          });

        } else {
          // Diseño Clásico - Rectángulo con bordes redondeados
          doc.roundedRect(currentX, currentY, etiquetaWidth, etiquetaHeight, 10)
            .lineWidth(3)
            .stroke(colorBorde);

          // Título
          doc.font(fontInfo.regular)
            .fontSize(16 * fontInfo.size)
            .fillColor(colorHex)
            .text(config.titulo, currentX + 10, currentY + 15, {
              width: etiquetaWidth - 20,
              align: 'center'
            });

          // Especificaciones
          let specY = currentY + 45;
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#3B82F6');
          config.especificaciones.forEach((espec) => {
            doc.text(`• ${espec}`, currentX + 15, specY, { width: etiquetaWidth - 30 });
            specY += 15;
          });
        }

        // Avanzar a siguiente posición
        currentX += etiquetaWidth + spacing;
        maxHeightInRow = Math.max(maxHeightInRow, etiquetaHeight);
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

// ✅ ENDPOINT LEGACY - Stock (mantener compatibilidad)
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

    const etiquetaWidth = 250;
    const etiquetaHeight = 160;
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

// 🆕 NUEVO ENDPOINT - Sistema Acumulativo Precio 4x2cm con Medio Círculo
app.post('/api/etiquetas/precio-batch', async (req, res) => {
  try {
    const { etiquetas } = req.body;
    
    if (!etiquetas || etiquetas.length === 0) {
      return res.status(400).json({ error: 'No hay etiquetas para generar' });
    }

    console.log('📦 Generando PDF Precio Batch:', etiquetas.length, 'configuraciones');
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-precio-${Date.now()}.pdf`);
    doc.pipe(res);

    // Tamaño fijo: 4cm x 2cm
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
          // Diseño Cool Panda Frame con medio círculo superior
          const earRadius = 12;
          const earY = currentY - 5;
          const leftEarX = currentX + etiquetaWidth * 0.3;
          const rightEarX = currentX + etiquetaWidth * 0.7;

          // Orejas - Solo medio círculo superior (arco de 0 a PI)
          doc.arc(leftEarX, earY, earRadius, 0, Math.PI, true)
            .fillAndStroke('#000000', '#000000');
          doc.arc(rightEarX, earY, earRadius, 0, Math.PI, true)
            .fillAndStroke('#000000', '#000000');

          // Cuerpo de la etiqueta
          doc.roundedRect(currentX, currentY, etiquetaWidth, etiquetaHeight, 12)
            .lineWidth(3)
            .stroke('#000000');

          // Logo
          try {
            doc.image(logoBuffer, currentX + 15, currentY + 12, { fit: [35, 35], align: 'center' });
          } catch (err) {}

          doc.font(fontInfo.regular)
            .fontSize(8)
            .fillColor('#666666')
            .text('De:', currentX + 55, currentY + 18);
          
          doc.fontSize(14 * fontInfo.size)
            .fillColor(colorOriginal)
            .text(`${config.precioOriginal}`, currentX + 55, currentY + 28);
          
          doc.moveTo(currentX + 54, currentY + 41)
            .lineTo(currentX + 125, currentY + 41)
            .stroke(colorOriginal);

          const boxY = currentY + 55;
          doc.rect(currentX + 45, boxY, 90, 50)
            .lineWidth(3)
            .strokeColor(colorDescuento)
            .fillColor('#F0FDF4')
            .fillAndStroke();
          
          doc.fontSize(10 * fontInfo.size)
            .fillColor('#000000')
            .text('A:', currentX + 52, boxY + 6);
          
          doc.fontSize(24 * fontInfo.size)
            .fillColor(colorDescuento)
            .text(`${config.precioDescuento}`, currentX + 50, boxY + 18, { width: 80, align: 'center' });

        } else {
          // Diseño Ovalado Clásico
          const centerX = currentX + etiquetaWidth / 2;
          const centerY = currentY + etiquetaHeight / 2;

          doc.ellipse(centerX, centerY, etiquetaWidth / 2, etiquetaHeight / 2)
            .lineWidth(3)
            .stroke('#000000');

          try {
            doc.image(logoBuffer, currentX + 15, currentY + 12, { fit: [35, 35], align: 'center' });
          } catch (err) {}

          doc.font(fontInfo.regular)
            .fontSize(8)
            .fillColor('#666666')
            .text('De:', currentX + 55, currentY + 18);
          
          doc.fontSize(14 * fontInfo.size)
            .fillColor(colorOriginal)
            .text(`${config.precioOriginal}`, currentX + 55, currentY + 28);
          
          doc.moveTo(currentX + 54, currentY + 41)
            .lineTo(currentX + 125, currentY + 41)
            .stroke(colorOriginal);

          const boxY = currentY + 55;
          doc.rect(currentX + 45, boxY, 90, 50)
            .lineWidth(3)
            .strokeColor(colorDescuento)
            .fillColor('#F0FDF4')
            .fillAndStroke();
          
          doc.fontSize(10 * fontInfo.size)
            .fillColor('#000000')
            .text('A:', currentX + 52, boxY + 6);
          
          doc.fontSize(24 * fontInfo.size)
            .fillColor(colorDescuento)
            .text(`${config.precioDescuento}`, currentX + 50, boxY + 18, { width: 80, align: 'center' });
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
    message: 'Backend funcionando correctamente - v3.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      legacy: ['/api/etiquetas/exhibicion', '/api/etiquetas/stock'],
      new: [
        '/api/etiquetas/exhibicion-batch (Dimensiones dinámicas + Cool Panda)',
        '/api/etiquetas/precio-batch (4x2cm + Medio círculo)'
      ]
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
  console.log(`🚀 Backend corriendo en puerto ${PORT} - v3.0`);
  console.log(`🔧 Endpoints disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/etiquetas/exhibicion (legacy)`);
  console.log(`   POST /api/etiquetas/exhibicion-batch (NEW - dinámico)`);
  console.log(`   POST /api/etiquetas/stock (legacy)`);
  console.log(`   POST /api/etiquetas/precio-batch (NEW - 4x2cm)`);
});