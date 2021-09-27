import React, { ReactElement } from "react"
import { useLocation } from "react-router-dom"
import { selectTimestampedAccountData } from "@tallyho/tally-background/redux-slices/accounts"
import { useBackgroundSelector } from "../hooks"
import CorePage from "../components/Core/CorePage"
import SharedAssetIcon from "../components/Shared/SharedAssetIcon"
import SharedButton from "../components/Shared/SharedButton"
import WalletActivityList from "../components/Wallet/WalletActivityList"
import BackButton from "../components/Shared/SharedBackButton"

export default function SingleAsset(): ReactElement {
  const location = useLocation()
  const { symbol } = location.state
  const { activity } = useBackgroundSelector(selectTimestampedAccountData)

  const filteredActivity = activity.filter((item) => {
    return item?.asset?.symbol === symbol
  })

  return (
    <>
      <CorePage>
        <BackButton />
        <div className="header standard_width_padded">
          <div className="left">
            <div className="asset_wrap">
              <SharedAssetIcon />
              <span className="asset_name">{symbol}</span>
            </div>
            <div className="balance">125,137.00</div>
            <div className="usd_value">($127,237,318)</div>
          </div>
          <div className="right">
            <SharedButton
              type="primary"
              size="medium"
              icon="send"
              linkTo={{
                pathname: "/send",
                state: {
                  token: { name: symbol },
                },
              }}
            >
              Send
            </SharedButton>
            <SharedButton type="primary" size="medium" icon="swap">
              Swap
            </SharedButton>
          </div>
        </div>
        <div className="sub_info_seperator_wrap standard_width_padded">
          <div className="left">Asset is on: Arbitrum</div>
          <div className="right">Move to Ethereum</div>
        </div>
        <div className="label_light standard_width_padded">Activity</div>
        <WalletActivityList activity={filteredActivity} />
      </CorePage>
      <style jsx>
        {`
          .sub_info_seperator_wrap {
            display: flex;
            border: 1px solid var(--green-120);
            border-left: 0px;
            border-right: 0px;
            padding-top: 8px;
            padding-bottom: 8px;
            box-sizing: border-box;
            color: var(--green-60);
            font-size: 14px;
            line-height: 16px;
            justify-content: space-between;
            margin-top: 23px;
            margin-bottom: 16px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header .right {
            height: 95px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .asset_name {
            color: #fff;
            font-size: 22px;
            font-weight: 500;
            line-height: 32px;
            text-align: center;
            text-transform: uppercase;
            margin-left: 8px;
          }
          .asset_wrap {
            display: flex;
            align-items: center;
          }
          .balance {
            color: #fff;
            font-size: 36px;
            font-weight: 500;
            line-height: 48px;
          }
          .usd_value {
            width: 112px;
            color: var(--green-40);
            font-size: 16px;
            font-weight: 600;
            line-height: 24px;
            text-align: center;
          }
          .label_light {
            color: var(--green-40);
            font-size: 16px;
            font-weight: 500;
            line-height: 24px;
            margin-bottom: 8px;
          }
        `}
      </style>
    </>
  )
}
