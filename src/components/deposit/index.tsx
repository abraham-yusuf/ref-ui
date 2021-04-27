import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import {
  useTokenBalances,
  useUserRegisteredTokens,
  useWhitelistTokens,
} from '../../state/token';
import { TokenMetadata } from '../../services/ft-contract';
import { toReadableNumber } from '../../utils/numbers';
import { Card } from '../card';
import TokenAmount from '../forms/TokenAmount';
import { TokenBalancesView, withdraw } from '../../services/token';

export function WithdrawModal(props: ReactModal.Props) {
  const [amount, setAmount] = useState<string>('');
  const tokens = useWhitelistTokens();
  const userTokens = useUserRegisteredTokens();
  const balances = useTokenBalances();
  const [selectedToken, setSelectedToken] = useState<TokenMetadata | null>(
    null
  );

  useEffect(() => {
    if (userTokens) setSelectedToken(userTokens[0]);
  }, [userTokens]);

  const ready = tokens && balances && userTokens && selectedToken;
  if (!ready) return null;

  const max = toReadableNumber(
    selectedToken.decimals,
    balances[selectedToken.id] || '0'
  );

  return (
    <Modal {...props}>
      <Card style={{ width: '25vw' }}>
        <div className="text-sm text-gray-800 font-semibold pb-4">
          Withdraw Token
        </div>
        <TokenAmount
          amount={amount}
          max={max}
          tokens={userTokens}
          selectedToken={selectedToken}
          onSelectToken={setSelectedToken}
          onChangeAmount={setAmount}
        />
        <div className="flex items-center justify-center pt-5">
          <button
            className="rounded-full text-xs text-white px-3 py-1.5 focus:outline-none font-semibold bg-green-500"
            onClick={() => {
              withdraw({
                token: selectedToken,
                amount,
              });
            }}
          >
            Withdraw
          </button>
        </div>
      </Card>
    </Modal>
  );
}

export function Token(props: TokenMetadata & { amount: string }) {
  const { symbol, icon, amount } = props;
  return (
    <div className="token flex items-center justify-between pt-3.5 pb-3.5">
      <div className="flex items-center">
        {icon ? (
          <img className="h-6 w-6" src={icon} alt={symbol} />
        ) : (
          <div className="h-6 w-6"></div>
        )}
        <div className="pl-5 font-semibold text-xs">{symbol}</div>
      </div>
      <div className="font-semibold text-sm">{amount}</div>
    </div>
  );
}

export function TokenList(props: {
  tokens: TokenMetadata[];
  balances: TokenBalancesView;
}) {
  const { tokens, balances } = props;

  return (
    <div className="divide-y">
      {tokens.map((token) => {
        const amount = toReadableNumber(
          token.decimals,
          balances[token.id] || '0'
        );
        return <Token key={token.id} {...token} amount={amount} />;
      })}
      {tokens.length === 0 ? (
        <div className="text-center text-gray-600 text-xs font-semibold pt-2 pb-2">
          No tokens deposit
        </div>
      ) : null}
    </div>
  );
}

export function Balances(props: {
  title?: string;
  tokens: TokenMetadata[];
  balances: TokenBalancesView;
}) {
  const { tokens, balances, title } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="balances flex items-center flex-col justify-center pt-8 w-full">
      {title ? (
        <div className="text-white font-semibold text-xl pb-4">Balance</div>
      ) : null}
      <Card>
        <TokenList tokens={tokens} balances={balances} />

        {tokens.length > 0 ? (
          <div className="flex items-center justify-center pt-5">
            <button
              className="rounded-full text-xs text-white px-3 py-1.5 focus:outline-none font-semibold bg-greenLight"
              onClick={() => setIsOpen(true)}
            >
              Withdraw
            </button>
          </div>
        ) : null}
      </Card>

      <WithdrawModal isOpen={isOpen} onRequestClose={() => setIsOpen(false)} />
    </div>
  );
}