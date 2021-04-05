import React from 'react';
import { TokenMetadata } from '../../services/ft-contract';
import Icon from './Icon';

interface TokenProps {
  token: TokenMetadata;
  onClick: (token: TokenMetadata) => void;
  render?: (token: TokenMetadata) => React.ReactElement;
}

export default function Token({ token, onClick, render }: TokenProps) {
  return (
    <section
      className={`${
        onClick ? 'cursor-pointer' : ' '
      } grid grid-cols-3 align-center p-4 w-full text-center hover:bg-secondaryScale-100`}
      onClick={() => onClick && onClick(token)}
    >
      <Icon token={token} />
      <p>{token.symbol}</p>
      {render && render(token)}
    </section>
  );
}
