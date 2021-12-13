import { AnyAssetAmount } from "@tallyho/tally-background/assets"
import { EIP1559TransactionRequest } from "@tallyho/tally-background/networks"
import { CompleteAssetAmount } from "@tallyho/tally-background/redux-slices/accounts"
import { selectAssetPricePoint } from "@tallyho/tally-background/redux-slices/assets"
import {
  selectCurrentAddressNetwork,
  selectMainCurrency,
} from "@tallyho/tally-background/redux-slices/selectors"
import {
  AssetDecimalAmount,
  enrichAssetAmountWithDecimalValues,
  enrichAssetAmountWithMainCurrencyValues,
} from "@tallyho/tally-background/redux-slices/utils/asset-utils"
import React, { ReactElement } from "react"
import { useBackgroundSelector } from "../../hooks"

interface Props {
  transactionDetails: EIP1559TransactionRequest
}

export default function SignTransactionSignBlock({
  transactionDetails,
}: Props): ReactElement {
  const {
    addressNetwork: { network },
  } = useBackgroundSelector(selectCurrentAddressNetwork)
  const mainCurrency = useBackgroundSelector(selectMainCurrency)
  const baseAssetPricePoint = useBackgroundSelector((state) =>
    selectAssetPricePoint(
      state.assets,
      network.baseAsset.symbol,
      mainCurrency?.symbol
    )
  )

  const transactionAssetAmount = enrichAssetAmountWithDecimalValues(
    {
      asset: network.baseAsset,
      amount: transactionDetails.value,
    },
    2
  )

  const completeTransactionAssetAmount:
    | (AnyAssetAmount & AssetDecimalAmount)
    | CompleteAssetAmount =
    typeof baseAssetPricePoint !== "undefined"
      ? enrichAssetAmountWithMainCurrencyValues(
          transactionAssetAmount,
          baseAssetPricePoint,
          2
        )
      : transactionAssetAmount

  return (
    <div className="sign_block">
      <dl>
        {typeof transactionDetails.to === "undefined" ? (
          <>
            <dt>Send to:</dt>
            <dd className="contract_creation">Contract creation</dd>
          </>
        ) : (
          <>
            <dt>Send to:</dt>
            <dd className="contract_recipient">{transactionDetails.to}</dd>
          </>
        )}
        <dt className="spend_amount_label">Spend Amount</dt>
        <dd className="spend_amount">
          <div className="eth_value">
            {completeTransactionAssetAmount.localizedDecimalAmount}
          </div>
          <div className="main_currency_value">
            {"localizedMainCurrencyAmount" in completeTransactionAssetAmount ? (
              completeTransactionAssetAmount.localizedMainCurrencyAmount
            ) : (
              <></>
            )}
          </div>
        </dd>
      </dl>
      <style jsx>
        {`
          .sign_block {
            padding: 24px 0px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .spend_amount_label {
            color: var(--green-40);
            font-size: 14px;
            line-height: 16px;
            margin-bottom: 4px;
          }
          .spend_amount {
            color: #fff;
            font-size: 28px;
            text-align: right;
            text-transform: uppercase;
          }
        `}
      </style>
    </div>
  )
}
