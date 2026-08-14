// scratch/dump-local-mongo.js
import mongoose from 'mongoose';

const mongoUri = 'mongodb://127.0.0.1:27017/campana_ganadora';

async function dump() {
  console.log('🔄 Intentando conectar a MongoDB local (127.0.0.1:27017)...');
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Conectado a MongoDB local.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`\nColecciones encontradas (${collections.length}):`);
    
    for (const col of collections) {
      const name = col.name;
      const count = await db.collection(name).countDocuments();
      console.log(`- ${name}: ${count} documentos`);
      
      if (count > 0 && ['clients', 'campaigns', 'licenses', 'subscriptions', 'invoices', 'users', 'users_list'].includes(name)) {
        const docs = await db.collection(name).find({}).limit(3).toArray();
        console.log(`  Ejemplo de ${name}:`, JSON.stringify(docs, null, 2));
      }
    }
  } catch (err) {
    console.error('\n❌ No se pudo conectar a MongoDB local:', err.message || err);
  } finally {
    await mongoose.disconnect();
  }
}

dump();
