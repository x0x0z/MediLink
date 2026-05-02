import { useEffect, useState } from "react";

export type AccountType = "Personal" | "Enterprise";

type AccountTypeListener = (type: AccountType) => void;

const listeners = new Set<AccountTypeListener>();

let accountType: AccountType = "Personal";

export function getAccountType() {
  return accountType;
}

export function setAccountType(nextAccountType: AccountType) {
  if (accountType === nextAccountType) {
    return;
  }

  accountType = nextAccountType;

  listeners.forEach((listener) => {
    listener(accountType);
  });
}

export function subscribeAccountType(listener: AccountTypeListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useAccountType() {
  const [currentType, setCurrentType] = useState<AccountType>(() =>
    getAccountType()
  );

  useEffect(() => {
    return subscribeAccountType(setCurrentType);
  }, []);

  return currentType;
}
