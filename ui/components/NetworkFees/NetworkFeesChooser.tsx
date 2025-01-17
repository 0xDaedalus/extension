import { formatUnits, formatEther } from "@ethersproject/units"
import { BlockEstimate } from "@tallyho/tally-background/networks"
import { selectMainCurrencyUnitPrice } from "@tallyho/tally-background/redux-slices/selectors"
import {
  EstimatedFeesPerGas,
  selectLastGasEstimatesRefreshTime,
} from "@tallyho/tally-background/redux-slices/transaction-construction"
import React, { ReactElement, useCallback, useEffect, useState } from "react"
import { useBackgroundSelector } from "../../hooks"
import SharedButton from "../Shared/SharedButton"
import SharedInput from "../Shared/SharedInput"

type GasOption = {
  name: string
  confidence: string
  gwei: string
  dollarValue: string
  price: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

interface NetworkFeesChooserProps {
  setFeeModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  onSelectFeeOption: (arg0: BlockEstimate) => void
  currentFeeSelectionPrice: (arg0: { gwei: string; fiat: string }) => void
  selectedGas?: BlockEstimate
  gasLimit: string | number
  setGasLimit: React.Dispatch<React.SetStateAction<string>>
  estimatedFeesPerGas: EstimatedFeesPerGas | undefined
}

export default function NetworkFeesChooser({
  setFeeModalOpen,
  onSelectFeeOption,
  currentFeeSelectionPrice,
  selectedGas,
  gasLimit,
  setGasLimit,
  estimatedFeesPerGas,
}: NetworkFeesChooserProps): ReactElement {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [activeFeeIndex, setActiveFeeIndex] = useState(0)
  const [gasOptions, setGasOptions] = useState<GasOption[]>([])

  const handleSelectGasOption = (index: number) => {
    setActiveFeeIndex(index)
  }

  const saveUserGasChoice = () => {
    onSelectFeeOption({
      confidence: Number(gasOptions[activeFeeIndex].confidence),
      price: gasOptions[activeFeeIndex].price,
      maxFeePerGas: gasOptions[activeFeeIndex].maxFeePerGas,
      maxPriorityFeePerGas: gasOptions[activeFeeIndex].maxPriorityFeePerGas,
    })
    setFeeModalOpen(false)
    currentFeeSelectionPrice({
      gwei: gasOptions[activeFeeIndex].gwei,
      fiat: gasOptions[activeFeeIndex].dollarValue,
    })
  }
  const gasTime = useBackgroundSelector(selectLastGasEstimatesRefreshTime)

  const ethUnitPrice = useBackgroundSelector(selectMainCurrencyUnitPrice)

  const getSecondsTillGasUpdate = useCallback(() => {
    const now = new Date().getTime()
    setTimeRemaining(Number((120 - (now - gasTime) / 1000).toFixed()))
  }, [gasTime])

  useEffect(() => {
    getSecondsTillGasUpdate()
    const interval = setTimeout(getSecondsTillGasUpdate, 1000)
    return () => {
      clearTimeout(interval)
    }
  })

  const updateGasOptions = useCallback(() => {
    const formatBlockEstimate = (option: BlockEstimate) => {
      const { confidence } = option
      const baseFee = estimatedFeesPerGas?.baseFeePerGas || 0n
      const feeOptionData: {
        name: { [key: number]: string }
        multiplier: { [key: number]: bigint }
      } = {
        name: {
          70: "Regular",
          95: "Express",
          99: "Instant",
        },
        multiplier: {
          70: 13n,
          95: 15n,
          99: 18n,
        },
      }
      const gweiAmount = formatUnits(
        BigInt(
          Number(
            (baseFee * feeOptionData.multiplier[confidence]) / 10n
          ).toFixed()
        ) + option.maxPriorityFeePerGas,
        "gwei"
      ).split(".")[0]

      const ethAmount = formatEther(
        (baseFee * feeOptionData.multiplier[confidence] +
          option.maxPriorityFeePerGas) *
          (BigInt(gasLimit) > 0 ? BigInt(gasLimit) : 21000n)
      )

      const feeFiatPrice =
        ethUnitPrice !== undefined
          ? `${(+ethAmount * ethUnitPrice).toFixed(2)}`
          : "N/A"

      return {
        name: feeOptionData.name[confidence],
        confidence: `${confidence}`,
        gwei: gweiAmount,
        dollarValue: feeFiatPrice,
        price: option.price,
        maxFeePerGas: (baseFee * feeOptionData.multiplier[confidence]) / 10n,
        maxPriorityFeePerGas: option.maxPriorityFeePerGas,
      }
    }
    if (estimatedFeesPerGas) {
      const regular = estimatedFeesPerGas?.regular
      const express = estimatedFeesPerGas?.express
      const instant = estimatedFeesPerGas?.instant
      if (
        instant !== undefined &&
        express !== undefined &&
        regular !== undefined
      ) {
        const updatedGasOptions = [regular, express, instant].map((option) =>
          formatBlockEstimate(option)
        )
        setGasOptions(updatedGasOptions)
        const currentlySelectedFee = updatedGasOptions.find(
          (el, index) => index === activeFeeIndex
        )
        if (currentlySelectedFee) {
          onSelectFeeOption({
            confidence: Number(currentlySelectedFee?.confidence),
            maxFeePerGas: currentlySelectedFee?.maxFeePerGas,
            maxPriorityFeePerGas: currentlySelectedFee?.maxPriorityFeePerGas,
            price: currentlySelectedFee.price,
          })
          currentFeeSelectionPrice({
            gwei: currentlySelectedFee.gwei,
            fiat: currentlySelectedFee.dollarValue,
          })
        }
      }
    }
  }, [
    estimatedFeesPerGas,
    gasLimit,
    ethUnitPrice,
    onSelectFeeOption,
    activeFeeIndex,
    currentFeeSelectionPrice,
  ])

  useEffect(() => {
    updateGasOptions()
  }, [updateGasOptions])

  useEffect(() => {
    setActiveFeeIndex(
      gasOptions.findIndex(
        (el) => el.confidence === `${selectedGas?.confidence}`
      )
    )
  }, [gasOptions, selectedGas])

  return (
    <div className="wrapper">
      <div className="fees">
        <div className="title">Network Fees</div>
        <div className="divider">
          <div className="divider-background" />
          <div
            className="divider-cover"
            style={{ left: (120 - timeRemaining) * (-384 / 120) }}
          />
        </div>
        {gasOptions.map((option, i) => {
          return (
            <button
              className={`option ${i === activeFeeIndex ? "active" : ""}`}
              onClick={() => handleSelectGasOption(i)}
              type="button"
            >
              <div className="option_left">
                <div className="name">{option.name}</div>
                <div className="subtext">Probability: {option.confidence}%</div>
              </div>
              <div className="option_right">
                <div className="price">{`~${option.gwei} Gwei`}</div>
                <div className="subtext">${option.dollarValue}</div>
              </div>
            </button>
          )
        })}
        <div className="limit">
          <label className="limit_label" htmlFor="gasLimit">
            Gas limit
          </label>
          <SharedInput
            id="gasLimit"
            value={gasLimit}
            onChange={(val) => setGasLimit(val)}
            placeholder="Auto"
            type="number"
          />
        </div>
      </div>
      <div className="confirm">
        <SharedButton size="medium" type="primary" onClick={saveUserGasChoice}>
          Save
        </SharedButton>
      </div>
      <style jsx>
        {`
          .wrapper {
            height: 100%;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
          }
          .fees {
            background-color: var(--green-95);
            width: 352px;
            margin: 0 auto;
            display: flex;
            flex-flow: column;
          }
          .divider {
            border-radius: 4px;
            height: 2px;
            width: 384px;
            position: relative;
            left: -16px;
            margin: 12px 0;
          }
          .divider-cover {
            background: #667c7a;
            border-radius: 4px;
            width: 100%;
            height: 100%;
            position: absolute;
            transition: all 0.3s ease;
          }
          .divider-background {
            background: #33514e;
            border-radius: 4px;
            width: 100%;
            height: 100%;
            position: absolute;
            transition: all 0.3s ease;
          }
          .limit {
            margin: 16px 0;
            width: 40%;
            position: relative;
          }
          .limit_label {
            position: absolute;
            top: -8px;
            left: 10px;
            font-size: 12px;
            padding: 0 4px;
            background-color: var(--green-95);
            color: var(--green-40);
          }
          .title {
            font-size: 22px;
            font-weight: 600;
          }
          .option {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #002522;
            box-sizing: border-box;
            padding: 12px;
            margin: 8px 0;
            cursor: pointer;
            border-radius: 4px;
          }
          .option.active {
            border: 1px solid #22c480;
            box-shadow: 0px 16px 16px rgba(0, 20, 19, 0.14),
              0px 6px 8px rgba(0, 20, 19, 0.24),
              0px 2px 4px rgba(0, 20, 19, 0.34);
          }
          .option.active .name {
            color: #22c480;
          }
          .option_left,
          .option_right {
            display: flex;
            flex-flow: column;
            gap: 4px;
          }
          .option_left {
            text-align: left;
          }
          .option_right {
            text-align: right;
          }
          .name,
          .price {
            color: var(--green--5);
            font-size: 18px;
            font-weight: 600;
          }
          .subtext {
            color: var(--green-60);
            font-size: 14px;
          }
          .confirm {
            width: 100%;
            background: #002522;
            display: flex;
            box-sizing: border-box;
            justify-content: flex-end;
            padding: 20px 16px;
          }
        `}
      </style>
    </div>
  )
}
