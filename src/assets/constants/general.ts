import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
config();

export const ASCII_logo = `
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||                                                          ||
||   //////  //   //  /////   /////   /////  /////  /////   ||
||   //       // //   //  //  //  //  //     //     //      ||
||   //////    ///    /////   ////    /////  /////  /////   ||
||   //       // //   //      // //   //        //     //   ||
||   //////  //   //  //      //  //  /////  /////  /////   ||
||                                                          ||
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
`;

import path from "path";

const isDev = process.env.DEVELOPER_MODE === 'TRUE';
// Use absolute paths rooted at process.cwd() to be safe across src/dist
const baseDir = process.cwd();
export const logsBasePath = path.join(baseDir, isDev ? 'src/bin/logs' : 'dist/bin/logs');
export const currentLogFilePath = path.join(logsBasePath, 'logs.log');

if (!existsSync(logsBasePath)) {
    try {
        mkdirSync(logsBasePath, { recursive: true });
    } catch (err) {
        console.error(`Failed to create log directory: ${err}`);
    }
}

if (!existsSync(currentLogFilePath)) {
    try {
        writeFileSync(currentLogFilePath, '');
    } catch (err) {
        console.error(`Failed to create log file: ${err}`);
    }
}
