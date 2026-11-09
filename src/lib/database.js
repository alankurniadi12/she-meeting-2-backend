import { MongoClient } from 'mongodb';

export async function connectDatabase(config) {
  const client = new MongoClient(config.mongoUri, {
    maxPoolSize: 5, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000,
  });
  try {
    await client.connect();
    const database = client.db(config.databaseName);
    await database.command({ ping: 1 });
    return { client, database };
  } catch {
    await client.close();
    throw new Error('Koneksi MongoDB gagal. Periksa database development dan konfigurasi lokal; detail kredensial tidak ditampilkan.');
  }
}
