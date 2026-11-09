export async function prepareAuthStore(database) {
  await database.collection('accounts').createIndex({ username: 1 }, { unique: true });
  await database.collection('accounts').createIndex({ divisionId: 1 }, {
    unique: true, partialFilterExpression: { role: 'DIVISION', active: true },
  });
  await database.collection('divisions').createIndex({ code: 1 }, { unique: true });
  await database.collection('divisions').createIndex({ name: 1 }, { unique: true });
  await database.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await database.collection('loginAttempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

// Deliberate allowlist: never serialize a database account document to the client.
export function publicAccount(account, division = null) {
  return {
    id: account._id.toString(), username: account.username, displayName: account.displayName,
    role: account.role, active: account.active,
    division: division ? { id: division._id.toString(), code: division.code, name: division.name } : null,
  };
}
