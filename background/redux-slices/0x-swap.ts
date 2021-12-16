import { createSlice, createSelector } from "@reduxjs/toolkit"
import { fetchJson } from "@ethersproject/web"

import { createBackgroundAsyncThunk } from "./utils"
import { isSmartContractFungibleAsset, Asset } from "../assets"
import { AssetsState } from "./assets"
import logger from "../lib/logger"
import accounts, { AccountState } from "./accounts"
import { KeeperDAOLimitOrder } from "../types"
import { UIState } from "./ui"

interface SwapAsset extends Asset {
  contractAddress?: string
  price?: string
}

export interface SwapState {
  sellToken?: SwapAsset
  buyToken?: SwapAsset
  sellAmount: string
  buyAmount: string
  tokens: Asset[]
  expiration: "1h" | "2h" | "1d" | "1w"
  limitTokens: Asset[]
}

interface RookToken {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI: string
}

interface RookTokenListResponse {
  result: {
    name: string
    timestamp: string
    version: {
      major: number
      minor: number
      patch: number
    }
    keywords: string[]
    tokens: RookToken[]
    logoURI: string
  }
  message: string
}

interface SwapToken {
  sellToken?: Asset
  buyToken?: Asset
}

interface SwapAmount {
  sellAmount?: string
  buyAmount?: string
}

interface ZrxToken {
  symbol: string
  name: string
  decimals: number
  address: string
}

interface ZrxPrice {
  symbol: string
  price: string
}

const getValidAssets = async (getState: () => unknown) => {
  const state = getState() as { assets: AssetsState }
  const assets = state.assets as Asset[]
  const apiData = await fetchJson(`https://api.0x.org/swap/v1/tokens`)

  const filteredAssets = assets
    .filter(isSmartContractFungibleAsset)
    .filter((asset) => {
      const matchingTokens = apiData.records.filter((zrxToken: ZrxToken) => {
        // Only allow tokens to be swapped if the data from 0x matches our asset information
        if (
          asset.symbol.toLowerCase() === zrxToken.symbol.toLowerCase() &&
          asset.contractAddress.toLowerCase() === zrxToken.address.toLowerCase()
        ) {
          return true
        }

        if (
          asset.symbol.toLowerCase() === zrxToken.symbol.toLowerCase() &&
          asset.contractAddress.toLowerCase() !== zrxToken.address.toLowerCase()
        ) {
          logger.warn(
            "Swap Token Discrepancy: Symbol matches but contract address doesn't",
            asset,
            zrxToken
          )
        }

        if (
          asset.contractAddress.toLowerCase() ===
            zrxToken.address.toLowerCase() &&
          asset.symbol.toLowerCase() !== zrxToken.symbol.toLowerCase()
        ) {
          logger.warn(
            "Swap Token Discrepancy: Contract address matches but symbol doesn't",
            asset,
            zrxToken
          )
        }

        return false
      })

      // TODO: What if multiple assets match?
      if (matchingTokens.length) {
        return matchingTokens[0]
      }

      return false
    })

  return filteredAssets
}

export const fetchTokens = createBackgroundAsyncThunk(
  "0x-swap/fetchTokens",
  async (_, { getState }) => {
    logger.log("fetching tokens")
    return getValidAssets(getState)
  }
)

export const fetchLimitTokens = createBackgroundAsyncThunk(
  "0x-swap/fetchLimitTokens",
  async (_, { getState }) => {
    const validAssets = await getValidAssets(getState)
    const rookTokens = (await fetchJson(
      `https://hidingbook.keeperdao.com/api/v1/tokenList`
    )) as RookTokenListResponse
    return validAssets.filter((asset) => {
      return rookTokens.result.tokens.find(
        (rookToken) => rookToken.address === asset.contractAddress
      )
    })
  }
)

export const fetchSwapPrices = createBackgroundAsyncThunk(
  "0x-swap/fetchSwapPrices",
  async (token: Asset) => {
    const apiData = await fetchJson(
      `https://api.0x.org/swap/v1/prices?sellToken=${token.symbol}&perPage=1000`
    )

    return apiData.records
  }
)

export const initialState: SwapState = {
  sellToken: undefined,
  buyToken: undefined,
  sellAmount: "",
  buyAmount: "",
  tokens: [],
  expiration: "1h",
  limitTokens: [],
}

const swapSlice = createSlice({
  name: "0x-swap",
  initialState,
  reducers: {
    setSwapAmount: (
      immerState,
      { payload: amount }: { payload: SwapAmount }
    ) => {
      return { ...immerState, ...amount }
    },

    setSwapTrade: (immerState, { payload: token }: { payload: SwapToken }) => {
      return { ...immerState, ...token }
    },
    setExpiration: (
      immerState,
      { payload: expiration }: { payload: "1h" | "2h" | "1d" | "1w" }
    ) => {
      return { ...immerState, expiration }
    },
    swapBuyAndSellSides: (immerState) => {
      return {
        ...immerState,
        buyAmount: immerState.sellAmount,
        buyToken: immerState.sellToken,
        sellAmount: immerState.buyAmount,
        sellToken: immerState.buyToken,
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchSwapPrices.fulfilled,
        (immerState, { payload: assetPrices }: { payload: ZrxPrice[] }) => {
          const tokensWithPrices = immerState.tokens.map((asset) => {
            const matchingAsset = assetPrices.filter((price) => {
              if (asset.symbol.toLowerCase() === price.symbol.toLowerCase()) {
                return true
              }

              return false
            })

            if (matchingAsset.length) {
              return { ...asset, price: matchingAsset[0].price }
            }

            return { ...asset, price: 0 }
          })

          return { ...immerState, tokens: tokensWithPrices }
        }
      )
      .addCase(
        fetchTokens.fulfilled,
        (immerState, { payload: tokens }: { payload: Asset[] }) => {
          return { ...immerState, tokens }
        }
      )
      .addCase(
        fetchLimitTokens.fulfilled,
        (immerState, { payload: limitTokens }: { payload: Asset[] }) => {
          return { ...immerState, limitTokens }
        }
      )
  },
})

export const selectCurrentLimitOrder = createSelector(
  (state: { swap: SwapState; ui: UIState; assets: AssetsState }) => {
    return { swap: state.swap, ui: state.ui, assets: state.assets }
  },
  ({ swap, ui, assets }) => {
    return {
      maker: ui.currentAccount.addressNetwork.address,
      taker: "0x0000000000000000000000000000000000000000",
      makerAmount: swap.sellAmount,
      takerAmount: swap.buyAmount,
      makerToken: (swap.sellToken as any)?.contractAddress,
      takerToken: (swap.buyToken as any)?.contractAddress,
      salt: Date.now().toString(),
      expiry: swap.expiration,
      chainId: 1,
      txOrigin: "0xBd49A97300E10325c78D6b4EC864Af31623Bb5dD",
      pool: "0x0000000000000000000000000000000000000000000000000000000000000017",
      verifyingContract: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    }
  }
)

export const {
  setSwapAmount,
  setSwapTrade,
  setExpiration,
  swapBuyAndSellSides,
} = swapSlice.actions
export default swapSlice.reducer
