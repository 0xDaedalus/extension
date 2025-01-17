import React, { ReactElement } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  selectHideDust,
  toggleHideDust,
} from "@tallyho/tally-background/redux-slices/ui"
import CorePage from "../components/Core/CorePage"
import SharedButton from "../components/Shared/SharedButton"
import SharedToggleButton from "../components/Shared/SharedToggleButton"

function SettingRow(props: {
  title: string
  component: () => ReactElement
}): ReactElement {
  const { title, component } = props

  return (
    <li>
      <div className="left">{title}</div>
      <div className="right">{component()}</div>
      <style jsx>
        {`
          li {
            height: 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .left {
            color: var(--green-20);
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
          }
        `}
      </style>
    </li>
  )
}

export default function Menu(): ReactElement {
  const dispatch = useDispatch()
  const hideDust = useSelector(selectHideDust)

  const toggleHideDustAssets = (toggleValue: boolean | undefined) => {
    dispatch(toggleHideDust(toggleValue))
  }
  const settings = {
    general: [
      {
        title: "Hide asset balance under $2",
        component: () => (
          <SharedToggleButton
            onChange={(toggleValue) => toggleHideDustAssets(toggleValue)}
            value={hideDust}
          />
        ),
      },
    ],
  }

  return (
    <>
      <CorePage hasTopBar={false}>
        <section className="standard_width_padded">
          <h1>Settings</h1>
          <ul>
            {settings.general.map((setting) => (
              <SettingRow
                key={setting.title}
                title={setting.title}
                component={setting.component}
              />
            ))}
          </ul>
          <span>More settings are coming</span>
          <div className="community_cta_wrap">
            <div className="illustration_discord" />
            <h2 className="serif_header">Community release!</h2>
            <p>Join our discord to give us feedback!</p>
            <SharedButton
              type="primary"
              size="large"
              icon="discord"
              iconSize="large"
              iconPosition="left"
              onClick={() => {
                window.open(`https://chat.tally.cash/`, "_blank")?.focus()
              }}
            >
              Give feedback!
            </SharedButton>
          </div>
        </section>
      </CorePage>
      <style jsx>
        {`
          .community_cta_wrap {
            height: 435px;
            width: 384px;
            position: absolute;
            bottom: 0px;
            left: 0px;
            background-color: var(--green-95);
            text-align: center;
            padding-top: 24px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            color: #fff;
            font-size: 22px;
            font-weight: 500;
            line-height: 32px;
            margin-bottom: 5px;
          }
          h2 {
            font-size: 36px;
          }
          p {
            color: var(--green-20);
            text-align: center;
            font-size: 16px;
            margin-top: 6px;
            margin-bottom: 24px;
          }
          span {
            color: var(--green-40);
            font-size: 16px;
            font-weight: 400;
            line-height: 24px;
          }
          .mega_discord_chat_bubble_button {
            background: url("./images/tally_ho_chat_bubble@2x.png");
            background-size: cover;
            width: 266px;
            height: 120px;
            margin-top: 20px;
          }
          .mega_discord_chat_bubble_button:hover {
            opacity: 0.8;
          }
          .illustration_discord {
            background: url("./images/illustration_menu_tab_discord@2x.png");
            background-size: cover;
            width: 252px;
            height: 162px;
            margin: 5px 0px 20px -19px;
          }
        `}
      </style>
    </>
  )
}
