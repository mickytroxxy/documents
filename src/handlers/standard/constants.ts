// constants.ts
import { rgb } from 'pdf-lib';

export const COLORS = {
    bankBlue: rgb(0 / 255, 51 / 255, 170 / 255), // #0033aa
    borderGray: rgb(0.85, 0.85, 0.85),
    redColor: rgb(0.7, 0, 0),
    greenColor: rgb(0, 0.35, 0),
    grayColor: rgb(0.4, 0.4, 0.4),
    darkColor: rgb(0.1, 0.1, 0.1),
    whiteColor: rgb(1, 1, 1),
    whiteBorderColor: rgb(0.5, 0.5, 0.5),
    lightBlack: rgb(0.5, 0.5, 0.5),
    blackColor: rgb(0, 0, 0),
    stampColor: rgb(0.35, 0.35, 0.35),
    capitecBlue: rgb(0.1, 0.6, 0.9),
    capitecTomato: rgb(0.9804, 0.0941, 0.149)
};

export const TABLE_CONFIG = {
    rowHeight: 31, // Can change this to 50 and text will still be aligned
    headerHeight: 32,
    fontSize: 9,
    leftMargin: 32,
    rightMargin: 27,
    columnWidths: [60, 230, 75, 75, 0] // Last column will be calculated
};
