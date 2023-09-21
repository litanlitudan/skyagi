import re
from urllib.parse import urlparse
import aiohttp
from bs4 import BeautifulSoup, Tag
from abstract import AbstractWebCrawler, CrawlResult, ParseResult


class IMDBCrawler(AbstractWebCrawler):

    def __init__(self):
        super().__init__(starting_url="https://www.imdb.com/user/ur102296684/", depth_setting=3, pause_between_requests_s=0)

    def parese_movie_review(self, soup):
        return None

    def parse_user_profile(self, soup: BeautifulSoup, userUrl: str) -> ParseResult | None:
        reviews = []
        review_section = soup.find(class_='reviews')
        try:
            header = soup.find(class_='header')
            userName_element = header.find(name="h1")  # type: ignore
            userName = userName_element.text.strip() if userName_element else "Username element not found"
        except AttributeError:
            userName = "NotFound"
        if not review_section or not isinstance(review_section, Tag):
            return None
        for item in review_section.find_all(class_='item'):
            movie_name = item.find('h3')
            if movie_name:
                movie_name = movie_name.text.strip()
            review_date = item.find(class_='details')
            if review_date:
                review_date = review_date.text.strip()
            review_comment = item.find('p')
            if review_comment:
                review_comment = review_comment.text.strip()
            reviews.append({
                "movieName": movie_name,
                "reviewDate": review_date,
                "reviewComment": review_comment
            })

        return ParseResult(userName=userName, userReviews=reviews, userUrl=userUrl)

    def is_movie_path(self, toTest: str):
        pattern = r'^/title/[^/]+/?$'
        return re.match(pattern, toTest)

    def is_user_path(self, toTest: str):
        pattern = r'^/user/[^/]+/?$'
        return re.match(pattern, toTest)

    async def _crawl(self, url: str) -> CrawlResult | None:
        purl = urlparse(url)
        if purl.netloc != self.netloc:
            # gone out of scope
            return None
        soup = self.get_html(url)
        # Otherwise, navigate further
        new_urls = self.get_hrefs(soup)
        pr = None
        if self.is_movie_path(purl.path):
            # a movie page
            pr = self.parese_movie_review(soup)
        elif self.is_user_path(purl.path):
            userUrl = url
            pr = self.parse_user_profile(soup, userUrl)
        return CrawlResult(result=pr, new_urls=new_urls)
