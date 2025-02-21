export type RSSFeed = {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
};

export type RSSItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}; 