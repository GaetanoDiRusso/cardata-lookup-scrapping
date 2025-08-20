import puppeteer from 'puppeteer';
import puppeteer_core, { PuppeteerLaunchOptions } from 'puppeteer-core';
import { PuppeteerExtra, VanillaPuppeteer } from 'puppeteer-extra';
import userPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import chromium from "@sparticuz/chromium";
import path from 'path';

const BASE_PUPPETEER_LAUNCH_OPTIONS: PuppeteerLaunchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
    headless: true,
}

const getLaunchOptions = async (options: PuppeteerLaunchOptions) => {
    const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

    let launchOptions: PuppeteerLaunchOptions = {
        ...BASE_PUPPETEER_LAUNCH_OPTIONS,
        ...options,
    };

    // If we are in Lambda environment, we need to override the base launch options with necessary Lambda launch options.
    if (isLambda) {
        const executablePath = await chromium.executablePath();

        launchOptions = {
            ...launchOptions,
            // @ts-ignore
            headless: chromium.headless,
            args: chromium.args,
            executablePath,
            defaultViewport: { width: 1280, height: 800 },
            env: { ...process.env, TZ: "America/Montevideo" }
        }
    }

    return launchOptions;
}

/**
 * Launch a puppeteer browser with the given options.
 * If the environment is Lambda, it will override the base launch options with necessary Lambda launch options.
 * Otherwise, it will use the base launch options.
 * @param options - The options to pass to the puppeteer launch function.
 * @returns The puppeteer browser instance.
 */
export const launchPuppeteerBrowser = async (options: PuppeteerLaunchOptions = {}) => {
    const launchOptions = await getLaunchOptions(options);
    return await puppeteer.launch(launchOptions as any);
}

/**
 * Launch a puppeteer extra browser with the given options.
 * If the environment is Lambda, it will use the Lambda launch options.
 * Otherwise, it will use the local launch options.
 * 
 * This browser is used for websites that require particular user preferences, such as getting the PDF files
 * that are downloaded automatically.
 * @param options - The options to pass to the puppeteer launch function.
 * @returns The puppeteer browser instance.
 */
export const launchPuppeteerExtraBrowser = async (options: PuppeteerLaunchOptions = {}) => {
    const launchOptions = await getLaunchOptions(options);

    const puppeteerExtra = new PuppeteerExtra(puppeteer as any);
    puppeteerExtra.use(userPreferencesPlugin({
        userPrefs: {
            download: {
                prompt_for_download: false,
                open_pdf_in_system_reader: true,
            },
            plugins: {
                always_open_pdf_externally: true,
            }
        }
    }));

    return await puppeteerExtra.launch({
        downloadBehavior: {
            policy: 'allow',
            downloadPath: path.join(process.cwd(), 'puppeteer-downloads')
        },
        ...(launchOptions as Parameters<VanillaPuppeteer["launch"]>[0]),
    });
}