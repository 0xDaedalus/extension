import { createSlice } from "@reduxjs/toolkit"
import Emittery from "emittery"
import logger from "../lib/logger"

import { KeyringTypes } from "../types"
import { setCurrentAccount } from "./ui"
import { createBackgroundAsyncThunk } from "./utils"

// TODO this is very simple. We'll want to expand to include "capabilities" per
// keyring, including whether they can add new accounts, whether they can sign
// transactions, messages, typed data, etc. Including those explicitly means the
// type string (and frontend) can do way less work.
type Keyring = {
  type: KeyringTypes
  addresses: string[]
}

type KeyringsState = {
  keyrings: Keyring[]
  importing: false | "pending" | "done"
  status: "locked" | "unlocked" | "uninitialized"
}

export const initialState: KeyringsState = {
  keyrings: [],
  importing: false,
  status: "uninitialized",
}

export type Events = {
  createPassword: string
  unlockKeyrings: string
  generateNewKeyring: never
  importLegacyKeyring: { mnemonic: string }
}

export const emitter = new Emittery<Events>()

// Async thunk to bubble the importLegacyKeyring action from  store to emitter.
export const importLegacyKeyring = createBackgroundAsyncThunk(
  "keyrings/importLegacyKeyring",
  async ({ mnemonic }: { mnemonic: string }, { getState, dispatch }) => {
    await emitter.emit("importLegacyKeyring", { mnemonic })

    // Set the selected account as the first address of the last added keyring,
    // which will correspond to the last imported keyring, AKA this one. Note that
    // this does rely on the KeyringService's behavior of pushing new keyrings to
    // the end of the keyring list.
    dispatch(
      setCurrentAccount(
        (getState() as { keyrings: KeyringsState }).keyrings.keyrings.slice(
          -1
        )[0].addresses[0]
      )
    )
  }
)

const keyringsSlice = createSlice({
  name: "keyrings",
  initialState,
  reducers: {
    keyringLocked: (state) => ({ ...state, status: "locked" }),
    keyringUnlocked: (state) => ({ ...state, status: "unlocked" }),
    updateKeyrings: (state, { payload: keyrings }: { payload: Keyring[] }) => {
      // When the keyrings are locked, we receive updateKeyrings with an empty
      // list as the keyring service clears the in-memory keyrings. For UI
      // purposes, however, we want to continue tracking the keyring metadata,
      // so we ignore an empty list if the keyrings are locked.
      if (keyrings.length === 0 && state.status === "locked") {
        return state
      }

      return {
        ...state,
        keyrings,
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(importLegacyKeyring.pending, (state) => {
        return {
          ...state,
          importing: "pending",
        }
      })
      .addCase(importLegacyKeyring.fulfilled, (state) => {
        return {
          ...state,
          importing: "done",
        }
      })
  },
})

export const { updateKeyrings, keyringLocked, keyringUnlocked } =
  keyringsSlice.actions

export default keyringsSlice.reducer

// Async thunk to bubble the generateNewKeyring action from  store to emitter.
export const generateNewKeyring = createBackgroundAsyncThunk(
  "keyrings/generateNewKeyring",
  async () => {
    await emitter.emit("generateNewKeyring")
  }
)

export const unlockKeyrings = createBackgroundAsyncThunk(
  "keyrings/unlockKeyrings",
  async (password: string) => {
    logger.log("emitting unlockKeyrings")
    await emitter.emit("unlockKeyrings", password)
  }
)

export const createPassword = createBackgroundAsyncThunk(
  "keyrings/createPassword",
  async (password: string) => {
    await emitter.emit("createPassword", password)
  }
)
