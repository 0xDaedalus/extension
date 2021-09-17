import React, { ReactElement } from "react"
import SharedButton from "../Shared/SharedButton"
import OnboardingStepsIndicator from "./OnboardingStepsIndicator"
import titleStyle from "./titleStyle"

interface Props {
  triggerNextStep: () => void
}

export default function OnboardingSaveSeed(props: Props): ReactElement {
  const { triggerNextStep } = props

  return (
    <section>
      <OnboardingStepsIndicator activeStep={1} />
      <h1 className="serif_header center_text title">
        Save and store your recovery seed
      </h1>
      <div className="subtitle">
        This is the only way to restore your tally wallett
      </div>
      <div className="words_group">
        <div className="column_wrap">
          <div className="column numbers">1 2 3 4 5 6</div>
          <div className="column dashes">- - - - - -</div>
          <div className="column words">hub plum catering desk mouse cap</div>
        </div>
        <div className="column_wrap">
          <div className="column numbers">1 2 3 4 5 6</div>
          <div className="column dashes">- - - - - -</div>
          <div className="column words">hub plum catering desk mouse cap</div>
        </div>
      </div>
      <div className="button_group">
        <SharedButton
          type="primary"
          size="medium"
          icon="arrow_right"
          iconSize="large"
          onClick={triggerNextStep}
        >
          I wrote it down, verify recovery seed
        </SharedButton>
        <div className="copy_button">
          <SharedButton
            type="secondary"
            size="medium"
            icon="arrow_right"
            iconSize="large"
            onClick={triggerNextStep}
          >
            Copy and verify recovery seed
          </SharedButton>
        </div>
        <SharedButton type="tertiary" size="medium" linkTo="/">
          remind me later
        </SharedButton>
      </div>
      <style jsx>
        {`
          ${titleStyle}
          .words_group {
            display: flex;
            width: 232px;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .numbers {
            width: 12px;
          }
          .dashes {
            width: 12px;
          }
          .words {
            width: 69px;
          }
          .column {
            height: 142px;
            color: #ffffff;
            font-size: 18px;
            font-weight: 600;
            line-height: 24px;
            text-align: right;
          }
          .column_wrap {
            display: flex;
          }
          .dashes {
            margin-right: 8px;
            margin-left: 5px;
          }
          .words {
            text-align: left;
          }
          .button_group {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .copy_button {
            margin: 16px 0px 4px 0px;
          }
        `}
      </style>
    </section>
  )
}
