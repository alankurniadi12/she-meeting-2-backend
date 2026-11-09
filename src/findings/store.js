export async function prepareFindingStore(database) {
  const findings = database.collection('findings');
  await findings.createIndex({ reference: 1 }, { unique: true });
  await findings.createIndex({ seedKey: 1 }, { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } });
  await findings.createIndex({ cancelledAt: 1, responsibleDivisionIds: 1 });
  await findings.createIndex({ reportedDate: -1, _id: -1 });
  await findings.createIndex({ updatedAt: -1, _id: -1 });
  await findings.createIndex({ createMutationId: 1 }, { unique: true, partialFilterExpression: { createMutationId: { $type: 'string' } } });
}
