import { toNonDivisibleNumber, toReadableNumber } from '../utils/numbers';
import {
  near,
  ONE_YOCTO_NEAR,
  RefFiFunctionCallOptions,
  refFiManyFunctionCalls,
  refFiViewFunction,
  wallet,
} from './near';
import { TokenMetadata } from './ft-contract';
import { getIdealSwapPool, Pool } from './pool';
import { checkTokenNeedsStorageDeposit } from './token';
import { JsonRpcProvider } from 'near-api-js/lib/providers';

interface EstimateSwapOptions {
  tokenIn: TokenMetadata;
  tokenOut: TokenMetadata;
  amountIn: string;
}

export interface EstimateSwapView {
  estimate: string;
  pool: Pool;
}
export const estimateSwap = async ({
  tokenIn,
  tokenOut,
  amountIn,
}: EstimateSwapOptions): Promise<EstimateSwapView> => {
  const parsedAmountIn = toNonDivisibleNumber(tokenIn.decimals, amountIn);
  if (!parsedAmountIn)
    throw new Error(`${amountIn} is not a valid swap amount`);

  const pool = await getIdealSwapPool({
    tokenInId: tokenIn.id,
    tokenOutId: tokenOut.id,
    amountIn: parsedAmountIn,
  });

  if (!pool)
    throw new Error(
      `No pool available to make a swap from ${tokenIn.symbol} -> ${tokenOut.symbol} for the amount ${amountIn}`
    );

  const estimate = await refFiViewFunction({
    methodName: 'get_return',
    args: {
      pool_id: pool.id,
      token_in: tokenIn.id,
      token_out: tokenOut.id,
      amount_in: parsedAmountIn,
    },
  });

  return {
    estimate: toReadableNumber(tokenOut.decimals, estimate),
    pool,
  };
};

interface SwapOptions extends EstimateSwapOptions {
  pool: Pool;
  minAmountOut: string;
}

export const swap = async ({
  pool,
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
}: SwapOptions) => {
  const swapAction = {
    pool_id: pool.id,
    token_in: tokenIn.id,
    token_out: tokenOut.id,
    amount_in: toNonDivisibleNumber(tokenIn.decimals, amountIn),
    min_amount_out: toNonDivisibleNumber(tokenOut.decimals, minAmountOut),
  };

  const actions: RefFiFunctionCallOptions[] = [
    {
      methodName: 'swap',
      args: { actions: [swapAction] },
      amount: ONE_YOCTO_NEAR,
    },
  ];

  const needsStorageDeposit = await checkTokenNeedsStorageDeposit(tokenIn.id);
  if (needsStorageDeposit) {
    actions.unshift({
      methodName: 'storage_deposit',
      args: { account_id: wallet.getAccountId(), registration_only: false },
      amount: '0.00084',
    });
  }

  return refFiManyFunctionCalls(actions);
};

export const checkSwap = (txHash: string) => {
  return (near.connection.provider as JsonRpcProvider).sendJsonRpc('tx', [
    txHash,
    wallet.getAccountId(),
  ]);
};
