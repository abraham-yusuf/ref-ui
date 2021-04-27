import React, { useState } from 'react';
import {
  useTokenBalances,
  useUserRegisteredTokens,
  useWhitelistTokens,
} from '../state/token';
import Loading from '../components/layout/Loading';
import { Card } from '../components/card';
import { toReadableNumber } from '../utils/numbers';
import { TokenMetadata } from '../services/ft-contract';
import { nearMetadata } from '../services/wrap-near';
import { useDepositableBalance } from '../state/token';
import TokenAmount from '../components/forms/TokenAmount';
import { Near } from '../components/icon';
import { deposit } from '../services/token';
import { wallet } from '~services/near';
import { Balances } from '../components/deposit';

function ConnectToNearBtn() {
  return (
    <div
      className="flex items-center justify-center pt-2"
      onClick={() => wallet.requestSignIn()}
    >
      <div className="inline-flex cursor-pointer font-bold items-center text-center rounded-full bg-gray-800 px-3.5 py-1">
        <div className="pr-1">
          <Near />
        </div>
        <div className="text-xs text-white">Connect to NEAR</div>
      </div>
    </div>
  );
}

function DepositBtn(props: { amount?: string; token?: TokenMetadata }) {
  const { amount, token } = props;
  const canSubmit = !!amount && !!token;

  return (
    <div className="flex items-center justify-center pt-2">
      <button
        className={`rounded-full text-xs text-white px-3 py-1.5 focus:outline-none font-semibold ${
          canSubmit ? 'bg-greenLight' : 'bg-gray-800'
        }`}
        onClick={() => {
          if (canSubmit) {
            deposit({
              token,
              amount,
            });
          }
        }}
      >
        Deposit to Stake
      </button>
    </div>
  );
}

export default function DepositPage() {
  const [amount, setAmount] = useState<string>('');
  const balances = useTokenBalances();

  const registeredTokens = useUserRegisteredTokens();
  const [selectedToken, setSelectedToken] = useState<TokenMetadata>(
    nearMetadata
  );

  const tokens = useWhitelistTokens();
  const userTokens = useUserRegisteredTokens();
  const depositable = useDepositableBalance(selectedToken?.id);

  if (!tokens || !userTokens) return <Loading />;
  if (!registeredTokens || !balances) return <Loading />;

  const max = toReadableNumber(selectedToken?.decimals, depositable) || '0';

  return (
    <div className="flex items-center flex-col">
      <div className="text-center pb-5">
        <div className="text-white text-3xl font-semibold">Deposit</div>
        <div className="text-white text-xs pt-2">Use this to deposit tokens</div>
      </div>
      <Card>
        <TokenAmount
          amount={amount}
          max={max}
          tokens={[nearMetadata, ...tokens]}
          selectedToken={selectedToken}
          onSelectToken={setSelectedToken}
          onChangeAmount={setAmount}
        />
        {wallet.isSignedIn() ? (
          <DepositBtn amount={amount} token={selectedToken} />
        ) : (
          <ConnectToNearBtn />
        )}
      </Card>
      <div className="text-white text-xs pt-3">
        Small storage fee is applied of{' '}
        <span className="font-bold">0.00084</span> Ⓝ
      </div>

      <Balances title="Balance" tokens={userTokens} balances={balances} />
    </div>
  );
}