import BN from 'bn.js';
import {
  ONE_YOCTO_NEAR,
  refFiFunctionCall,
  RefFiFunctionCallOptions,
  refFiManyFunctionCalls,
  refFiViewFunction,
  Transaction,
  REF_FI_CONTRACT_ID,
  wallet,
  executeMultipleTransactions,
} from './near';
import { ftGetStorageBalance, TokenMetadata } from './ft-contract';
import { currentStorageBalance, MIN_DEPOSIT_PER_TOKEN } from './account';
import { toNonDivisibleNumber } from '../utils/numbers';

export const checkTokenNeedsStorageDeposit = async (tokenId: string) => {
  const [registeredTokens, { available }] = await Promise.all([
    getUserRegisteredTokens(),
    currentStorageBalance(wallet.getAccountId()),
  ]);

  return (
    new BN(available).lt(MIN_DEPOSIT_PER_TOKEN) &&
    !registeredTokens.includes(tokenId)
  );
};

export const registerTokenAndExchange = async (tokenId: string) => {
  const transactions: Transaction[] = [];
  const actions: RefFiFunctionCallOptions[] = [
    {
      methodName: 'register_tokens',
      args: { token_ids: [tokenId] },
    },
  ];

  const needsStorageDeposit = await checkTokenNeedsStorageDeposit(tokenId);
  if (needsStorageDeposit) {
    actions.unshift({
      methodName: 'storage_deposit',
      args: { account_id: wallet.getAccountId(), registration_only: false },
      amount: '0.00084',
    });
  }

  transactions.push({
    receiverId: REF_FI_CONTRACT_ID,
    functionCalls: actions,
  });

  const exchangeBalanceAtFt = await ftGetStorageBalance(
    tokenId,
    REF_FI_CONTRACT_ID
  );
  if (!exchangeBalanceAtFt || exchangeBalanceAtFt.total === '0') {
    transactions.push({
      receiverId: tokenId,
      functionCalls: [
        {
          methodName: 'storage_deposit',
          args: { account_id: REF_FI_CONTRACT_ID, registration_only: true },
          amount: '0.1',
        },
      ],
    });
  }

  return executeMultipleTransactions(transactions);
};

export const registerToken = async (tokenId: string) => {
  const registered = await ftGetStorageBalance(
    tokenId,
    REF_FI_CONTRACT_ID
  ).catch(() => {
    throw new Error(`${tokenId} doesn't exist.`);
  });
  if (!registered) throw new Error('No liquidity pools available for token');

  const actions: RefFiFunctionCallOptions[] = [
    {
      methodName: 'register_tokens',
      args: { token_ids: [tokenId] },
    },
  ];

  const needsStorageDeposit = await checkTokenNeedsStorageDeposit(tokenId);
  if (needsStorageDeposit) {
    actions.unshift({
      methodName: 'storage_deposit',
      args: { account_id: wallet.getAccountId(), registration_only: false },
      amount: '0.00084',
    });
  }

  return refFiManyFunctionCalls(actions);
};

export const unregisterToken = (tokenId: string) => {
  return refFiFunctionCall({
    methodName: 'unregister_tokens',
    args: { token_ids: [tokenId] },
  });
};

interface DepositOptions {
  token: TokenMetadata;
  amount: string;
  msg?: string;
}
export const deposit = async ({ token, amount, msg = '' }: DepositOptions) => {
  const transactions: Transaction[] = [
    {
      receiverId: token.id,
      functionCalls: [
        {
          methodName: 'ft_transfer_call',
          args: {
            receiver_id: REF_FI_CONTRACT_ID,
            amount: toNonDivisibleNumber(token.decimals, amount),
            msg,
          },
          amount: ONE_YOCTO_NEAR,
          gas: '100000000000000',
        },
      ],
    },
  ];

  const needsStorage = await checkTokenNeedsStorageDeposit(token.id);
  if (needsStorage) {
    transactions.unshift({
      receiverId: REF_FI_CONTRACT_ID,
      functionCalls: [
        {
          methodName: 'storage_deposit',
          args: {
            account_id: wallet.getAccountId(),
            registration_only: false,
          },
          amount: '0.00084',
        },
      ],
    });
  }

  return executeMultipleTransactions(transactions);
};

interface WithdrawOptions {
  token: TokenMetadata;
  amount: string;
  unregister?: boolean;
}
export const withdraw = async ({
  token,
  amount,
  unregister = false,
}: WithdrawOptions) => {
  const parsedAmount = toNonDivisibleNumber(token.decimals, amount);
  const ftBalance = await ftGetStorageBalance(token.id);

  const transactions: Transaction[] = [
    {
      receiverId: REF_FI_CONTRACT_ID,
      functionCalls: [
        {
          methodName: 'withdraw',
          args: { token_id: token.id, amount: parsedAmount, unregister },
          amount: ONE_YOCTO_NEAR,
        },
      ],
    },
  ];

  if (!ftBalance || ftBalance.total === '0') {
    transactions.unshift({
      receiverId: token.id,
      functionCalls: [
        {
          methodName: 'storage_deposit',
          args: { account_id: wallet.getAccountId(), registration_only: true },
          amount: '0.1',
        },
      ],
    });
  }

  return executeMultipleTransactions(transactions);
};

export interface TokenBalancesView {
  [tokenId: string]: string;
}
export const getTokenBalances = (): Promise<TokenBalancesView> => {
  return refFiViewFunction({
    methodName: 'get_deposits',
    args: { account_id: wallet.getAccountId() },
  });
};

export const getUserRegisteredTokens = (): Promise<string[]> => {
  return refFiViewFunction({
    methodName: 'get_user_whitelisted_tokens',
    args: { account_id: wallet.getAccountId() },
  });
};

export const getWhitelistedTokens = async (): Promise<string[]> => {
  const [globalWhitelist, userWhitelist] = await Promise.all([
    refFiViewFunction({ methodName: 'get_whitelisted_tokens' }),
    refFiViewFunction({
      methodName: 'get_user_whitelisted_tokens',
      args: { account_id: wallet.getAccountId() },
    }),
  ]);

  return [...new Set<string>([...globalWhitelist, ...userWhitelist])];
};
