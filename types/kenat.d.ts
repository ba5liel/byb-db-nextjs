declare module "kenat" {
  export interface EthiopianDate {
    year: number
    month: number
    day: number
  }

  export interface GregorianDate {
    year: number
    month: number
    day: number
  }

  export const monthNames: {
    english: string[]
    amharic: string[]
    gregorian: string[]
  }

  export function toGC(ethYear: number, ethMonth: number, ethDay: number): GregorianDate
  export function toEC(gregYear: number, gregMonth: number, gregDay: number): EthiopianDate

  export default class Kenat {
    constructor(input?: Date | string | EthiopianDate)
    getEthiopian(): EthiopianDate
    getGregorian(): GregorianDate
  }
}
