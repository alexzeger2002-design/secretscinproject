export interface ContentData {
  global: {
    appName: string;
    botUrl: string;
    ctaText: string;
    disclaimer: string;
  };
  hero: {
    badge: string;
    title: {
      main: string;
      sub: string;
    };
    description: string;
    subCta: string;
  };
  chat: {
    botName: string;
    status: string;
    messages: Array<{
      id: number;
      type: string;
      sender: string;
      content?: string;
      src?: string;
      poster?: string;
      delay: number;
    }>;
  };
  showcase: {
    title: string;
    cards: Array<{
      id: number;
      videoSrc: string;
      poster: string;
      tag: string;
    }>;
  };
  benefits: Array<{
    id: number;
    title: string;
    desc: string;
  }>;
  stats: {
    mainCount: string;
    mainLabel: string;
    subStat: string;
  };
  steps: string[];
}

declare const contentData: ContentData;
export default contentData;
