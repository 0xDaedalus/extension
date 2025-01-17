import dayjs from "dayjs"
import { convertToEth } from "../../lib/utils"
import { AnyEVMTransaction } from "../../networks"
import { ContractInfo } from "../../services/enrichment"

function ethTransformer(
  value: string | number | bigint | null | undefined
): string {
  if (value === null || typeof value === "undefined") {
    return "(Unknown)"
  }
  return `${convertToEth(value)} ETH`
}

type FieldAdapter<T> = {
  readableName: string
  transformer: (value: T) => string
  detailTransformer: (value: T) => string
}

export type UIAdaptationMap<T> = {
  [P in keyof T]?: FieldAdapter<T[P]>
}

export type ActivityItem = AnyEVMTransaction & {
  contractInfo?: ContractInfo | undefined
  localizedDecimalValue: string
  timestamp?: number
  isSent?: boolean
  blockHeight: number | null
  fromTruncated: string
  toTruncated: string
  infoRows: {
    [name: string]: {
      label: string
      value: string
      valueDetail: string
    }
  }
}

/**
 * Given a map of adaptations from fields in type T, return all keys that need
 * adaptation with three fields, a label, a value, and a valueDetail, derived
 * based on the adaptation map.
 */
export function adaptForUI<T>(
  fieldAdapters: UIAdaptationMap<T>,
  item: T
): {
  [key in keyof UIAdaptationMap<T>]: {
    label: string
    value: string
    valueDetail: string
  }
} {
  // The as below is dicey but reasonable in our usage.
  return Object.keys(fieldAdapters).reduce(
    (adaptedFields, key) => {
      const knownKey = key as keyof UIAdaptationMap<T> // statically guaranteed
      const adapter = fieldAdapters[knownKey] as
        | FieldAdapter<unknown>
        | undefined

      if (typeof adapter === "undefined") {
        return adaptedFields
      }

      const { readableName, transformer, detailTransformer } = adapter

      return {
        ...adaptedFields,
        [key]: {
          label: readableName,
          value: transformer(item[knownKey]),
          valueDetail: detailTransformer(item[knownKey]),
        },
      }
    },
    {} as {
      [key in keyof UIAdaptationMap<T>]: {
        label: string
        value: string
        valueDetail: string
      }
    }
  )
}

export const keysMap: UIAdaptationMap<ActivityItem> = {
  blockHeight: {
    readableName: "Block Height",
    transformer: (height: number | null) =>
      height === null ? "(pending)" : height.toString(),
    detailTransformer: () => {
      return ""
    },
  },
  value: {
    readableName: "Amount",
    transformer: ethTransformer,
    detailTransformer: ethTransformer,
  },
  gasUsed: {
    readableName: "Gas",
    transformer: ethTransformer,
    detailTransformer: ethTransformer,
  },
  maxFeePerGas: {
    readableName: "Max Fee/Gas",
    transformer: ethTransformer,
    detailTransformer: ethTransformer,
  },
  gasPrice: {
    readableName: "Gas Price",
    transformer: ethTransformer,
    detailTransformer: ethTransformer,
  },
  timestamp: {
    readableName: "Timestamp",
    transformer: (item) => {
      if (typeof item !== "undefined") {
        return dayjs.unix(item).format("MM/DD/YYYY hh:mm a")
      }
      return "(Unknown)"
    },
    detailTransformer: () => {
      return ""
    },
  },
}
