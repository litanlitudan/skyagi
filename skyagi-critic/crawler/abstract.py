from typing import List
from dataclasses import dataclass
from typing import List, Dict
from urllib.parse import urljoin, urlparse, urlunparse
import requests
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod
import asyncio


@dataclass
class ParseResult:
    userName: str
    userUrl: str
    ''' example:
    review1 = {
        "movieName": "Inception",
        "reviewDate": "2023-09-21",
        "reviewRate": "9/10",
        "reviewComments": "Amazing movie!"
    }
    '''
    userReviews: List[Dict[str, str]]


@dataclass
class CrawlResult:
    result: ParseResult | None
    new_urls: List[str]


class AbstractWebCrawler(ABC):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }

    def __init__(self, starting_url, depth_setting, pause_between_requests_s):
        self.starting_url = starting_url
        self.netloc = urlparse(starting_url).netloc
        self.depth_setting = depth_setting
        self.pause_between_requests = pause_between_requests_s

    async def get_seen_map(self):
        # TODO: Persist this map to a file or database
        return set()

    @abstractmethod
    async def _crawl(self, url) -> CrawlResult:
        pass

    def get_html(self, url) -> BeautifulSoup:
        try:
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            return soup
        except Exception as e:
            print(e)
            return BeautifulSoup("", 'html.parser')

    def get_hrefs(self, soup: BeautifulSoup) -> List[str]:
        result = []
        for a_tag in soup.find_all('a', href=True):
            parsed_url = urlparse(a_tag['href'])
            # Use '|' for the scheme and netloc to provide defaults if they are missing in the href
            new_url_tuple = (
                parsed_url.scheme or "https",
                parsed_url.netloc or self.netloc,
                parsed_url.path,
                '',
                '',
                ''
            )
            result.append(urlunparse(new_url_tuple))
        return result

    async def scrape(self):
        urls_to_crawl = {self.starting_url}
        parse_results: List[ParseResult] = []
        seen_map = await self.get_seen_map()

        for i in range(self.depth_setting):
            all_new_urls_in_this_depth = set()
            while urls_to_crawl:
                url = urls_to_crawl.pop()
                if url in seen_map:
                    continue
                seen_map.add(url)
                cr = await self._crawl(url)

                if cr and cr.result:
                    parse_results.append(cr.result)

                if cr and cr.new_urls:
                    all_new_urls_in_this_depth.update(cr.new_urls)

                if cr and cr.result:
                    await asyncio.sleep(self.pause_between_requests)

            print(f"Finished crawling depth {i}.. new urls found: {len(all_new_urls_in_this_depth)}")
            urls_to_crawl = all_new_urls_in_this_depth

        return parse_results
