import React, { useState } from 'react';
import { FaRegWindowClose, FaCheck } from 'react-icons/fa';
import { useSwap } from '../../state/swap';
import SelectToken from '../../components/forms/SelectToken';
import Icon from '../../components/tokens/Icon';
import { AdboardMetadata } from '../../services/adboard';
import { TokenMetadata } from '../../services/ft-contract';
import { useToken, useUserRegisteredTokens, useWhitelistTokens } from '../../state/token';

interface BuyModalProps {
  metadata: AdboardMetadata;
  tokens: TokenMetadata[];
  close: () => void;
}

const BuyModal = ({ metadata, close }: BuyModalProps) => {
  const [selectedToken, setSelectedToken] = useState<TokenMetadata>();
  const token = useToken(metadata.token_id);
  const tokens = useWhitelistTokens();

  const { minAmountOut } = useSwap({
    tokenIn: token,
    tokenInAmount: String(metadata.token_price),
    tokenOut: selectedToken,
    slippageTolerance: 1.1,
  });

  if (!token) return null;

  function buyFrame() {
    console.log(metadata.token_id);
    close();
  }

  return (
    <div className="fixed flex items-center justify-center w-screen h-screen">
      <div
        className="fixed w-screen h-screen blur"
        style={{
          filter: 'blur(5px)',
          background: 'rgba(0, 0, 0, 0.75)',
        }}
      ></div>
      <div className="fixed flex w-1/2 flex-row rounded-md shadow-xl bg-theme-normal">
        <div
          className="p-6"
          style={{
            backgroundColor: 'black',
            borderRadius: '6px',
          }}
        >
          <div className="mb-2 font-semibold text-white">
            <span className="flex">
              Frame #{metadata.frameId} will cost you {metadata.token_price}{' '}
              <Icon className="ml-2" token={token} />
            </span>
            <p className="my-2">
              After you buy the frame it is protected for 1 hour before it can
              be bought by other users.
            </p>
            <p className="my-2 flex items-center">
              Please decide which token you will accept for your frame
              <SelectToken
                tokens={tokens}
                selected={selectedToken && <Icon token={selectedToken} />}
                onSelect={setSelectedToken}
              />
            </p>

            <p>
              And a price factor (between 0.9 and 1.1):
              <input
                type="range"
                min="0.9"
                max="1.1"
                step="0.1"
                list="steplist"
              />
              <datalist className="text-white" id="steplist">
                <option>0.9</option>
                <option>1.0</option>
                <option>1.1</option>
              </datalist>
            </p>
            {minAmountOut ? (
              <div className="flex mt-6">
                <span className="mr-2">
                  Giving you a sale price of {minAmountOut}
                </span>
                <Icon token={selectedToken} />
              </div>
            ) : null}
          </div>
          <br></br>

          <div className="flex flex-row justify-around w-full mt-12">
            <button
              onClick={close}
              className="flex flex-row justify-center items-center h-auto py-2 font-semibold border border-solid rounded-md shadow-xl focus:outline-none border-theme-light w-28 text-theme-dark bg-theme-light"
              style={{ backgroundColor: 'green' }}
            >
              <FaRegWindowClose className="mr-2" />
              Cancel
            </button>
            <button
              onClick={() => buyFrame()}
              className="flex flex-row justify-center items-center h-auto py-2 font-semibold border border-solid rounded-md shadow-xl focus:outline-none border-theme-light w-28 text-theme-dark bg-theme-light"
              style={{ backgroundColor: 'green' }}
            >
              <FaCheck className="mr-2" />
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyModal;
