import { MongoClient } from 'mongodb'

let client
let db

export async function getDb() {
  if (!db) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'thinkovr')
    // Ensure indexes (best-effort)
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true })
      await db.collection('wishes').createIndex({ user_id: 1 })
      await db.collection('wishes').createIndex({ status: 1 })
    } catch (e) {}
  }
  return db
}
