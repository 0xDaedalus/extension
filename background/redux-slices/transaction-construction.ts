import { createSlice, createSelector } from "@reduxjs/toolkit"
import Emittery from "emittery"
import logger from "../lib/logger"

import {
  BlockEstimate,
  BlockPrices,
  EIP1559TransactionRequest,
} from "../networks"
import { KeeperDAOLimitOrder } from "../types"
import { SwapState } from "./0x-swap"
import { createBackgroundAsyncThunk } from "./utils"

const enum TransactionConstructionStatus {
  Idle = "idle",
  Pending = "pending",
  Loaded = "loaded",
  Signed = "signed",
}
export type TransactionConstruction = {
  status: TransactionConstructionStatus
  transactionRequest?: EIP1559TransactionRequest
  transactionLikelyFails?: boolean
  estimatedFeesPerGas: EstimatedFeesPerGas | undefined
  lastGasEstimatesRefreshed: number
}

export type EstimatedFeesPerGas = {
  baseFeePerGas: bigint
  instant: BlockEstimate | undefined
  express: BlockEstimate | undefined
  regular: BlockEstimate | undefined
}

export const initialState: TransactionConstruction = {
  status: TransactionConstructionStatus.Idle,
  estimatedFeesPerGas: undefined,
  lastGasEstimatesRefreshed: Date.now(),
}

export type Events = {
  updateOptions: Partial<EIP1559TransactionRequest> & {
    from: string
  }
  requestSignature: EIP1559TransactionRequest
  requestLimitOrder: KeeperDAOLimitOrder
}

export const emitter = new Emittery<Events>()

// Async thunk to pass transaction options from the store to the background via an event
export const updateTransactionOptions = createBackgroundAsyncThunk(
  "transaction-construction/update-options",
  async (options: Partial<EIP1559TransactionRequest> & { from: string }) => {
    await emitter.emit("updateOptions", options)
  }
)

export const signTransaction = createBackgroundAsyncThunk(
  "transaction-construction/sign",
  async (transaction: EIP1559TransactionRequest) => {
    await emitter.emit("requestSignature", transaction)
  }
)

export const signLimitOrder = createBackgroundAsyncThunk(
  "transaction-construction/signLimitOrder",
  async (transaction: KeeperDAOLimitOrder) => {
    console.log("requesting limit order")
    logger.log("Requesting Limit Order")
    await emitter.emit("requestLimitOrder", transaction)
  }
)

const transactionSlice = createSlice({
  name: "transaction-construction",
  initialState,
  reducers: {
    transactionRequest: (
      immerState,
      {
        payload: { transactionRequest, transactionLikelyFails },
      }: {
        payload: {
          transactionRequest: EIP1559TransactionRequest
          transactionLikelyFails: boolean
        }
      }
    ) => ({
      ...immerState,
      status: TransactionConstructionStatus.Loaded,
      transactionRequest,
      transactionLikelyFails,
    }),
    signed: (immerState) => {
      immerState.status = TransactionConstructionStatus.Signed
    },
    transactionLikelyFails: (state) => ({
      ...state,
      transactionLikelyFails: true,
    }),
    estimatedFeesPerGas: (
      immerState,
      { payload: estimatedFeesPerGas }: { payload: BlockPrices }
    ) => {
      return {
        ...immerState,
        estimatedFeesPerGas: {
          baseFeePerGas: estimatedFeesPerGas.baseFeePerGas,
          instant: estimatedFeesPerGas.estimatedPrices.find(
            (el) => el.confidence === 99
          ),
          express: estimatedFeesPerGas.estimatedPrices.find(
            (el) => el.confidence === 95
          ),
          regular: estimatedFeesPerGas.estimatedPrices.find(
            (el) => el.confidence === 70
          ),
        },
        lastGasEstimatesRefreshed: Date.now(),
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateTransactionOptions.pending, (immerState) => {
      immerState.status = TransactionConstructionStatus.Pending
    })
  },
})

export const {
  transactionRequest,
  transactionLikelyFails,
  signed,
  estimatedFeesPerGas,
} = transactionSlice.actions

export default transactionSlice.reducer

export const selectEstimatedFeesPerGas = createSelector(
  (state: { transactionConstruction: TransactionConstruction }) =>
    state.transactionConstruction.estimatedFeesPerGas,
  (gasData) => gasData
)

export const selectLastGasEstimatesRefreshTime = createSelector(
  (state: { transactionConstruction: TransactionConstruction }) =>
    state.transactionConstruction.lastGasEstimatesRefreshed,
  (updateTime) => updateTime
)

export const selectTransactionData = createSelector(
  (state: { transactionConstruction: TransactionConstruction }) =>
    state.transactionConstruction.transactionRequest,
  (transactionRequestData) => transactionRequestData
)

export const selectIsTransactionLoaded = createSelector(
  (state: { transactionConstruction: TransactionConstruction }) =>
    state.transactionConstruction.status,
  (status) => status === "loaded"
)

export const selectIsTransactionSigned = createSelector(
  (state: { transactionConstruction: TransactionConstruction }) =>
    state.transactionConstruction.status,
  (status) => status === "signed"
)
