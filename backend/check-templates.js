const mongoose = require('mongoose');

async function main() {
  try {
    await mongoose.connect('mongodb+srv://fabian-DB-new:Qw7f9vH!p6GV9XW3GJFe@cluster0.oizwtoa.mongodb.net/discover?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Conectado a MongoDB');
    
    const templates = await mongoose.connection.db.collection('proceduretemplates').find({}).toArray();
    console.log('\n=== PROCEDURE TEMPLATES EN BD ===');
    templates.forEach(t => {
      console.log('  Code:', t.code, '| Color:', t.color || 'UNDEFINED', '| Active:', t.isActive);
    });
    
    // Actualizar templates sin color
    const DEFAULT_COLORS = {
      'PR01': '#2563eb',
      'PR02': '#16a34a',
      'PR03': '#db2777',
      'PR09': '#d97706',
      'VERIF-001': '#14b8a6',
      'RETEST-001': '#8b5cf6'
    };
    
    console.log('\n=== ACTUALIZANDO TEMPLATES SIN COLOR ===');
    for (const template of templates) {
      if (!template.color && DEFAULT_COLORS[template.code]) {
        const result = await mongoose.connection.db.collection('proceduretemplates').updateOne(
          { _id: template._id },
          { $set: { color: DEFAULT_COLORS[template.code] } }
        );
        console.log('  Actualizado:', template.code, '-> color:', DEFAULT_COLORS[template.code]);
      }
    }
    
    // Verificar después de actualizar
    const updated = await mongoose.connection.db.collection('proceduretemplates').find({}).toArray();
    console.log('\n=== TEMPLATES DESPUES DE ACTUALIZACION ===');
    updated.forEach(t => {
      console.log('  Code:', t.code, '| Color:', t.color || 'UNDEFINED', '| Active:', t.isActive);
    });
    
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  } catch(err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
