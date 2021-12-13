import { isAddress } from "@ethersproject/address"
import { formatEther } from "@ethersproject/units"
import { BlockEstimate } from "@tallyho/tally-background/networks"
import { selectCurrentAccountBalances } from "@tallyho/tally-background/redux-slices/selectors"
import { updateTransactionOptions } from "@tallyho/tally-background/redux-slices/transaction-construction"
import { utils } from "ethers"
import React, { ReactElement, useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import CorePage from "../components/Core/CorePage"
import FeeSettingsButton from "../components/NetworkFees/FeeSettingsButton"
import SharedAssetInput from "../components/Shared/SharedAssetInput"
import SharedButton from "../components/Shared/SharedButton"
import { useBackgroundDispatch, useBackgroundSelector } from "../hooks"

export default function Send(): ReactElement {
  const location = useLocation<{ symbol: string }>()

  const [assetSymbol, setAssetSymbol] = useState(location?.state?.symbol)
  const [selectedCount, setSelectedCount] = useState(0)
  const [destinationAddress, setDestinationAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [currentBalance, setCurrentBalance] = useState("")

  const [selectedEstimatedFeePerGas, setSelectedEstimatedFeePerGas] =
    useState<BlockEstimate>({
      confidence: 0,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      price: 0n,
    })

  const dispatch = useBackgroundDispatch()

  const currentAccount = useBackgroundSelector(({ ui }) => ui.currentAccount)

  const balanceData = useBackgroundSelector(selectCurrentAccountBalances)

  const { assetAmounts } = balanceData ?? {
    assetAmounts: [],
  }

  const getTotalLocalizedValue = () => {
    const pricePerUnit = assetAmounts.find(
      (el) => el.asset.symbol === assetSymbol
    )?.unitPrice
    if (pricePerUnit) {
      return (Number(amount) * pricePerUnit).toFixed(2)
    }
    return 0
  }
  const findBalance = useCallback(() => {
    const balance = formatEther(
      assetAmounts.find((el) => el.asset.symbol === assetSymbol)?.amount || "0"
    )
    setCurrentBalance(balance)
  }, [assetAmounts, assetSymbol])

  const setMaxBalance = () => {
    if (currentBalance) {
      setAmount(currentBalance)
    }
  }

  const openSelectFeeModal = () => {
    setFeeModalOpen(true)
  }
  const closeSelectFeeModal = () => {
    setFeeModalOpen(false)
  }

  const sendTransactionRequest = async () => {
    const transaction = {
      from: currentAccount.address,
      to: destinationAddress,
      // eslint-disable-next-line no-underscore-dangle
      value: BigInt(utils.parseEther(amount?.toString())._hex),
      maxFeePerGas: selectedEstimatedFeePerGas?.maxFeePerGas,
      maxPriorityFeePerGas: selectedEstimatedFeePerGas?.maxPriorityFeePerGas,
    }
    dispatch(updateTransactionOptions(transaction))
  }

  useEffect(() => {
    findBalance()
  }, [findBalance])

  useEffect(() => {
    if (assetSymbol) {
      setSelectedCount(1)
    }
  }, [assetSymbol])

  return (
    <>
      <CorePage>
        <div className="standard_width">
          <h1 className="header">
            <span className="icon_activity_send_medium" />
            <div className="title">Send Asset</div>
          </h1>
          <div className="form">
            <div className="form_input">
              <div className="balance">
                Balance: {`${currentBalance.substr(0, 8)}\u2026 `}
                <span
                  className="max"
                  onClick={setMaxBalance}
                  role="button"
                  tabIndex={0}
                  onKeyDown={() => {}}
                >
                  Max
                </span>
              </div>
              <SharedAssetInput
                label="Asset / Amount"
                onAssetSelect={(token) => {
                  setAssetSymbol(token.symbol)
                }}
                assets={assetAmounts.map((asset) => {
                  return {
                    symbol: asset.asset.symbol,
                    name: asset.asset.name,
                  }
                })}
                onAmountChange={setAmount}
                defaultToken={{ symbol: assetSymbol, name: assetSymbol }}
                amount={amount}
              />
              <div className="value">${getTotalLocalizedValue()}</div>
            </div>
            <div className="form_input">
              <SharedAssetInput
                isTypeDestination
                label="Send To:"
                onSendToAddressChange={setDestinationAddress}
              />
            </div>
            <div className="network_fee">
              <p>Estimated network fee</p>
              <FeeSettingsButton
                openModal={openSelectFeeModal}
                closeModal={closeSelectFeeModal}
                open={feeModalOpen}
              />
            </div>
            <div className="divider" />
            <div className="send_footer standard_width_padded">
              <SharedButton
                type="primary"
                size="large"
                isDisabled={
                  selectedCount <= 0 ||
                  Number(amount) === 0 ||
                  !isAddress(destinationAddress)
                }
                linkTo={{
                  pathname: "/signTransaction",
                  state: {
                    assetSymbol,
                    amount,
                    to: destinationAddress,
                    signType: "sign",
                  },
                }}
                onClick={sendTransactionRequest}
              >
                Send
              </SharedButton>
            </div>
          </div>
        </div>
      </CorePage>
      <style jsx>
        {`
          .icon_activity_send_medium {
            background: url("./images/activity_send_medium@2x.png");
            background-size: 24px 24px;
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }
          .network_fee {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            line-height: 16px;
            color: var(--green-40);
            margin-bottom: 12px;
          }
          .title {
            width: 113px;
            height: 32px;
            color: #ffffff;
            font-size: 22px;
            font-weight: 500;
            line-height: 32px;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            margin-top: 17px;
          }
          .form_input {
            margin-bottom: 22px;
          }

          .label_right {
            margin-right: 6px;
          }
          .divider {
            width: 384px;
            border-bottom: 1px solid #000000;
            margin-left: -16px;
          }
          .label {
            margin-bottom: 6px;
          }
          .balance {
            color: var(--green-40);
            text-align: right;
            position: relative;
            font-size: 14px;
            top: 16px;
            right: 0;
          }
          .max {
            color: #d08e39;
            cursor: pointer;
          }
          .value {
            display: flex;
            justify-content: flex-end;
            position: relative;
            top: -24px;
            right: 16px;
            color: var(--green-60);
            font-size: 12px;
            line-height: 16px;
          }
          .send_footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 21px;
            padding-bottom: 20px;
          }
        `}
      </style>
    </>
  )
}
