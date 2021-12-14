import { createSlice } from "@reduxjs/toolkit"
import { fetchJson } from "@ethersproject/web"

import { createBackgroundAsyncThunk } from "./utils"
import { isSmartContractFungibleAsset, Asset } from "../assets"
import { AssetsState } from "./assets"
import logger from "../lib/logger"

interface SwapAsset extends Asset {
  price?: string
}

export interface SwapState {
  sellToken?: SwapAsset
  buyToken?: SwapAsset
  sellAmount: string
  buyAmount: string
  tokens: Asset[]
  limitTokens: Asset[]
}

interface RookToken {
  address: string,
  chainId: number,
  name: string,
  symbol: string,
  decimals: number,
  logoURI: string
}

interface RookTokenListResponse {
  result: { 
    name: string,
    timestamp: string,
    version: {
      major: number,
      minor: number,
      patch: number
    },
    keywords: string[],
    tokens: RookToken[],
    logoURI: string
  },
  message: string
}

interface SwapToken {
  sellToken?: Asset
  buyToken?: Asset
}

interface SwapAmount {
  sellAmount: string
  buyAmount: string
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
            asset.contractAddress.toLowerCase() ===
              zrxToken.address.toLowerCase()
          ) {
            return true
          }

          if (
            asset.symbol.toLowerCase() === zrxToken.symbol.toLowerCase() &&
            asset.contractAddress.toLowerCase() !==
              zrxToken.address.toLowerCase()
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
    logger.log('fetching tokens')
    return getValidAssets(getState)
  }
)

export const fetchLimitTokens = createBackgroundAsyncThunk(
  "0x-swap/fetchLimitTokens",
  async (_, { getState }) => {
    const validAssets = await getValidAssets(getState)
    const rookTokens = await fetchJson(`https://hidingbook.keeperdao.com/api/v1/tokenList`) as RookTokenListResponse
    return validAssets.filter(asset => {
      return rookTokens.result.tokens.find(rookToken => rookToken.address === asset.contractAddress && String(rookToken.chainId) === asset.homeNetwork.chainID)
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
  limitTokens: []
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

export const { setSwapAmount, setSwapTrade } = swapSlice.actions
export default swapSlice.reducer
