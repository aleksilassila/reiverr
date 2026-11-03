import { TransactionContext } from '@mikro-orm/core';

/**
 * Fails inside a transaction, for work that would wait on the one SQLite
 * connection the transaction holds until it ends: queries of an entity
 * manager of its own, or a wait on work that runs them
 */
export function assertOutsideTransaction(action: string): void {
  if (TransactionContext.currentTransactionContext()) {
    throw new Error(`${action} inside a transaction`);
  }
}
