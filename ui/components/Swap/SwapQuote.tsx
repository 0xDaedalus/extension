import React, { ReactElement } from "react"
import SharedButton from "../Shared/SharedButton"
import SharedActivityHeader from "../Shared/SharedActivityHeader"
import SwapQuoteAssetCard from "./SwapQuoteAssetCard"
import { useBackgroundDispatch, useBackgroundSelector } from "../../hooks"
import SwapLimitSettings from "./SwapLimitSettings"
import { DAY, HOUR } from "@tallyho/tally-background/constants"
import { KeeperDAOLimitOrder } from "@tallyho/tally-background/types"
import { selectCurrentLimitOrder } from "@tallyho/tally-background/redux-slices/0x-swap"
import { signLimitOrder } from "@tallyho/tally-background/redux-slices/transaction-construction"
import { useHistory } from "react-router-dom"

type UnVerifiedLimitOrder = [false, false]

type VerifiedLimitOrder = [true, KeeperDAOLimitOrder]

const verifyLimitOrder = (
  record: any
): VerifiedLimitOrder | UnVerifiedLimitOrder => {
  if (!record.maker || typeof record.maker !== "string") {
    return [false, false]
  }
  if (!record.taker || typeof record.taker !== "string") {
    return [false, false]
  }
  if (!record.makerAmount || typeof record.makerAmount !== "string") {
    return [false, false]
  }
  if (!record.takerAmount || typeof record.takerAmount !== "string") {
    return [false, false]
  }
  if (!record.makerToken || typeof record.makerToken !== "string") {
    return [false, false]
  }
  if (!record.takerToken || typeof record.takerToken !== "string") {
    return [false, false]
  }

  // Expiration must be in seconds
  let expiration = ""

  switch (record.expiry) {
    case "1h":
      expiration = String((Date.now() + HOUR) / 1000)
      break
    case "2h":
      expiration = String((Date.now() + HOUR * 2) / 1000)
    case "1d":
      expiration = String((Date.now() + DAY) / 1000)
    case "1w":
      expiration = String((Date.now() + DAY * 7) / 1000)
    default:
      return [false, false]
  }

  return [
    true,
    {
      maker: record.maker,
      taker: "0x0000000000000000000000000000000000000000",
      makerAmount: record.makerAmount,
      takerAmount: record.takerAmount,
      makerToken: record.makerToken,
      takerToken: record.takerToken,
      salt: Date.now().toString(),
      expiry: expiration,
      chainId: 1,
      txOrigin: "0xBd49A97300E10325c78D6b4EC864Af31623Bb5dD",
      pool: "0x0000000000000000000000000000000000000000000000000000000000000017",
      verifyingContract: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    },
  ]
}

export default function SwapQoute(): ReactElement {
  const history = useHistory()
  const dispatch = useBackgroundDispatch()

  const swap = useBackgroundSelector((state) => {
    return state.swap
  })

  const limitOrderState = useBackgroundSelector(selectCurrentLimitOrder)

  const handleConfirm = async () => {
    if (limitOrderState) {
      const verified = verifyLimitOrder(limitOrderState)
      if (verified[0] === false) {
        console.error("Bad Limit Order: ", limitOrderState)
        return
      }

      console.log("Limit Order Verified!")
      const verifiedLimitOrder = verified[1]
      dispatch(signLimitOrder(verifiedLimitOrder))
      //   await isTransactionSigned
      history.push("/")
      // }
    }
  }

  const exchangeRateLabel = `1 ${
    swap.sellToken?.symbol
  } = ${new Intl.NumberFormat("en-US").format(
    +swap.buyAmount / +swap.sellAmount
  )} ${swap.buyToken?.symbol}`

  return (
    <section className="center_horizontal standard_width">
      <SharedActivityHeader label="Limit Order" activity="swap" />
      <div className="qoute_cards">
        <SwapQuoteAssetCard type="sell" test="enabled" />
        <span className="icon_switch" />
        <SwapQuoteAssetCard type="buy" />
      </div>
      <span className="label label_right">{exchangeRateLabel}</span>
      <div className="settings_wrap">
        <SwapLimitSettings />
      </div>

      <>
        <div className="exchange_section_wrap">
          <div className="exchange_content standard_width">
            <div className="left">
              <div className="icon_rook" />
              <a
                className="keeper-link"
                href="https://www.keeperdao.com/"
                target="_blank"
              >
                Powered By KeeperDAO
              </a>
            </div>
          </div>
        </div>
        <div className="approve_button center_horizontal">
          <SharedButton type="primary" size="large" onClick={handleConfirm}>
            Sign Limit Order
          </SharedButton>
        </div>
      </>
      <style jsx>
        {`
          section {
            margin-top: -24px;
          }
          .icon_rook {
            background: url("./images/rook@2x.png");
            background-size: 24px 24px;
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }
          .keeper-link,
          .keeper-link:visited,
          .keeper-link:hover,
          .keeper-link:active {
            color: var(--gold-80);
          }
          .approval_steps {
            height: 96px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin-top: 24px;
          }
          .icon_switch {
            background: url("./images/switch@2x.png") center no-repeat;
            background-size: 20px 20px;
            width: 40px;
            height: 32px;
            border-radius: 4px;
            border: 3px solid var(--hunter-green);
            background-color: var(--green-95);
            margin-left: -11px;
            margin-right: -11px;
            z-index: 5;
            flex-grow: 1;
            flex-shrink: 0;
          }
          .qoute_cards {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .label_right {
            float: right;
            margin-top: 16px;
          }
          .settings_wrap {
            margin-top: 44px;
          }
          .exchange_content {
            height: 40px;
            border-radius: 4px;
            background-color: var(--green-95);
            color: var(--green-20);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0.42px;
            line-height: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0px 16px;
            box-sizing: border-box;
          }
          .approve_button {
            width: fit-content;
            margin-top: 36px;
          }
          .exchange_section_wrap {
            margin-top: 16px;
          }
          .left {
            display: flex;
            align-items: center;
          }
        `}
      </style>
    </section>
  )
}
