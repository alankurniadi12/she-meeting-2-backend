export async function prepareFindingStore(database) {
  const findings = database.collection('findings');
  await findings.createIndex({ reference: 1 }, { unique: true });
  await findings.createIndex({ seedKey: 1 }, { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } });
  await findings.createIndex({ cancelledAt: 1, responsibleDivisionIds: 1 });
}
