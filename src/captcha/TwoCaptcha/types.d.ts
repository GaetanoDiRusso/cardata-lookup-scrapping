declare module '@infosimples/node_two_captcha' {
    export default class Client {
      constructor(apiKey: string, options?: {
        timeout?: number;
        polling?: number;
        throwErrors?: boolean;
      });
      
      decodeRecaptchaV2(options: {
        googlekey: string;
        pageurl: string;
      }): Promise<any>;
      
      // Add other methods as needed
    }
  }